import { useEffect } from 'react'
import {
  ArrowRight,
  BarChart2,
  Check,
  FileText,
  Laptop,
  Layout,
  Mail,
  Megaphone,
  Search,
  Share2,
  Target,
  Users,
} from 'lucide-react'
import { CORE_10_SERVICES, PILLARS, PILLAR_INFO, PILLAR_SLUGS } from '@chazon/shared'
import { track } from '../config'
import { engagements, pillarPath, pillars as pillarCopy } from '../content'
import { Link } from '../router'
import { breadcrumbSchema, faqSchema, serviceSchema, usePageMeta } from '../seo'
import { useSite } from '../site-data'
import { PageShell } from '../components/Layout'
import { Cta, Eyebrow, Faq, PageHero, SectionHead } from '../components/ui'

export function ServicesIndex() {
  usePageMeta({
    title: 'Our Services: Digital Growth Solutions | Chazon Digital Ventures',
    description:
      'A complete suite of 10 digital solutions across web development, SEO, marketing, and business automation — planned and delivered as one growth system.',
    path: '/services',
    schema: breadcrumbSchema([['Services', '/services']]),
  })

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'website-development':
        return <Laptop size={24} />
      case 'digital-marketing':
        return <Megaphone size={24} />
      case 'seo-services':
        return <Search size={24} />
      case 'content-marketing':
        return <FileText size={24} />
      case 'social-media-marketing':
        return <Share2 size={24} />
      case 'ppc-advertising':
        return <Target size={24} />
      case 'google-ads':
        return <BarChart2 size={24} />
      case 'email-marketing':
        return <Mail size={24} />
      case 'affiliate-influencer-marketing':
        return <Users size={24} />
      case 'ui-ux-design':
      default:
        return <Layout size={24} />
    }
  }

  const getDetailedScope = (id: string) => {
    switch (id) {
      case 'website-development':
        return [
          'Custom responsive engineering',
          'Sub-800ms page load speeds',
          'Direct WhatsApp & form triggers',
          'SEO-friendly semantic HTML',
        ]
      case 'digital-marketing':
        return [
          'Full-funnel campaign roadmap',
          'Targeted buyer persona reach',
          'Multi-channel brand coherence',
          'Revenue attribution tracking',
        ]
      case 'seo-services':
        return [
          'Commercial intent keywords',
          'Technical Core Web Vitals',
          'Structured schema.org data',
          'Local 3-Pack visibility',
        ]
      case 'content-marketing':
        return [
          'Topical authority clusters',
          'Conversion-led blog guides',
          'Buyer objection resolution',
          'SEO rank-building assets',
        ]
      case 'social-media-marketing':
        return [
          'Consistent brand presence',
          'Community trust building',
          'High-converting DM workflows',
          'Visual storytelling templates',
        ]
      case 'ppc-advertising':
        return [
          'Performance-driven campaigns',
          'Precise audience targeting',
          'Continuous bid & ad testing',
          'Cost-per-lead optimization',
        ]
      case 'google-ads':
        return [
          'High-intent search ads',
          'Performance Max campaigns',
          'Negative keyword filtration',
          'Direct call & inquiry tracking',
        ]
      case 'email-marketing':
        return [
          'Targeted email nurture flows',
          'Lead qualification sequences',
          'Client retention & loyalty',
          'Dynamic personalization',
        ]
      case 'affiliate-influencer-marketing':
        return [
          'Credible niche creator reach',
          'Performance partner networks',
          'Commercial affiliate tracking',
          'Influencer brand endorsement',
        ]
      case 'ui-ux-design':
      default:
        return [
          'User journey mapping',
          'Frictionless checkout UX',
          'High-contrast visual hierarchy',
          'Mobile tap-target ergonomics',
        ]
    }
  }

  return (
    <PageShell>
      {/* Services Hero matching Screen 2 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Services</span>
            </nav>
            <h1 className="phb-title">Our Services</h1>
            <p className="phb-lead">
              A complete suite of digital solutions to build your presence, attract customers and grow revenue.
            </p>
            <div className="button-row">
              <Link to="/contact" className="button button-primary">
                Discuss Your Project <ArrowRight size={18} />
              </Link>
              <Link to="/website-audit" className="button button-secondary">
                Free Website Audit
              </Link>
            </div>
          </div>

          <div className="phb-visual">
            <svg viewBox="0 0 320 220" className="services-hero-svg" aria-hidden="true">
              <defs>
                <linearGradient id="warmBuildingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF9F3" />
                  <stop offset="100%" stopColor="#FCE9DA" />
                </linearGradient>
              </defs>
              <rect width="320" height="220" rx="16" fill="url(#warmBuildingGrad)" />
              {/* Abstract Architectural Warm Layers */}
              <g transform="translate(40, 30)">
                <polygon points="120,20 220,70 120,120 20,70" fill="#E8B088" opacity="0.6" />
                <polygon points="120,50 220,100 120,150 20,100" fill="#DF8D5B" opacity="0.8" />
                <polygon points="120,80 220,130 120,180 20,130" fill="#E84B0B" />
                <line x1="120" y1="80" x2="120" y2="180" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="20" y1="130" x2="120" y2="180" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="220" y1="130" x2="120" y2="180" stroke="#FFFFFF" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* 10 Services Detailed Cards List matching Screen 2 */}
      <section className="section services-full-list-section" aria-labelledby="all-services-heading">
        <div className="container">
          <SectionHead
            eyebrow="Complete Suite"
            id="all-services-heading"
            title={
              <>
                Ten High-Impact Capabilities. <em>Zero Fluff.</em>
              </>
            }
            intro="Each capability is engineered around practical commercial execution, providing transparent deliverables and measurable ROI."
          />

          <div className="services-cards-detailed-grid">
            {CORE_10_SERVICES.map((s) => (
              <article key={s.id} className="service-detail-card">
                <div className="sdc-icon-badge">{getServiceIcon(s.id)}</div>

                <div className="sdc-body">
                  <div className="sdc-top-line">
                    <span className="sdc-category-pill">{s.category}</span>
                    <span className="sdc-pillar-tag">Pillar: {s.pillar}</span>
                  </div>

                  <h3 className="sdc-title">{s.title}</h3>
                  <p className="sdc-description">{s.description}</p>

                  <div className="sdc-scope">
                    <strong>What Chazon Provides:</strong>
                    <ul className="sdc-scope-list">
                      {getDetailedScope(s.id).map((item) => (
                        <li key={item}>
                          <Check size={14} className="scope-check" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="sdc-footer">
                    <Link to={s.path} className="sdc-link">
                      Learn More About {s.title} <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The Four Strategic Service Groupings matching Source Brief */}
      <section className="section surface-cream" id="service-groupings" aria-labelledby="groupings-heading">
        <div className="container">
          <SectionHead
            eyebrow="Specialized Offerings"
            id="groupings-heading"
            title={
              <>
                Organized into <em>Four Core Strategic Domains</em>
              </>
            }
            intro="Explore our full capability taxonomy across digital platforms, customer acquisition, organic search discoverability, and conversion experience design."
          />

          <div className="domain-groupings-grid">
            {/* Group A */}
            <div className="domain-group-card">
              <div className="dgc-badge">DOMAIN A</div>
              <h3 className="dgc-title">Websites & Digital Platforms</h3>
              <p className="dgc-lead">10 specialized digital platform architectures engineered for speed, conversion, and reliability.</p>
              <ul className="dgc-list">
                <li><Link to="/services/website-development">Business & Corporate Websites</Link></li>
                <li><Link to="/services/ecommerce-development">E-commerce Websites</Link></li>
                <li><Link to="/services/website-development">Portfolio Websites</Link></li>
                <li><Link to="/services/website-development">Booking & Appointment Websites</Link></li>
                <li><Link to="/services/content-marketing">Blogs & News Websites</Link></li>
                <li><Link to="/services/website-development">Social Media & Community Websites</Link></li>
                <li><Link to="/services/website-development">Educational & eLearning Websites</Link></li>
                <li><Link to="/services/website-development">Entertainment & Streaming Websites</Link></li>
                <li><Link to="/services/website-development">Wikis & Informational Websites</Link></li>
                <li><Link to="/services/website-development">Nonprofit & NGO Websites</Link></li>
              </ul>
            </div>

            {/* Group B */}
            <div className="domain-group-card">
              <div className="dgc-badge">DOMAIN B</div>
              <h3 className="dgc-title">Digital Marketing</h3>
              <p className="dgc-lead">Multi-channel performance campaigns and organic reach connecting attention to real commercial demand.</p>
              <ul className="dgc-list">
                <li><Link to="/services/digital-marketing">Integrated Digital Marketing</Link></li>
                <li><Link to="/services/content-marketing">Content Marketing</Link></li>
                <li><Link to="/services/social-media-marketing">Social Media Marketing</Link></li>
                <li><Link to="/services/ppc-advertising">PPC Advertising</Link></li>
                <li><Link to="/services/google-ads">Google Ads</Link></li>
                <li><Link to="/services/email-marketing">Email Marketing</Link></li>
                <li><Link to="/services/affiliate-influencer-marketing">Affiliate & Influencer Marketing</Link></li>
              </ul>
            </div>

            {/* Group C */}
            <div className="domain-group-card">
              <div className="dgc-badge">DOMAIN C</div>
              <h3 className="dgc-title">Search & Discoverability</h3>
              <p className="dgc-lead">The 8 strategic SEO capabilities to establish organic authority and capture ready-to-buy customer demand.</p>
              <ul className="dgc-list">
                <li><Link to="/services/seo-services">SEO Audit & Strategy</Link></li>
                <li><Link to="/services/seo-services">Keyword Research & Search Intent Analysis</Link></li>
                <li><Link to="/services/seo-services">On-Page & Technical SEO</Link></li>
                <li><Link to="/services/seo-services">Off-Page SEO & Link Building</Link></li>
                <li><Link to="/services/content-marketing">Content Optimisation & Blog Strategy</Link></li>
                <li><Link to="/services/local-seo">Local SEO & Google Business Profile</Link></li>
                <li><Link to="/services/ecommerce-development">E-commerce SEO</Link></li>
                <li><Link to="/services/seo-services">SEO Performance Monitoring & Reporting</Link></li>
              </ul>
            </div>

            {/* Group D */}
            <div className="domain-group-card">
              <div className="dgc-badge">DOMAIN D</div>
              <h3 className="dgc-title">Design & Experience</h3>
              <p className="dgc-lead">Intuitive customer journeys, high-contrast visual hierarchy, and frictionless conversion pathways.</p>
              <ul className="dgc-list">
                <li><Link to="/services/ui-ux-design">UI/UX Design</Link></li>
                <li><Link to="/services/ui-ux-design">Customer Journey Optimisation</Link></li>
                <li><Link to="/services/landing-page-development">Landing Page Design</Link></li>
                <li><Link to="/services/ecommerce-development">Website & E-commerce Experience Design</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Four Strategic Pillars Section */}
      <section className="section" id="four-pillars" aria-labelledby="pillars-heading">
        <div className="container">
          <SectionHead
            eyebrow="System Architecture"
            id="pillars-heading"
            title={
              <>
                How the Services Connect into <em>Four Strategic Pillars</em>
              </>
            }
            intro="Individual services perform best when connected into an end-to-end revenue pipeline: Digital Foundation, Digital Growth, Revenue & Commerce, and Automation & Retention."
          />

          <div className="four-pillars-grid">
            {PILLARS.map((p, idx) => (
              <div key={p} className="pillar-overview-card">
                <div className="poc-number">0{idx + 1}</div>
                <h3 className="poc-title">{PILLAR_INFO[p].title}</h3>
                <span className="poc-verb">Role: {PILLAR_INFO[p].verb}</span>
                <p className="poc-desc">
                  {pillarCopy[idx]?.scope || 'Strategic capability to scale digital revenue.'}
                </p>
                <Link to={`/services/${PILLAR_SLUGS[p]}`} className="poc-link">
                  Explore Pillar Architecture <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="section" aria-labelledby="engage-heading">
        <div className="container">
          <SectionHead
            eyebrow="Flexible Partnership"
            id="engage-heading"
            title={
              <>
                Flexible Ways to <em>Work Together</em>
              </>
            }
            intro="Whether you need a defined project, ongoing execution, or an extended growth partner, scope and deliverables are agreed in writing before kickoff."
          />

          <div className="engagements-grid">
            {engagements.map(([title, desc], i) => (
              <div key={title} className="engagement-card">
                <span className="eng-num">0{i + 1}</span>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section surface-peach text-center">
        <div className="container">
          <h2 className="section-title-large">
            Not sure which services your business needs first?
          </h2>
          <p className="section-sub-desc" style={{ marginInline: 'auto' }}>
            Run our free instant Website Audit or request a comprehensive Digital Growth Audit with our advisory team.
          </p>
          <div className="button-row" style={{ justifyContent: 'center' }}>
            <Link to="/website-audit" className="button button-primary">
              Run Free Website Audit <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="button button-secondary">
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

/** Individual Pillar Page View */
export function ServicePage({ index }: { index: number }) {
  const { pillars } = useSite()
  const p = pillars[index]
  const { page } = p
  const path = pillarPath(p)

  usePageMeta({
    title: page.title,
    description: page.description,
    path,
    schema: [
      ...serviceSchema({
        name: `${p.verb}: ${p.title}`,
        description: page.description,
        path,
        offers: pillarCopy[index].items,
      }),
      ...breadcrumbSchema([
        ['Services', '/services'],
        [p.title, path],
      ]),
      ...faqSchema(page.faqs),
    ],
  })

  useEffect(() => {
    track('service_page_view', { pillar: p.key })
  }, [p.key])

  const contact = `/contact?service=${encodeURIComponent(p.slug)}`

  return (
    <PageShell>
      <PageHero
        trail={[
          ['Services', '/services'],
          [p.title, path],
        ]}
        eyebrow={
          <>
            Strategic Pillar 0{index + 1} · {p.verb} — {p.title}
          </>
        }
        title={page.h1}
        intro={page.intro}
      >
        <div className="button-row">
          <Cta to={contact} location={`service_${p.key.toLowerCase()}_hero`}>
            {page.cta}
          </Cta>
          <Cta
            to="#what-we-provide"
            variant="secondary"
            location={`service_${p.key.toLowerCase()}_hero_secondary`}
          >
            What’s Included
          </Cta>
        </div>
      </PageHero>

      {/* The Problem */}
      <section className="section" aria-labelledby="signs-title">
        <div className="container split-section">
          <div>
            <Eyebrow>The Problem</Eyebrow>
            <h2 id="signs-title">{p.problem}</h2>
          </div>
          <div>
            <p className="split-intro">Signs this is holding your business back:</p>
            <ul className="signs">
              {page.signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Included Services */}
      <section
        className="section surface-cream"
        id="what-we-provide"
        aria-labelledby="services-title"
      >
        <div className="container">
          <SectionHead
            eyebrow="Capabilities"
            id="services-title"
            title={
              <>
                What’s included in <em>{p.title}</em>
              </>
            }
          />
          <ul className="service-list">
            {page.services.map((item, idx) => (
              <li key={item.title}>
                <span className="mono">{String(idx + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Deliverables */}
      <section className="section" aria-labelledby="deliverables-title">
        <div className="container">
          <SectionHead
            eyebrow="Deliverables"
            id="deliverables-title"
            title={
              <>
                Tangible outputs from <em>every engagement.</em>
              </>
            }
          />
          <ol className="deliverables-grid">
            {page.deliverables.map((d, idx) => (
              <li key={d}>
                <span className="mono">0{idx + 1}</span>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Faq items={page.faqs} title={`${p.title}: Frequently Asked Questions`} />

      {/* Bottom CTA */}
      <section className="section surface-peach text-center">
        <div className="container">
          <h2 className="section-title-large">Discuss Your {p.title} Requirements</h2>
          <p className="section-sub-desc" style={{ marginInline: 'auto' }}>
            Book a conversation with our founder to review your challenges and plan a customized roadmap.
          </p>
          <div className="button-row" style={{ justifyContent: 'center' }}>
            <Link to={contact} className="button button-primary">
              {page.cta} <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="button button-secondary">
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
