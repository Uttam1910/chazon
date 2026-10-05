import { useEffect } from 'react'
import { Footer, MobileActions, Navbar } from './components/Layout'
import { Hero } from './sections/Hero'
import { Problem, WhoWeAre } from './sections/Story'
import { Services } from './sections/Services'
import { Approach, AuditStrip, WhyChazon } from './sections/Method'
import { Founder, Industries, Insights, Testimonials, Work } from './sections/Proof'
import { Contact } from './sections/Contact'
import { config } from './config'
import { applySeo, mergeSeo, useSite } from './site-data'

// The homepage is one story: what Chazon is → the problem → what we do → why we're different → how we work → proof → next step.
// Only five sections are navigation destinations; the rest are reached through contextual links and the footer.
export default function App() {
  // Homepage SEO managed in the Admin overrides the built-in <head> tags once loaded; empty fields keep them.
  const { seo, live } = useSite()
  useEffect(() => {
    if (live) applySeo(mergeSeo(seo, 'home'), { canonical: config.siteUrl ? `${config.siteUrl}/` : undefined })
  }, [seo, live])
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar/>
    <main id="main">
      <Hero/>
      <WhoWeAre/>
      <Problem/>
      <Services/>
      <WhyChazon/>
      <Approach/>
      <AuditStrip/>
      <Work/>
      <Industries/>
      <Testimonials/>
      <Founder/>
      <Insights/>
      <Contact/>
    </main>
    <Footer/>
    <MobileActions/>
  </>
}
