import type { ReactNode } from 'react'
import { PILLAR_SLUGS, PILLARS } from '@chazon/shared'
import { Home } from './pages/Home'
import { ServicePage, ServicesIndex } from './pages/Services'
import { About, Approach } from './pages/Company'
import { Contact, GrowthAudit } from './pages/Enquire'
import { NotFound, Privacy, Terms } from './pages/Legal'
import { CaseStudyPage, InsightPage, InsightsIndex, WorkIndex } from './pages/Content'

// Every URL the website answers. Fixed pages are listed in PUBLIC_PAGES (packages/shared) for the sitemap and prerender.

const pages: Record<string, () => ReactNode> = {
  '/': () => <Home/>,
  '/services': () => <ServicesIndex/>,
  ...Object.fromEntries(PILLARS.map((p, i) => [`/services/${PILLAR_SLUGS[p]}`, () => <ServicePage index={i}/>])),
  '/growth-audit': () => <GrowthAudit/>,
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
