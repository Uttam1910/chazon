import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Clock, FileCheck2, Lock, MessageCircle, Quote, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import type { EnquiryType } from '@chazon/shared'
import { auditScope, enquiryServices, founder, homeFaqs, problems } from '../content'
import { formatDate } from '../format'
import { useRouter } from '../location'
import { Link } from '../router'
import { faqSchema, organizationSchema, usePageMeta, withAdminSeo } from '../seo'
import { useSite } from '../site-data'
import { Engine } from '../components/Engine'
import { EnquiryForm } from '../components/EnquiryForm'
import { PageShell, WhatsAppIcon } from '../components/Layout'
import { Compare, FounderCard, IndustryList, Principles, ProcessList } from '../components/Sections'
import { Cta, Eyebrow, Faq, PillarIcon, SectionHead, TextLink } from '../components/ui'
import { DirectContact } from './Enquire'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Home() {
  const { settings, seo, live, socialChannels, caseStudies, testimonials, insights, pillars, whatsappReady, whatsappHref } = useSite()
  const { hash, search } = useRouter()
  const [formType, setFormType] = useState<EnquiryType>('talk')
  const [selectedService, setSelectedService] = useState<string>('')

  // Sync form state if arrived with query param or hash intent
  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.get('enquiry') === 'audit' || hash === '#audit') {
      setFormType('audit')
    }
    const requested = params.get('service')
    if (requested) {
      const matched = pillars.find(p => p.slug === requested)?.title ?? (enquiryServices.includes(requested) ? requested : '')
      if (matched) setSelectedService(matched)
    }
  }, [hash, search, pillars])

  usePageMeta(withAdminSeo({
    title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
    description: 'Chazon plans, builds and improves the websites, marketing, conversion journeys and automation businesses run on — one connected digital growth system. Mumbai.',
    path: '/',
    ogTitle: 'Chazon Digital Ventures — Revenue-Led Digital Transformation',
    ogDescription: 'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.',
    schema: [...organizationSchema(settings, socialChannels.map(c => c.href)), ...faqSchema(homeFaqs.slice(0, 3))],
  }, live ? { noindex: seo.global?.noindex, nofollow: seo.global?.nofollow, ogImage: seo.global?.ogImage } : undefined, live ? seo.home : undefined))

  const handleSelectPillar = (serviceTitle: string) => {
    setFormType('talk')
    setSelectedService(serviceTitle)
  }

  const handleSelectAudit = () => {
    setFormType('audit')
    setSelectedService('Digital Growth Audit')
  }

  return <PageShell>
    <Hero onSelectAudit={handleSelectAudit}/>
    <Disconnect/>
    <InteractiveDiagnostic onSelectPillar={handleSelectPillar}/>
    <System onSelectPillar={handleSelectPillar}/>
    <ApproachSection onSelectPillar={handleSelectPillar}/>
    <AuditSection onSelectAudit={handleSelectAudit}/>
    <AboutSection onSelectPillar={handleSelectPillar}/>
    {caseStudies.length > 0 && <Work/>}
    {testimonials.length > 0 && <Testimonials/>}
    {insights.length > 0 && <Insights/>}
    <ConversionHub formType={formType} setFormType={setFormType} selectedService={selectedService}/>
    <FaqSection onSelectAudit={handleSelectAudit}/>
    <FloatingDock onSelectAudit={handleSelectAudit} whatsappReady={whatsappReady} whatsappHref={whatsappHref}/>
  </PageShell>
}

