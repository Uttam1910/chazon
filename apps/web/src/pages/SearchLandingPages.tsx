import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Layers,
  MousePointerClick,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react'
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

function renderHeroTitle(h1: string) {
  if (h1.includes('.')) {
    const parts = h1.split('.')
    return (
      <>
        {parts[0]}. <em>{parts.slice(1).join('.').trim()}</em>
      </>
    )
  }
  const words = h1.split(' ')
  if (words.length > 4) {
    const splitIndex = Math.max(3, words.length - 4)
    return (
      <>
        {words.slice(0, splitIndex).join(' ')} <em>{words.slice(splitIndex).join(' ')}</em>
      </>
    )
  }
  return <>{h1}</>
}

/** Visual mockups and interactive compositions tailored for each service hero */
function ServiceHeroVisual({ slug }: { slug: string }) {
  if (slug === 'ui-ux-design') {
    return (
      <div className="shv-card shv-uiux" aria-hidden="true">
        <div className="shv-browser-bar">
          <span className="shv-dot red" />
          <span className="shv-dot yellow" />
          <span className="shv-dot green" />
          <span className="shv-bar-title">Figma · Chazon Design System</span>
          <span className="shv-badge-small">100%</span>
        </div>
        <div className="shv-artboard-content">
          <div className="shv-wireframe-screen">
            <div className="shv-app-nav">
              <span className="shv-mini-logo" />
              <div className="shv-nav-pills">
                <span />
                <span />
              </div>
            </div>
            <div className="shv-app-hero">
              <div className="shv-chip">STAGE 03 · CONVERT</div>
              <h5>Friction-Free Checkout Flow</h5>
              <p>Removing cognitive load & increasing tap velocity.</p>
              <div className="shv-cta-preview">
                <span>Complete Order</span>
                <MousePointerClick size={14} className="shv-cursor-icon" />
              </div>
            </div>
            <div className="shv-trust-row">
              <div className="shv-mini-trust"><CheckCircle2 size={12} /> Sub-600ms Speed</div>
              <div className="shv-mini-trust"><CheckCircle2 size={12} /> WCAG AAA</div>
            </div>
          </div>
          <div className="shv-floating-metric metric-right">
            <div className="sfm-icon"><TrendingUp size={16} /></div>
            <div className="sfm-text">
              <strong>+42% Conversion</strong>
              <small>Frictionless UX lift</small>
            </div>
          </div>
          <div className="shv-floating-metric metric-bottom-left">
            <div className="sfm-icon sfm-shield"><ShieldCheck size={16} /></div>
            <div className="sfm-text">
              <strong>98/100 Usability</strong>
              <small>Cognitive clarity audit</small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slug === 'website-development' || slug === 'ecommerce-development' || slug === 'landing-page-development') {
    return (
      <div className="shv-card shv-webdev" aria-hidden="true">
        <div className="shv-browser-bar">
          <span className="shv-dot red" />
          <span className="shv-dot yellow" />
          <span className="shv-dot green" />
          <span className="shv-bar-title">https://chazon.digital/{slug}</span>
        </div>
        <div className="shv-browser-inner">
          <div className="shv-laptop-viewport">
            <div className="slv-top-bar">
              <span className="slv-brand">CHAZON ARCHITECTURE</span>
              <span className="slv-status">⚡ Sub-800ms</span>
            </div>
            <h4>High-Performing Digital Platform</h4>
            <p>Engineered for discoverability, trust, and commercial conversion.</p>
            <div className="slv-btn-mock">Explore Solutions →</div>
          </div>
          <div className="shv-mobile-mockup">
            <div className="smm-notch" />
            <div className="smm-content">
              <span className="smm-tag">MOBILE FIRST</span>
              <strong>Frictionless UX</strong>
              <div className="smm-btn">Instant WhatsApp</div>
            </div>
          </div>
          <div className="shv-floating-metric metric-right">
            <div className="sfm-icon"><TrendingUp size={16} /></div>
            <div className="sfm-text">
              <strong>+74% Traffic</strong>
              <small>Speed & SEO optimized</small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slug === 'seo-services' || slug === 'local-seo' || slug === 'search-engine-optimisation') {
    return (
      <div className="shv-card shv-seo" aria-hidden="true">
        <div className="shv-browser-bar">
          <span className="shv-dot red" />
          <span className="shv-dot yellow" />
          <span className="shv-dot green" />
          <span className="shv-bar-title">google.com/search?q=high+intent+revenue</span>
        </div>
        <div className="shv-serp-inner">
          <div className="shv-serp-card">
            <span className="serp-badge">#1 GOOGLE RANKING</span>
            <h4>Chazon Digital Ventures — Revenue-Led Growth</h4>
            <p>Connecting technology, organic search intent, and commercial conversion into one unified pipeline.</p>
            <div className="serp-stars">★★★★★ 4.9 (48 Client Reviews)</div>
          </div>
          <div className="shv-floating-metric metric-right">
            <div className="sfm-icon"><TrendingUp size={16} /></div>
            <div className="sfm-text">
              <strong>+184% Organic</strong>
              <small>Topical cluster authority</small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slug === 'digital-marketing' || slug === 'ppc-advertising' || slug === 'google-ads' || slug === 'social-media-marketing' || slug === 'content-marketing' || slug === 'affiliate-influencer-marketing') {
    return (
      <div className="shv-card shv-growth" aria-hidden="true">
        <div className="shv-browser-bar">
          <span className="shv-dot red" />
          <span className="shv-dot yellow" />
          <span className="shv-dot green" />
          <span className="shv-bar-title">Chazon Growth Cockpit · Live Attribution</span>
        </div>
        <div className="shv-cockpit-inner">
          <div className="shv-channels-grid">
            <div className="scg-item">
              <span className="scg-label">Organic Search</span>
              <strong>48% Volume</strong>
              <div className="scg-bar"><span style={{ width: '85%' }} /></div>
            </div>
            <div className="scg-item">
              <span className="scg-label">Targeted Paid</span>
              <strong>4.8x ROAS</strong>
              <div className="scg-bar"><span style={{ width: '92%' }} /></div>
            </div>
            <div className="scg-item">
              <span className="scg-label">Social & Content</span>
              <strong>+68% Reach</strong>
              <div className="scg-bar"><span style={{ width: '74%' }} /></div>
            </div>
          </div>
          <div className="shv-floating-metric metric-right">
            <div className="sfm-icon"><Zap size={16} /></div>
            <div className="sfm-text">
              <strong>+68% Acquisition</strong>
              <small>Full-funnel attribution</small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Automation / Email / AI fallback
  return (
    <div className="shv-card shv-automate" aria-hidden="true">
      <div className="shv-browser-bar">
        <span className="shv-dot red" />
        <span className="shv-dot yellow" />
        <span className="shv-dot green" />
        <span className="shv-bar-title">Automated Pipeline · Live 24/7</span>
      </div>
      <div className="shv-automate-inner">
        <div className="shv-chat-bubble whatsapp">
          <span className="bubble-head">WhatsApp Business API · Automated</span>
          <p>“New high-intent enquiry received. Personalized strategy brief dispatched.”</p>
        </div>
        <div className="shv-chat-bubble crm">
          <span className="bubble-head">HubSpot CRM · Pipeline Sync</span>
          <p>Lead tagged, assigned to growth strategist & consultation booked.</p>
        </div>
        <div className="shv-floating-metric metric-right">
          <div className="sfm-icon"><Zap size={16} /></div>
          <div className="sfm-text">
            <strong>24/7 Pipeline</strong>
            <small>Zero lead response delay</small>
          </div>
        </div>
      </div>
    </div>
  )
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

  const categoryMap: Record<string, string> = {
    'Website Development': 'BUILD',
    'UI/UX Design': 'BUILD',
    'Landing Page Development': 'CONVERT',
    'E-Commerce Development': 'E-COMMERCE',
    'Search Engine Optimisation': 'GROW',
    'Local SEO': 'GROW',
    'Digital Marketing': 'GROW',
    'Content Marketing': 'GROW',
    'Social Media Marketing': 'GROW',
    'Affiliate & Influencer Marketing': 'GROW',
    'PPC Advertising': 'CONVERT',
    'Google Ads': 'CONVERT',
    'Email Marketing': 'AUTOMATE',
    'AI Integration': 'AI',
  }
  const categoryType = categoryMap[config.ctaPillar] || 'BUILD'
  const contactLink = `/contact?type=${categoryType}&service=${encodeURIComponent(config.slug)}`

  return (
    <PageShell>
      <PageHero
        trail={[
          ['Services', '/services'],
          [config.breadcrumb, path],
        ]}
        eyebrow={`Specialized Capability · ${config.breadcrumb}`}
        title={renderHeroTitle(config.h1)}
        intro={config.intro}
        aside={<ServiceHeroVisual slug={config.slug} />}
      >
        <div className="button-row">
          <Cta to={contactLink} location={`service_${config.slug}_hero`}>
            {config.ctaLabel}
          </Cta>
          <Cta
            to="/contact"
            variant="secondary"
            location={`service_${config.slug}_consult`}
          >
            Start a Conversation
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

      {/* The Problem & Commercial Friction */}
      <section className="section service-challenge-section" aria-labelledby="problem-heading">
        <div className="container split-section">
          <div className="challenge-left">
            <Eyebrow>Commercial Reality</Eyebrow>
            <h2 id="problem-heading" className="challenge-title">{config.problemTitle}</h2>
            <p className="split-intro">{config.problemText}</p>
          </div>
          <div className="challenge-right">
            <div className="challenge-friction-box">
              <div className="cfb-head">
                <AlertTriangle size={18} className="text-accent" />
                <strong className="cfb-title">Common Friction Points & Revenue Leaks:</strong>
              </div>
              <ul className="signs-styled">
                {config.signs.map((s) => (
                  <li key={s} className="sign-item">
                    <span className="sign-bullet" aria-hidden="true" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
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

      {/* What's Included / Core Scope */}
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

      {/* Featured Craft & Commercial Proof Showcase */}
      <section className="section surface-cream service-craft-spotlight" aria-labelledby="craft-heading">
        <div className="container">
          <div className="craft-spotlight-split">
            <div className="craft-img-frame">
              <img
                src={
                  config.slug === 'ui-ux-design'
                    ? '/assets/hero-laptop-desk.webp'
                    : config.slug === 'website-development' || config.slug === 'ecommerce-development' || config.slug === 'landing-page-development'
                    ? '/assets/hero-laptop-desk.webp'
                    : '/assets/about-team-story.webp'
                }
                alt={`${config.title} in practice at Chazon`}
                className="craft-spotlight-img"
                width={560}
                height={340}
                loading="lazy"
              />
              <span className="craft-badge">Chazon Commercial Standard</span>
            </div>
            <div className="craft-copy">
              <Eyebrow>Execution Craft</Eyebrow>
              <h2 id="craft-heading">
                Engineered for <em>measurable commercial outcomes.</em>
              </h2>
              <p className="craft-lead">
                Every {config.title.toLowerCase()} project at Chazon bridges the gap between technical execution and business revenue. We don't build generic deliverables—we build growth engines that compound in value over time.
              </p>
              <div className="craft-pillars-grid">
                <div className="cpp-item">
                  <div className="cpp-icon"><Zap size={16} /></div>
                  <div>
                    <strong>Sub-800ms Speed</strong>
                    <small>High conversion velocity</small>
                  </div>
                </div>
                <div className="cpp-item">
                  <div className="cpp-icon"><CheckCircle2 size={16} /></div>
                  <div>
                    <strong>Conversion Psychology</strong>
                    <small>Zero friction pathways</small>
                  </div>
                </div>
                <div className="cpp-item">
                  <div className="cpp-icon"><Layers size={16} /></div>
                  <div>
                    <strong>WhatsApp & CRM Sync</strong>
                    <small>Instant lead routing</small>
                  </div>
                </div>
                <div className="cpp-item">
                  <div className="cpp-icon"><TrendingUp size={16} /></div>
                  <div>
                    <strong>Closed-Loop ROI</strong>
                    <small>Clear attribution tracking</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Bottom Call to Action: Premium Dark Revenue Engine Card */}
      <section className="section service-bottom-cta-section" aria-labelledby="cta-bottom-heading">
        <div className="container">
          <div className="service-bottom-cta-card">
            <span className="sbc-badge">CHAZON DIGITAL VENTURES · MUMBAI</span>
            <h2 id="cta-bottom-heading" className="sbc-title">
              Ready to turn your {config.title.toLowerCase()} into <em>predictable business growth?</em>
            </h2>
            <p className="sbc-desc">
              Book a strategic conversation with founder Binny Rogin to inspect your current setup, uncover conversion leaks, and outline a concrete execution roadmap.
            </p>
            <div className="sbc-actions">
              <Cta to={contactLink} location={`service_${config.slug}_footer`}>
                {config.ctaLabel} <ArrowRight size={16} />
              </Cta>
              <Cta to="/contact" variant="secondary" location={`service_${config.slug}_footer_talk`}>
                Start a Conversation
              </Cta>
            </div>
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
