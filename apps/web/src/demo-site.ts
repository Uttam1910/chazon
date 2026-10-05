// Demo mode (VITE_DEMO_MODE=true): the website's published content comes from built-in sample data instead of the API.
import { PILLARS, slugify, type PageMeta, type PublicCaseStudy, type PublicInsight, type PublicSeo, type PublicSite } from '@chazon/shared'
import { daysAgo, demoCaseStudies, demoHomeSeo, demoIndustries, demoInsights, demoServices, demoSettings, demoTestimonials } from '@chazon/shared/demo'

const noSeo: PublicSeo = { title: null, description: null, canonicalUrl: null, ogTitle: null, ogDescription: null, ogImage: null, noindex: false, nofollow: false }
const insights = demoInsights.filter(i => i.status === 'PUBLISHED').map(i => ({
  title: i.title, slug: i.slug, excerpt: i.excerpt, category: i.category, featuredImage: null, authorName: 'Chazon Team', tags: ['demo'], publishedAt: daysAgo(i.days), content: i.content,
}))
const caseStudies = demoCaseStudies.filter(c => c.status === 'PUBLISHED').map(c => ({
  title: c.title, slug: c.slug, industry: c.industry, summary: c.summary, coverImage: null, publishedAt: daysAgo(c.days),
  challenge: c.challenge, strategy: c.strategy, execution: c.execution, deliverables: c.deliverables, result: c.result, metrics: c.metrics, images: [],
}))

export const demoSite: PublicSite = {
  settings: demoSettings,
  seo: { home: { ...noSeo, ...demoHomeSeo } },
  services: [...demoServices].sort((a, b) => PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar)).map(s => ({ title: s.title, slug: slugify(s.title), pillar: s.pillar, shortDescription: null })),
  industries: demoIndustries.map(([name, description]) => ({ name, slug: slugify(name), description })),
  testimonials: demoTestimonials.map(t => ({ name: t.name, company: t.company, designation: t.designation, quote: t.quote, photoUrl: null })),
  caseStudies: caseStudies.map(({ title, slug, industry, summary, coverImage, publishedAt }) => ({ title, slug, industry, summary, coverImage, publishedAt })),
  insights: insights.map(({ content: _content, ...summary }) => { void _content; return summary }),
}

/** Answers the website's content requests (/insights…, /case-studies/:slug) from the sample data; null = not found. */
export function demoContent(path: string): { data: unknown; meta?: PageMeta } | null {
  const url = new URL(path, 'http://demo')
  const [resource, slug] = url.pathname.split('/').filter(Boolean)
  if (resource === 'insights' && !slug) {
    const category = url.searchParams.get('category')
    const list = demoSite.insights.filter(i => !category || i.category === category)
    const pageSize = Number(url.searchParams.get('pageSize')) || 12
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    return { data: list.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total: list.length, pages: Math.max(1, Math.ceil(list.length / pageSize)) } }
  }
  if (resource === 'insights') {
    const article = insights.find(i => i.slug === slug)
    return article ? { data: { ...article, seo: { ...noSeo, title: article.title, description: article.excerpt } } satisfies PublicInsight } : null
  }
  if (resource === 'case-studies' && slug) {
    const study = caseStudies.find(c => c.slug === slug)
    return study ? { data: { ...study, seo: { ...noSeo, title: study.title, description: study.summary } } satisfies PublicCaseStudy } : null
  }
  return null
}
