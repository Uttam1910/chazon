import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, MessageCircle, Quote, Zap } from 'lucide-react'
import { homeFaqs, pillarPath, problems } from '../content'
import { formatDate } from '../format'
import { Link } from '../router'
import { faqSchema, organizationSchema, usePageMeta, withAdminSeo } from '../seo'
import { useSite } from '../site-data'
import { Engine } from '../components/Engine'
import { PageShell } from '../components/Layout'
import { AuditBand, FinalCta, ProcessList } from '../components/Sections'
import { Cta, Eyebrow, Faq, PillarIcon, SectionHead, TextLink } from '../components/ui'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The homepage tells one story: what Chazon does → the problem → the four-pillar system → why it's different →
// how we work → the audit → who it's for → who's behind it → questions → the next step.
// Work, testimonials and insights appear only once real, approved content is published in the Admin.
export function Home() {
  const { settings, seo, live, socialChannels, caseStudies, testimonials, insights } = useSite()
  usePageMeta(withAdminSeo({
    title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
    description: 'Chazon plans, builds and improves the websites, marketing, conversion journeys and automation businesses run on — one connected digital growth system. Mumbai.',
    path: '/',
    ogTitle: 'Chazon Digital Ventures — Revenue-Led Digital Transformation',
    ogDescription: 'Turn your digital presence into a revenue engine. Strategy, technology, marketing and automation, working together.',
    schema: [...organizationSchema(settings, socialChannels.map(c => c.href)), ...faqSchema(homeFaqs.slice(0, 3))],
  }, live ? { noindex: seo.global?.noindex, nofollow: seo.global?.nofollow, ogImage: seo.global?.ogImage } : undefined, live ? seo.home : undefined))
  return <PageShell>
    <Hero/>
    <Disconnect/>
    <System/>
    <section className="section" aria-labelledby="process-title">
      <div className="container">
        <SectionHead index="03" eyebrow="Our approach" id="process-title" title={<>Purpose at every step. <em>Progress at every stage.</em></>}
          intro="A structured way of working: no random activity and no disconnected execution.">
          <TextLink to="/approach">See the full approach</TextLink>
        </SectionHead>
        <ProcessList/>
      </div>
    </section>
    <AuditBand index="04"/>
    {caseStudies.length > 0 && <Work/>}
    {testimonials.length > 0 && <Testimonials/>}
    {insights.length > 0 && <Insights/>}
    <Faq items={homeFaqs.slice(0, 3)}/>
    <FinalCta/>
  </PageShell>
}