function Hero({ onSelectAudit }: { onSelectAudit: () => void }) {
  const { pillars, settings } = useSite()
  const [active, setActive] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  useEffect(() => {
    if (reducedMotion()) return
    timers.current = [0, 1, 2, 3, null].map((step, i) => window.setTimeout(() => setActive(step), 700 + i * 850))
    return stop
  }, [])

  const point = (i: number | null) => { stop(); setActive(i) }

  return <section className="hero surface-ink" id="hero" aria-labelledby="hero-title">
    <div className="container hero-grid">
      <div className="hero-copy">
        <Eyebrow>Digital revenue & growth partner</Eyebrow>
        <h1 id="hero-title">Turn your digital presence into a <em>revenue engine.</em></h1>
        <p className="lead">Websites, marketing, conversion and automation — built as one system designed to turn visitors into enquiries.</p>
        <div className="button-row">
          <Cta to="#contact" onClick={onSelectAudit} location="hero">{settings.ctaAuditLabel}</Cta>
          <Cta to="#system" variant="secondary" location="hero_secondary">Explore the growth system</Cta>
        </div>
        <ul className="hero-facts" aria-label="About Chazon">
          <li>Founder-led</li><li>Strategy and execution together</li><li>Based in Mumbai</li>
        </ul>
      </div>
      <div className="hero-visual">
        <span className="hero-glow" aria-hidden="true"/>
        <Engine active={active}/>
        <div className="float-card fc-1" aria-hidden="true"><span className="fc-icon"><MessageCircle size={18}/></span><span><strong>New enquiry</strong><small>Website form → CRM</small></span></div>
        <div className="float-card fc-2" aria-hidden="true"><span className="fc-icon"><Zap size={18}/></span><span><strong>Follow-up sent</strong><small>WhatsApp · automatically</small></span></div>
        <div className="float-card fc-3" aria-hidden="true"><span className="fc-icon"><CheckCircle2 size={18}/></span><span><strong>Journey tracked</strong><small>Visit → enquiry → customer</small></span></div>
      </div>
    </div>
    <div className="container">
      <ol className="hero-pillars" aria-label="The four pillars">
        {pillars.map((p, i) => <li key={p.key} className={`p${i}`}>
          <a href={`#system-${p.key.toLowerCase()}`} onPointerEnter={() => point(i)} onPointerLeave={() => point(null)} onFocus={() => point(i)} onBlur={() => point(null)}>
            <PillarIcon index={i}/>
            <strong>{p.verb}</strong>
            <span>{p.scope}</span>
            <ArrowUpRight className="hero-pillar-arrow" size={20} aria-hidden="true"/>
          </a>
        </li>)}
      </ol>
    </div>
  </section>
}

function Disconnect() {
  const { pillars } = useSite()
  return <section className="section disconnect" id="disconnect" aria-labelledby="disconnect-title">
    <div className="container">
      <SectionHead index="01" eyebrow="The disconnect" id="disconnect-title" title={<>Having a digital presence is not the same as having a <em>growth engine.</em></>}
        intro="Most businesses already have the pieces. They’re just not working together. Do any of these sound familiar?"/>
      <ul className="problems">
        {[problems[0], problems[2], problems[4]].map(({ quote, fix, pillar }) => <li key={quote} className={`p${pillar}`}>
          <Quote className="problem-mark" size={28} aria-hidden="true"/>
          <blockquote><p>“{quote}”</p></blockquote>
          <p className="problem-fix">{fix}</p>
          <a className="problem-tag" href={`#system-${pillars[pillar].key.toLowerCase()}`}>
            <PillarIcon index={pillar} size={16}/><span>{pillars[pillar].verb}</span><ArrowRight size={16} aria-hidden="true"/>
          </a>
        </li>)}
      </ul>
      <p className="disconnect-turn">That’s where <em>Chazon</em> comes in.</p>
    </div>
  </section>
}

