import { engagements, founder } from '../content'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { PageShell } from '../components/Layout'
import { AuditBand, Compare, FinalCta, FounderCard, IndustryList, Principles, ProcessList } from '../components/Sections'
import { Cta, Eyebrow, PageHero, SectionHead, TextLink } from '../components/ui'

export function Approach() {
  usePageMeta({
    title: 'Our Approach: Business-First Digital Growth | Chazon',
    description: 'How Chazon works: start with the business objective, then discover, strategise, build, execute, measure and optimise — with better data every cycle.',
    path: '/approach',
    schema: breadcrumbSchema([['Our approach', '/approach']]),
  })
  return <PageShell>
    <PageHero trail={[['Our approach', '/approach']]} eyebrow="Our approach" title={<>We don’t start with the channel. We start with the <em>business objective.</em></>}
      intro="Most digital work begins with a tool: a new website, an Instagram plan, a round of ads. We begin with what your business needs to achieve, then choose and connect the tools that will get it there.">
      <div className="button-row"><Cta to="/contact" location="approach_hero">Discuss your objectives</Cta></div>
    </PageHero>
    <section className="section" aria-labelledby="compare-title">
      <div className="container">
        <SectionHead eyebrow="The difference" id="compare-title" title={<>Two ways to begin. <em>Only one is built for revenue.</em></>}
          intro="Before recommending any platform, we answer five questions about your business. The channels follow from the answers."/>
        <Compare/>
      </div>
    </section>
    <section className="section surface-paper-2" aria-labelledby="stages-title">
      <div className="container">
        <SectionHead eyebrow="Six stages" id="stages-title" title={<>Purpose at every step. <em>Progress at every stage.</em></>}
          intro="Every engagement follows the same structure, scaled to the size of the work. Each stage has a clear output, so you always know what has been done and what comes next."/>
        <ProcessList detailed/>
      </div>
    </section>
    <section className="section" aria-labelledby="engage-title">
      <div className="container">
        <SectionHead eyebrow="Working together" id="engage-title" title={<>Engagement that fits <em>the work.</em></>}
          intro="Start with a defined project, hand over ongoing execution, or bring us in as an extended growth partner. Scope, deliverables and fees are agreed with you in writing before work begins."/>
        <ol className="engagements">{engagements.map(([title, text], i) => <li key={title}><span className="mono">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </div>
    </section>
    <section className="section surface-ink" aria-labelledby="principles-title">
      <div className="container">
        <SectionHead eyebrow="What guides the work" id="principles-title" title={<>Six principles behind <em>every engagement.</em></>}/>
        <Principles/>
      </div>
    </section>
    <AuditBand/>
    <FinalCta/>
  </PageShell>
}

export function About() {
  const { settings } = useSite()
  usePageMeta({
    title: 'About Chazon Digital Ventures | Founder-Led Growth Partner, Mumbai',
    description: 'Chazon Digital Ventures is a founder-led digital revenue and growth partner in Mumbai, bringing strategy, technology, marketing and automation together.',
    path: '/about',
    schema: breadcrumbSchema([['About', '/about']]),
  })
  return <PageShell>
    <PageHero trail={[['About', '/about']]} eyebrow="About Chazon" title={<>Digital expertise with a <em>business-growth mindset.</em></>}
      intro={`Chazon Digital Ventures is a digital revenue and growth partner${settings.location ? ` based in ${settings.location}` : ''}. We bring strategy, technology, marketing and automation together around one thing: what your business needs to achieve.`}/>
    <section className="section" aria-labelledby="who-title">
      <div className="container about-grid">
        <FounderCard/>
        <div className="about-copy">
          <Eyebrow>Who we are</Eyebrow>
          <h2 id="who-title">We don’t just build digital channels. <em>We connect them.</em></h2>
          <p className="lead">Chazon Digital Ventures is led by its founder, {founder.name}, whose experience spans marketing, media planning, digital platforms, website development, performance marketing, social media, digital commerce and revenue enhancement.</p>
          <p>That breadth shapes how we work. A website, a campaign and a WhatsApp workflow are rarely separate problems — they are parts of one customer journey. Our role is to connect the pieces so your digital ecosystem works as a business growth engine, not a collection of disconnected activities.</p>
          <p>The approach is consultative and practical: understand the business, connect the right digital capabilities, and keep improving the path to revenue.</p>
          <p className="about-tagline mono">{settings.tagline}</p>
          <div className="button-row"><Cta to="/contact" location="about_intro">Start a conversation</Cta><TextLink to="/approach">How we work</TextLink></div>
        </div>
      </div>
    </section>
    <section className="section surface-ink" aria-labelledby="principles-title">
      <div className="container">
        <SectionHead eyebrow="Why Chazon" id="principles-title" title={<>Your business doesn’t need more digital activity. <em>It needs the right digital activity.</em></>}/>
        <Principles/>
      </div>
    </section>
    <section className="section" aria-labelledby="industries-title">
      <div className="container">
        <SectionHead eyebrow="Who we work with" id="industries-title" title={<>Different industries. <em>The same ambition.</em></>}
          intro="Our approach is built for SMEs, entrepreneurs, start-ups, D2C and B2B businesses — and for businesses with a website or social presence that isn’t yet delivering results."/>
        <IndustryList/>
      </div>
    </section>
    <FinalCta/>
  </PageShell>
}
