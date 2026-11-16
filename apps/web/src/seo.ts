import { createContext, useContext, useEffect } from 'react'
import type { PublicSeo, PublicSettings } from '@chazon/shared'
import { config } from './config'
import { founder } from './content'

// Page metadata: title, description, canonical, robots, Open Graph and JSON-LD. Each page declares it with
// usePageMeta(). At build time the prerender collects it into the static HTML; in the browser it keeps <head> in sync
// as the visitor navigates. Structured data only describes what the page visibly shows.

export const BRAND = 'Chazon Digital Ventures'
export const withBrand = (title: string) => (title.includes('Chazon') ? title : `${title} | ${BRAND}`)
export const absoluteUrl = (path: string) => (config.siteUrl ? `${config.siteUrl}${path}` : '')

export type Meta = {
  title: string
  description?: string | null
  /** Site-relative path; becomes the canonical URL when VITE_SITE_URL is set. */
  path?: string
  /** Overrides the canonical built from `path`. */
  canonical?: string | null
  noindex?: boolean
  nofollow?: boolean
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  ogType?: 'website' | 'article'
  schema?: Schema[]
}
export type Schema = Record<string, unknown>

type Tag = { tag: 'title' | 'meta' | 'link' | 'script'; attrs: Record<string, string>; text?: string }

export function headTags(m: Meta): Tag[] {
  const canonical = m.canonical || (m.path !== undefined ? absoluteUrl(m.path) : '')
  const ogImage = m.ogImage || absoluteUrl('/og-image.png')
  const title = m.ogTitle || m.title
  const description = m.ogDescription || m.description || ''
  const meta = (key: 'name' | 'property', name: string, content: string | null | undefined): Tag[] => (content ? [{ tag: 'meta', attrs: { [key]: name, content } }] : [])
  return [
    { tag: 'title', attrs: {}, text: m.title },
    ...meta('name', 'description', m.description),
    ...meta('name', 'robots', `${m.noindex ? 'noindex' : 'index'}, ${m.nofollow ? 'nofollow' : 'follow'}`),
    ...(canonical ? [{ tag: 'link', attrs: { rel: 'canonical', href: canonical } } as Tag] : []),
    ...meta('property', 'og:site_name', BRAND),
    ...meta('property', 'og:locale', 'en_IN'),
    ...meta('property', 'og:type', m.ogType || 'website'),
    ...meta('property', 'og:title', title),
    ...meta('property', 'og:description', description),
    ...meta('property', 'og:url', canonical),
    ...meta('property', 'og:image', ogImage),
    ...(ogImage && !m.ogImage ? [...meta('property', 'og:image:width', '1200'), ...meta('property', 'og:image:height', '630')] : []),
    ...meta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary'),
    ...meta('name', 'twitter:title', title),
    ...meta('name', 'twitter:description', description),
    ...(m.schema?.length ? [{ tag: 'script', attrs: { type: 'application/ld+json' }, text: JSON.stringify(graph(m.schema)) } as Tag] : []),
  ]
}

/** One schema as-is; several as a single @graph sharing one @context. */
function graph(schema: Schema[]) {
  if (schema.length === 1) return schema[0]
  return { '@context': 'https://schema.org', '@graph': schema.map(node => Object.fromEntries(Object.entries(node).filter(([k]) => k !== '@context'))) }
}

