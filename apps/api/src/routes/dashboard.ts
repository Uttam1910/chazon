import { Router } from 'express'
import { z } from 'zod'
import { isDatabaseUnavailable, prisma } from '../db'
import { ok } from '../lib/http'
import { runtimeStore, type AuditScanRecord } from '../lib/runtime-store'
import { auditJobStore } from './audit-jobs'

export const dashboardRouter = Router()

const ENQUIRY_PILLARS = ['BUILD', 'GROW', 'CONVERT', 'AUTOMATE', 'E-COMMERCE', 'AI'] as const

type LeadMetricRow = {
  status: string
  category: string | null
  service: string | null
  services: string[]
  preferredContact: string | null
  auditRef: string | null
  auditData: unknown
  source: string
  sourceDetail: string | null
  createdAt: Date | string
}

type AuditMetricRow = {
  status: string
  createdAt: Date | string
}

function toIso(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  return typeof d === 'string' ? d : d.toISOString()
}

function normalizeCategoryKey(raw: string | null | undefined): string {
  if (!raw) return 'General'
  const upper = raw.trim().toUpperCase()
  if ((ENQUIRY_PILLARS as readonly string[]).includes(upper)) return upper
  return raw.trim()
}

function humanizeServiceLabel(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  if (/^[a-z0-9-]+$/.test(s)) {
    return s
      .split('-')
      .map(w => (w === 'seo' || w === 'ai' || w === 'ppc' || w === 'ui' || w === 'ux' || w === 'crm' ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
      .join(' ')
  }
  return s
}

function mergeScans(dbScans: AuditScanRecord[]): AuditScanRecord[] {
  const byRef = new Map<string, AuditScanRecord>()
  // Live runtimeStore scans first (most up-to-date running/completed state)
  for (const s of runtimeStore.auditScans) {
    byRef.set(s.reference || s.id, s)
  }
  for (const s of dbScans) {
    const key = s.reference || s.id
    if (!byRef.has(key)) byRef.set(key, s)
  }
  return [...byRef.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function avgOf(values: number[]): number {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function buildDashboardPayload(params: {
  storageMode: 'database' | 'memory'
  leads: LeadMetricRow[]
  recentLeads: {
    id: string
    reference: string | null
    name: string
    businessName: string
    category: string | null
    service: string | null
    services: string[]
    preferredContact: string | null
    auditRef: string | null
    budget: string | null
    status: string
    createdAt: Date | string
  }[]
  audits: AuditMetricRow[]
  recentAudits: {
    id: string
    name: string
    businessName: string
    website: string | null
    category: string | null
    status: string
    createdAt: Date | string
  }[]
  scans: AuditScanRecord[]
  content: {
    publishedServices: number
    totalServices: number
    publishedCaseStudies: number
    publishedInsights: number
    publishedIndustries: number
    publishedTestimonials: number
  }
}) {
  const sinceMs = Date.now() - 30 * 86400_000
  const byStatus: Record<string, number> = {}
  const categoryTotals = new Map<string, number>()
  const contactTotals = new Map<string, number>()
  const serviceTotals = new Map<string, number>()
  const sourceTotals = new Map<string, number>()

  let leadsLast30 = 0
  let withAuditCount = 0

  for (const l of params.leads) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
    if (Date.parse(toIso(l.createdAt)) >= sinceMs) leadsLast30++
    if (l.auditRef || l.auditData) withAuditCount++

    const cat = normalizeCategoryKey(l.category)
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + 1)

    const contact = l.preferredContact ? l.preferredContact.trim() : 'WhatsApp'
    const contactLabel = contact[0].toUpperCase() + contact.slice(1).toLowerCase()
    contactTotals.set(contactLabel, (contactTotals.get(contactLabel) ?? 0) + 1)

    const srcKey = l.sourceDetail || (l.source === 'Website' ? 'Website (direct)' : l.source)
    sourceTotals.set(srcKey, (sourceTotals.get(srcKey) ?? 0) + 1)

    const seenServices = new Set<string>()
    for (const s of l.services ?? []) {
      const label = humanizeServiceLabel(s)
      if (label && !seenServices.has(label.toLowerCase())) {
        seenServices.add(label.toLowerCase())
        serviceTotals.set(label, (serviceTotals.get(label) ?? 0) + 1)
      }
    }
    if (!seenServices.size && l.service) {
      const label = humanizeServiceLabel(l.service)
      serviceTotals.set(label, (serviceTotals.get(label) ?? 0) + 1)
    }
  }

  const auditsByStatus: Record<string, number> = {}
  let auditsLast30 = 0
  for (const a of params.audits) {
    auditsByStatus[a.status] = (auditsByStatus[a.status] ?? 0) + 1
    if (Date.parse(toIso(a.createdAt)) >= sinceMs) auditsLast30++
  }

  const completedScans = params.scans.filter(s => s.state === 'completed')
  const scansLast30 = params.scans.filter(s => Date.parse(s.createdAt) >= sinceMs).length
  const convertedToLeads = params.scans.filter(s => !!(s.leadId || s.leadReference)).length

  // Ensure all 6 core website categories stay consistently ordered in breakdown
  const byCategory = [
    ...ENQUIRY_PILLARS.map(label => ({ label, count: categoryTotals.get(label) ?? 0 })),
    ...[...categoryTotals.entries()]
      .filter(([label]) => !(ENQUIRY_PILLARS as readonly string[]).includes(label))
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
  ].filter(item => item.count > 0 || (ENQUIRY_PILLARS as readonly string[]).includes(item.label))

  return {
    storageMode: params.storageMode,
    generatedAt: new Date().toISOString(),
    leads: {
      total: params.leads.length,
      new: byStatus.NEW ?? 0,
      qualified: byStatus.QUALIFIED ?? 0,
      converted: byStatus.WON ?? 0,
      last30Days: leadsLast30,
      withAuditCount,
      byStatus,
      byCategory,
      byPreferredContact: [...contactTotals]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
    audits: {
      total: params.audits.length,
      new: auditsByStatus.NEW ?? 0,
      last30Days: auditsLast30,
      byStatus: auditsByStatus,
    },
    websiteScans: {
      total: params.scans.length,
      running: auditJobStore.running,
      last30Days: scansLast30,
      convertedToLeads,
      avgOverallScore: avgOf(completedScans.map(s => s.overallScore)),
      avgPerformanceScore: avgOf(completedScans.map(s => s.performanceScore)),
      avgSeoScore: avgOf(completedScans.map(s => s.seoScore)),
      avgMobileScore: avgOf(completedScans.map(s => s.mobileScore)),
      avgConversionScore: avgOf(completedScans.map(s => s.conversionScore)),
      recentScans: params.scans.slice(0, 8),
    },
    content: params.content,
    recentLeads: params.recentLeads.map(l => ({ ...l, createdAt: toIso(l.createdAt) })),
    recentAudits: params.recentAudits.map(a => ({ ...a, createdAt: toIso(a.createdAt) })),
    topServices: [...serviceTotals]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    sources: [...sourceTotals]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  }
}

dashboardRouter.get('/', async (req, res) => {
  const forceRefresh = req.query.refresh === '1'
  if (!forceRefresh) {
    const cached = runtimeStore.getCachedDashboard('main')
    if (cached) return ok(res, cached)
  }

  try {
    const active = { archivedAt: null }
    const [
      leadRows,
      recentLeads,
      auditRows,
      recentAudits,
      dbScans,
      publishedServices,
      totalServices,
      publishedCaseStudies,
      publishedInsights,
      publishedIndustries,
      publishedTestimonials,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: active,
        select: {
          status: true,
          category: true,
          service: true,
          services: true,
          preferredContact: true,
          auditRef: true,
          auditData: true,
          source: true,
          sourceDetail: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: active,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          reference: true,
          name: true,
          businessName: true,
          category: true,
          service: true,
          services: true,
          preferredContact: true,
          auditRef: true,
          budget: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.growthAudit.findMany({ where: active, select: { status: true, createdAt: true } }),
      prisma.growthAudit.findMany({
        where: active,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, businessName: true, website: true, category: true, status: true, createdAt: true },
      }),
      prisma.auditScan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          reference: true,
          url: true,
          normalizedUrl: true,
          overallScore: true,
          performanceScore: true,
          seoScore: true,
          mobileScore: true,
          conversionScore: true,
          metrics: true,
          issues: true,
          leadId: true,
          createdAt: true,
        },
      }),
      prisma.service.count({ where: { published: true, archivedAt: null } }),
      prisma.service.count({ where: { archivedAt: null } }),
      prisma.caseStudy.count({ where: { status: 'PUBLISHED' } }),
      prisma.insight.count({ where: { status: 'PUBLISHED' } }),
      prisma.industry.count({ where: { published: true } }),
      prisma.testimonial.count({ where: { published: true } }),
    ])

    const mappedDbScans: AuditScanRecord[] = dbScans.map(s => {
      const m = (s.metrics ?? {}) as Record<string, unknown>
      const issues = Array.isArray(s.issues) ? (s.issues as { title: string; severity: string; category: string }[]) : []
      return {
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
      }
    })

    const payload = buildDashboardPayload({
      storageMode: 'database',
      leads: leadRows,
      recentLeads,
      audits: auditRows,
      recentAudits,
      scans: mergeScans(mappedDbScans),
      content: {
        publishedServices,
        totalServices,
        publishedCaseStudies,
        publishedInsights,
        publishedIndustries,
        publishedTestimonials,
      },
    })

    runtimeStore.setCachedDashboard('main', payload)
    ok(res, payload)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const activeLeads = runtimeStore.leads.filter(l => !l.archivedAt)
    const activeAudits = runtimeStore.growthAudits.filter(a => !a.archivedAt)
    const payload = buildDashboardPayload({
      storageMode: 'memory',
      leads: activeLeads,
      recentLeads: activeLeads.slice(0, 6),
      audits: activeAudits,
      recentAudits: activeAudits.slice(0, 6),
      scans: mergeScans([]),
      content: {
        publishedServices: runtimeStore.services.filter(s => s.published && !s.archivedAt).length,
        totalServices: runtimeStore.services.filter(s => !s.archivedAt).length,
        publishedCaseStudies: 0,
        publishedInsights: 0,
        publishedIndustries: runtimeStore.industries.filter(i => i.published).length,
        publishedTestimonials: runtimeStore.testimonials.filter(t => t.published).length,
      },
    })
    runtimeStore.setCachedDashboard('main', payload)
    ok(res, payload)
  }
})

