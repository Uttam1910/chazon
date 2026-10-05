import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { ok } from '../lib/http'

export const dashboardRouter = Router()

// Real counts only: an empty database yields zeros and empty lists, which the Admin shows as empty states.
dashboardRouter.get('/', async (_req, res) => {
  const active = { archivedAt: null }
  const since = new Date(Date.now() - 30 * 86400_000)
  const [leadStatus, auditStatus, publishedCases, publishedInsights, recentLeads, recentAudits, services, sources, leadsLast30, auditsLast30] = await Promise.all([
    prisma.lead.groupBy({ by: ['status'], where: active, _count: { _all: true } }),
    prisma.growthAudit.groupBy({ by: ['status'], where: active, _count: { _all: true } }),
    prisma.caseStudy.count({ where: { status: 'PUBLISHED' } }),
    prisma.insight.count({ where: { status: 'PUBLISHED' } }),
    prisma.lead.findMany({ where: active, orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, businessName: true, service: true, status: true, createdAt: true } }),
    prisma.growthAudit.findMany({ where: active, orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, businessName: true, website: true, status: true, createdAt: true } }),
    prisma.lead.groupBy({ by: ['service'], where: { ...active, service: { not: null } }, _count: { _all: true }, orderBy: { _count: { service: 'desc' } }, take: 6 }),
    prisma.lead.groupBy({ by: ['sourceDetail', 'source'], where: active, _count: { _all: true } }),
    prisma.lead.count({ where: { ...active, createdAt: { gte: since } } }),
    prisma.growthAudit.count({ where: { ...active, createdAt: { gte: since } } }),
  ])
  const byStatus = Object.fromEntries(leadStatus.map(s => [s.status, s._count._all]))
  const auditsByStatus = Object.fromEntries(auditStatus.map(s => [s.status, s._count._all]))
  const sourceTotals = new Map<string, number>()
  for (const s of sources) {
    const key = s.sourceDetail || (s.source === 'Website' ? 'Website (direct / unknown)' : s.source)
    sourceTotals.set(key, (sourceTotals.get(key) ?? 0) + s._count._all)
  }
  ok(res, {
    leads: {
      total: leadStatus.reduce((n, s) => n + s._count._all, 0),
      new: byStatus.NEW ?? 0,
      qualified: byStatus.QUALIFIED ?? 0,
      converted: byStatus.WON ?? 0,
      last30Days: leadsLast30,
      byStatus,
    },
    audits: { total: auditStatus.reduce((n, s) => n + s._count._all, 0), new: auditsByStatus.NEW ?? 0, last30Days: auditsLast30, byStatus: auditsByStatus },
    content: { publishedCaseStudies: publishedCases, publishedInsights },
    recentLeads,
    recentAudits,
    topServices: services.map(s => ({ label: s.service!, count: s._count._all })),
    sources: [...sourceTotals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6),
  })
})

dashboardRouter.get('/notifications', async (_req, res) => {
  const where = { status: 'NEW' as const, archivedAt: null }
  const [newLeads, newAudits, leads, audits] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.growthAudit.count({ where }),
    prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, businessName: true, createdAt: true } }),
    prisma.growthAudit.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, businessName: true, createdAt: true } }),
  ])
  const items = [...leads.map(l => ({ ...l, kind: 'lead' as const })), ...audits.map(a => ({ ...a, kind: 'audit' as const }))]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6)
  ok(res, { newLeads, newAudits, items })
})

dashboardRouter.get('/search', async (req, res) => {
  const q = z.string().trim().max(100).catch('').parse(req.query.q)
  if (q.length < 2) return ok(res, { leads: [], audits: [], insights: [], caseStudies: [] })
  const like = { contains: q, mode: 'insensitive' as const }
  const [leads, audits, insights, caseStudies] = await Promise.all([
    prisma.lead.findMany({ where: { OR: [{ name: like }, { businessName: like }, { email: like }, { phone: like }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, businessName: true, status: true } }),
    prisma.growthAudit.findMany({ where: { OR: [{ name: like }, { businessName: like }, { email: like }, { website: like }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, businessName: true, status: true } }),
    prisma.insight.findMany({ where: { title: like }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true } }),
    prisma.caseStudy.findMany({ where: { OR: [{ title: like }, { industry: like }] }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true } }),
  ])
  ok(res, { leads, audits, insights, caseStudies })
})
