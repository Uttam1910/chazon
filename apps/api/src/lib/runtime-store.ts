import { randomUUID } from 'node:crypto'
import {
  CORE_10_SERVICES,
  LEAD_STATUSES,
  PILLARS,
  SEO_PAGES,
  slugify,
  type AuditReport,
  type AuditStatus,
  type LeadStatus,
  type Pillar,
} from '@chazon/shared'
import { env } from '../env'

export type AuditScanRecord = {
  id: string
  reference: string
  url: string
  normalizedUrl: string
  strategy: 'mobile' | 'desktop'
  state: 'running' | 'completed' | 'failed'
  overallScore: number
  performanceScore: number
  seoScore: number
  mobileScore: number
  conversionScore: number
  accessibilityScore: number | null
  bestPracticesScore: number | null
  pagesInspected: number
  durationMs: number | null
  headline: string | null
  topIssues: { title: string; severity: string; category: string }[]
  leadId: string | null
  leadReference: string | null
  createdAt: string
  completedAt: string | null
}

export type RuntimeLead = {
  id: string
  reference: string
  name: string
  businessName: string
  email: string
  phone: string
  preferredContact: string
  website: string | null
  category: string | null
  service: string | null
  services: string[]
  businessStage: string | null
  targetAudience: string | null
  businessDescription: string | null
  budget: string | null
  timeline: string | null
  message: string | null
  dynamicAnswers: Record<string, unknown> | null
  consentToContact: boolean
  marketingConsent: boolean
  auditRef: string | null
  auditData: Record<string, unknown> | null
  source: string
  sourceDetail: string | null
  status: LeadStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  assignedToId: string | null
  assignedTo: { id: string; name: string; email: string } | null
  notes: { id: string; body: string; createdAt: string; author: { id: string; name: string } | null }[]
  activities: { id: string; type: string; message: string; createdAt: string; actor: { id: string; name: string } | null }[]
}

export type RuntimeGrowthAudit = {
  id: string
  reference: string | null
  name: string
  businessName: string
  email: string
  phone: string
  website: string | null
  category: string | null
  requirements: string | null
  budget: string | null
  source: string
  sourceDetail: string | null
  status: AuditStatus
  notes: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  activities: { id: string; type: string; message: string; createdAt: string; actor: { id: string; name: string } | null }[]
}

const DEFAULT_INDUSTRIES: [string, string][] = [
  ['D2C & E-commerce', 'Connect discovery, shopping and retention to build a stronger digital commerce journey.'],
  ['Retail', 'Connect local visibility and online presence to create a clearer path to purchase.'],
  ['Hospitality', 'Help guests discover your business, explore the experience and make an enquiry or booking.'],
  ['Travel & Tourism', 'Bring inspiration, enquiry and follow-up together in one considered customer journey.'],
  ['Professional Services', 'Make your expertise easy to understand and help the right prospects take the next step.'],
  ['Healthcare & Wellness', 'Build clear, accessible digital experiences that help people find your services and enquire.'],
  ['Manufacturing', 'Translate your capabilities into a digital presence that supports trade enquiries and commerce.'],
  ['B2B', 'Support longer buying journeys with relevant content, qualified enquiries and consistent follow-up.'],
  ['Start-ups & Entrepreneurs', 'Prioritise the right digital foundations and channels for your next stage of business.'],
]

export function normalizeUrlDomain(raw: string): string {
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]?.toLowerCase() || raw.toLowerCase()
  }
}

export function extractScoresFromReport(report: AuditReport) {
  const byKey = new Map(report.scores.map(s => [s.key, s.value]))
  const val = (k: (typeof report.scores)[number]['key']) => {
    const v = byKey.get(k)
    return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0
  }
  const optVal = (k: (typeof report.scores)[number]['key']) => {
    const v = byKey.get(k)
    return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null
  }
  return {
    overallScore: val('overallHealth'),
    performanceScore: val('performance'),
    seoScore: val('technicalSeo'),
    mobileScore: val('mobileUx'),
    conversionScore: val('conversionReadiness'),
    accessibilityScore: optVal('accessibility'),
    bestPracticesScore: optVal('bestPractices'),
  }
}

class RuntimeStore {
  readonly leads: RuntimeLead[] = []
  readonly growthAudits: RuntimeGrowthAudit[] = []
  readonly auditScans: AuditScanRecord[] = []

