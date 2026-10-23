import type { ReactNode } from 'react'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { Link } from '../router'
import { PageShell } from '../components/Layout'
import { Cta, PageHero } from '../components/ui'

// Plain-language notices describing how this website actually works (see EnquiryForm, config.ts and the API's
// enquiry endpoint). Update them whenever data handling changes, e.g. before adding analytics.
const UPDATED = '23 October 2026'

function ContactRoute() {
  const { settings } = useSite()
  return settings.email
    ? <>email <a href={`mailto:${settings.email}`}>{settings.email}</a> or use our <Link to="/contact">contact form</Link></>
    : <>use our <Link to="/contact">contact form</Link></>
}

function LegalPage({ path, label, title, intro, children }: { path: string; label: string; title: string; intro: string; children: ReactNode }) {
  return <PageShell>
    <PageHero trail={[[label, path]]} eyebrow={`Last updated ${UPDATED}`} title={title} intro={intro}/>
    <section className="section">
      <div className="container"><div className="prose legal">{children}</div></div>
    </section>
  </PageShell>
}

export function Privacy() {
  const { settings } = useSite()
  usePageMeta({
    title: 'Privacy Notice | Chazon Digital Ventures',
    description: 'How Chazon Digital Ventures handles the information you share through this website: what is collected, why, who processes it and how to ask for it to be deleted.',
    path: '/privacy',
    schema: breadcrumbSchema([['Privacy notice', '/privacy']]),
  })
  return <LegalPage path="/privacy" label="Privacy notice" title="Privacy notice"
    intro={`How ${settings.companyName} handles the information you share through this website.`}>
    <h2>What we collect</h2>
    <p>When you send an enquiry or request a Digital Growth Audit, we receive the details you enter: your name, email address, phone number, business name and, if you choose to give them, your website or social profile, industry, the service you’re interested in, a budget range and your message.</p>
    <p>With each enquiry we also record the campaign or website that referred you to us, where your browser makes that available. Our server uses your IP address briefly to limit repeated submissions; it is not stored with your enquiry.</p>
    <h2>How we use it</h2>
    <p>We use your details only to respond to your enquiry, arrange a conversation, prepare any audit you request and manage our working relationship with you. We do not sell your information or use it for advertising.</p>
    <h2>Who processes it</h2>
    <p>Enquiries are stored in our database. When email notifications are enabled, an email service sends a confirmation to you and a notification to our team. These providers host or send information on our behalf and do not use it for their own purposes.</p>
    <h2>Cookies and analytics</h2>
    <p>This website does not set cookies and does not load analytics or advertising scripts. Fonts are served from our own website rather than a third party. Your browser keeps a note of how you arrived (the referring site or campaign) for the current session only, so it can be included with an enquiry.</p>
    <p>If we add analytics in future, we will update this notice first and ask for your consent where it is required.</p>
    <h2>How long we keep it</h2>
    <p>We keep enquiry records for as long as we need them to respond to you and manage our relationship. You can ask us to delete them at any time.</p>
    <h2>Your choices</h2>
    <p>You can ask to see, correct or delete the information you have sent us. To do so, <ContactRoute/>. Please don’t include sensitive personal information, such as health or financial details, in an enquiry.</p>
  </LegalPage>
}

export function Terms() {
  const { settings } = useSite()
  usePageMeta({
    title: 'Website Terms of Use | Chazon Digital Ventures',
    description: 'The terms that apply when you use the Chazon Digital Ventures website, including how information on the site should be read and how client engagements are agreed.',
    path: '/terms',
    schema: breadcrumbSchema([['Website terms', '/terms']]),
  })
  return <LegalPage path="/terms" label="Website terms" title="Website terms of use"
    intro={`These terms apply to your use of the ${settings.companyName} website.`}>
    <h2>About this website</h2>
    <p>This website describes the services offered by {settings.companyName}. Its content is general information, not advice for your particular business.</p>
    <h2>No guaranteed results</h2>
    <p>Digital results depend on many factors, including your market, offer, budget and competition. Nothing on this website is a promise of particular rankings, traffic, leads, sales or revenue.</p>
    <h2>Working with us</h2>
    <p>The scope, fees and deliverables of any engagement are agreed with you separately in writing. That agreement, not this website, sets out what we will do.</p>
    <h2>Content and links</h2>
    <p>The text, design and graphics on this website belong to {settings.companyName} unless stated otherwise. Please don’t reproduce them without permission. Links to other websites are provided for convenience; we are not responsible for their content.</p>
    <h2>Changes and questions</h2>
    <p>We may update these terms from time to time; the date at the top shows the latest version. If you have a question, <ContactRoute/>.</p>
  </LegalPage>
}

export function NotFound() {
  usePageMeta({ title: 'Page not found | Chazon Digital Ventures', description: 'This page could not be found.', noindex: true })
  return <PageShell>
    <section className="page-hero surface-ink not-found">
      <div className="container">
        <p className="mono not-found-code">Error 404</p>
        <h1>This page isn’t part of <em>the system.</em></h1>
        <p className="lead">The link may be old, or the page may have moved. These are good places to continue:</p>
        <div className="button-row">
          <Cta to="/" location="404_home">Go to the homepage</Cta>
          <Cta to="/services" variant="secondary" location="404_services">Explore services</Cta>
          <Cta to="/contact" variant="secondary" location="404_contact">Contact us</Cta>
        </div>
      </div>
    </section>
  </PageShell>
}
