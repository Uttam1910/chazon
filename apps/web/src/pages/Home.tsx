import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import type { AuditAnalysisResult } from '@chazon/shared'
import { founder, homeFaqs } from '../content'
import { formatDate } from '../format'
import { useRouter } from '../location'
import { Link } from '../router'
import { faqSchema, organizationSchema, usePageMeta, withAdminSeo } from '../seo'
import { useSite } from '../site-data'
import { Engine } from '../components/Engine'
import { PageShell, WhatsAppIcon } from '../components/Layout'
import { Compare, FounderCard, IndustryList } from '../components/Sections'
import { SmartEnquiryForm } from '../components/SmartEnquiryForm'
import { WebsiteAuditAnalyzer } from '../components/WebsiteAuditAnalyzer'
import { Cta, Eyebrow, Faq, PillarIcon, SectionHead, TextLink } from '../components/ui'
import { DirectContact } from './Enquire'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Home() {
  const { settings, seo, live, socialChannels, caseStudies, testimonials, insights } = useSite()
  const { hash, search } = useRouter()
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [attachedAudit, setAttachedAudit] = useState<AuditAnalysisResult | null>(null)

  // Sync form state if arrived with query param or hash intent
  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.get('enquiry') === 'audit' || hash === '#audit') {
      const el = document.getElementById('audit-tool')
      el?.scrollIntoView({ behavior: 'smooth' })
    }
    const requested = params.get('service')
    if (requested) {
      setSelectedService(requested)
    }
    const requestedGoal = params.get('goal')
    if (requestedGoal) {
      setSelectedGoal(requestedGoal)
    }
  }, [hash, search])

  usePageMeta(
    withAdminSeo(
      {
        title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
        description:
          "Don't just build a digital presence. Build a digital revenue engine. Chazon connects website development, SEO, CRO and business automation into one system.",
        path: '/',
        ogTitle: 'Chazon — Digital Revenue & Growth Partner for Businesses',
        ogDescription:
          'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.',
        schema: [
          ...organizationSchema(
            settings,
            socialChannels.map(c => c.href)
          ),
          ...faqSchema(homeFaqs.slice(0, 3)),
        ],
      },
      live ? { noindex: seo.global?.noindex, nofollow: seo.global?.nofollow, ogImage: seo.global?.ogImage } : undefined,
      live ? seo.home : undefined
    )
  )

  const handleSelectPillar = (serviceTitle: string) => {
    setSelectedService(serviceTitle)
    if (serviceTitle.includes('Website') || serviceTitle.includes('Web Application') || serviceTitle.includes('Foundation')) {
      setSelectedGoal('build-new')
    } else if (serviceTitle.includes('SEO') || serviceTitle.includes('Organic') || serviceTitle.includes('Growth')) {
      setSelectedGoal('seo-visibility')
    } else if (serviceTitle.includes('Conversion') || serviceTitle.includes('Commerce')) {
      setSelectedGoal('improve-conversions')
    } else if (serviceTitle.includes('Automation') || serviceTitle.includes('AI')) {
      setSelectedGoal('automate-ops')
    }
    const el = document.getElementById('contact')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFixLeaks = (audit: AuditAnalysisResult) => {
    setAttachedAudit(audit)
    setSelectedService('Website Growth Optimization')
    setSelectedGoal('improve-existing')
    const el = document.getElementById('contact')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <PageShell>
      <Hero />
      <ProblemSolution onSelectPillar={handleSelectPillar} />
      <InteractiveDiagnostic onSelectPillar={handleSelectPillar} />
      <System onSelectPillar={handleSelectPillar} />
      <ApproachSection onSelectPillar={handleSelectPillar} />
      <WebsiteAuditSection onFixLeaks={handleFixLeaks} onSelectPillar={handleSelectPillar} />
      <AboutSection onSelectPillar={handleSelectPillar} />
      {caseStudies.length > 0 && <Work />}
      {testimonials.length > 0 && <Testimonials />}
      {insights.length > 0 && <Insights />}
      <ConversionHub
        selectedGoal={selectedGoal}
        selectedService={selectedService}
        auditContext={attachedAudit}
      />
      <FaqSection />
    </PageShell>
  )
}