function Hero() {
  const { pillars, settings } = useSite()
  const [active, setActive] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => {
    // A one-time introduction: each pillar lights in turn, then the whole loop. Under five seconds; skipped with reduced motion.
    if (reducedMotion()) return
    timers.current = [0, 1, 2, 3, null].map((step, i) => window.setTimeout(() => setActive(step), 700 + i * 850))
    return stop
  }, [])
  const point = (i: number | null) => { stop(); setActive(i) }
  return <section className="hero surface-ink" aria-labelledby="hero-title">
    <div className="container hero-grid">
      <div className="hero-copy">
        <Eyebrow>Digital revenue & growth partner</Eyebrow>
        <h1 id="hero-title">Turn your digital presence into a <em>revenue engine.</em></h1>
        <p className="lead">Websites, marketing, conversion and automation — built as one system designed to turn visitors into enquiries.</p>
        <div className="button-row">
          <Cta to="/contact" location="hero">{settings.ctaTalkLabel}</Cta>
          <Cta to="/services" variant="secondary" location="hero_secondary">Explore the growth system</Cta>
        </div>
        <ul className="hero-facts" aria-label="About Chazon">
          <li>Founder-led</li><li>Strategy and execution together</li><li>Based in Mumbai</li>
        </ul>
      </div>
      <div className="hero-visual">
        <span className="hero-glow" aria-hidden="true"/>
        <Engine active={active}/>
        {/* Illustrative workflow moments around the engine (decorative, not data). */}
        <div className="float-card fc-1" aria-hidden="true"><span className="fc-icon"><MessageCircle size={18}/></span><span><strong>New enquiry</strong><small>Website form → CRM</small></span></div>
        <div className="float-card fc-2" aria-hidden="true"><span className="fc-icon"><Zap size={18}/></span><span><strong>Follow-up sent</strong><small>WhatsApp · automatically</small></span></div>
        <div className="float-card fc-3" aria-hidden="true"><span className="fc-icon"><CheckCircle2 size={18}/></span><span><strong>Journey tracked</strong><small>Visit → enquiry → customer</small></span></div>
      </div>
    </div>
    <div className="container">
      <ol className="hero-pillars" aria-label="The four pillars">
        {pillars.map((p, i) => <li key={p.key} className={`p${i}`}>
          <Link to={pillarPath(p)} onPointerEnter={() => point(i)} onPointerLeave={() => point(null)} onFocus={() => point(i)} onBlur={() => point(null)}>
            <PillarIcon index={i}/>
            <strong>{p.verb}</strong>
            <span>{p.scope}</span>
            <ArrowUpRight className="hero-pillar-arrow" size={20} aria-hidden="true"/>
          </Link>
        </li>)}
      </ol>
    </div>
  </section>
}

function Disconnect() {
  const { pillars } = useSite()
  return <section className="section disconnect" aria-labelledby="disconnect-title">
    <div className="container">
      <SectionHead index="01" eyebrow="The disconnect" id="disconnect-title" title={<>Having a digital presence is not the same as having a <em>growth engine.</em></>}
        intro="Most businesses already have the pieces. They’re just not working together. Do any of these sound familiar?"/>
      <ul className="problems">
        {[problems[0], problems[2], problems[4]].map(({ quote, fix, pillar }) => <li key={quote} className={`p${pillar}`}>
          <Quote className="problem-mark" size={28} aria-hidden="true"/>
          <blockquote><p>“{quote}”</p></blockquote>
          <p className="problem-fix">{fix}</p>
          <Link className="problem-tag" to={pillarPath(pillars[pillar])}><PillarIcon index={pillar} size={16}/><span>{pillars[pillar].verb}</span><ArrowRight size={16} aria-hidden="true"/></Link>
        </li>)}
      </ul>
      <p className="disconnect-turn">That’s where <em>Chazon</em> comes in.</p>
    </div>
  </section>
}

function System() {
  const { pillars } = useSite()
  return <section className="section system" id="system" aria-labelledby="system-title">
    <div className="container">
      <SectionHead index="02" eyebrow="What we do" id="system-title" title={<>Four pillars. <em>One growth system.</em></>}
        intro="Build the foundation, grow qualified demand, convert it into revenue and automate what keeps customers coming back. Each pillar makes the next one work harder."/>
      <ol className="pillar-cards">
        {pillars.map((p, i) => <li key={p.key} className={`pillar-card p${i}`}>
          <div className="pillar-card-head"><PillarIcon index={i} size={26}/><span className="mono">0{i + 1}</span></div>
          <h3>{p.verb}<small>{p.title}</small></h3>
          <p className="pillar-card-problem"><span className="mono">The problem</span>{p.problem}</p>
          <p>{p.statement}</p>
          <ul className="chips" aria-label={`${p.title} services`}>{p.items.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
          <TextLink to={pillarPath(p)}>Explore {p.verb}<span className="visually-hidden">: {p.title}</span></TextLink>
        </li>)}
      </ol>
    </div>
  </section>
}

function Work() {
  const { caseStudies } = useSite()
  return <section className="section work" aria-labelledby="work-title">
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
  return <section className="section testimonials" aria-labelledby="testimonials-title">
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
  return <section className="section" aria-labelledby="insights-title">
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
