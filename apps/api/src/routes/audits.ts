import { Router } from 'express'
import { z } from 'zod'
import { AUDIT_STATUSES, AUDIT_STATUS_LABELS } from '@chazon/shared'
import { prisma, type Prisma } from '../db'
import { requireRole } from '../lib/auth'
import { listQuery, notFound, ok, optionalText, paged, parse, requiredText } from '../lib/http'

export const auditsRouter = Router()

const auditFields = {
  name: requiredText(100, 'Name'),
  businessName: requiredText(150, 'Business name'),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().regex(/^[+0-9() .-]{7,20}$/, 'Enter a valid phone number'),
  website: optionalText(200),
  category: optionalText(100),
  requirements: optionalText(3000),
  budget: optionalText(60),
  notes: optionalText(10000),
}
const createSchema = z.object({ ...auditFields, status: z.enum(AUDIT_STATUSES).default('NEW') })
const updateSchema = z.object({ ...auditFields, status: z.enum(AUDIT_STATUSES), archived: z.boolean() }).partial()

const filters = listQuery.extend({
  status: z.enum(AUDIT_STATUSES).optional().catch(undefined),
  view: z.enum(['active', 'archived', 'all']).default('active').catch('active'),
  sort: z.enum(['newest', 'oldest', 'name', 'business', 'status']).default('newest').catch('newest'),
})
const orderings: Record<string, Prisma.GrowthAuditOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }], oldest: [{ createdAt: 'asc' }], name: [{ name: 'asc' }], business: [{ businessName: 'asc' }], status: [{ status: 'asc' }, { createdAt: 'desc' }],
}

auditsRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status, view, sort } = parse(filters, req.query)
  const where: Prisma.GrowthAuditWhereInput = {
    ...(view === 'active' ? { archivedAt: null } : view === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: ['name', 'businessName', 'email', 'phone', 'website', 'requirements', 'category'].map(f => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.growthAudit.findMany({ where, orderBy: orderings[sort], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.growthAudit.count({ where }),
  ])
  paged(res, items, total, page, pageSize)
})

auditsRouter.post('/', async (req, res) => {
  const data = parse(createSchema, req.body)
  const audit = await prisma.growthAudit.create({ data: { ...data, source: 'Manual', activities: { create: { type: 'CREATED', message: 'Audit request added manually.', actorId: req.admin!.id } } } })
  ok(res, audit, 201)
})

const detail = (id: string) => prisma.growthAudit.findUnique({
  where: { id },
  include: { activities: { orderBy: { createdAt: 'desc' }, take: 100, include: { actor: { select: { id: true, name: true } } } } },
})

auditsRouter.get('/:id', async (req, res) => {
  const audit = await detail(req.params.id)
  if (!audit) throw notFound('Audit request')
  ok(res, audit)
})

auditsRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(updateSchema, req.body)
  const existing = await prisma.growthAudit.findUnique({ where: { id: req.params.id } })
  if (!existing) throw notFound('Audit request')
  const actor = { actor: { connect: { id: req.admin!.id } } }
  const activities: Prisma.ActivityCreateWithoutAuditInput[] = []
  if (data.status && data.status !== existing.status) activities.push({ type: 'STATUS_CHANGED', message: `Status changed from ${AUDIT_STATUS_LABELS[existing.status]} to ${AUDIT_STATUS_LABELS[data.status]}.`, ...actor })
  if (data.notes !== undefined && data.notes !== existing.notes) activities.push({ type: 'NOTE_ADDED', message: 'Internal notes updated.', ...actor })
  const edited = Object.keys(data).filter(k => !['status', 'notes'].includes(k) && (data as Record<string, unknown>)[k] !== (existing as Record<string, unknown>)[k])
  if (edited.length) activities.push({ type: 'UPDATED', message: `Details updated (${edited.join(', ')}).`, ...actor })
  if (archived !== undefined && archived !== !!existing.archivedAt) activities.push({ type: archived ? 'ARCHIVED' : 'RESTORED', message: archived ? 'Audit request archived.' : 'Audit request restored.', ...actor })
  await prisma.growthAudit.update({
    where: { id: existing.id },
    data: { ...data, ...(archived !== undefined ? { archivedAt: archived ? existing.archivedAt ?? new Date() : null } : {}), activities: { create: activities } },
  })
  ok(res, await detail(existing.id))
})

auditsRouter.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  await prisma.growthAudit.delete({ where: { id: String(req.params.id) } })
  ok(res, { deleted: true })
})
