import { Router } from 'express'
import { z } from 'zod'
import { PILLARS } from '@chazon/shared'
import { prisma, type Prisma } from '../db'
import { uniqueSlug } from '../lib/content'
import { notFound, ok, optionalText, parse, requiredText, slug, urlOrPath } from '../lib/http'

// Ordered, publishable lists: Services, Industries and Testimonials.

const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) })
const reorder = (update: (id: string, order: number) => Prisma.PrismaPromise<unknown>) => async (ids: string[]) => {
  await prisma.$transaction(ids.map((id, order) => update(id, order)))
}

// ---------- Services ----------
export const servicesRouter = Router()
const serviceFields = {
  title: requiredText(120, 'Title'),
  slug: slug.optional(),
  pillar: z.enum(PILLARS, { error: 'Choose a pillar' }),
  shortDescription: optionalText(300),
  description: optionalText(5000),
  icon: optionalText(60),
  imageUrl: urlOrPath,
  published: z.boolean(),
  archived: z.boolean(),
}
const serviceCreate = z.object(serviceFields).partial({ published: true, archived: true })
const serviceUpdate = z.object(serviceFields).partial()

servicesRouter.get('/', async (req, res) => {
  const view = z.enum(['active', 'archived', 'all']).catch('active').parse(req.query.view ?? 'active')
  const items = await prisma.service.findMany({
    where: view === 'active' ? { archivedAt: null } : view === 'archived' ? { archivedAt: { not: null } } : {},
    orderBy: [{ pillar: 'asc' }, { order: 'asc' }, { title: 'asc' }],
  })
  ok(res, items)
})
servicesRouter.get('/:id', async (req, res) => {
  const item = await prisma.service.findUnique({ where: { id: req.params.id } })
  if (!item) throw notFound('Service')
  ok(res, item)
})
servicesRouter.post('/', async (req, res) => {
  const { archived, slug: requested, ...data } = parse(serviceCreate, req.body)
  const last = await prisma.service.findFirst({ where: { pillar: data.pillar }, orderBy: { order: 'desc' }, select: { order: true } })
  const item = await prisma.service.create({
    data: { ...data, slug: requested || await uniqueSlug(data.title, async s => !!(await prisma.service.findUnique({ where: { slug: s } }))), order: (last?.order ?? -1) + 1, archivedAt: archived ? new Date() : null },
  })
  ok(res, item, 201)
})
servicesRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(serviceUpdate, req.body)
  const item = await prisma.service.update({ where: { id: req.params.id }, data: { ...data, ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) } })
  ok(res, item)
})
servicesRouter.post('/reorder', async (req, res) => {
  const { ids } = parse(reorderSchema, req.body)
  await reorder((id, order) => prisma.service.update({ where: { id }, data: { order } }))(ids)
  ok(res, { reordered: ids.length })
})
servicesRouter.delete('/:id', async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } })
  ok(res, { deleted: true })
})

// ---------- Industries ----------
export const industriesRouter = Router()
const industryFields = { name: requiredText(100, 'Name'), slug: slug.optional(), description: optionalText(500), published: z.boolean() }
const industryCreate = z.object(industryFields).partial({ published: true })
const industryUpdate = z.object(industryFields).partial()

industriesRouter.get('/', async (_req, res) => ok(res, await prisma.industry.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })))
industriesRouter.post('/', async (req, res) => {
  const { slug: requested, ...data } = parse(industryCreate, req.body)
  const last = await prisma.industry.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  const item = await prisma.industry.create({ data: { ...data, slug: requested || await uniqueSlug(data.name, async s => !!(await prisma.industry.findUnique({ where: { slug: s } }))), order: (last?.order ?? -1) + 1 } })
  ok(res, item, 201)
})
industriesRouter.patch('/:id', async (req, res) => ok(res, await prisma.industry.update({ where: { id: req.params.id }, data: parse(industryUpdate, req.body) })))
industriesRouter.post('/reorder', async (req, res) => {
  const { ids } = parse(reorderSchema, req.body)
  await reorder((id, order) => prisma.industry.update({ where: { id }, data: { order } }))(ids)
  ok(res, { reordered: ids.length })
})
industriesRouter.delete('/:id', async (req, res) => {
  await prisma.industry.delete({ where: { id: req.params.id } })
  ok(res, { deleted: true })
})

// ---------- Testimonials ----------
export const testimonialsRouter = Router()
const testimonialFields = {
  name: requiredText(100, 'Name'),
  company: optionalText(150),
  designation: optionalText(120),
  quote: requiredText(1500, 'Testimonial'),
  photoUrl: urlOrPath,
  published: z.boolean(),
}
const testimonialCreate = z.object(testimonialFields).partial({ published: true })
const testimonialUpdate = z.object(testimonialFields).partial()

testimonialsRouter.get('/', async (_req, res) => ok(res, await prisma.testimonial.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })))
testimonialsRouter.post('/', async (req, res) => {
  const data = parse(testimonialCreate, req.body)
  const last = await prisma.testimonial.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  ok(res, await prisma.testimonial.create({ data: { ...data, order: (last?.order ?? -1) + 1 } }), 201)
})
testimonialsRouter.patch('/:id', async (req, res) => ok(res, await prisma.testimonial.update({ where: { id: req.params.id }, data: parse(testimonialUpdate, req.body) })))
testimonialsRouter.post('/reorder', async (req, res) => {
  const { ids } = parse(reorderSchema, req.body)
  await reorder((id, order) => prisma.testimonial.update({ where: { id }, data: { order } }))(ids)
  ok(res, { reordered: ids.length })
})
testimonialsRouter.delete('/:id', async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } })
  ok(res, { deleted: true })
})