  readonly services = PILLARS.flatMap(pillar => {
    const fromCore = CORE_10_SERVICES.filter(s => s.pillar === pillar).map((s, order) => ({
      id: `mem_svc_${s.id}`,
      title: s.title,
      slug: s.id,
      pillar: pillar as Pillar,
      shortDescription: s.description,
      description: s.description,
      icon: s.icon,
      imageUrl: null as string | null,
      order,
      published: true,
      archivedAt: null as string | null,
      updatedAt: new Date().toISOString(),
    }))
    return fromCore
  })

  readonly industries = DEFAULT_INDUSTRIES.map(([name, description], order) => ({
    id: `mem_ind_${order + 1}`,
    name,
    slug: slugify(name),
    description,
    order,
    published: true,
  }))

  readonly testimonials: {
    id: string
    name: string
    company: string | null
    designation: string | null
    quote: string
    photoUrl: string | null
    order: number
    published: boolean
  }[] = []

  settings = {
    id: 'default',
    companyName: 'Chazon Digital Ventures',
    tagline: 'Revenue-Led Digital Transformation',
    description:
      'Chazon Digital Ventures helps businesses build, optimise and grow their digital revenue channels through strategy, technology, marketing and automation.',
    email: process.env.VITE_CONTACT_EMAIL || 'hello@chazondigital.com',
    phone: process.env.VITE_PHONE || '+91 98200 00000',
    whatsapp: process.env.VITE_WHATSAPP_NUMBER || '919820000000',
    location: 'Mumbai, Maharashtra, India',
    linkedinUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    ctaTalkLabel: "Let's Talk",
    ctaAuditLabel: 'Run Free Website Audit',
    updatedAt: new Date(),
  }

  readonly seo = SEO_PAGES.map(page => ({
    page,
    title: page === 'home' ? 'Chazon Digital Ventures | Digital Revenue & Growth Partner' : null,
    description:
      page === 'home'
        ? 'Build, optimise and grow your digital revenue channels with Chazon. Business-first strategy, websites, marketing, digital commerce and automation in Mumbai.'
        : null,
    canonicalUrl: null as string | null,
    ogTitle: page === 'home' ? 'Chazon Digital Ventures — Revenue-Led Digital Transformation' : null,
    ogDescription:
      page === 'home'
        ? 'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.'
        : null,
    ogImage: null as string | null,
    noindex: false,
    nofollow: false,
    updatedAt: null as string | null,
  }))

  // Short-lived dashboard micro-cache (invalidated immediately on any write)
  private dashboardCache: { key: string; payload: unknown; expiresAt: number } | null = null

  getCachedDashboard(key: string) {
    if (this.dashboardCache && this.dashboardCache.key === key && Date.now() < this.dashboardCache.expiresAt) {
      return this.dashboardCache.payload
    }
    return null
  }

  setCachedDashboard(key: string, payload: unknown, ttlMs = 4000) {
    this.dashboardCache = { key, payload, expiresAt: Date.now() + ttlMs }
  }

  invalidateDashboard() {
    this.dashboardCache = null
  }

  upsertAuditScan(scan: AuditScanRecord) {
    const idx = this.auditScans.findIndex(s => s.id === scan.id || s.reference === scan.reference)
    if (idx >= 0) {
      this.auditScans[idx] = { ...this.auditScans[idx], ...scan }
    } else {
      this.auditScans.unshift(scan)
      if (this.auditScans.length > 250) this.auditScans.length = 250
    }
    this.invalidateDashboard()
  }

  linkLeadToAuditScan(auditRef: string | null | undefined, leadId: string, leadReference: string) {
    if (!auditRef) return
    const target = this.auditScans.find(s => s.reference === auditRef || s.id === auditRef)
    if (target) {
      target.leadId = leadId
      target.leadReference = leadReference
      this.invalidateDashboard()
    }
  }

  recordJobStart(id: string, url: string, strategy: 'mobile' | 'desktop') {
    this.upsertAuditScan({
      id,
      reference: id,
      url,
      normalizedUrl: normalizeUrlDomain(url),
      strategy,
      state: 'running',
      overallScore: 0,
      performanceScore: 0,
      seoScore: 0,
      mobileScore: 0,
      conversionScore: 0,
      accessibilityScore: null,
      bestPracticesScore: null,
      pagesInspected: 0,
      durationMs: null,
      headline: null,
      topIssues: [],
      leadId: null,
      leadReference: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    })
  }

