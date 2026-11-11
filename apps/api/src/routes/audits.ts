import { Router } from 'express'
import { z } from 'zod'
import { AUDIT_STATUSES, AUDIT_STATUS_LABELS } from '@chazon/shared'
import { isDatabaseUnavailable, prisma, type Prisma } from '../db'
import { generateReference } from '../lib/audit-engine'
import { requireRole } from '../lib/auth'
import { listQuery, notFound, ok, optionalText, paged, parse, requiredText } from '../lib/http'
import { runtimeStore, type AuditScanRecord, type RuntimeGrowthAudit } from '../lib/runtime-store'

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
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  name: [{ name: 'asc' }],
  business: [{ businessName: 'asc' }],
  status: [{ status: 'asc' }, { createdAt: 'desc' }],
}

// ---------- Instant Website Audit Scans (Website <-> Admin Sync) ----------
auditsRouter.get('/scans', async (req, res) => {
  const { page, pageSize, q } = parse(listQuery, req.query)
  const ql = q?.toLowerCase()
  const byKey = new Map<string, AuditScanRecord>()
  for (const s of runtimeStore.auditScans) byKey.set(s.reference || s.id, s)

  try {
    const dbScans = await prisma.auditScan.findMany({
      where: q
        ? { OR: [{ url: { contains: q, mode: 'insensitive' } }, { normalizedUrl: { contains: q, mode: 'insensitive' } }, { reference: { contains: q, mode: 'insensitive' } }] }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    for (const s of dbScans) {
      if (!byKey.has(s.reference)) {
        const m = (s.metrics ?? {}) as Record<string, unknown>
        const issues = Array.isArray(s.issues) ? (s.issues as { title: string; severity: string; category: string }[]) : []
        byKey.set(s.reference, {
          id: s.id,
          reference: s.reference,
          url: s.url,
          normalizedUrl: s.normalizedUrl,
          strategy: m.strategy === 'desktop' ? 'desktop' : 'mobile',
          state: 'completed',
          overallScore: s.overallScore,
          performanceScore: s.performanceScore,
          seoScore: s.seoScore,
          mobileScore: s.mobileScore,
          conversionScore: s.conversionScore,
          accessibilityScore: typeof m.accessibilityScore === 'number' ? m.accessibilityScore : null,
          bestPracticesScore: typeof m.bestPracticesScore === 'number' ? m.bestPracticesScore : null,
          pagesInspected: typeof m.pagesInspected === 'number' ? m.pagesInspected : 1,
          durationMs: typeof m.durationMs === 'number' ? m.durationMs : null,
          headline: typeof m.headline === 'string' ? m.headline : null,
          topIssues: issues.slice(0, 6),
          leadId: s.leadId,
          leadReference: null,
          createdAt: s.createdAt.toISOString(),
          completedAt: s.createdAt.toISOString(),
        })
      }
    }
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
  }

  const list = [...byKey.values()]
    .filter(s => (!ql ? true : s.url.toLowerCase().includes(ql) || s.normalizedUrl.toLowerCase().includes(ql) || s.reference.toLowerCase().includes(ql)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  paged(res, list.slice((page - 1) * pageSize, page * pageSize), list.length, page, pageSize)
})

auditsRouter.get('/scans/:id', async (req, res) => {
  const id = String(req.params.id)
  const mem = runtimeStore.auditScans.find(s => s.id === id || s.reference === id)
  if (mem) return ok(res, mem)
  try {
    const scan = await prisma.auditScan.findFirst({ where: { OR: [{ id }, { reference: id }] } })
    if (!scan) throw notFound('Website audit scan')
    ok(res, scan)
  } catch (err) {
    if (isDatabaseUnavailable(err)) throw notFound('Website audit scan')
    throw err
  }
})

// ---------- Growth Audit Advisory Requests ----------
auditsRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status, view, sort } = parse(filters, req.query)
  const where: Prisma.GrowthAuditWhereInput = {
    ...(view === 'active' ? { archivedAt: null } : view === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: ['name', 'businessName', 'email', 'phone', 'website', 'requirements', 'category'].map(f => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {}),
  }
  try {
    const [items, total] = await Promise.all([
      prisma.growthAudit.findMany({ where, orderBy: orderings[sort], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.growthAudit.count({ where }),
    ])
    paged(res, items, total, page, pageSize)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const ql = q?.toLowerCase()
    const sorters: Record<string, (a: RuntimeGrowthAudit, b: RuntimeGrowthAudit) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      business: (a, b) => a.businessName.localeCompare(b.businessName),
      status: (a, b) => a.status.localeCompare(b.status),
    }
    const items = runtimeStore.growthAudits
      .filter(a => (view === 'active' ? !a.archivedAt : view === 'archived' ? !!a.archivedAt : true))
      .filter(a => (!status ? true : a.status === status))
      .filter(a =>
        !ql ? true : [a.name, a.businessName, a.email, a.phone, a.website, a.requirements, a.category].some(v => (v ?? '').toLowerCase().includes(ql))
      )
      .sort(sorters[sort] ?? sorters.newest)
    paged(res, items.slice((page - 1) * pageSize, page * pageSize), items.length, page, pageSize)
  }
})

auditsRouter.post('/', async (req, res) => {
  const data = parse(createSchema, req.body)
  try {
    const audit = await prisma.growthAudit.create({
      data: { ...data, source: 'Manual', activities: { create: { type: 'CREATED', message: 'Audit request added manually.', actorId: req.admin!.id } } },
    })
    runtimeStore.invalidateDashboard()
    ok(res, audit, 201)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const audit = runtimeStore.createGrowthAudit(
      { ...data, source: 'Manual', reference: generateReference('AUD') },
      'Audit request added manually.',
      req.admin ? { id: req.admin.id, name: req.admin.name } : null
    )
    ok(res, audit, 201)
  }
})

const detail = (id: string) =>
  prisma.growthAudit.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 100, include: { actor: { select: { id: true, name: true } } } } },
  })

