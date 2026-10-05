import { Router, json } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { ENQUIRY_TYPES, INSIGHT_CATEGORIES, PILLARS, type PublicSite } from '@chazon/shared'
import { prisma } from '../db'
import { env } from '../env'
import { notifySubmission } from '../lib/email'
import { ApiError, listQuery, notFound, ok, paged, parse } from '../lib/http'
import { absolute, absoluteMarkdown, getSeo, getSettings } from '../lib/content'

// Endpoints used by the public website. Reads are public and cacheable; the only write is the enquiry form.
export const publicRouter = Router()

const readCors = cors({ origin: '*', methods: ['GET'] })
const formCors = cors({ origin: env.PUBLIC_SITE_URL || false, methods: ['POST'], maxAge: 600 })
// Browsers revalidate on every view (cheap 304s via ETag) so Admin changes show immediately;
// shared caches / CDNs may hold a copy for `seconds`.
const cacheable = (seconds: number) => (_req: unknown, res: { set: (k: string, v: string) => void }, next: () => void) => { res.set('Cache-Control', `public, max-age=0, must-revalidate, s-maxage=${seconds}`); next() }

// ---------- Enquiries: "Let's Talk" → Lead, "Digital Growth Audit" → GrowthAudit ----------
const enquiryLimiter = rateLimit({
  windowMs: 10 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again in a few minutes.' } }),
})
const field = (max: number) => z.string().trim().max(max).optional().transform(v => v || null)
const enquirySchema = z.object({
  enquiry_type: z.enum(ENQUIRY_TYPES).default('talk'),
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  business: z.string().trim().min(1, 'Please enter your business name').max(150),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().regex(/^[+0-9() .-]{7,20}$/, 'Enter a valid phone number'),
  website: field(200),
  category: field(100),
  service: field(100),
  budget: field(60),
  message: field(3000),
  company_url: z.string().optional(), // honeypot
  form_started: z.coerce.number().optional(), // ms timestamp set when the form opened
  source_detail: field(120),
})

publicRouter.options('/enquiries', formCors)
publicRouter.post('/enquiries', formCors, json({ limit: '32kb' }), enquiryLimiter, async (req, res) => {
  const origin = req.get('origin')
  if (origin && env.PUBLIC_SITE_URL && origin !== env.PUBLIC_SITE_URL) throw new ApiError(403, 'FORBIDDEN', 'Origin not allowed.')
  const body = parse(enquirySchema, req.body)
  // Likely automated: the honeypot is filled, the form was submitted implausibly fast, or the message is mostly links.
  // Answer as if accepted so bots learn nothing, but store nothing.
  const tooFast = body.form_started && Date.now() - body.form_started < 2500
  const linkSpam = (body.message?.match(/https?:\/\//g)?.length ?? 0) > 4
  if (body.company_url || tooFast || linkSpam) return ok(res, { received: true }, 201)

  const common = {
    name: body.name, businessName: body.business, email: body.email, phone: body.phone, website: body.website,
    category: body.category, budget: body.budget, source: 'Website', sourceDetail: body.source_detail,
  }
  if (body.enquiry_type === 'audit') {
    const audit = await prisma.growthAudit.create({ data: { ...common, requirements: body.message, activities: { create: { type: 'CREATED', message: 'Audit requested through the website form.' } } } })
    ok(res, { received: true }, 201)
    void notifySubmission({ kind: 'audit', id: audit.id, ...common, service: body.service, message: body.message })
  } else {
    const lead = await prisma.lead.create({ data: { ...common, service: body.service, message: body.message, activities: { create: { type: 'CREATED', message: 'Enquiry received through the website form.' } } } })
    ok(res, { received: true }, 201)
    void notifySubmission({ kind: 'lead', id: lead.id, ...common, service: body.service, message: body.message })
  }
})

// ---------- Published content ----------
publicRouter.use(readCors)
const insightSummary = { title: true, slug: true, excerpt: true, category: true, featuredImage: true, authorName: true, tags: true, publishedAt: true } as const
const summary = <T extends { featuredImage: string | null; publishedAt: Date | null }>(i: T) => ({ ...i, featuredImage: absolute(i.featuredImage), publishedAt: i.publishedAt?.toISOString() ?? null })

const pillarOrder = (p: string) => PILLARS.indexOf(p as (typeof PILLARS)[number])

publicRouter.get('/site', cacheable(60), async (_req, res) => {
  const [settings, seo, services, industries, testimonials, caseStudies, insights] = await Promise.all([
    getSettings(),
    getSeo(),
    prisma.service.findMany({ where: { published: true, archivedAt: null }, orderBy: [{ order: 'asc' }, { title: 'asc' }], select: { title: true, slug: true, pillar: true, shortDescription: true } }),
    prisma.industry.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { name: true, slug: true, description: true } }),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], select: { name: true, company: true, designation: true, quote: true, photoUrl: true } }),
    prisma.caseStudy.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }], take: 6, select: { title: true, slug: true, industry: true, summary: true, coverImage: true, publishedAt: true } }),
    prisma.insight.findMany({ where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 6, select: insightSummary }),
  ])
  const { id: _id, updatedAt: _updated, ...publicSettings } = settings
  void _id; void _updated
  const site: PublicSite = {
    settings: publicSettings,
    seo,
    services: services.sort((a, b) => pillarOrder(a.pillar) - pillarOrder(b.pillar)),
    industries,
    testimonials: testimonials.map(t => ({ ...t, photoUrl: absolute(t.photoUrl) })),
    caseStudies: caseStudies.map(c => ({ ...c, coverImage: absolute(c.coverImage), publishedAt: c.publishedAt?.toISOString() ?? null })),
    insights: insights.map(summary),
  }
  ok(res, site)
})

