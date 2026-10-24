import { useEffect } from 'react'
import { ArrowUpRight, CalendarClock, MapPin } from 'lucide-react'
import { auditScope, enquiryServices, nextSteps } from '../content'
import { config, track } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { breadcrumbSchema, faqSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { EnquiryForm } from '../components/EnquiryForm'
import { ChannelIcon, ChannelLink, PageShell } from '../components/Layout'
import { Cta, Eyebrow, Faq, PageHero, SectionHead } from '../components/ui'

/** Configured ways to reach Chazon directly, plus the booking page when one is configured. Nothing is invented. */
export function DirectContact({ location }: { location: string }) {
  const { directChannels, socialChannels, settings } = useSite()
  return <div className="direct">
    {config.bookingUrl && <a className="direct-booking" href={config.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('booking_click', { location })}>
      <CalendarClock size={22} aria-hidden="true"/><span><strong>Book a discovery call</strong><small>Choose a time that suits you</small></span><ArrowUpRight size={18} aria-hidden="true"/><span className="visually-hidden"> (opens in a new tab)</span>
    </a>}
    {directChannels.length > 0 && <>
      <p className="mono direct-label">Or reach us directly</p>
      <ul className="direct-list">{directChannels.map(c => <li key={c.key}><ChannelLink channel={c} location={location} className="direct-link">
        <ChannelIcon channel={c}/><span><strong>{c.label}</strong><small>{c.detail}</small></span>
      </ChannelLink></li>)}</ul>
    </>}
    {socialChannels.length > 0 && <ul className="social-list">{socialChannels.map(c => <li key={c.key}><ChannelLink channel={c} location={location} className="social-link"><ChannelIcon channel={c} size={18}/>{c.label}</ChannelLink></li>)}</ul>}
    {settings.location && <p className="direct-location"><MapPin size={18} aria-hidden="true"/>Based in {settings.location}</p>}
  </div>
}

export function Contact() {
  const { pillars } = useSite()
  const { search, navigate } = useRouter()
  const params = new URLSearchParams(search)
  // Older links (/?enquiry=audit#contact) and audit requests belong on the audit page.
  const wantsAudit = params.get('enquiry') === 'audit'
  useEffect(() => { if (wantsAudit) navigate('/growth-audit', { replace: true }) }, [wantsAudit, navigate])
  // ?service= accepts a pillar's page slug (from its service page) or one of the listed needs.
  const requested = params.get('service') ?? ''
  const initialService = pillars.find(p => p.slug === requested)?.title ?? (enquiryServices.includes(requested) ? requested : '')
  usePageMeta({
    title: 'Contact Chazon Digital Ventures | Discuss Your Project',
    description: 'Tell us about your business and what you want to achieve. Chazon will reply to arrange a conversation about your website, growth, conversion or automation challenges.',
    path: '/contact',
    schema: breadcrumbSchema([['Contact', '/contact']]),
  })
  return <PageShell>
    <PageHero trail={[['Contact', '/contact']]} eyebrow="Contact" title={<>Let’s talk about <em>your business.</em></>}
      intro="Tell us where your business is today, what you’re trying to achieve and where you’re stuck. We’ll reply to arrange a conversation and recommend a practical next step."/>
    <section className="section enquire" aria-labelledby="enquiry-title">
      <div className="container enquire-grid">
        <aside className="enquire-aside">
          <Eyebrow>What happens next</Eyebrow>
          <ol className="steps-list">{nextSteps.map((step, i) => <li key={step}><span className="mono">0{i + 1}</span>{step}</li>)}</ol>
          <p className="enquire-note">A specific project or a long-term growth partner — we’ll find the right fit. If you’re not sure what you need yet, a <Link to="/growth-audit">Digital Growth Audit</Link> is a good place to start.</p>
          <DirectContact location="contact_page"/>
        </aside>
        <div className="form-card">
          <h2 id="enquiry-title">Send an enquiry</h2>
          <p className="form-card-intro">Fields are required unless marked optional.</p>
          <EnquiryForm key={initialService} type="talk" initialService={initialService} location="contact_page"/>
        </div>
      </div>
    </section>
  </PageShell>
}

const auditFaqs: [string, string][] = [
  ['Is there a fee for the audit?', 'The scope of each audit, and any fee, is confirmed with you before work begins. Requesting an audit doesn’t commit you to anything.'],
  ['What do you need from us?', 'Your website and social profiles, and a short description of what you want to achieve. Access to analytics or advertising accounts allows a deeper review, but it isn’t required to start.'],
  ['What happens after the audit?', 'You decide. Some businesses act on the recommendations themselves; others ask us to help with a project or ongoing support.'],
]

export function GrowthAudit() {
  const { settings } = useSite()
  usePageMeta({
    title: 'Digital Growth Audit: Website, SEO & Lead Handling Review | Chazon',
    description: 'Request a Digital Growth Audit: a review of your website, SEO, Google visibility, social media, ads, conversion journey and lead handling, and how they could work better.',
    path: '/growth-audit',
    schema: [...breadcrumbSchema([['Digital Growth Audit', '/growth-audit']]), ...faqSchema(auditFaqs)],
  })
  return <PageShell>
    <PageHero trail={[['Digital Growth Audit', '/growth-audit']]} eyebrow="Digital Growth Audit" title={<>How hard is your digital presence <em>really</em> working?</>}
      intro="A structured review of your website, search visibility, social media, advertising, conversion journey and lead handling — and a clear view of where they could work better together.">
      <div className="button-row"><Cta to="#request" location="audit_hero">{settings.ctaAuditLabel}</Cta></div>
    </PageHero>
    <section className="section" aria-labelledby="scope-title">
      <div className="container">
        <SectionHead eyebrow="What the audit looks at" id="scope-title" title={<>Nine areas. <em>One connected picture.</em></>}
          intro="Each area is reviewed against your business objective — not a generic checklist — so the findings point to what matters for your growth."/>
        <ol className="scope-grid">{auditScope.map(([name, text], i) => <li key={name}><span className="mono">{String(i + 1).padStart(2, '0')}</span><h3>{name}</h3><p>{text}</p></li>)}</ol>
      </div>
    </section>
    <section className="section surface-paper-2" aria-labelledby="how-title">
      <div className="container">
        <SectionHead eyebrow="How it works" id="how-title" title={<>Three steps, <em>no obligation.</em></>}/>
        <ol className="engagements">{[
          ['Request', 'Share your website, your social profiles and what you want to achieve.'],
          ['Review', 'We confirm the scope with you, then review the areas that matter most for your objective.'],
          ['Recommendations', 'We share what we found and the practical next steps, in order of priority.'],
        ].map(([title, text], i) => <li key={title}><span className="mono">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <p className="audit-fit"><strong>A good fit if</strong> you have a website or social presence that isn’t producing the enquiries you expected, you’re about to invest in a rebuild or new campaigns, or you’re not sure which of your digital activities actually drive revenue.</p>
      </div>
    </section>
    <section className="section enquire" id="request" aria-labelledby="request-title">
      <div className="container enquire-grid">
        <aside className="enquire-aside">
          <Eyebrow>Request your audit</Eyebrow>
          <p className="enquire-note">Tell us about your business and where you’d like us to look. We’ll confirm the scope with you before any work begins.</p>
          <DirectContact location="audit_page"/>
        </aside>
        <div className="form-card">
          <h2 id="request-title">{settings.ctaAuditLabel}</h2>
          <p className="form-card-intro">Fields are required unless marked optional.</p>
          <EnquiryForm type="audit" location="audit_page"/>
        </div>
      </div>
    </section>
    <Faq items={auditFaqs} title="About the audit"/>
  </PageShell>
}
