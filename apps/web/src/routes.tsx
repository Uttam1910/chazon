import type { ReactNode } from 'react'
import { Home } from './pages/Home'
import { ServicePage, ServicesIndex } from './pages/Services'
import {
  DedicatedServicePage,
  WEBSITE_DEV,
  DIGITAL_MARKETING,
  SEO_SERVICES,
  CONTENT_MARKETING,
  SOCIAL_MEDIA_MARKETING,
  PPC_ADVERTISING,
  GOOGLE_ADS,
  EMAIL_MARKETING,
  AFFILIATE_INFLUENCER_MARKETING,
  UI_UX_DESIGN,
  LANDING_PAGE_DEV,
  ECOMMERCE_DEV,
  LOCAL_SEO,
  AI_INTEGRATION,
} from './pages/SearchLandingPages'
import { About, Approach } from './pages/Company'
import { Contact } from './pages/Contact'
import { WebsiteAudit } from './pages/WebsiteAudit'
import { GrowthAudit } from './pages/Enquire'
import { NotFound, Privacy, Terms } from './pages/Legal'
import { CaseStudyPage, InsightPage, InsightsIndex, WorkIndex } from './pages/Content'

// Every URL the website answers. Fixed pages are listed in PUBLIC_PAGES (packages/shared) for the sitemap and prerender.

const pages: Record<string, () => ReactNode> = {
  '/': () => <Home />,
  '/services': () => <ServicesIndex />,

  // Dedicated 10 Individual Service Detail Pages matching design reference & brief
  '/services/website-development': () => <DedicatedServicePage config={WEBSITE_DEV} />,
  '/services/digital-marketing': () => <DedicatedServicePage config={DIGITAL_MARKETING} />,
  '/services/seo-services': () => <DedicatedServicePage config={SEO_SERVICES} />,
  '/services/search-engine-optimisation': () => <DedicatedServicePage config={SEO_SERVICES} />,
  '/services/content-marketing': () => <DedicatedServicePage config={CONTENT_MARKETING} />,
  '/services/social-media-marketing': () => <DedicatedServicePage config={SOCIAL_MEDIA_MARKETING} />,
  '/services/ppc-advertising': () => <DedicatedServicePage config={PPC_ADVERTISING} />,
  '/services/google-ads': () => <DedicatedServicePage config={GOOGLE_ADS} />,
  '/services/email-marketing': () => <DedicatedServicePage config={EMAIL_MARKETING} />,
  '/services/affiliate-influencer-marketing': () => <DedicatedServicePage config={AFFILIATE_INFLUENCER_MARKETING} />,
  '/services/ui-ux-design': () => <DedicatedServicePage config={UI_UX_DESIGN} />,

  // Pillar & specialized search landing pages preserved for backward compatibility
  '/services/digital-growth': () => <DedicatedServicePage config={DIGITAL_MARKETING} />,
  '/services/conversion-optimisation': () => <ServicePage index={2} />,
  '/services/business-automation': () => <ServicePage index={3} />,
  '/services/landing-page-development': () => <DedicatedServicePage config={LANDING_PAGE_DEV} />,
  '/services/ecommerce-development': () => <DedicatedServicePage config={ECOMMERCE_DEV} />,
  '/services/local-seo': () => <DedicatedServicePage config={LOCAL_SEO} />,
  '/services/ai-integration': () => <DedicatedServicePage config={AI_INTEGRATION} />,

  // Growth Framework, Company, and Diagnostic pages
  '/approach': () => <Approach />,
  '/growth-framework': () => <Approach />,
  '/about': () => <About />,
  '/website-audit': () => <WebsiteAudit />,
  '/growth-audit': () => <GrowthAudit />,
  '/work': () => <WorkIndex />,
  '/insights': () => <InsightsIndex />,
  '/contact': () => <Contact />,
  '/privacy': () => <Privacy />,
  '/terms': () => <Terms />,
}

/** The page for a path, and the HTTP status a static host should serve it with. */
export function matchRoute(path: string): { element: ReactNode; status: 200 | 404 } {
  const page = pages[path]
  if (page) return { element: page(), status: 200 }
  const insight = /^\/insights\/([a-z0-9-]+)$/.exec(path)
  if (insight) return { element: <InsightPage slug={insight[1]} />, status: 200 }
  const work = /^\/work\/([a-z0-9-]+)$/.exec(path)
  if (work) return { element: <CaseStudyPage slug={work[1]} />, status: 200 }
  return { element: <NotFound />, status: 404 }
}
