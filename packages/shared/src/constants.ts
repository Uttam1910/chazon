// Domain vocabulary shared by the public website, the Admin and the API.
// Values match the database enums; labels are what people see.

export const LEAD_STATUSES = ['NEW', 'REVIEWED', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST', 'ARCHIVED'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal sent',
  WON: 'Won',
  LOST: 'Lost',
  ARCHIVED: 'Archived',
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

/** Each pillar's page on the public website (/services/<slug>). */
export const PILLAR_SLUGS: Record<Pillar, string> = {
  BUILD: 'website-development',
  GROW: 'digital-growth',
  CONVERT: 'conversion-optimisation',
  AUTOMATE: 'business-automation',
}

export const SERVICE_PAGES = [
  '/services/website-development',
  '/services/digital-marketing',
  '/services/seo-services',
  '/services/content-marketing',
  '/services/social-media-marketing',
  '/services/ppc-advertising',
  '/services/google-ads',
  '/services/email-marketing',
  '/services/affiliate-influencer-marketing',
  '/services/ui-ux-design',
  '/services/landing-page-development',
  '/services/ecommerce-development',
  '/services/local-seo',
  '/services/conversion-optimisation',
  '/services/business-automation',
  '/services/ai-integration',
] as const

/** The website's fixed, indexable pages, in sitemap order. */
export const PUBLIC_PAGES = [
  '/',
  '/services',
  ...SERVICE_PAGES,
  '/website-audit',
  '/growth-audit',
  '/approach',
  '/about',
  '/work',
  '/insights',
  '/contact',
  '/privacy',
  '/terms',
] as const

/** Chazon Growth Framework — Five Stages (The Complete Digital Growth Journey) */
export const GROWTH_FRAMEWORK_STAGES = [
  {
    step: '01',
    id: 'discover',
    title: 'Discover',
    tagline: 'Visibility & Searchability',
    description: 'Make your brand visible & searchable.',
    detail: 'Make your brand visible and searchable to high-intent buyers looking for your exact capabilities.',
    icon: 'search',
  },
  {
    step: '02',
    id: 'attract',
    title: 'Attract',
    tagline: 'Audience Acquisition',
    description: 'Bring the right audience to your brand.',
    detail: 'Attract qualified decision-makers through structured search, performance campaigns, and organic reach.',
    icon: 'target',
  },
  {
    step: '03',
    id: 'convert',
    title: 'Convert',
    tagline: 'High-Impact Conversion',
    description: 'Turn interest into enquiries and sales.',
    detail: 'Design high-converting page structures and frictionless inquiry pathways that convert visitors into revenue.',
    icon: 'zap',
  },
  {
    step: '04',
    id: 'retain',
    title: 'Retain',
    tagline: 'Automated Lifecycle',
    description: 'Build relationships and encourage repeat business.',
    detail: 'Automate WhatsApp triage, instant CRM lead response, and post-purchase customer retention journeys.',
    icon: 'heart',
  },
  {
    step: '05',
    id: 'grow',
    title: 'Grow',
    tagline: 'Revenue & Performance Scale',
    description: 'Improve revenue and business performance.',
    detail: 'Continuously measure performance KPIs and eliminate leaks to expand commercial business growth.',
    icon: 'trending-up',
  },
] as const

export type GrowthFrameworkStage = (typeof GROWTH_FRAMEWORK_STAGES)[number]

/** Complete 10-Service Suite matching the design reference */
export const CORE_10_SERVICES = [
  {
    id: 'website-development',
    title: 'Website Development',
    category: 'Digital Foundation',
    pillar: 'BUILD',
    description: 'High-performance, responsive websites that convert visitors into customers.',
    path: '/services/website-development',
    icon: 'laptop',
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Integrated marketing to build visibility, engagement and business growth.',
    path: '/services/digital-marketing',
    icon: 'megaphone',
  },
  {
    id: 'seo-services',
    title: 'Search Engine Optimisation (SEO)',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Improve your search visibility and attract high-intent customers organically.',
    path: '/services/seo-services',
    icon: 'search-check',
  },
  {
    id: 'content-marketing',
    title: 'Content Marketing',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Strategic content that builds trust, engagement and conversions.',
    path: '/services/content-marketing',
    icon: 'file-text',
  },
  {
    id: 'social-media-marketing',
    title: 'Social Media Marketing',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Grow your brand and community across key social platforms.',
    path: '/services/social-media-marketing',
    icon: 'share-2',
  },
  {
    id: 'ppc-advertising',
    title: 'PPC Advertising',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Performance-driven ad campaigns that generate qualified leads and sales.',
    path: '/services/ppc-advertising',
    icon: 'target',
  },
  {
    id: 'google-ads',
    title: 'Google Ads',
    category: 'Digital Growth',
    pillar: 'GROW',
    description: 'Reach the right audience at the right time with high-ROI campaigns.',
    path: '/services/google-ads',
    icon: 'bar-chart-2',
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing',
    category: 'Automation & Retention',
    pillar: 'AUTOMATE',
    description: 'Build stronger customer relationships through targeted email campaigns.',
    path: '/services/email-marketing',
    icon: 'mail',
  },
  {
    id: 'affiliate-influencer-marketing',
    title: 'Affiliate & Influencer Marketing',
    category: 'Revenue & Commerce',
    pillar: 'CONVERT',
    description: 'Expand your reach and sales through credible creators and partner networks.',
    path: '/services/affiliate-influencer-marketing',
    icon: 'users',
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX Design',
    category: 'Digital Foundation',
    pillar: 'BUILD',
    description: 'User-focused designs that are intuitive, engaging and conversion-ready.',
    path: '/services/ui-ux-design',
    icon: 'layout',
  },
] as const

export type CoreService = (typeof CORE_10_SERVICES)[number]

export const INSIGHT_CATEGORIES = [
  'All',
  'Strategy',
  'SEO',
  'Marketing',
  'Automation',
  'Digital Revenue',
  'Performance Marketing',
  'Digital Commerce',
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