function Hero() {
  const { pillars } = useSite()
  const [active, setActive] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    if (reducedMotion()) return
    timers.current = [0, 1, 2, 3, null].map((step, i) =>
      window.setTimeout(() => setActive(step), 700 + i * 850)
    )
    return stop
  }, [])

  const point = (i: number | null) => {
    stop()
    setActive(i)
  }

  return (
    <section className="hero surface-ink" id="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <Eyebrow>Digital revenue & growth partner</Eyebrow>
          <h1 id="hero-title">
            Don’t just build a digital presence. Build a <em>digital revenue engine.</em>
          </h1>
          <p className="lead">
            Websites, SEO, conversion optimization and business automation — engineered as one connected revenue system designed to turn visitors into qualified customers.
          </p>
          <div className="button-row">
            <Cta to="#audit" location="hero_primary">
              Get Free Website Audit
            </Cta>
            <Cta to="#contact" variant="secondary" location="hero_secondary">
              Discuss Your Project
            </Cta>
          </div>
          <ul className="hero-facts" aria-label="About Chazon">
            <li>What We Do: Strategy & Tech Combined</li>
            <li>Who We Help: Growing SMEs & D2C Brands</li>
            <li>Founder-Led Advisory · Measurable ROI</li>
          </ul>
        </div>
        <div className="hero-visual">
          <span className="hero-glow" aria-hidden="true" />
          <Engine active={active} />
          <div className="float-card fc-1" aria-hidden="true">
            <span className="fc-icon">
              <MessageCircle size={18} />
            </span>
            <span>
              <strong>New enquiry</strong>
              <small>Website form → CRM capture</small>
            </span>
          </div>
          <div className="float-card fc-2" aria-hidden="true">
            <span className="fc-icon">
              <Zap size={18} />
            </span>
            <span>
              <strong>Instant follow-up</strong>
              <small>WhatsApp Business automated</small>
            </span>
          </div>
          <div className="float-card fc-3" aria-hidden="true">
            <span className="fc-icon">
              <CheckCircle2 size={18} />
            </span>
            <span>
              <strong>Revenue attribution</strong>
              <small>Visitor → Enquiry → Customer</small>
            </span>
          </div>
        </div>
      </div>
      <div className="container">
        <ol className="hero-pillars" aria-label="The four service pillars">
          {pillars.map((p, i) => (
            <li key={p.key} className={`p${i}`}>
              <a
                href={`#system-${p.key.toLowerCase()}`}
                onPointerEnter={() => point(i)}
                onPointerLeave={() => point(null)}
                onFocus={() => point(i)}
                onBlur={() => point(null)}
              >
                <PillarIcon index={i} />
                <strong>{p.verb}</strong>
                <span>{p.scope}</span>
                <ArrowUpRight className="hero-pillar-arrow" size={20} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProblemSolution({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const commonProblems = [
    {
      problem: 'Website not generating enquiries',
      symptom: 'You have traffic arriving, but few visitors submit an enquiry or call.',
      solution: 'We re-architect user pathways, clarify decision triggers, and remove form friction.',
      tag: 'BUILD & CONVERT',
    },
    {
      problem: 'Poor Google search visibility',
      symptom: 'Competitors dominate search results for high-intent commercial keywords.',
      solution: 'We align technical SEO, high-value local intent, and structured authority pages.',
      tag: 'GROW',
    },
    {
      problem: 'Visitors browsing and leaving',
      symptom: 'High bounce rate and drop-offs without taking a commercial action.',
      solution: 'We run conversion rate audits, refine value propositions, and add high-trust triggers.',
      tag: 'CONVERT',
    },
    {
      problem: 'Manual, delayed lead follow-ups',
      symptom: 'Enquiries arrive via forms or WhatsApp but replies take 12 to 24 hours.',
      solution: 'We automate WhatsApp triage, instant lead routing, and CRM capture.',
      tag: 'AUTOMATE',
    },
    {
      problem: 'Disconnected tools & blind spots',
      symptom: 'Marketing, website, ads and sales operate in separate silos with unclear ROI.',
      solution: 'We build one connected revenue engine with end-to-end attribution.',
      tag: 'FULL SYSTEM',
    },
  ]

  return (
    <section className="section disconnect" id="problems" aria-labelledby="disconnect-title">
      <div className="container">
        <SectionHead
          index="01"
          eyebrow="The Business Disconnect"
          id="disconnect-title"
          title={
            <>
              Having a digital presence is not the same as having a <em>growth engine.</em>
            </>
          }
          intro="Most businesses already possess individual digital assets — a website, an ad account, a WhatsApp number. But when they operate in isolation, potential customers slip through the cracks."
        />

        <div className="problem-grid">
          {commonProblems.map(item => (
            <div key={item.problem} className="problem-card">
              <span className="mono problem-tag">{item.tag}</span>
              <h3>{item.problem}</h3>
              <p className="problem-symptom">{item.symptom}</p>
              <div className="problem-solution-box">
                <strong>How Chazon Solves This:</strong>
                <p>{item.solution}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="disconnect-conclusion">
          <p className="disconnect-turn">
            That’s where <em>Chazon</em> comes in: we connect strategy, technology, marketing and automation around your business revenue goals.
          </p>
        </div>

        <div className="section-cta-banner">
          <div className="section-cta-content">
            <span className="mono section-cta-tag">Growth Gap Fix</span>
            <h3>Don’t let invisible leaks slow your revenue growth.</h3>
            <p>
              Most business websites lose over 60% of potential enquiries to slow mobile speeds, vague copy, or broken lead forms. Let’s diagnose and fix your gaps.
            </p>
          </div>
          <Cta to="#contact" onClick={() => onSelectPillar('Growth Gap Remediation')} location="problems_fix_gaps">
            Let’s Fix Your Growth Gaps
          </Cta>
        </div>
      </div>
    </section>
  )
}

function InteractiveDiagnostic({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const bottlenecks = [
    {
      id: 'build',
      label: 'Website not converting',
      symptom: 'Visitors arrive, but few of them enquire or buy',
      tag: 'BUILD · Digital Foundation',
      remedy: 'Pages structured around customer decision-making with frictionless enquiry flows and responsive UX.',
      service: 'Website Development',
      cta: 'Explore Build Services',
    },
    {
      id: 'grow',
      label: 'Low search traffic & leads',
      symptom: 'Spend is rising or organic rankings are stagnant',
      tag: 'GROW · Search & Demand',
      remedy: 'Technical SEO, high-intent commercial content, and local visibility combined into an acquisition engine.',
      service: 'SEO & Performance Marketing',
      cta: 'Explore Grow Services',
    },
    {
      id: 'convert',
      label: 'High customer drop-offs',
      symptom: 'Visitors browse and leave before making a decision',
      tag: 'CONVERT · Journey Optimization',
      remedy: 'Friction elimination across customer decision points and targeted conversion journey alignment.',
      service: 'Conversion Optimisation',
      cta: 'Explore Convert Services',
    },
    {
      id: 'automate',
      label: 'Slow manual follow-ups',
      symptom: 'Enquiries arrive across channels with delayed responses',
      tag: 'AUTOMATE · Operations & Retention',
      remedy: 'Automated WhatsApp Business workflows and instant CRM capture so no enquiry goes cold.',
      service: 'Business Automation',
      cta: 'Explore Automate Services',
    },
  ]

  const [activeId, setActiveId] = useState<string>('build')
  const active = bottlenecks.find(b => b.id === activeId) ?? bottlenecks[0]

  return (
    <section className="section" style={{ paddingTop: 0 }} aria-label="Interactive Growth Diagnostic">
      <div className="container">
        <div className="diagnostic">
          <div className="diagnostic-head">
            <Eyebrow>Interactive Revenue Diagnostic</Eyebrow>
            <h3>Where is your digital revenue leaking right now?</h3>
            <p className="lead" style={{ fontSize: '1rem', color: 'var(--fg-2)' }}>
              Select your primary business challenge to see our strategic recommendation and direct roadmap:
            </p>
          </div>
          <div className="diagnostic-options" role="tablist" aria-label="Growth bottlenecks">
            {bottlenecks.map(b => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={b.id === activeId}
                className={`diagnostic-btn ${b.id === activeId ? 'is-selected' : ''}`}
                onClick={() => setActiveId(b.id)}
              >
                <span className="diagnostic-btn-label">{b.label}</span>
                <span className="diagnostic-btn-sub">{b.symptom}</span>
              </button>
            ))}
          </div>
          <div className="diagnostic-result" role="tabpanel">
            <div className="diagnostic-result-copy">
              <span className="mono" style={{ color: 'var(--signal)', marginBottom: '4px', display: 'block' }}>
                Identified Need · {active.tag}
              </span>
              <strong>{active.remedy}</strong>
              <p>We solve this with a focused implementation connecting strategy, technology and commercial tracking.</p>
            </div>
            <Cta to="#contact" onClick={() => onSelectPillar(active.service)} location="diagnostic_cta">
              {active.cta}
            </Cta>
          </div>
        </div>
      </div>
    </section>
  )
}

function System({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const { pillars } = useSite()

  const pillarDetails: Record<
    string,
    {
      includes: string[]
      problem: string
      audience: string
      receives: string
    }
  > = {
    BUILD: {
      includes: ['Business Websites', 'Landing Pages', 'E-commerce Stores', 'Web Applications', 'Custom Software'],
      problem: 'Slow page loads, poor mobile responsiveness, or websites that fail to move visitors to enquire or purchase.',
      audience: 'Growing SMEs, D2C brands launching or rebuilding stores, and professional service firms needing high credibility.',
      receives: 'Turnkey high-speed website, conversion-focused page plan, technical SEO foundation, and integrated enquiry capture.',
    },
    GROW: {
      includes: ['Search Engine Optimisation', 'Local SEO', 'Content Strategy', 'Digital Marketing', 'Lead Generation'],
      problem: 'Stagnant Google rankings, rising ad spend, and disjointed campaigns that bring clicks without commercial enquiries.',
      audience: 'Businesses ready to capture commercial search demand, scale inbound leads, and build long-term digital authority.',
      receives: 'Commercial keyword rankings, technical SEO audit, high-converting content plan, and transparent lead reporting.',
    },
    CONVERT: {
      includes: ['Conversion Rate Optimisation', 'Landing Page Optimisation', 'Customer Journey Improvements', 'Enquiry & Booking Systems', 'Trust & Credibility Improvements'],
      problem: 'Traffic arrives on your pages, hesitates, and leaves without submitting a form, booking a call, or buying.',
      audience: 'Companies with existing traffic who want to maximize lead volume and revenue without constantly doubling ad spend.',
      receives: 'Full funnel friction audit, data-backed UX recommendations, A/B testing plan, and measurable conversion lift.',
    },
    AUTOMATE: {
      includes: ['Business Process Automation', 'CRM Integration', 'WhatsApp Automation', 'Lead Management', 'AI-Powered Workflows'],
      problem: 'Enquiries go cold due to delayed manual response times, lost spreadsheet records, and repetitive manual administrative tasks.',
      audience: 'Teams spending hours on manual follow-up, businesses with multiple inbound channels, and companies needing 24/7 lead capture.',
      receives: 'Instant WhatsApp business triage, automated CRM routing, immediate lead notifications, and customer retention sequences.',
    },
  }

  const pillarLinks: Record<string, string> = {
    BUILD: '/services/website-development',
    GROW: '/services/seo-services',
    CONVERT: '/services/conversion-optimisation',
    AUTOMATE: '/services/business-automation',
  }

  return (
    <section className="section system" id="system" aria-labelledby="system-title">
      <div className="container">
        <SectionHead
          index="02"
          eyebrow="Four Service Pillars"
          id="system-title"
          title={
            <>
              BUILD → GROW → CONVERT → AUTOMATE. <em>One connected engine.</em>
            </>
          }
          intro="Each pillar solves a critical business challenge. Together, they create a compound growth effect where your website, acquisition, conversion, and operations work as one unified system."
        />
        <ol className="pillar-cards">
          {pillars.map((p, i) => {
            const details = pillarDetails[p.key] || {
              includes: p.items.slice(0, 5),
              problem: p.problem,
              audience: 'Growing businesses ready to expand digital revenue.',
              receives: 'End-to-end implementation with commercial milestone tracking.',
            }

            return (
              <li key={p.key} id={`system-${p.key.toLowerCase()}`} className={`pillar-card p${i}`}>
                <div className="pillar-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PillarIcon index={i} size={24} />
                    <div>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-3)' }}>Stage 0{i + 1}</span>
                      <h3 style={{ margin: 0 }}>
                        {p.verb} <small>{p.title}</small>
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="pillar-spec-grid">
                  <div className="pillar-spec-row">
                    <span className="spec-label">Problem Solved</span>
                    <p className="spec-val">{details.problem}</p>
                  </div>

                  <div className="pillar-spec-row">
                    <span className="spec-label">Includes</span>
                    <ul className="chips" aria-label={`${p.verb} service scope`}>
                      {details.includes.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pillar-spec-row">
                    <span className="spec-label">Who Needs This</span>
                    <p className="spec-val">{details.audience}</p>
                  </div>

                  <div className="pillar-spec-row">
                    <span className="spec-label">What You Receive</span>
                    <p className="spec-val">{details.receives}</p>
                  </div>
                </div>

                <div className="pillar-card-actions">
                  <Link to={pillarLinks[p.key] || `/services/${p.slug}`} className="text-link">
                    Explore {p.verb} details <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <Cta
                    to="#contact"
                    onClick={() => onSelectPillar(p.title)}
                    location={`system_${p.verb.toLowerCase()}_discuss`}
                    size="sm"
                  >
                    Discuss {p.verb} Project
                  </Cta>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="section-cta-banner">
          <div className="section-cta-content">
            <span className="mono section-cta-tag">Strategic Direction</span>
            <h3>Not sure which pillar to prioritize first?</h3>
            <p>
              We assess your existing website performance, search visibility and lead leaks to recommend the highest-ROI starting point.
            </p>
          </div>
          <div className="section-cta-buttons">
            <Cta to="#contact" onClick={() => onSelectPillar('Growth Assessment')} location="system_find_solution">
              Find the Right Solution
            </Cta>
            <Cta to="#audit" variant="secondary" location="system_audit_secondary">
              Run Free Website Audit
            </Cta>
          </div>
        </div>
      </div>
    </section>
  )
}

function ApproachSection({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const steps = [
    { num: '01', title: 'Discover', desc: 'Understand the business, audience, existing assets, unit economics and commercial bottlenecks.' },
    { num: '02', title: 'Strategise', desc: 'Formulate a digital growth roadmap, customer journey blueprint, platform requirements, and measurable KPIs.' },
    { num: '03', title: 'Build', desc: 'Engineer or redesign the digital platforms, landing pages, tracking infrastructure, and conversion assets.' },
    { num: '04', title: 'Grow', desc: 'Activate search engine optimisation, performance acquisition, and authority content campaigns.' },
    { num: '05', title: 'Optimise', desc: 'Measure user behaviour data, eliminate friction points, and continuously improve conversion rates and revenue.' },
  ]

  return (
    <section className="section" id="approach" aria-labelledby="approach-title">
      <div className="container">
        <SectionHead
          index="03"
          eyebrow="Our Process"
          id="approach-title"
          title={
            <>
              Discover → Strategise → Build → Grow → Optimise. <em>Clear progress at every stage.</em>
            </>
          }
          intro="Every engagement follows a structured 5-step methodology scaled to your business size. You always know what is being built, why it matters, and what commercial metric it drives."
        />

        <div className="five-stage-grid">
          {steps.map(s => (
            <div key={s.num} className="stage-step-card">
              <span className="mono stage-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
          <Compare />
        </div>

        <div className="stage-cta-box">
          <div className="stage-cta-content">
            <span className="mono" style={{ color: 'var(--signal)', marginBottom: '6px', display: 'block' }}>
              Milestone-Driven · Predictable Delivery
            </span>
            <h3>Ready for a structured, outcome-driven partnership?</h3>
            <p>
              From initial Discovery to launch and continuous optimization, every milestone has clear deliverables and commercial KPIs.
            </p>
          </div>
          <Cta to="#contact" onClick={() => onSelectPillar('Project Discovery')} location="approach_start_project">
            Start Your Project
          </Cta>
        </div>
      </div>
    </section>
  )
}

function WebsiteAuditSection({
  onFixLeaks,
  onSelectPillar,
}: {
  onFixLeaks: (audit: AuditAnalysisResult) => void
  onSelectPillar: (service: string) => void
}) {
  return (
    <section className="section surface-paper-2" id="audit" aria-labelledby="audit-section-title">
      <div className="container">
        <SectionHead
          index="04"
          eyebrow="Live Diagnostic Engine"
          id="audit-section-title"
          title={
            <>
              Check your website performance <em>free in seconds.</em>
            </>
          }
          intro="Enter your website URL below to discover hidden speed roadblocks, search visibility gaps, missing mobile tags, and enquiry leaks before they cost you another client."
        />

        <WebsiteAuditAnalyzer showTitle={false} onFixLeaksWithChazon={onFixLeaks} />

        <div className="section-cta-banner" style={{ marginTop: '24px' }}>
          <div className="section-cta-content">
            <span className="mono section-cta-tag">Direct Expert Review</span>
            <h3>Need a senior specialist to review your audit results?</h3>
            <p>
              We review your performance, SEO and conversion leaks together and give you a clear, prioritized remediation roadmap.
            </p>
          </div>
          <Cta to="#contact" onClick={() => onSelectPillar('Website Audit Review')} location="audit_get_help">
            Get Help Fixing These Issues
          </Cta>
        </div>
      </div>
    </section>
  )
}

function AboutSection({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const { settings } = useSite()
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="container">
        <SectionHead
          index="05"
          eyebrow="About Chazon"
          id="about-title"
          title={
            <>
              Digital expertise with a <em>business-growth mindset.</em>
            </>
          }
          intro={`Chazon Digital Ventures is a founder-led digital revenue partner${settings.location ? ` based in ${settings.location}` : ''}. We don't just execute tactical tasks — we build digital systems that support commercial expansion.`}
        />
        <div className="about-grid">
          <FounderCard />
          <div className="about-copy">
            <Eyebrow>Leadership</Eyebrow>
            <h2 id="who-title">
              We don’t just build channels. <em>We connect them.</em>
            </h2>
            <p className="lead">
              Chazon is led by founder {founder.name}, with extensive experience spanning digital platforms, website architecture, performance marketing, search optimisation, digital commerce and revenue enhancement.
            </p>
            <p>
              A website, an ad campaign, and a WhatsApp workflow are not separate problems — they are stages of a single customer decision journey. Our role is to connect the pieces so your digital presence operates as a reliable revenue engine.
            </p>
            <p>
              The approach is consultative, practical and rigorous: understand the business, engineer the right digital capabilities, and continuously optimize for commercial outcomes.
            </p>
            <p className="about-tagline mono">{settings.tagline}</p>
          </div>
        </div>
        <div className="founder-cta-box">
          <div>
            <span className="mono" style={{ color: 'var(--signal)', marginBottom: '6px', display: 'block' }}>
              Direct Founder Advisory
            </span>
            <h3>Speak directly with {founder.name}.</h3>
            <p>
              Strategy and implementation roadmaps are led directly by leadership — no junior handoffs, no corporate templates, and no generic agency bureaucracy.
            </p>
          </div>
          <Cta to="#contact" onClick={() => onSelectPillar('Founder Advisory')} location="about_founder_direct">
            Discuss Your Goals with Binny
          </Cta>
        </div>
        <div style={{ marginTop: 'clamp(56px, 7vw, 96px)' }}>
          <SectionHead
            eyebrow="Who We Work With"
            id="industries-title"
            title={
              <>
                Different industries. <em>The same growth ambition.</em>
              </>
            }
            intro="Our systems are built for SMEs, growing enterprises, professional services, D2C brands, and businesses with a digital presence that isn’t yet delivering consistent enquiries."
          />
          <IndustryList />
        </div>
      </div>
    </section>
  )
}

function Work() {
  const { caseStudies } = useSite()
  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="container">
        <SectionHead
          eyebrow="Case Studies"
          id="work-title"
          title={
            <>
              Business challenges. <em>Connected solutions.</em>
            </>
          }
          intro="Each case study explores the challenge, the strategy, the execution and the commercial outcome."
        />
        <ul className="card-grid">
          {caseStudies.map(c => (
            <li key={c.slug}>
              <Link to={`/work/${c.slug}`} className="content-card">
                {c.coverImage && <img src={c.coverImage} alt="" loading="lazy" decoding="async" />}
                <span className="mono">{c.industry || 'Case study'}</span>
                <h3>{c.title}</h3>
                {c.summary && <p>{c.summary}</p>}
                <span className="content-card-more">
                  Read the case study <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Testimonials() {
  const { testimonials } = useSite()
  const [chosen, setIndex] = useState(0)
  const total = testimonials.length
  const index = Math.min(chosen, total - 1)
  const { quote, name, role, company, photoUrl } = testimonials[index]
  return (
    <section className="section testimonials" id="testimonials" aria-labelledby="testimonials-title">
      <div className="container">
        <Eyebrow>Client perspective</Eyebrow>
        <h2 id="testimonials-title" className="visually-hidden">
          What clients say
        </h2>
        <figure className="testimonial">
          <blockquote>
            <p>“{quote}”</p>
          </blockquote>
          <figcaption>
            {photoUrl && <img src={photoUrl} alt="" width="56" height="56" loading="lazy" />}
            <span>
              <strong>{name}</strong>
              {[role, company].filter(Boolean).join(', ')}
            </span>
          </figcaption>
        </figure>
        {total > 1 && (
          <div className="testimonial-nav">
            <span className="mono" aria-live="polite">
              {index + 1} of {total}
            </span>
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() => setIndex((index - 1 + total) % total)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() => setIndex((index + 1) % total)}
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Insights() {
  const { insights } = useSite()
  return (
    <section className="section" id="insights" aria-labelledby="insights-title">
      <div className="container">
        <SectionHead
          eyebrow="Insights"
          id="insights-title"
          title={
            <>
              Clear thinking. <em>Practical digital insight.</em>
            </>
          }
          intro="Perspectives for business leaders on digital revenue, technical SEO, conversion and automation."
        >
          <TextLink to="/insights">All insights</TextLink>
        </SectionHead>
        <ul className="card-grid">
          {insights.slice(0, 3).map(a => (
            <li key={a.slug}>
              <Link to={`/insights/${a.slug}`} className="content-card">
                <span className="mono">{a.category}</span>
                <h3>{a.title}</h3>
                {a.excerpt && <p>{a.excerpt}</p>}
                <span className="content-card-more">{formatDate(a.publishedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ConversionHub({
  selectedGoal,
  selectedService,
  auditContext,
}: {
  selectedGoal: string
  selectedService: string
  auditContext: AuditAnalysisResult | null
}) {
  const nextSteps = [
    'Share where your business is today and what you want to achieve.',
    'We review your existing digital presence and identify highest-ROI opportunities.',
    'We recommend a practical next step — a targeted build, ongoing support or growth audit.',
  ]

  return (
    <section className="section enquire surface-paper-2" id="contact" aria-labelledby="contact-title" data-no-mobile-bar>
      <div className="container">
        <SectionHead
          index="06"
          eyebrow="Lead Generation Engine"
          id="contact-title"
          title={
            <>
              Ready to grow your business? <em>Let’s discuss your revenue goals.</em>
            </>
          }
          intro="Complete our smart enquiry form below. We will analyze your requirements, review your current digital presence, and reach out with strategic next steps within 4–24 hours."
        />

        <div className="trust-strip">
          <div className="trust-item">
            <Clock size={20} aria-hidden="true" />
            <span>Same-Day Response (Under 4h)</span>
          </div>
          <div className="trust-item">
            <Lock size={20} aria-hidden="true" />
            <span>Mutual NDA & Confidentiality</span>
          </div>
          <div className="trust-item">
            <FileCheck2 size={20} aria-hidden="true" />
            <span>Milestone-Based Transparent Pricing</span>
          </div>
          <div className="trust-item">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>Zero Sales Pressure · Practical Advisory</span>
          </div>
        </div>

        <div className="enquire-grid">
          <aside className="enquire-aside">
            <Eyebrow>What happens next</Eyebrow>
            <ol className="steps-list">
              {nextSteps.map((step, i) => (
                <li key={step}>
                  <span className="mono">0{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="enquire-note">
              Whether you need a full digital foundation, SEO acceleration, or automated operations, we will find the right fit with transparent milestones.
            </p>
            <DirectContact location="home_lead_hub" />
          </aside>

          <div className="form-card">
            <SmartEnquiryForm
              initialGoal={selectedGoal}
              initialService={selectedService}
              auditContext={auditContext}
              location="home_conversion_hub"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const { whatsappReady, whatsappHref } = useSite()
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="container">
        <Faq items={homeFaqs} />
        <div className="faq-foot-cta">
          <Eyebrow>Direct Clarity</Eyebrow>
          <h3>Have a question specific to your business model or budget?</h3>
          <p>We review your unique challenges and recommend a practical, tailored roadmap with zero pressure.</p>
          <div className="button-row" style={{ marginTop: '8px' }}>
            <Cta to="#audit" location="faq_foot_cta">
              Run Website Audit
            </Cta>
            {whatsappReady && (
              <a className="button button-secondary" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} />
                Ask on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
