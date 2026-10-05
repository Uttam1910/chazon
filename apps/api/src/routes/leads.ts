import { Router } from 'express'
import { z } from 'zod'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@chazon/shared'
import { prisma, type Prisma } from '../db'
import { requireRole } from '../lib/auth'
import { ApiError, listQuery, notFound, ok, optionalText, paged, parse, requiredText } from '../lib/http'

export const leadsRouter = Router()

const leadFields = {
  name: requiredText(100, 'Name'),
  businessName: requiredText(150, 'Business name'),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().regex(/^[+0-9() .-]{7,20}$/, 'Enter a valid phone number'),
  website: optionalText(200),
  category: optionalText(100),
  service: optionalText(100),
  budget: optionalText(60),
  message: optionalText(3000),
  sourceDetail: optionalText(120),
}
const createSchema = z.object({ ...leadFields, status: z.enum(LEAD_STATUSES).default('NEW') })
const updateSchema = z.object({ ...leadFields, status: z.enum(LEAD_STATUSES), archived: z.boolean() }).partial()

const filters = listQuery.extend({
  status: z.enum(LEAD_STATUSES).optional().catch(undefined),
  view: z.enum(['active', 'archived', 'all']).default('active').catch('active'),
  sort: z.enum(['newest', 'oldest', 'name', 'business', 'status']).default('newest').catch('newest'),
  service: z.string().trim().max(100).optional(),
})
const orderings: Record<string, Prisma.LeadOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }], oldest: [{ createdAt: 'asc' }], name: [{ name: 'asc' }], business: [{ businessName: 'asc' }], status: [{ status: 'asc' }, { createdAt: 'desc' }],
}

leadsRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status, view, sort, service } = parse(filters, req.query)
  const where: Prisma.LeadWhereInput = {
    ...(view === 'active' ? { archivedAt: null } : view === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(status ? { status } : {}),
    ...(service ? { service } : {}),
    ...(q ? { OR: ['name', 'businessName', 'email', 'phone', 'website', 'service', 'message', 'category'].map(f => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: orderings[sort], skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { notes: true } } } }),
    prisma.lead.count({ where }),
  ])
  paged(res, items, total, page, pageSize)
})

leadsRouter.post('/', async (req, res) => {
  const data = parse(createSchema, req.body)
  const lead = await prisma.lead.create({ data: { ...data, source: 'Manual', activities: { create: { type: 'CREATED', message: 'Lead added manually.', actorId: req.admin!.id } } } })
  ok(res, lead, 201)
})

const detail = (id: string) => prisma.lead.findUnique({
  where: { id },
  include: {
    notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, name: true } } } },
    activities: { orderBy: { createdAt: 'desc' }, take: 100, include: { actor: { select: { id: true, name: true } } } },
  },
})

leadsRouter.get('/:id', async (req, res) => {
  const lead = await detail(req.params.id)
  if (!lead) throw notFound('Lead')
  ok(res, lead)
})

leadsRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(updateSchema, req.body)
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } })
  if (!existing) throw notFound('Lead')
  const actorId = req.admin!.id
  const activities: Prisma.ActivityCreateWithoutLeadInput[] = []
  const actor = { actor: { connect: { id: actorId } } }
  if (data.status && data.status !== existing.status) activities.push({ type: 'STATUS_CHANGED', message: `Status changed from ${LEAD_STATUS_LABELS[existing.status]} to ${LEAD_STATUS_LABELS[data.status]}.`, ...actor })
  const edited = Object.keys(data).filter(k => k !== 'status' && (data as Record<string, unknown>)[k] !== (existing as Record<string, unknown>)[k])
  if (edited.length) activities.push({ type: 'UPDATED', message: `Details updated (${edited.join(', ')}).`, ...actor })
  if (archived !== undefined && archived !== !!existing.archivedAt) activities.push({ type: archived ? 'ARCHIVED' : 'RESTORED', message: archived ? 'Lead archived.' : 'Lead restored from archive.', ...actor })
  await prisma.lead.update({
    where: { id: existing.id },
    data: { ...data, ...(archived !== undefined ? { archivedAt: archived ? existing.archivedAt ?? new Date() : null } : {}), activities: { create: activities } },
  })
  ok(res, await detail(existing.id))
})

leadsRouter.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  await prisma.lead.delete({ where: { id: String(req.params.id) } })
  ok(res, { deleted: true })
})

const noteSchema = z.object({ body: requiredText(5000, 'Note') })
leadsRouter.post('/:id/notes', async (req, res) => {
  const { body } = parse(noteSchema, req.body)
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!lead) throw notFound('Lead')
  const note = await prisma.leadNote.create({ data: { leadId: lead.id, body, authorId: req.admin!.id }, include: { author: { select: { id: true, name: true } } } })
  await prisma.activity.create({ data: { leadId: lead.id, type: 'NOTE_ADDED', message: 'Internal note added.', actorId: req.admin!.id } })
  ok(res, note, 201)
})

leadsRouter.delete('/:id/notes/:noteId', async (req, res) => {
  const note = await prisma.leadNote.findFirst({ where: { id: req.params.noteId, leadId: req.params.id } })
  if (!note) throw notFound('Note')
  if (note.authorId !== req.admin!.id && req.admin!.role !== 'ADMIN') throw new ApiError(403, 'FORBIDDEN', 'You can only delete your own notes.')
  await prisma.leadNote.delete({ where: { id: note.id } })
  ok(res, { deleted: true })
})