  recordJobComplete(id: string, report: AuditReport): AuditScanRecord {
    const scores = extractScoresFromReport(report)
    const topIssues = (report.findings ?? []).slice(0, 6).map(f => ({
      title: f.title,
      severity: f.severity,
      category: f.category,
    }))
    const existing = this.auditScans.find(s => s.id === id || s.reference === id)
    const record: AuditScanRecord = {
      id,
      reference: report.id || id,
      url: report.finalUrl || report.inputUrl,
      normalizedUrl: normalizeUrlDomain(report.finalUrl || report.inputUrl),
      strategy: report.strategy,
      state: 'completed',
      ...scores,
      pagesInspected: report.pagesInspected ?? 1,
      durationMs: report.durationMs ?? null,
      headline: report.summary?.headline ?? null,
      topIssues,
      leadId: existing?.leadId ?? null,
      leadReference: existing?.leadReference ?? null,
      createdAt: existing?.createdAt ?? report.startedAt ?? new Date().toISOString(),
      completedAt: report.completedAt ?? new Date().toISOString(),
    }
    this.upsertAuditScan(record)
    return record
  }

  recordJobFail(id: string, message: string) {
    const existing = this.auditScans.find(s => s.id === id || s.reference === id)
    if (existing) {
      existing.state = 'failed'
      existing.headline = message
      existing.completedAt = new Date().toISOString()
      this.invalidateDashboard()
    }
  }

  createLead(input: Partial<RuntimeLead> & { name: string; businessName: string; email: string; phone: string }, activityMessage: string, actor?: { id: string; name: string } | null): RuntimeLead {
    const now = new Date().toISOString()
    const lead: RuntimeLead = {
      id: randomUUID(),
      reference: input.reference || `CHZ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: input.name,
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      preferredContact: input.preferredContact || 'WhatsApp',
      website: input.website ?? null,
      category: input.category ?? null,
      service: input.service ?? null,
      services: Array.isArray(input.services) ? input.services : [],
      businessStage: input.businessStage ?? null,
      targetAudience: input.targetAudience ?? null,
      businessDescription: input.businessDescription ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      message: input.message ?? null,
      dynamicAnswers: input.dynamicAnswers ?? null,
      consentToContact: input.consentToContact ?? true,
      marketingConsent: input.marketingConsent ?? false,
      auditRef: input.auditRef ?? null,
      auditData: input.auditData ?? null,
      source: input.source || 'Website',
      sourceDetail: input.sourceDetail ?? null,
      status: input.status && LEAD_STATUSES.includes(input.status) ? input.status : 'NEW',
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      assignedToId: null,
      assignedTo: null,
      notes: [],
      activities: [{ id: randomUUID(), type: 'CREATED', message: activityMessage, createdAt: now, actor: actor ?? null }],
    }
    this.leads.unshift(lead)
    this.linkLeadToAuditScan(lead.auditRef, lead.id, lead.reference)
    this.invalidateDashboard()
    return lead
  }

  createGrowthAudit(input: Partial<RuntimeGrowthAudit> & { name: string; businessName: string; email: string; phone: string }, activityMessage: string, actor?: { id: string; name: string } | null): RuntimeGrowthAudit {
    const now = new Date().toISOString()
    const audit: RuntimeGrowthAudit = {
      id: randomUUID(),
      reference: input.reference ?? null,
      name: input.name,
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      website: input.website ?? null,
      category: input.category ?? null,
      requirements: input.requirements ?? null,
      budget: input.budget ?? null,
      source: input.source || 'Website',
      sourceDetail: input.sourceDetail ?? null,
      status: input.status || 'NEW',
      notes: input.notes ?? null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      activities: [{ id: randomUUID(), type: 'CREATED', message: activityMessage, createdAt: now, actor: actor ?? null }],
    }
    this.growthAudits.unshift(audit)
    this.invalidateDashboard()
    return audit
  }
}

export const runtimeStore = new RuntimeStore()
export const runtimeEnabled = () => Boolean(env)