dashboardRouter.get('/notifications', async (_req, res) => {
  try {
    const where = { status: 'NEW' as const, archivedAt: null }
    const [newLeads, newAudits, leads, audits] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.growthAudit.count({ where }),
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, businessName: true, createdAt: true } }),
      prisma.growthAudit.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, businessName: true, createdAt: true } }),
    ])
    const items = [...leads.map(l => ({ ...l, kind: 'lead' as const })), ...audits.map(a => ({ ...a, kind: 'audit' as const }))]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
    ok(res, {
      storageMode: 'database',
      newLeads,
      newAudits,
      runningScans: auditJobStore.running,
      totalScans: runtimeStore.auditScans.length,
      items,
    })
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const newLeads = runtimeStore.leads.filter(l => !l.archivedAt && l.status === 'NEW')
    const newAudits = runtimeStore.growthAudits.filter(a => !a.archivedAt && a.status === 'NEW')
    const items = [
      ...newLeads.map(l => ({ id: l.id, name: l.name, businessName: l.businessName, createdAt: l.createdAt, kind: 'lead' as const })),
      ...newAudits.map(a => ({ id: a.id, name: a.name, businessName: a.businessName, createdAt: a.createdAt, kind: 'audit' as const })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6)
    ok(res, {
      storageMode: 'memory',
      newLeads: newLeads.length,
      newAudits: newAudits.length,
      runningScans: auditJobStore.running,
      totalScans: runtimeStore.auditScans.length,
      items,
    })
  }
})

