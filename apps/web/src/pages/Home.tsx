import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart2,
  Coins,
  Users,
} from 'lucide-react'
import { homeFaqs } from '../content'
import { useRouter } from '../location'
import { Link } from '../router'
import { faqSchema, organizationSchema, usePageMeta, withAdminSeo } from '../seo'
import { useSite } from '../site-data'
import { BusinessProblemSection } from '../components/BusinessProblemSection'
import { DashboardMockup } from '../components/DashboardMockup'
import { GrowthFramework } from '../components/GrowthFramework'
import { HomeAuditSection } from '../components/HomeAuditSection'
import { IndustriesShowcase } from '../components/IndustriesShowcase'
import { PageShell } from '../components/Layout'
import { ProcessTimeline } from '../components/ProcessTimeline'
import { ServicesGrid } from '../components/ServicesGrid'
import { WhyChooseChazon } from '../components/WhyChooseChazon'
import { Faq } from '../components/ui'

export function Home() {
  const { settings, seo, live, socialChannels } = useSite()
  const { hash, search } = useRouter()
  const [, setSelectedService] = useState<string>('')

  // Sync scroll on hash or query param intent
  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.get('enquiry') === 'audit' || hash === '#audit') {
      const el = document.getElementById('audit-tool')
      el?.scrollIntoView({ behavior: 'smooth' })
    } else if (hash === '#services') {
      const el = document.getElementById('services-overview')
      el?.scrollIntoView({ behavior: 'smooth' })
    } else if (hash === '#framework') {
      const el = document.getElementById('framework')
      el?.scrollIntoView({ behavior: 'smooth' })
    } else if (hash === '#contact') {
      const el = document.getElementById('contact')
      el?.scrollIntoView({ behavior: 'smooth' })
    }

    const requested = params.get('service')
    if (requested) {
      setSelectedService(requested)
    }
  }, [hash, search])

  usePageMeta(
    withAdminSeo(
      {
        title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
        description:
          "Don't just build a digital presence. Build a revenue engine. Chazon brings website development, SEO, digital marketing and business automation into one connected system.",
        path: '/',
        ogTitle: 'Chazon Digital Ventures — Digital Revenue & Growth Partner',
        ogDescription:
          'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.',
        schema: [
          ...organizationSchema(
            settings,
            socialChannels.map((c) => c.href)
          ),
          ...faqSchema(homeFaqs.slice(0, 4)),
        ],
      },
      live
        ? {
            noindex: seo.global?.noindex,
            nofollow: seo.global?.nofollow,
            ogImage: seo.global?.ogImage,
          }
        : undefined,
      live ? seo.home : undefined
    )
  )

  return (
    <PageShell>
      {/* 2. HERO SECTION */}
      <section className="hero-redesigned surface-cream" id="hero" aria-labelledby="hero-title">
        <div className="container hero-redesigned-grid">
          {/* Left Column: Value Prop */}
          <div className="hero-copy-column">
            <div className="hero-pill-badge">
              <span className="hpb-dot" aria-hidden="true" />
              <span>Digital Growth Partner for Businesses</span>
            </div>

            <h1 id="hero-title" className="hero-main-heading">
              Don’t just build a<br />
              digital presence.<br />
              <span className="hero-serif-highlight">Build a revenue engine.</span>
            </h1>

            <p className="hero-subhead-lead">
              We help businesses attract the right audience, convert opportunities into customers, and build sustainable digital growth through strategy, technology and marketing.
            </p>

            <div className="hero-btn-row">
              <Link to="/services" className="button button-primary hero-primary-btn">
                Explore Our Services <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="button button-outline hero-secondary-btn">
                Let’s Discuss Your Growth
              </Link>
            </div>

            {/* Trust highlights with orange icons */}
            <div className="hero-trust-bullets">
              <div className="htb-item">
                <span className="htb-icon-badge" aria-hidden="true">
                  <BarChart2 size={16} />
                </span>
                <span>More Visibility</span>
              </div>
              <div className="htb-item">
                <span className="htb-icon-badge" aria-hidden="true">
                  <Users size={16} />
                </span>
                <span>More Customers</span>
              </div>
              <div className="htb-item">
                <span className="htb-icon-badge" aria-hidden="true">
                  <Coins size={16} />
                </span>
                <span>More Revenue</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard Mockup with floating badges */}
          <div className="hero-visual-column">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* 3. BUSINESS CHALLENGES */}
      <BusinessProblemSection />

      {/* 4. FIVE-STAGE CHAZON GROWTH FRAMEWORK */}
      <GrowthFramework />

      {/* 5. FOUR SERVICE CATEGORIES COVERING ALL TEN SERVICES */}
      <ServicesGrid />

      {/* 6 & 7. WHY CHOOSE CHAZON + TECHNOLOGY & INTEGRATIONS */}
      <WhyChooseChazon />

      {/* 8. INTERACTIVE WEBSITE AUDIT SECTION */}
      <HomeAuditSection />

      {/* 9. SIX-STAGE WORKING PROCESS */}
      <section className="section how-we-work-section surface-cream" id="how-we-work" aria-labelledby="hww-title">
        <div className="container">
          <div className="how-we-work-head-split">
            <div className="hww-head-left">
              <span className="hww-eyebrow-orange">HOW WE WORK</span>
              <h2 id="hww-title" className="hww-main-title">
                A Clear and Collaborative Process
              </h2>
            </div>
            <div className="hww-head-right">
              <p className="hww-desc-text">
                From understanding your business to continuous optimisation, we follow a structured process that delivers results.
              </p>
            </div>
          </div>

          <ProcessTimeline variant="horizontal" />
        </div>
      </section>

      {/* 10. INDUSTRIES & SECTORS WE TRANSFORM (REPLACING INSIGHTS BLOG) */}
      <IndustriesShowcase />

      {/* 11. STRONG FINAL CTA */}
      <section className="home-orange-cta-banner" id="contact" aria-labelledby="home-cta-title">
        <div className="home-orange-cta-wave-pattern" aria-hidden="true" />
        <div className="container home-orange-cta-inner">
          <div className="home-orange-cta-copy">
            <h2 id="home-cta-title" className="home-orange-cta-title">
              Ready to Turn Your Digital Presence into Business Growth?
            </h2>
            <p className="home-orange-cta-subtitle">
              Let’s build a smarter digital growth strategy for your business.
            </p>
          </div>
          <div className="home-orange-cta-btn-wrap">
            <Link to="/contact" className="home-orange-cta-button">
              Start a Conversation <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION (Accessible & SEO-Compliant) */}
      <Faq items={homeFaqs} title="Frequently Asked Questions About Chazon" id="home-faq" />
    </PageShell>
  )
}
