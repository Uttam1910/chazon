import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { breadcrumbSchema, faqSchema, serviceSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'
import { WebsiteAuditView } from '../components/WebsiteAuditView'
import { Cta, Eyebrow, Faq, PageHero, SectionHead } from '../components/ui'
import {
  type SearchPageConfig,
  WEBSITE_DEV,
  DIGITAL_MARKETING,
  SEO_SERVICES,
  CONTENT_MARKETING,
  SOCIAL_MEDIA_MARKETING,
  PPC_ADVERTISING,
  GOOGLE_ADS,
  EMAIL_MARKETING,
  AFFILIATE_INFLUENCER_MARKETING,
  UI_UX_DESIGN,
  LANDING_PAGE_DEV,
  ECOMMERCE_DEV,
  LOCAL_SEO,
  AI_INTEGRATION,
} from './searchLandingConfigs'

export {
  WEBSITE_DEV,
  DIGITAL_MARKETING,
  SEO_SERVICES,
  CONTENT_MARKETING,
  SOCIAL_MEDIA_MARKETING,
  PPC_ADVERTISING,
  GOOGLE_ADS,
  EMAIL_MARKETING,
  AFFILIATE_INFLUENCER_MARKETING,
  UI_UX_DESIGN,
  LANDING_PAGE_DEV,
  ECOMMERCE_DEV,
  LOCAL_SEO,
  AI_INTEGRATION,
  type SearchPageConfig,
}

export function DedicatedServicePage({ config }: { config: SearchPageConfig }) {
  const path = `/services/${config.slug}`
  usePageMeta({
    title: config.seoTitle,
    description: config.seoDesc,
    path,
    schema: [
      ...serviceSchema({
        name: config.title,
        description: config.seoDesc,
        path,
        offers: config.included.map((i) => i.title),
      }),
      ...breadcrumbSchema([
        ['Services', '/services'],
        [config.breadcrumb, path],
      ]),
      ...faqSchema(config.faqs),
    ],
  })

  const contactLink = `/contact?service=${encodeURIComponent(config.ctaPillar)}`

  return (
    <PageShell>
      <PageHero
        trail={[
          ['Services', '/services'],
          [config.breadcrumb, path],
        ]}
        eyebrow={`Specialized Capability · ${config.breadcrumb}`}
        title={<>{config.h1}</>}
        intro={config.intro}
      >
        <div className="button-row">
          <Cta to={contactLink} location={`service_${config.slug}_hero`}>
            {config.ctaLabel}
          </Cta>
          <Cta
            to="/website-audit"
            variant="secondary"
            location={`service_${config.slug}_audit`}
          >
            Audit My Current Website
          </Cta>
        </div>

        {config.frameworkRole && (
          <div className="framework-connection-pill" style={{ marginTop: '20px' }}>
            <span className="fcp-badge">GROWTH FRAMEWORK</span>
            <span className="fcp-stage">Stage {config.frameworkRole.stage}:</span>
            <span className="fcp-summary">{config.frameworkRole.summary}</span>
          </div>
        )}
      </PageHero>

      {/* The Problem & Solution */}
      <section className="section" aria-labelledby="problem-heading">
        <div className="container split-section">
          <div>
            <Eyebrow>The Challenge</Eyebrow>
            <h2 id="problem-heading">{config.problemTitle}</h2>
          </div>
          <div>
            <p className="split-intro">{config.problemText}</p>
            <ul className="signs">
              {config.signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Custom Category Groups (e.g. 10 Website Types or 8 SEO Capabilities) */}
      {config.categoryGroups && (
        <section className="section surface-cream" aria-labelledby="categories-heading">
          <div className="container">
            <SectionHead
              eyebrow="Taxonomy & Solutions"
              id="categories-heading"
              title={
                <>
                  Tailored architectures for <em>every commercial requirement.</em>
                </>
              }
              intro="We build solutions organized around how your customers interact and transact."
            />

            <div className="service-groups-stack">
              {config.categoryGroups.map((group) => (
                <div key={group.group} className="service-group-box">
                  <h3 className="sgb-title">{group.group}</h3>
                  <div className="sgb-grid">
                    {group.items.map((item) => (
                      <div key={item.name} className="sgb-item-card">
                        <div className="sgb-head">
                          <CheckCircle2 size={18} className="sgb-check" />
                          <h4>{item.name}</h4>
                        </div>
                        <p>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Strategic Principles (e.g. for Content Marketing) */}
      {config.principles && (
        <section className="section surface-peach" aria-labelledby="principles-heading">
          <div className="container">
            <SectionHead
              eyebrow="Core Principles"
              id="principles-heading"
              title={
                <>
                  The Foundational Principles of <em>{config.title}</em>
                </>
              }
              intro="How we approach this capability to maximize commercial conversion and sustainable return."
            />

            <div className="principles-grid">
              {config.principles.map((p) => (
                <div key={p.number} className="principle-card">
                  <span className="mono p-number">{p.number}</span>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dedicated Platforms (e.g. for Social Media Marketing) */}
      {config.platforms && (
        <section className="section surface-cream" aria-labelledby="platforms-heading">
          <div className="container">
            <SectionHead
              eyebrow="Platform Ecosystem"
              id="platforms-heading"
              title={
                <>
                  Channel Mastery across the <em>Key Digital Networks</em>
                </>
              }
              intro="Connecting each platform to its unique commercial strength and customer touchpoint."
            />

            <div className="platforms-grid">
              {config.platforms.map((p) => (
                <div key={p.name} className="platform-card">
                  <div className="platform-card-header">
                    <h4>{p.name}</h4>
                    <span className="platform-role-tag">{p.role}</span>
                  </div>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What's Included */}
      <section
        className="section"
        id="included"
        aria-labelledby="included-heading"
      >
        <div className="container">
          <SectionHead
            eyebrow="Capabilities & Scope"
            id="included-heading"
            title={
              <>
                Engineered for <em>measurable business outcomes.</em>
              </>
            }
            intro="We don't sell generic templates. Every deliverable connects strategy, execution, and tracking into a reliable revenue pipeline."
          />
          <ul className="service-list">
            {config.included.map((item, idx) => (
              <li key={item.title}>
                <span className="mono">{String(idx + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Deliverables Checklist */}
      <section className="section surface-cream" aria-labelledby="deliverables-heading">
        <div className="container">
          <SectionHead
            eyebrow="Tangible Outputs"
            id="deliverables-heading"
            title={
              <>
                What you receive upon <em>completion.</em>
              </>
            }
          />
          <ol className="deliverables-grid">
            {config.deliverables.map((d, idx) => (
              <li key={d}>
                <span className="mono">0{idx + 1}</span>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQs */}
      <Faq items={config.faqs} title={`${config.title}: Frequently Asked Questions`} />

      {/* Bottom CTA */}
      <section className="section surface-peach text-center">
        <div className="container">
          <h2 className="section-title-large">
            Ready to upgrade your {config.title.toLowerCase()}?
          </h2>
          <p className="section-sub-desc" style={{ marginInline: 'auto' }}>
            Book a conversation with founder Binny Rogin to review your requirements and outline a concrete execution plan.
          </p>
          <div className="button-row" style={{ justifyContent: 'center' }}>
            <Cta to={contactLink} location={`service_${config.slug}_footer`}>
              {config.ctaLabel} <ArrowRight size={16} />
            </Cta>
            <Cta
              to="/website-audit"
              variant="secondary"
              location={`service_${config.slug}_footer_audit`}
            >
              Run Website Diagnostic
            </Cta>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export function WebsiteAuditPage({ mode = 'audit' }: { mode?: 'audit' | 'growth' }) {
  const isGrowth = mode === 'growth'
  const path = isGrowth ? '/growth-audit' : '/website-audit'
  const title = isGrowth
    ? 'Digital Growth Audit: Website, SEO & Conversion Review | Chazon'
    : 'Free Website Audit & Digital Growth Analyzer | Chazon'
  const description = isGrowth
    ? 'Request a comprehensive Digital Growth Audit. We inspect your website performance, search visibility, conversion journey, and automated follow-ups.'
    : 'Run a free instant website audit. Uncover hidden speed bottlenecks, search visibility gaps, missing mobile tags, and enquiry leaks before they cost leads.'

  const auditFaqs: [string, string][] = [
    [
      'Is there any fee or commercial commitment for running the website audit?',
      'No. The Website Audit & Digital Growth Analyzer is completely free and requires zero credit card or commercial commitment.',
    ],
    [
      'What areas does the diagnostic inspect?',
      'The engine inspects server response latency, crawlability, robots.txt, sitemap.xml, Core Web Vitals, Google search title/description tags, heading hierarchy, mobile responsive viewports, contact pathways, and conversion readiness.',
    ],
    [
      'Can I download or share the generated audit report?',
      'Yes. Simply click the "Download PDF" button at the top of your audit results to view the full printable report or save it as a PDF.',
    ],
    [
      'Can Chazon help fix the issues found in the audit?',
      'Yes. Click "Fix These Issues with Chazon" on your audit results. Your audit reference and findings will be automatically attached to your enquiry so our team can review them before our strategy consultation.',
    ],
  ]

  usePageMeta({
    title,
    description,
    path,
    schema: [
      ...breadcrumbSchema([[isGrowth ? 'Digital Growth Audit' : 'Website Audit', path]]),
      ...faqSchema(auditFaqs),
    ],
  })

  return (
    <PageShell>
      <WebsiteAuditView asHeroH1={true} />
      <Faq items={auditFaqs} title="Website Audit: Frequently Asked Questions" />
    </PageShell>
  )
}
