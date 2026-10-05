// Domain vocabulary shared by the public website, the Admin and the API.
// Values match the database enums; labels are what people see.

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', PROPOSAL_SENT: 'Proposal sent', WON: 'Won', LOST: 'Lost',
}

export const AUDIT_STATUSES = ['NEW', 'REVIEWING', 'AUDIT_READY', 'SENT', 'CLOSED'] as const
export type AuditStatus = (typeof AUDIT_STATUSES)[number]
export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  NEW: 'New', REVIEWING: 'Reviewing', AUDIT_READY: 'Audit ready', SENT: 'Sent', CLOSED: 'Closed',
}

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' }

// Chazon's four service pillars: Build → Grow → Convert → Automate.
export const PILLARS = ['BUILD', 'GROW', 'CONVERT', 'AUTOMATE'] as const
export type Pillar = (typeof PILLARS)[number]
export const PILLAR_INFO: Record<Pillar, { verb: string; title: string }> = {
  BUILD: { verb: 'Build', title: 'Digital Foundation' },
  GROW: { verb: 'Grow', title: 'Digital Growth' },
  CONVERT: { verb: 'Convert', title: 'Revenue & Commerce' },
  AUTOMATE: { verb: 'Automate', title: 'Automation & Retention' },
}

export const INSIGHT_CATEGORIES = [
  'Digital Revenue',
  'Performance Marketing',
  'Digital Commerce',
  'Automation',
  'Entrepreneur’s Digital Playbook',
] as const
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]

// Pages whose SEO can be managed from the Admin. `global` supplies defaults for every page.
export const SEO_PAGES = ['global', 'home', 'insights', 'work'] as const
export type SeoPage = (typeof SEO_PAGES)[number]
export const SEO_PAGE_LABELS: Record<SeoPage, string> = {
  global: 'Global defaults', home: 'Homepage', insights: 'Insights listing', work: 'Work / case studies',
}

export const ADMIN_ROLES = ['ADMIN', 'EDITOR'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ENQUIRY_TYPES = ['talk', 'audit'] as const
export type EnquiryType = (typeof ENQUIRY_TYPES)[number]

export const slugify = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