dashboardRouter.get('/search', async (req, res) => {
  const q = z.string().trim().max(100).catch('').parse(req.query.q)
  if (q.length < 2) return ok(res, { leads: [], audits: [], scans: [], insights: [], caseStudies: [] })
  const ql = q.toLowerCase()
  const memScans = runtimeStore.auditScans
    .filter(s => s.url.toLowerCase().includes(ql) || s.normalizedUrl.toLowerCase().includes(ql) || s.reference.toLowerCase().includes(ql))
    .slice(0, 5)
    .map(s => ({ id: s.id, reference: s.reference, url: s.url, normalizedUrl: s.normalizedUrl, overallScore: s.overallScore }))

  try {
    const like = { contains: q, mode: 'insensitive' as const }
    const [leads, audits, dbScans, insights, caseStudies] = await Promise.all([
      prisma.lead.findMany({ where: { OR: [{ name: like }, { businessName: like }, { email: like }, { phone: like }, { reference: like }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, businessName: true, status: true } }),
      prisma.growthAudit.findMany({ where: { OR: [{ name: like }, { businessName: like }, { email: like }, { website: like }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, businessName: true, status: true } }),
      prisma.auditScan.findMany({ where: { OR: [{ url: like }, { normalizedUrl: like }, { reference: like }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, reference: true, url: true, normalizedUrl: true, overallScore: true } }),
      prisma.insight.findMany({ where: { title: like }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true } }),
      prisma.caseStudy.findMany({ where: { OR: [{ title: like }, { industry: like }] }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true } }),
    ])
    const scanMap = new Map(memScans.map(s => [s.reference, s]))
    for (const s of dbScans) if (!scanMap.has(s.reference)) scanMap.set(s.reference, s)
    ok(res, { leads, audits, scans: [...scanMap.values()].slice(0, 5), insights, caseStudies })
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    ok(res, {
      leads: runtimeStore.leads
        .filter(l => [l.name, l.businessName, l.email, l.phone, l.reference].some(v => (v ?? '').toLowerCase().includes(ql)))
        .slice(0, 5)
        .map(l => ({ id: l.id, name: l.name, businessName: l.businessName, status: l.status })),
      audits: runtimeStore.growthAudits
        .filter(a => [a.name, a.businessName, a.email, a.website].some(v => (v ?? '').toLowerCase().includes(ql)))
        .slice(0, 5)
        .map(a => ({ id: a.id, name: a.name, businessName: a.businessName, status: a.status })),
      scans: memScans,
      insights: [],
      caseStudies: [],
    })
  }
})
