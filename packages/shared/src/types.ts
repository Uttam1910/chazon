import type { InsightCategory, Pillar } from './constants'

/** Standard API envelope: `{ data }` on success, `{ error }` on failure. */
export type ApiSuccess<T> = { data: T; meta?: PageMeta }
export type ApiFailure = { error: { code: string; message: string; details?: Record<string, string> } }
export type PageMeta = { page: number; pageSize: number; total: number; pages: number }

export type PublicSettings = {
  companyName: string
  tagline: string
  description: string
  email: string
  phone: string
  whatsapp: string
  location: string
  linkedinUrl: string
  instagramUrl: string
  facebookUrl: string
  ctaTalkLabel: string
  ctaAuditLabel: string
}

export type PublicSeo = {
  title: string | null
  description: string | null
  canonicalUrl: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  noindex: boolean
  nofollow: boolean
}

export type PublicService = { title: string; slug: string; pillar: Pillar; shortDescription: string | null }
export type PublicIndustry = { name: string; slug: string; description: string | null }
export type PublicTestimonial = { name: string; company: string | null; designation: string | null; quote: string; photoUrl: string | null }
export type PublicMetric = { label: string; value: string }

export type PublicCaseStudySummary = {
  title: string
  slug: string
  industry: string | null
  summary: string | null
  coverImage: string | null
  publishedAt: string | null
}
export type PublicCaseStudy = PublicCaseStudySummary & {
  challenge: string | null
  strategy: string | null
  execution: string | null
  deliverables: string[]
  result: string | null
  metrics: PublicMetric[]
  images: string[]
  seo: PublicSeo
}

export type PublicInsightSummary = {
  title: string
  slug: string
  excerpt: string | null
  category: InsightCategory | string
  featuredImage: string | null
  authorName: string | null
  tags: string[]
  publishedAt: string | null
}
export type PublicInsight = PublicInsightSummary & { content: string; seo: PublicSeo }

/** Everything the public homepage needs in one request. */
export type PublicSite = {
  settings: PublicSettings
  seo: Record<string, PublicSeo>
  services: PublicService[]
  industries: PublicIndustry[]
  testimonials: PublicTestimonial[]
  caseStudies: PublicCaseStudySummary[]
  insights: PublicInsightSummary[]
}

// ---------- Dynamic Enquiry & Growth Analyzer Types ----------

export type EnquiryCategory = 'BUILD' | 'GROW' | 'CONVERT' | 'AUTOMATE' | 'E-COMMERCE' | 'AI'

export type EnquiryGoal =
  | 'build-new'
  | 'improve-existing'
  | 'seo-visibility'
  | 'generate-leads'
  | 'improve-conversions'
  | 'automate-ops'
  | 'build-ecommerce'
  | 'integrate-ai'
  | 'multiple-services'
  | 'need-guidance'

export type PreferredContactMethod = 'WhatsApp' | 'Phone' | 'Email'
export type BusinessStage = 'New business' | 'Existing business' | 'Growing business' | 'Established business'

export type DynamicBuildAnswers = {
  isNewOrRedesign?: 'New website' | 'Existing website redesign'
  websiteType?: 'Business website' | 'Landing page' | 'E-commerce' | 'Portfolio' | 'Web application' | 'Custom platform'
  hasDomain?: 'Yes' | 'No' | 'Need help choosing'
  contentStatus?: 'Ready' | 'In progress' | 'Need Chazon to create'
  pageCount?: '1–5 pages' | '6–15 pages' | '15–30 pages' | '30+ pages'
  needsPayment?: boolean
  features?: string[]
  referenceUrl?: string
}

export type DynamicGrowAnswers = {
  hasWebsite?: boolean
  websiteUrl?: string
  primaryGoal?: 'More Google visibility' | 'More organic visitors' | 'Local customers' | 'More enquiries' | 'Better content strategy'
  currentInvestment?: 'Currently investing' | 'Tried in past' | 'Never invested'
  usesSearchConsole?: 'Yes' | 'No' | 'Not sure'
  targetLocations?: string
  targetKeywords?: string
}

