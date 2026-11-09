import { ArrowRight, ArrowUpRight, CalendarClock, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { auditScope, nextSteps } from '../content'
import { config, track } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { breadcrumbSchema, faqSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { ContactSection } from '../components/ContactSection'
import { ChannelIcon, ChannelLink, PageShell } from '../components/Layout'
import { WebsiteAuditAnalyzer } from '../components/WebsiteAuditAnalyzer'
import { Faq, SectionHead } from '../components/ui'

/** Configured ways to reach Chazon directly, plus the booking page when one is configured. */
export function DirectContact({ location }: { location: string }) {
  const { directChannels, socialChannels, settings } = useSite()
  return (
    <div className="direct">
      {config.bookingUrl && (
        <a
          className="direct-booking"
          href={config.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('booking_click', { location })}
        >
          <CalendarClock size={22} aria-hidden="true" />
          <span>
            <strong>Book a discovery call</strong>
            <small>Choose a time that suits you</small>
          </span>
          <ArrowUpRight size={18} aria-hidden="true" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      )}

      {directChannels.length > 0 && (
        <>
          <p className="mono direct-label">Or reach us directly</p>
          <ul className="direct-list">
            {directChannels.map((c) => (
              <li key={c.key}>
                <ChannelLink channel={c} location={location} className="direct-link">
                  <ChannelIcon channel={c} />
                  <span>
                    <strong>{c.label}</strong>
                    <small>{c.detail}</small>
                  </span>
                </ChannelLink>
              </li>
            ))}
          </ul>
        </>
      )}

      {socialChannels.length > 0 && (
        <ul className="social-list">
          {socialChannels.map((c) => (
            <li key={c.key}>
              <ChannelLink channel={c} location={location} className="social-link">
                <ChannelIcon channel={c} size={18} />
                {c.label}
              </ChannelLink>
            </li>
          ))}
        </ul>
      )}

      {settings.location && (
        <p className="direct-location">
          <MapPin size={18} aria-hidden="true" />
          Based in {settings.location}
        </p>
      )}
    </div>
  )
}

export function Contact() {
  const { search } = useRouter()
  const params = new URLSearchParams(search)
  const requestedService = params.get('service') ?? ''

  usePageMeta({
    title: 'Let’s Work Together: Contact Chazon Digital Ventures | Mumbai',
    description:
      'Have a project, a question or a growth goal? Tell us about it and we’ll get back to you soon. Connect with Chazon via email, phone, WhatsApp or project enquiry form.',
    path: '/contact',
    schema: breadcrumbSchema([['Contact', '/contact']]),
  })

  return (
    <PageShell>
      {/* Contact Hero matching Screen 7 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Contact</span>
            </nav>
            <h1 className="phb-title">Let’s Work Together</h1>
            <p className="phb-lead">
              Have a project, a question or a growth goal? Tell us about it and we’ll get back to you soon.
            </p>
          </div>

          <div className="phb-visual">
            <div className="contact-quick-highlights">
              <div className="cqh-item">
                <Clock size={16} className="cqh-icon" />
                <span>Initial reply within 4–24 hours</span>
              </div>
              <div className="cqh-item">
                <ShieldCheck size={16} className="cqh-icon" />
                <span>NDA & complete privacy respected</span>
              </div>
              <div className="cqh-item">
                <Sparkles size={16} className="cqh-icon" />
                <span>Founder-led discovery & strategic review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Contact Section matching Screen 7 */}
      <section className="section contact-main-body">
        <div className="container">
          <ContactSection initialService={requestedService} />
        </div>
      </section>

      {/* What Happens Next Guide */}
      <section className="section surface-cream" aria-labelledby="steps-heading">
        <div className="container">
          <SectionHead
            eyebrow="Expectations"
            id="steps-heading"
            title={
              <>
                What Happens <em>Next</em>
              </>
            }
            intro="No pushy sales calls. We review your actual digital footprint and propose clear, practical options."
          />
          <ol className="engagements-grid">
            {nextSteps.map((step, i) => (
              <li key={step} className="engagement-card">
                <span className="eng-num">0{i + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </PageShell>
  )
}

const auditFaqs: [string, string][] = [
  [
    'Is there a fee for the Digital Growth Audit?',
    'No. Our initial 9-point teardown and high-level strategy outline is completely free of charge and requires zero commercial commitment.',
  ],
  [
    'What do you need from us?',
    'Your current website URL, social profiles, and a brief description of what you are trying to achieve. Access to Google Analytics or Ads accounts is optional but helpful.',
  ],
  [
    'What happens after the audit?',
    'You decide. Some business owners execute the recommendations with their in-house team; others retain Chazon for a dedicated sprint or ongoing partnership.',
  ],
]

export function GrowthAudit() {
  usePageMeta({
    title: 'Digital Growth Audit: 9-Point Teardown & Strategy | Chazon',
    description:
      'Request a comprehensive Digital Growth Audit: website performance, search discoverability, paid ads, conversion journey, and automated follow-ups.',
    path: '/growth-audit',
    schema: [
      ...breadcrumbSchema([['Digital Growth Audit', '/growth-audit']]),
      ...faqSchema(auditFaqs),
    ],
  })

  return (
    <PageShell>
      {/* Audit Hero */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Growth Audit</span>
            </nav>
            <h1 className="phb-title">Digital Growth Audit</h1>
            <p className="phb-lead">
              How hard is your digital presence really working? A structured review of 9 vital growth areas to identify where you are leaking revenue.
            </p>
            <div className="button-row">
              <a href="#analyzer" className="button button-primary">
                Run Instant Diagnostic <ArrowRight size={18} />
              </a>
              <a href="#request-scope" className="button button-secondary">
                Audit Scope Breakdown
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Analyzer Tool Section */}
      <section className="section" id="analyzer" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="audit-card-surface">
            <WebsiteAuditAnalyzer showTitle={true} />
          </div>
        </div>
      </section>

      {/* 9 Areas Scope Grid */}
      <section className="section surface-cream" id="request-scope" aria-labelledby="scope-title">
        <div className="container">
          <SectionHead
            eyebrow="Comprehensive Inspection"
            id="scope-title"
            title={
              <>
                Nine Critical Areas. <em>One Connected Growth Picture.</em>
              </>
            }
            intro="Each area is evaluated against commercial ROI rather than generic checklists, pinpointing high-leverage fixes."
          />
          <ol className="scope-grid">
            {auditScope.map(([name, text], i) => (
              <li key={name}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Strategy Request Section */}
      <section className="section surface-peach" id="request" aria-labelledby="request-title">
        <div className="container">
          <div className="text-center section-center-head">
            <span className="pill-eyebrow">STRATEGIC AUDIT INTAKE</span>
            <h2 id="request-title" className="section-title-large">
              Request Your 9-Point Teardown
            </h2>
            <p className="section-sub-desc">
              Tell us about your business and website. Our founder will review your setup and prepare an actionable teardown before our conversation.
            </p>
          </div>

          <ContactSection initialService="Digital Growth Audit" />
        </div>
      </section>

      <Faq items={auditFaqs} title="Frequently Asked Questions About the Growth Audit" />
    </PageShell>
  )
}