publicRouter.get('/insights', cacheable(60), async (req, res) => {
  const { page, pageSize } = parse(listQuery, req.query)
  const category = z.enum(INSIGHT_CATEGORIES).optional().catch(undefined).parse(req.query.category)
  const where = { status: 'PUBLISHED' as const, publishedAt: { lte: new Date() }, ...(category ? { category } : {}) }
  const [items, total] = await Promise.all([
    prisma.insight.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: insightSummary }),
    prisma.insight.count({ where }),
  ])
  paged(res, items.map(summary), total, page, pageSize)
})

publicRouter.get('/insights/:slug', cacheable(60), async (req, res) => {
  const insight = await prisma.insight.findFirst({ where: { slug: req.params.slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } } })
  if (!insight) throw notFound('Article')
  const { title, slug, excerpt, category, featuredImage, authorName, tags, publishedAt, content, seoTitle, metaDescription, ogImage } = insight
  ok(res, {
    ...summary({ title, slug, excerpt, category, featuredImage, authorName, tags, publishedAt }),
    content: absoluteMarkdown(content),
    seo: {
      title: seoTitle || title, description: metaDescription || excerpt, canonicalUrl: env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/insights/${slug}` : null,
      ogTitle: seoTitle || title, ogDescription: metaDescription || excerpt, ogImage: absolute(ogImage || featuredImage), noindex: false, nofollow: false,
    },
  })
})

publicRouter.get('/case-studies', cacheable(60), async (_req, res) => {
  const items = await prisma.caseStudy.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }], select: { title: true, slug: true, industry: true, summary: true, coverImage: true, publishedAt: true } })
  ok(res, items.map(c => ({ ...c, coverImage: absolute(c.coverImage), publishedAt: c.publishedAt?.toISOString() ?? null })))
})

publicRouter.get('/case-studies/:slug', cacheable(60), async (req, res) => {
  const c = await prisma.caseStudy.findFirst({ where: { slug: req.params.slug, status: 'PUBLISHED' } })
  if (!c) throw notFound('Case study')
  ok(res, {
    title: c.title, slug: c.slug, industry: c.industry, summary: c.summary, coverImage: absolute(c.coverImage), publishedAt: c.publishedAt?.toISOString() ?? null,
    challenge: c.challenge && absoluteMarkdown(c.challenge), strategy: c.strategy && absoluteMarkdown(c.strategy), execution: c.execution && absoluteMarkdown(c.execution),
    deliverables: c.deliverables, result: c.result && absoluteMarkdown(c.result), metrics: Array.isArray(c.metrics) ? c.metrics : [], images: c.images.map(i => absolute(i)!),
    seo: {
      title: c.seoTitle || c.title, description: c.metaDescription || c.summary, canonicalUrl: env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/work/${c.slug}` : null,
      ogTitle: c.seoTitle || c.title, ogDescription: c.metaDescription || c.summary, ogImage: absolute(c.ogImage || c.coverImage), noindex: false, nofollow: false,
    },
  })
})

// Sitemap including published articles and case studies (the build-time sitemap lists only the homepage).
publicRouter.get('/sitemap.xml', cacheable(3600), async (_req, res) => {
  if (!env.PUBLIC_SITE_URL) throw new ApiError(404, 'NOT_CONFIGURED', 'PUBLIC_SITE_URL is not set.')
  const [insights, cases, seo] = await Promise.all([
    prisma.insight.findMany({ where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    prisma.caseStudy.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    getSeo(),
  ])
  const base = env.PUBLIC_SITE_URL
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${base}/` },
    ...(insights.length && !seo.insights?.noindex ? [{ loc: `${base}/insights` }] : []),
    ...insights.map(i => ({ loc: `${base}/insights/${i.slug}`, lastmod: i.updatedAt.toISOString() })),
    ...cases.map(c => ({ loc: `${base}/work/${c.slug}`, lastmod: c.updatedAt.toISOString() })),
  ]
  const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`)
})