export type DynamicConvertAnswers = {
  targetAction?: 'Call' | 'Submit an enquiry' | 'Book an appointment' | 'Purchase' | 'Contact through WhatsApp'
  conversionProblem?: 'High traffic low enquiries' | 'High bounce rate' | 'Drop-off at checkout/form' | 'Poor mobile conversions' | 'Not sure'
  hasWebsite?: boolean
  websiteUrl?: string
  trackingStatus?: 'GA4 / Meta Pixel' | 'Basic tracking' | 'Not tracking' | 'Not sure'
  journeyToImprove?: string
}

export type DynamicAutomateAnswers = {
  processesToAutomate?: string[]
  currentTools?: string
  usesCrm?: 'Yes' | 'No' | 'Looking for one'
  whatsAppVolume?: 'High volume' | 'Moderate' | 'Want to start' | 'None'
  needsAutoFollowUp?: boolean
  needsAi?: 'Yes AI responses' | 'Not sure' | 'No'
  externalIntegrations?: string
  manualWorkflowDescription?: string
}

export type DynamicEcommerceAnswers = {
  hasStore?: boolean
  platform?: 'Shopify' | 'WooCommerce' | 'Custom platform' | 'None yet'
  productCount?: '1–10 products' | '11–100 products' | '100–1,000 products' | '1,000+ products'
  needsPayment?: boolean
  needsShipping?: boolean
  needsInventory?: boolean
  needsAccounts?: boolean
  needsOrderManagement?: boolean
}

export type DynamicAiAnswers = {
  aiCapabilities?: string[]
  hasSoftware?: boolean
  description?: string
}

export type DynamicFormAnswers = {
  build?: DynamicBuildAnswers
  grow?: DynamicGrowAnswers
  convert?: DynamicConvertAnswers
  automate?: DynamicAutomateAnswers
  ecommerce?: DynamicEcommerceAnswers
  ai?: DynamicAiAnswers
  additionalNotes?: string
}

export type EnquiryBusinessInfo = {
  businessName: string
  industry: string
  website?: string
  location?: string
  businessStage: BusinessStage
  targetAudience: string
  description?: string
}

export type EnquiryContactInfo = {
  name: string
  email: string
  phone: string
  preferredContact: PreferredContactMethod
  message?: string
  consentToContact: boolean
  marketingConsent?: boolean
}

export type AuditIssue = {
  id: string
  category: 'performance' | 'seo' | 'mobile' | 'conversion'
  severity: 'critical' | 'warning' | 'good'
  title: string
  description: string
  recommendation: string
  type?: 'measured' | 'detected' | 'manual_review'
}

export type AuditAnalysisResult = {
  id: string
  url: string
  normalizedUrl: string
  overallScore: number
  scores: {
    performance: number
    seo: number
    mobile: number
    conversion: number
  }
  metrics: {
    responseTimeMs: number
    pageSizeKb: number
    hasSsl: boolean
    hasViewport: boolean
    title: string | null
    titleLength: number
    metaDescription: string | null
    metaDescLength: number
    hasCanonical: boolean
    hasOpenGraph: boolean
    h1Count: number
    h2Count: number
    imgTotal: number
    imgWithoutAlt: number
    hasTelLink: boolean
    hasMailto: boolean
    hasWhatsApp: boolean
    hasForm: boolean
    hasTracking: boolean
  }
  issues: AuditIssue[]
  analyzedAt: string
}

export type SmartEnquiryPayload = {
  category?: string
  goals: EnquiryGoal[]
  dynamicAnswers: DynamicFormAnswers
  business: EnquiryBusinessInfo
  budget?: string
  timeline: string
  contact: EnquiryContactInfo
  auditRef?: string
  auditSummary?: {
    overallScore: number
    scores: { performance: number; seo: number; mobile: number; conversion: number }
    topBottlenecks: string[]
  }
  company_url?: string // honeypot
  form_started?: number
  source_detail?: string
}

export type SmartEnquiryResponse = {
  received: boolean
  reference: string
  message: string
  nextSteps: string[]
  whatsAppHref?: string
}
