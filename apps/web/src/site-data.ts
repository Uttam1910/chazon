import { createContext, useContext } from 'react'
import { PILLARS, type PublicCaseStudySummary, type PublicInsightSummary, type PublicSeo, type PublicSettings, type PublicSite } from '@chazon/shared'
import { buildChannels, config, type Channels } from './config'
import { industries as staticIndustries, pillars as staticPillars, testimonials as staticTestimonials, type Pillar, type PillarService } from './content'

// Website content: rendered immediately from the built-in copy in content.ts, then replaced by what the
// Chazon Admin has published once the API responds. If the API is unavailable the built-in copy simply stays.

export type Testimonial = { quote: string; name: string; role: string; company: string; photoUrl?: string | null }
/** A pillar with the services currently offered under it (from the Admin once loaded), each with a one-line description. */
export type LivePillar = Pillar & { services: PillarService[] }
export type SiteData = Channels & {
  live: boolean
  settings: PublicSettings
  seo: Record<string, PublicSeo>
  pillars: LivePillar[]
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
    pillars: staticPillars.map((p, i) => {
      // Admin descriptions win; a service without one keeps the built-in line for the same title, if there is one.
      // A pillar with nothing published keeps the built-in list rather than rendering an empty service page.
      const published = (site?.services ?? []).filter(s => s.pillar === PILLARS[i])
        .map(s => ({ title: s.title, text: s.shortDescription || p.page.services.find(x => x.title === s.title)?.text || '' }))
      const services = published.length ? published : p.page.services
      return { ...p, items: services.map(s => s.title), services }
    }),
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
