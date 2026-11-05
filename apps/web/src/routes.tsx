import type { ReactNode } from 'react'
import { PILLAR_SLUGS, PILLARS } from '@chazon/shared'
import { Home } from './pages/Home'
import { ServicePage, ServicesIndex } from './pages/Services'
import {
  DedicatedServicePage,
  ECOMMERCE_DEV,
  AI_INTEGRATION,
  LANDING_PAGE_DEV,
  LOCAL_SEO,
  SEO_SERVICES,
  WebsiteAuditPage,
} from './pages/SearchLandingPages'
import { About, Approach } from './pages/Company'
import { Contact } from './pages/Enquire'
import { NotFound, Privacy, Terms } from './pages/Legal'
import { CaseStudyPage, InsightPage, InsightsIndex, WorkIndex } from './pages/Content'

// Every URL the website answers. Fixed pages are listed in PUBLIC_PAGES (packages/shared) for the sitemap and prerender.

const pages: Record<string, () => ReactNode> = {
  '/': () => <Home/>,
  '/services': () => <ServicesIndex/>,
  ...Object.fromEntries(PILLARS.map((p, i) => [`/services/${PILLAR_SLUGS[p]}`, () => <ServicePage index={i}/>])),
  '/services/landing-page-development': () => <DedicatedServicePage config={LANDING_PAGE_DEV}/>,
  '/services/ecommerce-development': () => <DedicatedServicePage config={ECOMMERCE_DEV}/>,
  '/services/seo-services': () => <DedicatedServicePage config={SEO_SERVICES}/>,
  '/services/local-seo': () => <DedicatedServicePage config={LOCAL_SEO}/>,
  '/services/ai-integration': () => <DedicatedServicePage config={AI_INTEGRATION}/>,
  '/website-audit': () => <WebsiteAuditPage mode="audit"/>,
  '/growth-audit': () => <WebsiteAuditPage mode="growth"/>,
  '/approach': () => <Approach/>,
  '/about': () => <About/>,
  '/contact': () => <Contact/>,
  '/privacy': () => <Privacy/>,
  '/terms': () => <Terms/>,
  '/insights': () => <InsightsIndex/>,
  '/work': () => <WorkIndex/>,
}

/** The page for a path, and the HTTP status a static host should serve it with. */
export function matchRoute(path: string): { element: ReactNode; status: 200 | 404 } {
  const page = pages[path]
  if (page) return { element: page(), status: 200 }
  const insight = /^\/insights\/([a-z0-9-]+)$/.exec(path)
  if (insight) return { element: <InsightPage slug={insight[1]}/>, status: 200 }
  const work = /^\/work\/([a-z0-9-]+)$/.exec(path)
  if (work) return { element: <CaseStudyPage slug={work[1]}/>, status: 200 }
  return { element: <NotFound/>, status: 404 }
}
