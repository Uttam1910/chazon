import { Router } from 'express'
import { z } from 'zod'
import { CONTENT_STATUSES, INSIGHT_CATEGORIES } from '@chazon/shared'
import { prisma, type Prisma } from '../db'
import { publishDate, uniqueSlug } from '../lib/content'
import { listQuery, notFound, ok, optionalText, paged, parse, requiredText, slug, urlOrPath } from '../lib/http'

// Editorial content with a Draft → Published → Archived lifecycle: Case Studies and Insights.

const seoFields = { seoTitle: optionalText(120), metaDescription: optionalText(320), ogImage: urlOrPath }
const filters = listQuery.extend({
  status: z.enum(CONTENT_STATUSES).optional().catch(undefined),
  category: z.string().trim().max(100).optional(),
})

// ---------- Case studies ----------
export const caseStudiesRouter = Router()
const longText = optionalText(20000)
const caseFields = {
  title: requiredText(160, 'Client / project name'),
  slug: slug.optional(),
  industry: optionalText(100),
  summary: optionalText(600),
  challenge: longText,
  strategy: longText,
  execution: longText,
  deliverables: z.array(z.string().trim().min(1).max(200)).max(40),
  result: longText,
  metrics: z.array(z.object({ label: requiredText(80, 'Metric label'), value: requiredText(80, 'Metric value') })).max(16),
  coverImage: urlOrPath,
  images: z.array(z.string().trim().max(2000).refine(v => /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v), 'Enter a valid image URL')).max(24),
  status: z.enum(CONTENT_STATUSES),
  publishedAt: z.coerce.date().nullable(),
  ...seoFields,
}
const caseCreate = z.object(caseFields).partial({ deliverables: true, metrics: true, images: true, status: true, publishedAt: true })
const caseUpdate = z.object(caseFields).partial()

caseStudiesRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status } = parse(filters, req.query)
  const where: Prisma.CaseStudyWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { industry: { contains: q, mode: 'insensitive' } }, { summary: { contains: q, mode: 'insensitive' } }] } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.caseStudy.findMany({ where, orderBy: [{ updatedAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, select: { id: true, title: true, slug: true, industry: true, status: true, publishedAt: true, updatedAt: true, coverImage: true } }),
    prisma.caseStudy.count({ where }),
  ])
  paged(res, items, total, page, pageSize)
})
caseStudiesRouter.get('/:id', async (req, res) => {
  const item = await prisma.caseStudy.findUnique({ where: { id: req.params.id } })
  if (!item) throw notFound('Case study')
  ok(res, item)
})
caseStudiesRouter.post('/', async (req, res) => {
  const { slug: requested, publishedAt, ...data } = parse(caseCreate, req.body)
  const item = await prisma.caseStudy.create({
    data: {
      ...data,
      slug: requested || await uniqueSlug(data.title, async s => !!(await prisma.caseStudy.findUnique({ where: { slug: s } }))),
      publishedAt: publishDate(data.status, publishedAt, null) ?? null,
    },
  })
  ok(res, item, 201)
})
caseStudiesRouter.patch('/:id', async (req, res) => {
  const { publishedAt, ...data } = parse(caseUpdate, req.body)
  const existing = await prisma.caseStudy.findUnique({ where: { id: req.params.id }, select: { publishedAt: true } })
  if (!existing) throw notFound('Case study')
  const item = await prisma.caseStudy.update({ where: { id: req.params.id }, data: { ...data, publishedAt: publishDate(data.status, publishedAt, existing.publishedAt) } })
  ok(res, item)
})
caseStudiesRouter.delete('/:id', async (req, res) => {
  await prisma.caseStudy.delete({ where: { id: req.params.id } })
  ok(res, { deleted: true })
})

// ---------- Insights ----------
export const insightsRouter = Router()
const insightFields = {
  title: requiredText(200, 'Title'),
  slug: slug.optional(),
  excerpt: optionalText(500),
  content: z.string().max(100_000, 'Content is too long'),
  featuredImage: urlOrPath,
  category: z.enum(INSIGHT_CATEGORIES, { error: 'Choose a category' }),
  authorName: optionalText(120),
  tags: z.array(z.string().trim().min(1).max(40)).max(15),
  status: z.enum(CONTENT_STATUSES),
  publishedAt: z.coerce.date().nullable(),
  ...seoFields,
}
const insightCreate = z.object(insightFields).partial({ content: true, tags: true, status: true, publishedAt: true })
const insightUpdate = z.object(insightFields).partial()

insightsRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status, category } = parse(filters, req.query)
  const where: Prisma.InsightWhereInput = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }, { tags: { has: q } }] } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.insight.findMany({ where, orderBy: [{ updatedAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, select: { id: true, title: true, slug: true, category: true, status: true, authorName: true, publishedAt: true, updatedAt: true, featuredImage: true } }),
    prisma.insight.count({ where }),
  ])
  paged(res, items, total, page, pageSize)
})
insightsRouter.get('/:id', async (req, res) => {
  const item = await prisma.insight.findUnique({ where: { id: req.params.id } })
  if (!item) throw notFound('Insight')
  ok(res, item)
})
insightsRouter.post('/', async (req, res) => {
  const { slug: requested, publishedAt, ...data } = parse(insightCreate, req.body)
  const item = await prisma.insight.create({
    data: {
      ...data,
      authorName: data.authorName ?? req.admin!.name,
      slug: requested || await uniqueSlug(data.title, async s => !!(await prisma.insight.findUnique({ where: { slug: s } }))),
      publishedAt: publishDate(data.status, publishedAt, null) ?? null,
    },
  })
  ok(res, item, 201)
})
insightsRouter.patch('/:id', async (req, res) => {
  const { publishedAt, ...data } = parse(insightUpdate, req.body)
  const existing = await prisma.insight.findUnique({ where: { id: req.params.id }, select: { publishedAt: true } })
  if (!existing) throw notFound('Insight')
  ok(res, await prisma.insight.update({ where: { id: req.params.id }, data: { ...data, publishedAt: publishDate(data.status, publishedAt, existing.publishedAt) } }))
})
insightsRouter.delete('/:id', async (req, res) => {
  await prisma.insight.delete({ where: { id: req.params.id } })
  ok(res, { deleted: true })
})