auditsRouter.get('/:id', async (req, res) => {
  try {
    const audit = await detail(req.params.id)
    if (!audit) throw notFound('Audit request')
    ok(res, audit)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const mem = runtimeStore.growthAudits.find(a => a.id === req.params.id || a.reference === req.params.id)
    if (!mem) throw notFound('Audit request')
    ok(res, mem)
  }
})

auditsRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(updateSchema, req.body)
  try {
    const existing = await prisma.growthAudit.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Audit request')
    const actor = { actor: { connect: { id: req.admin!.id } } }
    const activities: Prisma.ActivityCreateWithoutAuditInput[] = []
    if (data.status && data.status !== existing.status)
      activities.push({ type: 'STATUS_CHANGED', message: `Status changed from ${AUDIT_STATUS_LABELS[existing.status]} to ${AUDIT_STATUS_LABELS[data.status]}.`, ...actor })
    if (data.notes !== undefined && data.notes !== existing.notes) activities.push({ type: 'NOTE_ADDED', message: 'Internal notes updated.', ...actor })
    const edited = Object.keys(data).filter(k => !['status', 'notes'].includes(k) && (data as Record<string, unknown>)[k] !== (existing as Record<string, unknown>)[k])
    if (edited.length) activities.push({ type: 'UPDATED', message: `Details updated (${edited.join(', ')}).`, ...actor })
    if (archived !== undefined && archived !== !!existing.archivedAt)
      activities.push({ type: archived ? 'ARCHIVED' : 'RESTORED', message: archived ? 'Audit request archived.' : 'Audit request restored.', ...actor })
    await prisma.growthAudit.update({
      where: { id: existing.id },
      data: { ...data, ...(archived !== undefined ? { archivedAt: archived ? existing.archivedAt ?? new Date() : null } : {}), activities: { create: activities } },
    })
    runtimeStore.invalidateDashboard()
    ok(res, await detail(existing.id))
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const mem = runtimeStore.growthAudits.find(a => a.id === req.params.id || a.reference === req.params.id)
    if (!mem) throw notFound('Audit request')
    const now = new Date().toISOString()
    const actorInfo = req.admin ? { id: req.admin.id, name: req.admin.name } : null
    if (data.status && data.status !== mem.status) {
      mem.activities.unshift({
        id: generateReference('ACT'),
        type: 'STATUS_CHANGED',
        message: `Status changed from ${AUDIT_STATUS_LABELS[mem.status]} to ${AUDIT_STATUS_LABELS[data.status]}.`,
        createdAt: now,
        actor: actorInfo,
      })
    }
    if (archived !== undefined && archived !== !!mem.archivedAt) {
      mem.archivedAt = archived ? mem.archivedAt ?? now : null
    }
    Object.assign(mem, data, { updatedAt: now })
    runtimeStore.invalidateDashboard()
    ok(res, mem)
  }
})

auditsRouter.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.growthAudit.delete({ where: { id: String(req.params.id) } })
    runtimeStore.invalidateDashboard()
    ok(res, { deleted: true })
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const idx = runtimeStore.growthAudits.findIndex(a => a.id === req.params.id || a.reference === req.params.id)
    if (idx < 0) throw notFound('Audit request')
    runtimeStore.growthAudits.splice(idx, 1)
    runtimeStore.invalidateDashboard()
    ok(res, { deleted: true })
  }
})
