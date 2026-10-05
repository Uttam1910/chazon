import { createContext, useContext } from 'react'
import { PILLARS, type PublicCaseStudySummary, type PublicInsightSummary, type PublicSeo, type PublicSettings, type PublicSite } from '@chazon/shared'
import { buildChannels, config, type Channels } from './config'
import { industries as staticIndustries, pillars as staticPillars, testimonials as staticTestimonials, type Pillar } from './content'

// Website content: rendered immediately from the built-in copy in content.ts, then replaced by what the
// Chazon Admin has published once the API responds. If the API is unavailable the built-in copy simply stays.

export type Testimonial = { quote: string; name: string; role: string; company: string; photoUrl?: string | null }
export type SiteData = Channels & {
  live: boolean
  settings: PublicSettings
  seo: Record<string, PublicSeo>
  pillars: Pillar[]
  industries: [string, string][]
  testimonials: Testimonial[]
  caseStudies: PublicCaseStudySummary[]
  insights: PublicInsightSummary[]
}

const defaultSettings: PublicSettings = {
  companyName: 'Chazon Digital Ventures', tagline: 'Revenue-Led Digital Transformation', description: '',
  email: config.email, phone: config.phone, whatsapp: config.whatsapp, location: 'Mumbai, Maharashtra',
  linkedinUrl: config.linkedin, instagramUrl: config.instagram, facebookUrl: config.facebook,
  ctaTalkLabel: 'Let’s Talk', ctaAuditLabel: 'Get a Digital Growth Audit',
}

export function compose(site?: PublicSite): SiteData {
  // Admin values win; an empty Admin field falls back to the build-time value (or the default copy).
  const settings = { ...defaultSettings }
  if (site) for (const [key, value] of Object.entries(site.settings) as [keyof PublicSettings, string][]) if (value) settings[key] = value
  return {
    live: !!site,
    settings,
    seo: site?.seo ?? {},
    pillars: site ? staticPillars.map((p, i) => ({ ...p, items: site.services.filter(s => s.pillar === PILLARS[i]).map(s => s.title) })) : staticPillars,
    industries: site ? site.industries.map(i => [i.name, i.description ?? ''] as [string, string]) : staticIndustries,
    testimonials: site ? site.testimonials.map(t => ({ quote: t.quote, name: t.name, role: t.designation ?? '', company: t.company ?? '', photoUrl: t.photoUrl })) : staticTestimonials,
    caseStudies: site?.caseStudies ?? [],
    insights: site?.insights ?? [],
    ...buildChannels({ email: settings.email, phone: settings.phone, whatsapp: settings.whatsapp, instagram: settings.instagramUrl, linkedin: settings.linkedinUrl, facebook: settings.facebookUrl }),
  }
}

export const SiteContext = createContext<SiteData>(compose())

export async function fetchPublic<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!config.apiUrl) throw new Error('API not configured')
  const response = await fetch(`${config.apiUrl}/api/public${path}`, { signal })
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
  return (await response.json()).data as T
}

export const useSite = () => useContext(SiteContext)

/** Applies title, description, canonical, Open Graph and robots tags for the current page. */
export function applySeo(seo: Partial<PublicSeo> & { title?: string | null }, fallback: { canonical?: string } = {}) {
  const head = document.head
  const meta = (attr: 'name' | 'property', key: string, content: string | null | undefined) => {
    let tag = head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!content) { if (attr === 'property' && key === 'og:image') tag?.remove(); return }
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attr, key); head.append(tag) }
    tag.content = content
  }
  if (seo.title) document.title = seo.title
  meta('name', 'description', seo.description)
  meta('property', 'og:title', seo.ogTitle || seo.title)
  meta('property', 'og:description', seo.ogDescription || seo.description)
  meta('name', 'twitter:title', seo.ogTitle || seo.title)
  meta('name', 'twitter:description', seo.ogDescription || seo.description)
  meta('property', 'og:image', seo.ogImage)
  if (seo.ogImage) meta('name', 'twitter:card', 'summary_large_image')
  meta('name', 'robots', `${seo.noindex ? 'noindex' : 'index'}, ${seo.nofollow ? 'nofollow' : 'follow'}`)
  const canonical = seo.canonicalUrl || fallback.canonical
  if (canonical) {
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; head.append(link) }
    link.href = canonical
    meta('property', 'og:url', canonical)
  }
}

/** Page SEO merged over the global defaults: the page's own values win, empty ones inherit. */
export function mergeSeo(seo: Record<string, PublicSeo>, page: string, own?: Partial<PublicSeo>): Partial<PublicSeo> {
  const layers = [seo.global, seo[page], own].filter(Boolean) as Partial<PublicSeo>[]
  const merged: Partial<PublicSeo> = {}
  for (const layer of layers) for (const [k, v] of Object.entries(layer)) if (v !== null && v !== undefined && v !== '' && typeof v !== 'boolean') (merged as Record<string, unknown>)[k] = v
  // Robots flags add up: a global noindex can't be undone by a page's default "false".
  merged.noindex = layers.some(l => l.noindex)
  merged.nofollow = layers.some(l => l.nofollow)
  return merged
}