const escapeHtml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Head markup for the prerendered HTML. JSON-LD is escaped so content can never close the script element. */
export function renderHead(m: Meta) {
  return headTags(m).map(({ tag, attrs, text }) => {
    const a = Object.entries(attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join('') + ' data-head=""'
    if (tag === 'meta' || tag === 'link') return `<${tag}${a}>`
    const body = tag === 'script' ? (text ?? '').replace(/</g, '\\u003c') : escapeHtml(text ?? '')
    return `<${tag}${a}>${body}</${tag}>`
  }).join('')
}

export function applyHead(m: Meta) {
  document.title = m.title
  document.head.querySelectorAll('[data-head]:not(title)').forEach(el => el.remove())
  for (const { tag, attrs, text } of headTags(m)) {
    if (tag === 'title') continue
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    el.setAttribute('data-head', '')
    if (text) el.textContent = text
    document.head.append(el)
  }
}

/** Collects the page's metadata during the build-time render. Absent in the browser. */
export const HeadContext = createContext<{ meta?: Meta } | null>(null)

export function usePageMeta(meta: Meta) {
  const collector = useContext(HeadContext)
  if (collector) collector.meta = meta
  const key = JSON.stringify(meta)
  useEffect(() => { applyHead(JSON.parse(key) as Meta) }, [key])
}

/** Admin-managed SEO for a page, layered over the built-in metadata: non-empty Admin values win. */
export function withAdminSeo(meta: Meta, ...layers: (Partial<PublicSeo> | undefined)[]): Meta {
  const out = { ...meta }
  for (const layer of layers) {
    if (!layer) continue
    if (layer.title) out.title = withBrand(layer.title)
    if (layer.description) out.description = layer.description
    if (layer.canonicalUrl) out.canonical = layer.canonicalUrl
    if (layer.ogTitle) out.ogTitle = layer.ogTitle
    if (layer.ogDescription) out.ogDescription = layer.ogDescription
    if (layer.ogImage) out.ogImage = layer.ogImage
    // Robots flags add up: a global noindex can't be undone by a page's default "false".
    if (layer.noindex) out.noindex = true
    if (layer.nofollow) out.nofollow = true
  }
  return out
}

// ---------- Structured data (only with a production URL, so every @id and url is absolute) ----------
const orgId = () => absoluteUrl('/#organization')

export function organizationSchema(settings: PublicSettings, sameAs: string[]): Schema[] {
  const base = absoluteUrl('/')
  const orgUrl = base || 'https://chazon-sigma.vercel.app/'
  const org: Schema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': orgId(),
    name: settings.companyName || BRAND,
    legalName: 'Chazon Digital Ventures',
    url: orgUrl,
    logo: absoluteUrl('/logo-512.png'),
    image: absoluteUrl('/og-image.png'),
    slogan: settings.tagline || 'Revenue-Led Digital Transformation',
    description:
      'Chazon Digital Ventures helps businesses build, optimise and grow their digital revenue channels through strategy, technology, marketing and automation.',
    founder: { '@type': 'Person', name: founder.name },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '19.0760',
      longitude: '72.8777',
    },
    priceRange: '$$',
    currenciesAccepted: 'INR, USD, EUR, GBP, AED',
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'AdministrativeArea', name: 'Global' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:30',
        closes: '18:30',
      },
    ],
    knowsAbout: [
      'Search Engine Optimisation',
      'Website Engineering',
      'Digital Marketing Strategy',
      'Conversion Rate Optimisation',
      'Business Process Automation',
      'UI/UX Architecture',
      'Performance Advertising',
    ],
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }

  const website: Schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: BRAND,
    url: orgUrl,
    inLanguage: 'en-IN',
    publisher: { '@id': orgId() },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${orgUrl}services?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return [org, website]
}

export function webApplicationSchema({
  name = 'Website Health Scanner & SEO Diagnostic Tool',
  path = '/website-audit',
  description = 'Instant 0–100 Website Health Score, Core Web Vitals diagnostic, speed latency indexing, and SEO bottleneck analyzer.',
}: {
  name?: string
  path?: string
  description?: string
} = {}): Schema[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name,
      url: absoluteUrl(path),
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      creator: { '@id': orgId() },
      description,
      featureList: [
        '0-100 Performance Score',
        'SEO Health Diagnostic',
        'Mobile Responsiveness Audit',
        'Conversion Leak Detection',
        'Core Web Vitals Metric Tracking',
      ],
    },
  ]
}

/** BreadcrumbList matching the visible breadcrumb trail ([label, path] pairs, starting after Home). */
export function breadcrumbSchema(trail: [string, string][]): Schema[] {
  if (!config.siteUrl) return []
  return [{
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as [string, string], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path) })),
  }]
}

export function serviceSchema({ name, description, path, offers }: { name: string; description: string; path: string; offers: string[] }): Schema[] {
  if (!config.siteUrl) return []
  return [{
    '@context': 'https://schema.org', '@type': 'Service', name, description, url: absoluteUrl(path), serviceType: name,
    provider: { '@type': 'Organization', '@id': orgId(), name: BRAND, url: absoluteUrl('/') },
    hasOfferCatalog: { '@type': 'OfferCatalog', name, itemListElement: offers.map(o => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o } })) },
  }]
}

export function faqSchema(faqs: [string, string][]): Schema[] {
  if (!config.siteUrl || !faqs.length) return []
  return [{
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }]
}