function InteractiveDiagnostic({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const bottlenecks = [
    {
      id: 'build',
      label: 'Website not converting',
      symptom: 'Visitors arrive, but few of them enquire or buy',
      tag: 'Digital Foundation & UX',
      remedy: 'Pages structured around customer decision-making with frictionless enquiry flows and responsive UX.',
      service: 'Website Development',
      cta: 'Fix Digital Foundation',
    },
    {
      id: 'grow',
      label: 'Unpredictable ad results',
      symptom: 'Spend is rising, but leads and sales aren’t consistent',
      tag: 'Performance & Demand',
      remedy: 'Google Ads, Meta Ads and SEO combined into an acquisition engine evaluated against commercial leads.',
      service: 'Performance Marketing',
      cta: 'Accelerate Qualified Demand',
    },
    {
      id: 'convert',
      label: 'High funnel drop-offs',
      symptom: 'Visitors browse and leave before making a decision',
      tag: 'CRO & Revenue Journey',
      remedy: 'Friction elimination across customer decision points and targeted conversion journey alignment.',
      service: 'Conversion Optimisation',
      cta: 'Optimize Conversion Journey',
    },
    {
      id: 'automate',
      label: 'Slow manual follow-ups',
      symptom: 'Enquiries arrive across channels with delayed responses',
      tag: 'Automation & Retention',
      remedy: 'Automated WhatsApp Business workflows and instant CRM capture so no enquiry goes cold.',
      service: 'Business Automation',
      cta: 'Automate Lead Follow-ups',
    },
  ]

  const [activeId, setActiveId] = useState<string>('build')
  const active = bottlenecks.find(b => b.id === activeId) ?? bottlenecks[0]

  return <section className="section" style={{ paddingTop: 0 }} aria-label="Interactive Growth Diagnostic">
    <div className="container">
      <div className="diagnostic">
        <div className="diagnostic-head">
          <Eyebrow>Revenue Diagnostic</Eyebrow>
          <h3>Where is your digital revenue leaking right now?</h3>
          <p className="lead" style={{ fontSize: '1rem', color: 'var(--fg-2)' }}>Select your primary business challenge to see our strategic recommendation and direct roadmap:</p>
        </div>
        <div className="diagnostic-options" role="tablist" aria-label="Growth bottlenecks">
          {bottlenecks.map(b => <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={b.id === activeId}
            className={`diagnostic-btn ${b.id === activeId ? 'is-selected' : ''}`}
            onClick={() => setActiveId(b.id)}>
            <span className="diagnostic-btn-label">{b.label}</span>
            <span className="diagnostic-btn-sub">{b.symptom}</span>
          </button>)}
        </div>
        <div className="diagnostic-result" role="tabpanel">
          <div className="diagnostic-result-copy">
            <span className="mono" style={{ color: 'var(--accent-text)', marginBottom: '4px', display: 'block' }}>Identified Need · {active.tag}</span>
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
}

function System({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const { pillars } = useSite()
  return <section className="section system" id="system" aria-labelledby="system-title">
    <div className="container">
      <SectionHead index="02" eyebrow="What we do" id="system-title" title={<>Four pillars. <em>One growth system.</em></>}
        intro="Build the foundation, grow qualified demand, convert it into revenue and automate what keeps customers coming back. Each pillar makes the next one work harder."/>
      <ol className="pillar-cards">
        {pillars.map((p, i) => <li key={p.key} id={`system-${p.key.toLowerCase()}`} className={`pillar-card p${i}`}>
          <div className="pillar-card-head"><PillarIcon index={i} size={26}/><span className="mono">0{i + 1}</span></div>
          <h3>{p.verb}<small>{p.title}</small></h3>
          <p className="pillar-card-problem"><span className="mono">The problem</span>{p.problem}</p>
          <p>{p.statement}</p>
          <ul className="chips" aria-label={`${p.title} services`}>{p.items.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
          <div className="pillar-lead-cta">
            <a href="#contact" className="pillar-lead-link" onClick={() => onSelectPillar(p.title)}>
              Enquire about {p.verb} <ArrowRight size={16} aria-hidden="true"/>
            </a>
          </div>
        </li>)}
      </ol>
    </div>
  </section>
}

function ApproachSection({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  return <section className="section" id="approach" aria-labelledby="approach-title">
    <div className="container">
      <SectionHead index="03" eyebrow="Our approach" id="approach-title" title={<>We don’t start with the channel. We start with the <em>business objective.</em></>}
        intro="Most digital work begins with a tool: a new website, an Instagram plan, a round of ads. We begin with what your business needs to achieve, then choose and connect the tools that will get it there."/>
      <Compare/>
      <div style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
        <SectionHead eyebrow="Six stages" id="stages-title" title={<>Purpose at every step. <em>Progress at every stage.</em></>}
          intro="Every engagement follows the same structure, scaled to the size of the work. Each stage has a clear output, so you always know what has been done and what comes next."/>
        <ProcessList detailed/>
      </div>
      <div className="stage-cta-box">
        <div className="stage-cta-content">
          <span className="mono" style={{ color: 'var(--accent-text)', marginBottom: '6px', display: 'block' }}>Zero Obligation · 30-Minute Diagnostic</span>
          <h3>Every engagement begins with Stage 01: Discover.</h3>
          <p>We review your business goals, current customer journeys and digital assets to determine where the highest ROI opportunities exist before any work begins.</p>
        </div>
        <Cta to="#contact" onClick={() => onSelectPillar('Digital Revenue Strategy')} location="approach_discover_cta">
          Book a Discovery Session
        </Cta>
      </div>
      <div style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
        <SectionHead eyebrow="What guides the work" id="principles-title" title={<>Six principles behind <em>every engagement.</em></>}/>
        <Principles/>
      </div>
    </div>
  </section>
}

function AuditSection({ onSelectAudit }: { onSelectAudit: () => void }) {
  const { settings, whatsappReady, whatsappHref } = useSite()
  return <section className="section audit-band surface-signal" id="audit" aria-labelledby="audit-title">
    <div className="container">
      <Eyebrow index="04">Free Evaluation</Eyebrow>
      <h2 id="audit-title">How hard is your digital presence <em>really</em> working?</h2>
      <p className="lead" style={{ maxWidth: '64ch', marginTop: '16px', color: 'inherit' }}>
        A structured review of your website, search visibility, social media, advertising, conversion journey and lead handling — and a clear view of where they could work better together.
      </p>
      <div style={{ marginTop: '36px' }}>
        <ol className="scope-grid">
          {auditScope.map(([name, text], i) => <li key={name}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            <h3 style={{ fontSize: '1.25rem' }}>{name}</h3>
            <p>{text}</p>
          </li>)}
        </ol>
      </div>
      <div className="audit-action-row">
        <Cta to="#contact" onClick={onSelectAudit} location="audit_band">{settings.ctaAuditLabel}</Cta>
        {whatsappReady && <a className="button button-secondary" href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={18}/>Ask on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
        </a>}
        <p className="mono" style={{ fontSize: '0.8125rem' }}>Limited to 5 audits per week · Detailed teardown within 48 business hours</p>
      </div>
    </div>
  </section>
}

function AboutSection({ onSelectPillar }: { onSelectPillar: (service: string) => void }) {
  const { settings } = useSite()
  return <section className="section" id="about" aria-labelledby="about-title">
    <div className="container">
      <SectionHead index="05" eyebrow="About Chazon" id="about-title" title={<>Digital expertise with a <em>business-growth mindset.</em></>}
        intro={`Chazon Digital Ventures is a founder-led digital revenue and growth partner${settings.location ? ` based in ${settings.location}` : ''}. We bring strategy, technology, marketing and automation together around one thing: what your business needs to achieve.`}/>
      <div className="about-grid">
        <FounderCard/>
        <div className="about-copy">
          <Eyebrow>Who we are</Eyebrow>
          <h2 id="who-title">We don’t just build digital channels. <em>We connect them.</em></h2>
          <p className="lead">Chazon Digital Ventures is led by its founder, {founder.name}, whose experience spans marketing, media planning, digital platforms, website development, performance marketing, social media, digital commerce and revenue enhancement.</p>
          <p>That breadth shapes how we work. A website, a campaign and a WhatsApp workflow are rarely separate problems — they are parts of one customer journey. Our role is to connect the pieces so your digital ecosystem works as a business growth engine, not a collection of disconnected activities.</p>
          <p>The approach is consultative and practical: understand the business, connect the right digital capabilities, and keep improving the path to revenue.</p>
          <p className="about-tagline mono">{settings.tagline}</p>
        </div>
      </div>
      <div className="founder-cta-box">
        <div>
          <span className="mono" style={{ color: 'var(--signal)', marginBottom: '6px', display: 'block' }}>Direct Founder Advisory</span>
          <h3>Speak directly with founder {founder.name}.</h3>
          <p>Strategy and execution roadmaps are led directly by our leadership — no junior handoffs and no generic corporate templates.</p>
        </div>
        <Cta to="#contact" onClick={() => onSelectPillar('Digital Revenue Strategy')} location="about_founder_direct">
          Discuss Your Goals with Binny
        </Cta>
      </div>
      <div style={{ marginTop: 'clamp(56px, 7vw, 96px)' }}>
        <SectionHead eyebrow="Who we work with" id="industries-title" title={<>Different industries. <em>The same ambition.</em></>}
          intro="Our approach is built for SMEs, entrepreneurs, start-ups, D2C and B2B businesses — and for businesses with a website or social presence that isn’t yet delivering results."/>
        <IndustryList/>
        <div style={{ marginTop: '28px', padding: '18px 24px', border: '1px dashed var(--line)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '0.9375rem', color: 'var(--fg-2)' }}>Have a unique business model or niche industry not listed above?</span>
          <a href="#contact" className="text-link" onClick={() => onSelectPillar('Other')}>
            Request a Custom Strategy Blueprint <ArrowRight size={17} aria-hidden="true"/>
          </a>
        </div>
      </div>
    </div>
  </section>
}

function Work() {
  const { caseStudies } = useSite()
  return <section className="section work" id="work" aria-labelledby="work-title">
    <div className="container">
      <SectionHead eyebrow="Selected work" id="work-title" title={<>Business challenges. <em>Connected solutions.</em></>}
        intro="Each story covers the challenge, the strategy, what was implemented and what changed."/>
      <ul className="card-grid">{caseStudies.map(c => <li key={c.slug}><Link to={`/work/${c.slug}`} className="content-card">
        {c.coverImage && <img src={c.coverImage} alt="" loading="lazy" decoding="async"/>}
        <span className="mono">{c.industry || 'Case study'}</span>
        <h3>{c.title}</h3>
        {c.summary && <p>{c.summary}</p>}
        <span className="content-card-more">Read the case study <ArrowRight size={16} aria-hidden="true"/></span>
      </Link></li>)}</ul>
    </div>
  </section>
}

function Testimonials() {
  const { testimonials } = useSite()
  const [chosen, setIndex] = useState(0)
  const total = testimonials.length
  const index = Math.min(chosen, total - 1)
  const { quote, name, role, company, photoUrl } = testimonials[index]
  return <section className="section testimonials" id="testimonials" aria-labelledby="testimonials-title">
    <div className="container">
      <Eyebrow>Client perspective</Eyebrow>
      <h2 id="testimonials-title" className="visually-hidden">What clients say</h2>
      <figure className="testimonial">
        <blockquote><p>“{quote}”</p></blockquote>
        <figcaption>{photoUrl && <img src={photoUrl} alt="" width="56" height="56" loading="lazy"/>}<span><strong>{name}</strong>{[role, company].filter(Boolean).join(', ')}</span></figcaption>
      </figure>
      {total > 1 && <div className="testimonial-nav">
        <span className="mono" aria-live="polite">{index + 1} of {total}</span>
        <button type="button" aria-label="Previous testimonial" onClick={() => setIndex((index - 1 + total) % total)}><ArrowLeft size={18} aria-hidden="true"/></button>
        <button type="button" aria-label="Next testimonial" onClick={() => setIndex((index + 1) % total)}><ArrowRight size={18} aria-hidden="true"/></button>
      </div>}
    </div>
  </section>
}

function Insights() {
  const { insights } = useSite()
  return <section className="section" id="insights" aria-labelledby="insights-title">
    <div className="container">
      <SectionHead eyebrow="Insights" id="insights-title" title={<>Clear thinking. <em>Practical digital insight.</em></>}
        intro="Perspectives for business owners on digital revenue, marketing, commerce and automation.">
        <TextLink to="/insights">All insights</TextLink>
      </SectionHead>
      <ul className="card-grid">{insights.slice(0, 3).map(a => <li key={a.slug}><Link to={`/insights/${a.slug}`} className="content-card">
        <span className="mono">{a.category}</span>
        <h3>{a.title}</h3>
        {a.excerpt && <p>{a.excerpt}</p>}
        <span className="content-card-more">{formatDate(a.publishedAt)}</span>
      </Link></li>)}</ul>
    </div>
  </section>
}

function ConversionHub({ formType, setFormType, selectedService }: { formType: EnquiryType; setFormType: (t: EnquiryType) => void; selectedService: string }) {
  const { whatsappReady, whatsappHref } = useSite()
  const nextSteps = [
    'Share where your business is today and what you want to achieve.',
    'We arrange a conversation to understand your objectives.',
    'We recommend a practical next step — a project, ongoing support or an audit.',
  ]

  return <section className="section enquire surface-paper-2" id="contact" aria-labelledby="contact-title" data-no-mobile-bar>
    <div className="container">
      <SectionHead index="06" eyebrow="Conversion Engine" id="contact-title" title={<>Let’s turn your digital presence into a <em>revenue engine.</em></>}
        intro="Tell us where your business is today, what you’re trying to achieve and where you’re stuck. We’ll reply to arrange a conversation and recommend a practical next step."/>

      <div className="trust-strip">
        <div className="trust-item"><Clock size={20} aria-hidden="true"/><span>Same-Day Response (Under 4 Hours)</span></div>
        <div className="trust-item"><Lock size={20} aria-hidden="true"/><span>Mutual NDA & Confidentiality</span></div>
        <div className="trust-item"><FileCheck2 size={20} aria-hidden="true"/><span>Transparent Milestones & Flat Pricing</span></div>
        <div className="trust-item"><ShieldCheck size={20} aria-hidden="true"/><span>Zero Sales Pitch · Practical Advisory</span></div>
      </div>

      <div className="enquire-grid">
        <aside className="enquire-aside">
          <Eyebrow>What happens next</Eyebrow>
          <ol className="steps-list">{nextSteps.map((step, i) => <li key={step}><span className="mono">0{i + 1}</span>{step}</li>)}</ol>
          <p className="enquire-note">
            Whether you need a specific project or an extended growth partner, we’ll find the right fit with clear deliverables and transparent pricing.
          </p>
          <DirectContact location="home_lead_hub"/>
        </aside>
        <div className="form-card">
          {whatsappReady && <div className="quick-chat-banner">
            <span>Need an immediate answer?</span>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={16}/>Chat directly on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>}
          <div className="lead-switch" role="group" aria-label="Select enquiry type">
            <button
              type="button"
              className={`lead-switch-btn ${formType === 'talk' ? 'is-active' : ''}`}
              aria-pressed={formType === 'talk'}
              onClick={() => setFormType('talk')}>
              <Sparkles size={16} aria-hidden="true"/>
              Let’s Talk (Project Enquiry)
            </button>
            <button
              type="button"
              className={`lead-switch-btn ${formType === 'audit' ? 'is-active' : ''}`}
              aria-pressed={formType === 'audit'}
              onClick={() => setFormType('audit')}>
              <Zap size={16} aria-hidden="true"/>
              Request Growth Audit
            </button>
          </div>
          <h3 style={{ fontSize: 'clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem)', fontWeight: 400, fontFamily: 'var(--display)' }}>
            {formType === 'audit' ? 'Request a Digital Growth Audit' : 'Start a conversation'}
          </h3>
          <p className="form-card-intro">
            {formType === 'audit'
              ? 'Share your website and profiles for a comprehensive review of your digital presence.'
              : 'Fields are required unless marked optional.'}
          </p>
          <EnquiryForm key={formType + selectedService} type={formType} initialService={selectedService} location="home_lead_hub"/>
        </div>
      </div>
    </div>
  </section>
}

function FaqSection({ onSelectAudit }: { onSelectAudit: () => void }) {
  const { whatsappReady, whatsappHref } = useSite()
  return <section className="section" id="faq" aria-labelledby="faq-title">
    <div className="container">
      <Faq items={homeFaqs}/>
      <div className="faq-foot-cta">
        <Eyebrow>Direct Clarity</Eyebrow>
        <h3>Have a question specific to your business model or budget?</h3>
        <p>We review your unique challenges and recommend a practical, tailored next step with zero pressure.</p>
        <div className="button-row" style={{ marginTop: '8px' }}>
          <Cta to="#contact" onClick={onSelectAudit} location="faq_foot_cta">Request Growth Audit</Cta>
          {whatsappReady && <a className="button button-secondary" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18}/>Ask on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
          </a>}
        </div>
      </div>
    </div>
  </section>
}

function FloatingDock({ onSelectAudit, whatsappReady, whatsappHref }: { onSelectAudit: () => void; whatsappReady: boolean; whatsappHref: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolledPastHero = window.scrollY > window.innerHeight * 0.7
      setVisible(scrolledPastHero)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Hide floating dock when enquiry form or footer is in view
    const observer = new IntersectionObserver(entries => {
      const blocked = entries.some(e => e.isIntersecting)
      if (blocked) setVisible(false)
    })
    document.querySelectorAll('[data-no-mobile-bar], footer').forEach(el => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  return <aside className={`floating-dock ${visible ? '' : 'is-hidden'}`} aria-label="Quick Actions">
    <div className="dock-status">
      <span className="dock-dot" aria-hidden="true"/>
      <span>Advisory Open</span>
    </div>
    <a href="#contact" className="dock-btn dock-btn-audit" onClick={onSelectAudit}>
      <Zap size={14} aria-hidden="true"/>Request Audit
    </a>
    {whatsappReady && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="dock-btn dock-btn-wa">
      <WhatsAppIcon size={14}/>WhatsApp
    </a>}
  </aside>
}
