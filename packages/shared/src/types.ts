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
