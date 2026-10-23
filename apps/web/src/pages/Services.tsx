import { useEffect } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { engagements, pillarPath, pillars as pillarCopy } from '../content'
import { track } from '../config'
import { Link } from '../router'
import { breadcrumbSchema, faqSchema, serviceSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { PageShell } from '../components/Layout'
import { AuditBand, FinalCta } from '../components/Sections'
import { Cta, EngineMark, Eyebrow, Faq, PageHero, SectionHead, TextLink } from '../components/ui'

// How each pillar hands over to the next: the reason the four are one system rather than four service lists.
const handovers = [
  'A platform that can convert, so growth spend isn’t wasted.',
  'Qualified demand arriving at pages built for it.',
  'More of that demand turning into enquiries and orders.',
  'Every lead followed up and every customer given a reason to return.',
]

export function ServicesIndex() {
  const { pillars } = useSite()
  usePageMeta({
    title: 'Digital Growth Services: Build, Grow, Convert, Automate | Chazon',
    description: 'Website and e-commerce development, SEO and performance marketing, conversion optimisation and business automation — planned and delivered as one growth system.',
    path: '/services',
    schema: breadcrumbSchema([['Services', '/services']]),
  })
  return <PageShell>
    <PageHero trail={[['Services', '/services']]} eyebrow="Services" title={<>Four pillars. <em>One growth system.</em></>}
      intro="Most businesses buy digital services one at a time: a website here, some ads there. We plan them together, so each part makes the next one work harder.">
      <div className="button-row">
        <Cta to="/contact" location="services_hero">Discuss your project</Cta>
        <Cta to="/growth-audit" variant="secondary" location="services_hero_audit">Not sure where to start?</Cta>
      </div>
    </PageHero>
    <section className="section" aria-labelledby="pillars-title">
      <div className="container">
        <SectionHead eyebrow="The system" id="pillars-title" title={<>Start anywhere. <em>Everything connects.</em></>}
          intro="Each pillar can be engaged on its own. Here’s what it covers, and what it hands to the next part of the system."/>
        <ol className="system-cards">
          {pillars.map((p, i) => <li key={p.key}>
            <Link to={pillarPath(p)} className="system-card">
              <div className="system-card-head"><EngineMark active={i}/><span className="mono">0{i + 1}</span></div>
              <h2>{p.verb}<small>{p.title}</small></h2>
              <p className="system-card-scope">{p.scope}</p>
              <p>{p.statement}</p>
              <p className="system-card-hand"><span className="mono">Hands on</span>{handovers[i]}</p>
              <span className="system-card-more">Explore {p.verb} <ArrowRight size={17} aria-hidden="true"/></span>
            </Link>
          </li>)}
        </ol>
      </div>
    </section>
    <section className="section surface-paper-2" aria-labelledby="engage-title">
      <div className="container">
        <SectionHead eyebrow="Ways to work together" id="engage-title" title={<>A project, ongoing support <em>or a partnership.</em></>}
          intro="Engagement follows what your business needs. Scope and commercial terms are agreed with you in writing before work begins."/>
        <ol className="engagements">{engagements.map(([title, text], i) => <li key={title}><span className="mono">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </div>
    </section>
    <AuditBand/>
    <FinalCta/>
  </PageShell>
}

export function ServicePage({ index }: { index: number }) {
  const { pillars } = useSite()
  const p = pillars[index]
  const { page } = p
  const path = pillarPath(p)
  const prev = pillars[(index + 3) % 4], next = pillars[(index + 1) % 4]
  usePageMeta({
    title: page.title,
    description: page.description,
    path,
    schema: [
      // The built-in list keeps structured data identical between the prerendered page and the browser.
      ...serviceSchema({ name: `${p.verb}: ${p.title}`, description: page.description, path, offers: pillarCopy[index].items }),
      ...breadcrumbSchema([['Services', '/services'], [p.title, path]]),
      ...faqSchema(page.faqs),
    ],
  })
  useEffect(() => { track('service_page_view', { pillar: p.key }) }, [p.key])
  const contact = `/contact?service=${encodeURIComponent(p.slug)}`
  return <PageShell>
    <PageHero trail={[['Services', '/services'], [p.title, path]]} eyebrow={<>0{index + 1} · {p.verb} — {p.title}</>} title={page.h1} intro={page.intro}
      aside={<div className="pillar-hero-mark"><EngineMark active={index}/><p className="mono">{p.verb}</p><p>{p.line}</p></div>}>
      <div className="button-row">
        <Cta to={contact} location={`service_${p.key.toLowerCase()}_hero`}>{page.cta}</Cta>
        <Cta to="#what-we-provide" variant="secondary" location={`service_${p.key.toLowerCase()}_hero_secondary`}>What’s included</Cta>
      </div>
    </PageHero>
    <section className="section" aria-labelledby="signs-title">
      <div className="container split-section">
        <div>
          <Eyebrow>The problem</Eyebrow>
          <h2 id="signs-title">{p.problem}</h2>
        </div>
        <div>
          <p className="split-intro">Signs this is holding your business back:</p>
          <ul className="signs">{page.signs.map(s => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
    </section>
    <section className="section surface-paper-2" id="what-we-provide" aria-labelledby="provide-title">
      <div className="container">
        <SectionHead eyebrow="What we provide" id="provide-title" title={<>What’s included in <em>{p.verb}.</em></>} intro={p.statement}/>
        <ul className="service-list">{p.services.map((s, i) => <li key={s.title}>
          <span className="mono">{String(i + 1).padStart(2, '0')}</span><h3>{s.title}</h3>{s.text && <p>{s.text}</p>}
        </li>)}</ul>
      </div>
    </section>
    <section className="section" aria-labelledby="deliverables-title">
      <div className="container split-section">
        <div>
          <Eyebrow>What you receive</Eyebrow>
          <h2 id="deliverables-title">Typical deliverables</h2>
          <p className="split-intro">The exact scope depends on your objective and is agreed with you before work begins.</p>
        </div>
        <div>
          <ul className="deliverables">{page.deliverables.map(d => <li key={d}><Check size={18} aria-hidden="true"/>{d}</li>)}</ul>
          <div className="audience">
            <p className="mono">Who it’s for</p>
            <p>{page.audience}</p>
          </div>
        </div>
      </div>
    </section>
    <section className="section system-links surface-ink" aria-labelledby="connects-title">
      <div className="container">
        <SectionHead eyebrow="Part of one system" id="connects-title" title={<>{p.verb} works best <em>connected.</em></>}
          intro={`${p.title} is one of four pillars. Here’s what comes before and after it in the Chazon growth system.`}/>
        <div className="neighbours">
          {([['Before', prev], ['After', next]] as const).map(([label, n]) => <Link key={label} to={pillarPath(n)} className="neighbour">
            <span className="mono">{label}</span>
            <strong>{n.verb} — {n.title}</strong>
            <span>{n.line}</span>
            <ArrowRight size={20} aria-hidden="true"/>
          </Link>)}
        </div>
        <TextLink to="/services" className="neighbours-all">See all four pillars</TextLink>
      </div>
    </section>
    <Faq items={page.faqs} title={`${p.verb}: common questions`}/>
    <FinalCta talkTo={contact} title={<>{page.cta.replace(/^Discuss /, 'Let’s discuss ')}.</>}
      intro="Tell us what you’re working with and what you want to achieve. We’ll reply to arrange a conversation and recommend a practical next step."/>
  </PageShell>
}
