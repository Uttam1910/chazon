// Baseline content: the services, industries, settings and SEO the public website already shows.
// Idempotent — existing rows (including anything edited in the Admin) are never overwritten.
// Creates no leads, case studies, testimonials or articles: those must be real.
import { PILLARS, slugify } from '@chazon/shared'
import { industries, pillars } from '../../web/src/content'
import { prisma } from '../src/db'

async function main() {
  let services = 0
  for (const [p, pillar] of pillars.entries()) {
    for (const [order, title] of pillar.items.entries()) {
      const slug = slugify(title)
      const exists = await prisma.service.findUnique({ where: { slug } })
      if (!exists) { await prisma.service.create({ data: { title, slug, pillar: PILLARS[p], order, published: true } }); services++ }
    }
  }
  let added = 0
  for (const [order, [name, description]] of industries.entries()) {
    const slug = slugify(name)
    if (!(await prisma.industry.findUnique({ where: { slug } }))) { await prisma.industry.create({ data: { name, slug, description, order, published: true } }); added++ }
  }
  await prisma.websiteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      description: 'Chazon Digital Ventures helps businesses build, optimise and grow their digital revenue channels through strategy, technology, marketing and automation.',
    },
  })
  // Mirrors the existing <head> tags in apps/web/index.html.
  await prisma.seoSetting.upsert({
    where: { page: 'home' },
    update: {},
    create: {
      page: 'home',
      title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
      description: 'Build, optimise and grow your digital revenue channels with Chazon. Business-first strategy, websites, marketing, digital commerce and automation in Mumbai.',
      ogTitle: 'Chazon Digital Ventures — Revenue-Led Digital Transformation',
      ogDescription: 'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.',
    },
  })
  await prisma.seoSetting.upsert({ where: { page: 'global' }, update: {}, create: { page: 'global' } })
  console.log(`Seed complete: ${services} services and ${added} industries added (existing rows left unchanged).`)
}

main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
