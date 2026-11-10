import { useState, useEffect } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  Compass,
  FileText,
  Heart,
  Laptop,
  Layout,
  Layers,
  Mail,
  Megaphone,
  MousePointerClick,
  Search,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { track } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { breadcrumbSchema, usePageMeta, serviceSchema, faqSchema } from '../seo'
import { useSite } from '../site-data'
import { PageShell } from '../components/Layout'
import { Cta, Eyebrow, Faq, PageHero, SectionHead } from '../components/ui'
import { pillarPath, pillars as pillarCopy } from '../content'

// -------------------------------------------------------------
// ALL 10 SERVICES TAXONOMY & METADATA
// -------------------------------------------------------------
export interface ServiceDefinition {
  id: string
  number: string
  title: string
  categoryTag: string
  categoryFilters: Array<'all' | 'build' | 'market' | 'convert' | 'retain' | 'optimise'>
  headline: string
  shortDesc: string
  coreQuote: string
  enquiryType: 'BUILD' | 'GROW' | 'CONVERT' | 'AUTOMATE' | 'E-COMMERCE' | 'AI'
  enquiryService: string
  icon: typeof Laptop
}

export const ALL_10_SERVICES: ServiceDefinition[] = [
  {
    id: 'website-development',
    number: '01',
    title: 'Website Development',
    categoryTag: 'Digital Foundation',
    categoryFilters: ['all', 'build', 'convert'],
    headline: 'High-Performing Digital Platforms Built for Growth',
    shortDesc: 'Digital platforms that engage, convert and grow your business.',
    coreQuote: 'Your business deserves more than just a website. It deserves a digital platform that works as hard as your business does.',
    enquiryType: 'BUILD',
    enquiryService: 'Website Development',
    icon: Laptop,
  },
  {
    id: 'digital-marketing',
    number: '02',
    title: 'Digital Marketing',
    categoryTag: 'Digital Growth',
    categoryFilters: ['all', 'market', 'optimise'],
    headline: 'Integrated Digital Marketing That Drives Business Growth',
    shortDesc: 'Integrated marketing to increase visibility, reach and revenue.',
    coreQuote: 'Connecting strategy, audience targeting, performance advertising, and analytics into one growth system.',
    enquiryType: 'GROW',
    enquiryService: 'Digital Marketing',
    icon: Megaphone,
  },
  {
    id: 'seo-services',
    number: '03',
    title: 'Search Engine Optimisation',
    categoryTag: 'Organic Search',
    categoryFilters: ['all', 'market', 'optimise'],
    headline: 'Be Found. Get Discovered. Grow Organically.',
    shortDesc: 'Be found on Google and attract high-intent customers.',
    coreQuote: 'Sustainable organic visibility engineered around commercial search intent and technical authority.',
    enquiryType: 'GROW',
    enquiryService: 'SEO',
    icon: Search,
  },
  {
    id: 'content-marketing',
    number: '04',
    title: 'Content Marketing',
    categoryTag: 'Brand & Communication',
    categoryFilters: ['all', 'market', 'retain'],
    headline: 'Strategic Content That Connects with Commercial Objectives',
    shortDesc: 'Strategic content that builds trust, authority and demand.',
    coreQuote: 'Content marketing is not just about creating attractive posts. It is about connecting communication with commercial objectives.',
    enquiryType: 'GROW',
    enquiryService: 'Content Marketing',
    icon: FileText,
  },
  {
    id: 'social-media-marketing',
    number: '05',
    title: 'Social Media Marketing',
    categoryTag: 'Audience & Brand',
    categoryFilters: ['all', 'market'],
    headline: 'Transforming Social Channels into Customer Acquisition Engines',
    shortDesc: 'Build brand presence and engage your audience across platforms.',
    coreQuote: 'Audience-centric storytelling backed by commercial accountability across Facebook, Instagram, LinkedIn and YouTube.',
    enquiryType: 'GROW',
    enquiryService: 'Social Media Marketing',
    icon: Share2,
  },
  {
    id: 'ppc-advertising',
    number: '06',
    title: 'Pay-Per-Click Advertising',
    categoryTag: 'Performance Paid Media',
    categoryFilters: ['all', 'market', 'convert'],
    headline: 'Reach the Right Audience. Drive Qualified Traffic. Convert Clicks.',
    shortDesc: 'Targeted ad campaigns that bring quick and measurable results.',
    coreQuote: 'Data-driven performance advertising prioritizing customer acquisition and closed-loop revenue over vanity clicks.',
    enquiryType: 'GROW',
    enquiryService: 'PPC Advertising',
    icon: MousePointerClick,
  },
  {
    id: 'google-ads',
    number: '07',
    title: 'Google Ads',
    categoryTag: 'Intent Advertising',
    categoryFilters: ['all', 'market', 'convert'],
    headline: 'Capture High-Intent Customers at the Exact Moment of Search',
    shortDesc: 'Drive qualified traffic with high-performing Google campaigns.',
    coreQuote: 'Targeted Search, Display, Shopping, YouTube and Performance Max campaigns optimized for commercial ROI.',
    enquiryType: 'GROW',
    enquiryService: 'Google Ads',
    icon: Compass,
  },
  {
    id: 'email-marketing',
    number: '08',
    title: 'Email Marketing',
    categoryTag: 'Retention & Automation',
    categoryFilters: ['all', 'retain', 'convert'],
    headline: 'Turn Customer Connections into Sustainable Business Growth',
    shortDesc: 'Nurture leads, drive engagement and increase repeat sales.',
    coreQuote: 'Automated customer journeys, segmentation, personalized communication, and lead nurturing that compound LTV.',
    enquiryType: 'AUTOMATE',
    enquiryService: 'Email Marketing',
    icon: Mail,
  },
  {
    id: 'affiliate-influencer-marketing',
    number: '09',
    title: 'Affiliate & Influencer Marketing',
    categoryTag: 'Partnership & Influence',
    categoryFilters: ['all', 'market'],
    headline: 'Turn Influence and Partnerships into Measurable Revenue',
    shortDesc: 'Expand your reach and grow through trusted partnerships.',
    coreQuote: 'Authentic creator collaborations, vetted brand ambassadors, and scalable affiliate networks that build consumer confidence.',
    enquiryType: 'GROW',
    enquiryService: 'Affiliate & Influencer Marketing',
    icon: Award,
  },
  {
    id: 'ui-ux-design',
    number: '10',
    title: 'UI/UX Design',
    categoryTag: 'Experience & Conversion',
    categoryFilters: ['all', 'build', 'convert', 'optimise'],
    headline: 'Designing Experiences That Drive Engagement and Growth',
    shortDesc: 'User-centric designs that enhance experience and boost conversions.',
    coreQuote: 'Good digital design goes far beyond aesthetics — it removes purchase friction, guides choices, and accelerates conversions.',
    enquiryType: 'BUILD',
    enquiryService: 'UI/UX Design',
    icon: Layout,
  },
]

// -------------------------------------------------------------
// GROWTH FRAMEWORK 5 STAGES
// -------------------------------------------------------------
const FRAMEWORK_STAGES = [
  {
    id: 'discover',
    num: '01',
    name: 'Discover',
    tagline: 'Visibility & Searchability',
    summary: 'Make your brand visible and searchable to high-intent buyers.',
    icon: Search,
    services: ['Search Engine Optimisation (SEO)', 'Local SEO & Google Business Profile', 'Digital Presence Strategy'],
  },
  {
    id: 'attract',
    num: '02',
    name: 'Attract',
    tagline: 'Audience Acquisition',
    summary: 'Bring the right audience to your brand through targeted channels.',
    icon: Users,
    services: ['Social Media Marketing', 'Content Marketing', 'Pay-Per-Click Advertising', 'Google Ads'],
  },
  {
    id: 'convert',
    num: '03',
    name: 'Convert',
    tagline: 'Enquiries & Sales',
    summary: 'Turn audience interest and traffic into qualified enquiries and revenue.',
    icon: Target,
    services: ['Website Development', 'UI/UX Design', 'Conversion Rate Optimisation', 'E-commerce Checkout'],
  },
  {
    id: 'retain',
    num: '04',
    name: 'Retain',
    tagline: 'Relationships & Loyalty',
    summary: 'Build lasting customer relationships and encourage repeat purchases.',
    icon: Heart,
    services: ['Email Marketing', 'WhatsApp Business API Automation', 'CRM Integration & Lead Nurturing'],
  },
  {
    id: 'grow',
    num: '05',
    name: 'Grow',
    tagline: 'Compounding Revenue',
    summary: 'Continuously optimise performance to scale revenue and market share.',
    icon: TrendingUp,
    services: ['Analytics & Performance Tracking', 'Affiliate & Influencer Marketing', 'Continuous Growth Strategy'],
  },
]

// -------------------------------------------------------------
// HOW SERVICES WORK TOGETHER (5 ENGINES)
// -------------------------------------------------------------
const CONNECTED_ENGINES = [
  {
    id: 'organic',
    badge: 'ENGINE 01',
    title: 'The Organic Authority Engine',
    services: 'Website Development + SEO + Content Marketing',
    description:
      'Fast, structured web engineering combined with topical authority clusters and technical SEO. This creates a compounding asset that attracts buyers actively searching for solutions without ongoing media spend.',
    impact: 'Lowers customer acquisition cost (CAC) and establishes enduring domain authority.',
  },
  {
    id: 'acquisition',
    badge: 'ENGINE 02',
    title: 'The Demand & Acquisition Engine',
    services: 'Social Media Marketing + PPC + Google Ads',
    description:
      'High-intent search capture via Google Ads paired with targeted audience storytelling across Meta and LinkedIn. Traffic is routed directly to specialized campaign landing pages tailored for immediate response.',
    impact: 'Rapid customer acquisition and immediate market feedback with predictable ad attribution.',
  },
  {
    id: 'conversion',
    badge: 'ENGINE 03',
    title: 'The Conversion Engine',
    services: 'Website Development + UI/UX Design + CRO',
    description:
      'User-centric navigation hierarchies, ergonomic mobile design, and friction-free inquiry forms. We turn casual visitors into qualified leads through psychological clarity and rapid site performance.',
    impact: 'Maximizes lead volume from existing traffic without needing additional marketing budget.',
  },
  {
    id: 'retention',
    badge: 'ENGINE 04',
    title: 'The Retention & LTV Engine',
    services: 'CRM + Email Marketing + WhatsApp Automation',
    description:
      'Instant WhatsApp notifications when leads arrive, followed by personalized email nurture sequences, behavioral segmentation, and automated re-engagement triggers.',
    impact: 'Reduces lead drop-off, accelerates sales cycles, and drives repeat customer lifetime value.',
  },
  {
    id: 'optimization',
    badge: 'ENGINE 05',
    title: 'The Continuous Growth Loop',
    services: 'Analytics + SEO + Continuous Optimisation',
    description:
      'Closed-loop analytics dashboards tracking user behavior, drop-off points, and revenue attribution. Data feeds back into website UX updates, ad bid management, and content refinement.',
    impact: 'Ensures digital investments compound in efficiency and commercial return month over month.',
  },
]

// -------------------------------------------------------------
// DELIVERY PROCESS (6 STAGES)
// -------------------------------------------------------------
const DELIVERY_STAGES = [
  {
    num: '01',
    name: 'Discover',
    lead: 'Understand your goals, market landscape and commercial challenges.',
    detail: 'We audit current digital assets, inspect competitors, analyze buyer personas, and clarify exact revenue targets.',
  },
  {
    num: '02',
    name: 'Strategise',
    lead: 'Define the architectural roadmap, technical stack and priorities.',
    detail: 'We translate your objectives into an interconnected growth plan with clear milestones, scopes, and KPI benchmarks.',
  },
  {
    num: '03',
    name: 'Build',
    lead: 'Develop digital solutions, platforms and campaign infrastructure.',
    detail: 'Custom website engineering, UI/UX prototyping, CRM pipelines, ad tracking tags, and automation workflows.',
  },
  {
    num: '04',
    name: 'Execute',
    lead: 'Launch platforms and activate targeted growth campaigns.',
    detail: 'Production deployment, multi-channel ad launch, search indexing, content publication, and creator onboarding.',
  },
  {
    num: '05',
    name: 'Measure',
    lead: 'Review results, analytics and commercial performance.',
    detail: 'Attribution tracking, conversion journey inspection, keyword movements, lead quality verification, and ROI reporting.',
  },
  {
    num: '06',
    name: 'Optimise',
    lead: 'Refine, iterate and scale what delivers measurable revenue.',
    detail: 'Continuous A/B testing, bid adjustments, technical speed maintenance, content upgrades, and conversion rate tuning.',
  },
]

export type CategoryFilterType = 'all' | 'build' | 'market' | 'convert' | 'retain' | 'optimise'

export function normalizeCategoryFilter(val: string | null): CategoryFilterType {
  if (!val) return 'all'
  const lower = val.toLowerCase().trim()
  if (lower === 'build') return 'build'
  if (lower === 'market' || lower === 'grow') return 'market'
  if (lower === 'convert') return 'convert'
  if (lower === 'automate' || lower === 'retain') return 'retain'
  if (lower === 'optimise' || lower === 'optimize') return 'optimise'
  return 'all'
}

// -------------------------------------------------------------
// MAIN SERVICES INDEX PAGE COMPONENT
// -------------------------------------------------------------
export function ServicesIndex() {
  const { search, hash } = useRouter()

  usePageMeta({
    title: 'Services: Digital Revenue & Growth Solutions | Chazon Digital',
    description:
      'Explore Chazon’s 10 core digital solutions across website development, SEO, digital marketing, paid ads, and automation — connected into one growth system.',
    path: '/services',
    schema: breadcrumbSchema([['Services', '/services']]),
  })

  // Category filter state for Section 3 (Service Grid)
  const [activeFilter, setActiveFilter] = useState<CategoryFilterType>(() => {
    if (typeof window === 'undefined') return 'all'
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category') || params.get('filter') || params.get('type')
    return normalizeCategoryFilter(cat)
  })

  // Synchronise active filter and scroll when URL query params or hash change
  useEffect(() => {
    const params = new URLSearchParams(search)
    const cat = params.get('category') || params.get('filter') || params.get('type')
    if (cat) {
      const targetFilter = normalizeCategoryFilter(cat)
      setActiveFilter(targetFilter)
      const el = document.getElementById('services-grid')
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        })
      }
    } else if (hash === '#services-grid') {
      const el = document.getElementById('services-grid')
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        })
      }
    }
  }, [search, hash])

  const handleFilterClick = (tabId: CategoryFilterType) => {
    setActiveFilter(tabId)
    track('services_filter_tab_click', { category: tabId })
    if (typeof window !== 'undefined') {
      const newUrl = tabId === 'all' ? '/services#services-grid' : `/services?category=${tabId}#services-grid`
      window.history.replaceState(null, '', newUrl)
    }
  }

  // Interactive framework stage selection
  const [activeStageId, setActiveStageId] = useState('discover')

  // Active connected engine
  const [activeEngineId, setActiveEngineId] = useState('organic')

  // Filtered services list
  const filteredServices = ALL_10_SERVICES.filter((s) => s.categoryFilters.includes(activeFilter))

  // Active framework stage definition
  const currentStage = FRAMEWORK_STAGES.find((s) => s.id === activeStageId) || FRAMEWORK_STAGES[0]

  // Smooth scroll helper
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <PageShell>
      <div className="services-page-root">
        {/* =========================================================
            SECTION 1: SERVICES HERO & VALUE PROPOSITION
            ========================================================= */}
        <section className="services-hero-section surface-cream" id="services-hero">
          <div className="container">
            {/* Breadcrumb Navigation */}
            <nav className="services-breadcrumb" aria-label="Breadcrumb">
              <span className="services-breadcrumb-diamond" aria-hidden="true">❖</span>
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-sep" aria-hidden="true">&gt;</span>
              <span className="breadcrumb-current">Services</span>
            </nav>

            <div className="services-hero-grid">
              {/* Left Column: Heading & Introduction */}
              <div className="services-hero-copy">
                <span className="services-eyebrow">OUR SERVICES</span>
                <h1 className="services-hero-title">
                  Integrated digital solutions for{' '}
                  <span className="serif-italic-accent">real business growth.</span>
                </h1>

                <p className="services-hero-lead">
                  From building powerful websites to driving traffic, generating leads, automating customer journeys and
                  maximising revenue — Chazon brings strategy, technology and marketing together to grow your business online.
                </p>

                <div className="services-hero-actions">
                  <Link to="/contact" className="button button-primary">
                    Discuss Your Project <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => scrollTo('services-grid')}
                  >
                    See Our Services <ArrowDown size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Right Column: Premium Visual Composition */}
              <div className="services-hero-visual-col">
                <div className="services-hero-visual-frame">
                  <img
                    src="/assets/hero-laptop-desk.webp"
                    alt="Chazon business growth dashboard on laptop display"
                    className="services-hero-img"
                    width={560}
                    height={380}
                    loading="lazy"
                  />
                  <div className="services-hero-floating-badge" aria-hidden="true">
                    <span className="shfb-dot" />
                    <span className="shfb-text">Revenue-Led Growth System</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Proposition 4-Column Bar */}
            <div className="services-value-prop-bar" aria-label="Key Differentiators">
              <div className="svp-item">
                <div className="svp-icon-wrap" aria-hidden="true">
                  <Target size={20} />
                </div>
                <div className="svp-text-wrap">
                  <strong className="svp-title">Strategy Led</strong>
                  <span className="svp-desc">Goal-focused digital execution</span>
                </div>
              </div>

              <div className="svp-item">
                <div className="svp-icon-wrap" aria-hidden="true">
                  <Layers size={20} />
                </div>
                <div className="svp-text-wrap">
                  <strong className="svp-title">End-to-End</strong>
                  <span className="svp-desc">From build to growth and automation</span>
                </div>
              </div>

              <div className="svp-item">
                <div className="svp-icon-wrap" aria-hidden="true">
                  <Zap size={20} />
                </div>
                <div className="svp-text-wrap">
                  <strong className="svp-title">Revenue Focused</strong>
                  <span className="svp-desc">More visibility, leads and conversions</span>
                </div>
              </div>

              <div className="svp-item">
                <div className="svp-icon-wrap" aria-hidden="true">
                  <BarChart3 size={20} />
                </div>
                <div className="svp-text-wrap">
                  <strong className="svp-title">Measurable Results</strong>
                  <span className="svp-desc">Track, optimise and grow continuously</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: THE CHAZON GROWTH FRAMEWORK
            ========================================================= */}
        <section className="services-framework-section surface-cream-subtle" id="growth-framework">
          <div className="container">
            <div className="services-framework-head-split">
              <div className="sfh-left">
                <span className="services-eyebrow">THE CHAZON GROWTH FRAMEWORK</span>
                <h2 className="sfh-title">
                  A connected approach to business growth.
                </h2>
                <p className="sfh-desc">
                  Our five-stage framework turns your digital presence into a revenue-generating growth engine.
                  Click each stage to see how our services interconnect.
                </p>
                <Link to="/approach" className="sfh-link">
                  Explore the Complete Framework <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>

              {/* 5-Stage Interactive Connected Journey */}
              <div className="sfh-right">
                <div className="services-framework-steps" role="tablist" aria-label="Growth Framework Stages">
                  {FRAMEWORK_STAGES.map((stg) => {
                    const StgIcon = stg.icon
                    const isSelected = activeStageId === stg.id
                    return (
                      <button
                        key={stg.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={`sfs-step-btn ${isSelected ? 'is-active' : ''}`}
                        onClick={() => setActiveStageId(stg.id)}
                      >
                        <div className="sfs-icon-circle" aria-hidden="true">
                          <StgIcon size={20} />
                        </div>
                        <strong className="sfs-step-name">{stg.name}</strong>
                        <span className="sfs-step-sub">{stg.summary}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Stage Drawer */}
            <div className="services-framework-active-card">
              <div className="sfac-left">
                <span className="sfac-pill">STAGE {currentStage.num}</span>
                <h3 className="sfac-title">{currentStage.name} — {currentStage.tagline}</h3>
                <p className="sfac-desc">{currentStage.summary}</p>
              </div>
              <div className="sfac-right">
                <span className="sfac-services-label">Key Chazon Capabilities in This Stage:</span>
                <div className="sfac-tags-row">
                  {currentStage.services.map((srv) => (
                    <span key={srv} className="sfac-tag">
                      <CheckCircle2 size={14} className="text-accent" aria-hidden="true" />
                      <span>{srv}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: EXPLORE ALL 10 SERVICES (GRID & FILTER TABS)
            ========================================================= */}
        <section className="services-ecosystem-section surface-cream" id="services-grid">
          <div className="container">
            <div className="services-ecosystem-header">
              <div className="seh-left">
                <span className="services-eyebrow">OUR SERVICE ECOSYSTEM</span>
                <h2 className="seh-title">
                  Everything you need to build, market, convert and grow online.
                </h2>
              </div>

              {/* Category Filter Tabs */}
              <div className="services-filter-tabs" role="tablist" aria-label="Filter Services">
                {(
                  [
                    { id: 'all', label: 'All Services' },
                    { id: 'build', label: 'Build' },
                    { id: 'market', label: 'Market' },
                    { id: 'convert', label: 'Convert' },
                    { id: 'retain', label: 'Retain' },
                    { id: 'optimise', label: 'Optimise' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === tab.id}
                    className={`sft-btn ${activeFilter === tab.id ? 'is-active' : ''}`}
                    onClick={() => handleFilterClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 10 Services Interactive Cards Grid */}
            <div className="services-cards-grid">
              {filteredServices.map((srv) => {
                const IconComponent = srv.icon
                return (
                  <article
                    key={srv.id}
                    className="service-overview-card"
                    onClick={() => scrollTo(`detail-${srv.id}`)}
                  >
                    <div className="soc-top">
                      <div className="soc-icon-wrap" aria-hidden="true">
                        <IconComponent size={24} />
                      </div>
                      <span className="soc-number mono">{srv.number}</span>
                    </div>

                    <h3 className="soc-title">{srv.title}</h3>
                    <p className="soc-desc">{srv.shortDesc}</p>

                    <div className="soc-footer">
                      <span className="soc-category-tag">{srv.categoryTag}</span>
                      <button
                        type="button"
                        className="soc-arrow-btn"
                        aria-label={`Explore ${srv.title} details`}
                        onClick={(e) => {
                          e.stopPropagation()
                          scrollTo(`detail-${srv.id}`)
                        }}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: DETAILED DEEP-DIVE EXPLORATION FOR ALL 10 SERVICES
            ========================================================= */}
        <section className="services-deep-dive-section surface-cream" id="services-detail">
          <div className="container">
            {/* Sticky Navigation Sub-Bar */}
            <div className="services-sticky-nav-bar" aria-label="Jump to Service Deep Dive">
              <span className="ssnb-label">Jump to Capability:</span>
              <div className="ssnb-scrollable">
                {ALL_10_SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ssnb-pill"
                    onClick={() => scrollTo(`detail-${s.id}`)}
                  >
                    <span className="mono">{s.number}</span> {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* -------------------------------------------------------------
                01. WEBSITE DEVELOPMENT (FEATURED SERVICE)
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-website-development">
              <span id="website-development" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">FEATURED SERVICE · 01</span>
                <span className="sdb-pillar-badge">Pillar: Digital Foundation</span>
              </div>

              <div className="sdb-split-layout">
                <div className="sdb-copy-col">
                  <h2 className="sdb-title">Website Development</h2>
                  <blockquote className="sdb-quote">
                    “Your business deserves more than just a website. It deserves a digital platform that works as hard as your business does.”
                  </blockquote>

                  <p className="sdb-lead-p">
                    At Chazon, we design and develop responsive, scalable and user-friendly digital platforms tailored to your business objectives.
                    Whether establishing a new brand, upgrading an existing presence, or launching a complex commerce engine, we connect strategy,
                    technology, and conversion psychology into every page.
                  </p>

                  <h3 className="sdb-sub-heading">Three Core Solution Groups:</h3>
                  <div className="sdb-solution-groups-grid">
                    {/* Group A */}
                    <div className="sdb-solution-group">
                      <strong className="ssg-title">A. Business & Commerce Platforms</strong>
                      <ul className="ssg-list">
                        <li><Check size={14} className="text-accent" /> Business & Corporate Websites</li>
                        <li><Check size={14} className="text-accent" /> E-commerce Websites & Storefronts</li>
                        <li><Check size={14} className="text-accent" /> Portfolio & Showcase Websites</li>
                        <li><Check size={14} className="text-accent" /> Booking & Appointment Websites</li>
                      </ul>
                    </div>

                    {/* Group B */}
                    <div className="sdb-solution-group">
                      <strong className="ssg-title">B. Content & Engagement Platforms</strong>
                      <ul className="ssg-list">
                        <li><Check size={14} className="text-accent" /> Blogs & News Publishing Platforms</li>
                        <li><Check size={14} className="text-accent" /> Social Media & Community Websites</li>
                        <li><Check size={14} className="text-accent" /> Educational & eLearning Platforms</li>
                        <li><Check size={14} className="text-accent" /> Entertainment & Media Portals</li>
                      </ul>
                    </div>

                    {/* Group C */}
                    <div className="sdb-solution-group">
                      <strong className="ssg-title">C. Knowledge & Purpose-Driven Platforms</strong>
                      <ul className="ssg-list">
                        <li><Check size={14} className="text-accent" /> Wikis & Informational Knowledge Hubs</li>
                        <li><Check size={14} className="text-accent" /> Nonprofit & NGO Organization Websites</li>
                      </ul>
                    </div>
                  </div>

                  <div className="sdb-value-drivers">
                    <span className="svd-title">Commercial Value Drivers Built-In:</span>
                    <div className="svd-pills">
                      <span>Sub-800ms Latency</span>
                      <span>WhatsApp Business API</span>
                      <span>CRM Lead Routing</span>
                      <span>Payment Gateways</span>
                      <span>Semantic SEO Markup</span>
                      <span>Frictionless UX</span>
                    </div>
                  </div>

                  <div className="sdb-action-row">
                    <Link
                      to="/contact?type=BUILD&service=Website%20Development"
                      className="button button-primary"
                    >
                      Get a Website Consultation <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <Link to="/#framework" className="sdb-secondary-link">
                      Explore Framework Connection →
                    </Link>
                  </div>
                </div>

                {/* Right Visual: Realistic Composition matching reference */}
                <div className="sdb-visual-col">
                  <div className="website-mockup-composition">
                    <div className="wmc-browser-window">
                      <div className="wmc-browser-bar">
                        <span className="wmc-dot red" />
                        <span className="wmc-dot yellow" />
                        <span className="wmc-dot green" />
                        <span className="wmc-browser-url">https://chazon.com/your-business</span>
                      </div>
                      <div className="wmc-browser-content">
                        <div className="wmc-hero-preview">
                          <span className="wmc-hp-tag">CHAZON ARCHITECTURE</span>
                          <h4>Build Your Digital Presence</h4>
                          <p>Engineering speed, search discoverability and conversion readiness.</p>
                        </div>
                      </div>
                    </div>

                    {/* Floating Mobile Card */}
                    <div className="wmc-floating-phone" aria-hidden="true">
                      <div className="wmc-phone-speaker" />
                      <div className="wmc-phone-product">
                        <div className="wmc-prod-img" />
                        <strong>Modern Living Chair</strong>
                        <span className="wmc-prod-price">₹14,999</span>
                        <div className="wmc-add-btn">Add to Cart</div>
                      </div>
                    </div>

                    {/* Floating Traffic Badge */}
                    <div className="wmc-traffic-badge" aria-hidden="true">
                      <TrendingUp size={20} className="text-accent" />
                      <div>
                        <strong>+74%</strong>
                        <span>Traffic & Lead Growth</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                02. DIGITAL MARKETING
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-digital-marketing">
              <span id="digital-marketing" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 02</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Digital Marketing That Drives Business Growth</h2>
                <blockquote className="sdb-quote">
                  “Connecting digital strategy, content marketing, SEO, performance advertising, social media, e-commerce and business automation into one growth system.”
                </blockquote>

                <p className="sdb-lead-p">
                  Digital marketing should not be an isolated series of disjointed activities. At Chazon, we build cohesive marketing engines
                  that strengthen your brand presence, attract relevant prospective buyers, build trust, and increase customer acquisition.
                </p>

                <h3 className="sdb-sub-heading">The Five Core Strategic Focus Areas:</h3>
                <div className="five-focus-grid">
                  <div className="ffg-card">
                    <span className="ffg-num mono">01</span>
                    <strong className="ffg-title">Make Your Brand Discoverable</strong>
                    <p className="ffg-desc">Establish high-intent visibility so customers discover your brand when searching for solutions.</p>
                  </div>
                  <div className="ffg-card">
                    <span className="ffg-num mono">02</span>
                    <strong className="ffg-title">Make Your Proposition Compelling</strong>
                    <p className="ffg-desc">Position your unique value proposition clearly to resolve buyer hesitations and build authority.</p>
                  </div>
                  <div className="ffg-card">
                    <span className="ffg-num mono">03</span>
                    <strong className="ffg-title">Make Customer Acquisition More Effective</strong>
                    <p className="ffg-desc">Reach targeted decision-makers and buyers across multi-channel paid and organic pipelines.</p>
                  </div>
                  <div className="ffg-card">
                    <span className="ffg-num mono">04</span>
                    <strong className="ffg-title">Make Conversions Easier</strong>
                    <p className="ffg-desc">Streamline landing page journeys, contact pathways, and checkout touchpoints to remove friction.</p>
                  </div>
                  <div className="ffg-card">
                    <span className="ffg-num mono">05</span>
                    <strong className="ffg-title">Make Business Growth Measurable</strong>
                    <p className="ffg-desc">Track real-time commercial attribution, cost per acquisition (CAC), and customer lifetime value.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=Digital%20Marketing"
                    className="button button-primary"
                  >
                    Plan Your Marketing Strategy <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/services/digital-marketing" className="sdb-secondary-link">
                    View Dedicated Service Page →
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                03. SEARCH ENGINE OPTIMISATION (SEO)
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-seo-services">
              <span id="seo-services" className="scroll-anchor" />
              <span id="search-engine-optimisation" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 03</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Search Engine Optimisation (SEO)</h2>
                <blockquote className="sdb-quote">
                  “Be Found. Get Discovered. Grow Organically.”
                </blockquote>

                <p className="sdb-lead-p">
                  SEO is not about chasing algorithmic tricks. It is about aligning your technical platform and content architecture
                  with real human search intent. Chazon delivers 8 specialized SEO capabilities that establish organic authority and capture ready-to-buy customer demand.
                </p>

                <h3 className="sdb-sub-heading">Our Eight Specialized SEO Capabilities:</h3>
                <div className="eight-seo-grid">
                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">01</span>
                      <strong>SEO Audit & Strategy</strong>
                    </div>
                    <p>Deep diagnostic of crawling bottlenecks, indexation leaks, architectural flaws, and competitor gap opportunities.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">02</span>
                      <strong>Keyword Research & Search Intent</strong>
                    </div>
                    <p>Mapping commercial, transactional, and informational search intent to prioritize high-converting keywords.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">03</span>
                      <strong>On-Page & Technical SEO</strong>
                    </div>
                    <p>Core Web Vitals optimisation, structured schema.org markup, semantic HTML, canonical tagging, and internal linking.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">04</span>
                      <strong>Off-Page SEO & Link Building</strong>
                    </div>
                    <p>High-authority editorial backlink acquisition, digital PR, industry citations, and brand mentions that build domain authority.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">05</span>
                      <strong>Content Optimisation & Blog Strategy</strong>
                    </div>
                    <p>Topical cluster architecture, evergreen resource guides, search intent matching, and featured snippet capture.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">06</span>
                      <strong>Local SEO & Google Business Profile</strong>
                    </div>
                    <p>Google Maps 3-Pack rankings, local citation consistency (NAP), customer review workflows, and hyper-local discoverability.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">07</span>
                      <strong>E-commerce SEO</strong>
                    </div>
                    <p>Product schema integration, category page architecture, faceted navigation crawl budget optimization, and brand search capture.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">08</span>
                      <strong>Performance Monitoring & Reporting</strong>
                    </div>
                    <p>Transparent ranking progress, organic impression growth, lead attribution, and commercial conversion dashboards.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=SEO"
                    className="button button-primary"
                  >
                    Grow Your Search Rankings <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/services/seo-services" className="sdb-secondary-link">
                    View Dedicated SEO Page →
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                04. CONTENT MARKETING
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-content-marketing">
              <span id="content-marketing" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 04</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Content Marketing That Connects with Commercial Goals</h2>
                <blockquote className="sdb-quote">
                  “Content marketing is not just about creating attractive posts. It is about connecting communication with commercial objectives.”
                </blockquote>

                <p className="sdb-lead-p">
                  Every piece of content must earn its place by advancing a buyer journey. We engineer content assets that resolve objections,
                  educate decision-makers, and establish unquestioned category authority.
                </p>

                <h3 className="sdb-sub-heading">The Five Principles of Commercial Content:</h3>
                <div className="principles-horizontal-grid">
                  <div className="phg-item">
                    <span className="phg-num mono">01</span>
                    <strong>Strategy Before Creativity</strong>
                    <p>No arbitrary publishing. Content topics are mapped directly to customer commercial inquiries and search demand.</p>
                  </div>

                  <div className="phg-item">
                    <span className="phg-num mono">02</span>
                    <strong>Audience-First Communication</strong>
                    <p>Speak in the language of your buyer’s real challenges, eliminating industry jargon in favor of direct clarity.</p>
                  </div>

                  <div className="phg-item">
                    <span className="phg-num mono">03</span>
                    <strong>Consistent Brand Positioning</strong>
                    <p>A unified voice and aesthetic standard across website articles, whitepapers, social media and sales collateral.</p>
                  </div>

                  <div className="phg-item">
                    <span className="phg-num mono">04</span>
                    <strong>Integrated Digital Marketing</strong>
                    <p>One core content asset fuels SEO rankings, social discussions, paid ad copy, email nurture, and sales outreach.</p>
                  </div>

                  <div className="phg-item">
                    <span className="phg-num mono">05</span>
                    <strong>Revenue-Led Execution</strong>
                    <p>Every asset includes clear, frictionless calls-to-action guiding the reader toward the next natural commercial step.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=Content%20Marketing"
                    className="button button-primary"
                  >
                    Develop a Content Strategy <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                05. SOCIAL MEDIA MARKETING
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-social-media-marketing">
              <span id="social-media-marketing" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 05</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Social Media Marketing</h2>
                <blockquote className="sdb-quote">
                  “Transforming social media platforms into brand-building and customer-acquisition channels.”
                </blockquote>

                <p className="sdb-lead-p">
                  We move beyond superficial engagement metrics. Chazon leverages social platforms to build brand equity,
                  establish executive thought leadership, and drive qualified inquiries directly into your sales pipeline.
                </p>

                <h3 className="sdb-sub-heading">Platform Execution Matrix:</h3>
                <div className="platforms-cards-grid">
                  <div className="pcm-card">
                    <strong className="pcm-title">Facebook</strong>
                    <span className="pcm-role">Community & Precision Retargeting</span>
                    <p>Targeted local community building, event engagement, customer reviews, and high-ROI retargeting funnels.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">Instagram</strong>
                    <span className="pcm-role">Visual Storytelling & Direct Inquiries</span>
                    <p>Brand aesthetics, product showcase reels, behind-the-scenes founder storytelling, and automated DM lead workflows.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">LinkedIn</strong>
                    <span className="pcm-role">B2B Authority & Decision-Maker Reach</span>
                    <p>Executive profiling, corporate thought leadership, industry point-of-view commentary, and B2B pipeline development.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">YouTube</strong>
                    <span className="pcm-role">Evergreen Authority & Video SEO</span>
                    <p>Long-form educational walkthroughs, customer case interviews, and video search discoverability that compounds over time.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=Social%20Media%20Marketing"
                    className="button button-primary"
                  >
                    Scale Your Social Reach <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                06. PAY-PER-CLICK ADVERTISING (PPC)
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-ppc-advertising">
              <span id="ppc-advertising" className="scroll-anchor" />
              <span id="pay-per-click-advertising" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 06</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Pay-Per-Click Advertising (PPC)</h2>
                <blockquote className="sdb-quote">
                  “Reach the right audience. Drive qualified traffic. Convert clicks into customers.”
                </blockquote>

                <p className="sdb-lead-p">
                  PPC is the fastest way to validate demand and scale customer acquisition when managed with rigorous financial discipline.
                  We focus on cost-per-acquisition (CPA) and customer lifetime value (LTV) rather than vanity click volume.
                </p>

                <h3 className="sdb-sub-heading">End-to-End Paid Advertising Capabilities:</h3>
                <div className="eight-seo-grid">
                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">01</span>
                      <strong>Audience & Intent Targeting</strong>
                    </div>
                    <p>Pinpointing high-value customer demographics, job titles, search intent signals, and custom in-market segments.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">02</span>
                      <strong>Multi-Network Strategy</strong>
                    </div>
                    <p>Deploying budget across Google Search, Display, YouTube, Meta (Facebook/Instagram), and LinkedIn for unified coverage.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">03</span>
                      <strong>Ad Copy & Creative Production</strong>
                    </div>
                    <p>Developing compelling hook copy, benefit-led messaging, high-contrast visual creative, and persuasive calls-to-action.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">04</span>
                      <strong>Landing Page Optimisation</strong>
                    </div>
                    <p>Ensuring message match between ad copy and landing page headlines to maximize conversion rate and quality score.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">05</span>
                      <strong>Bid Management & Testing</strong>
                    </div>
                    <p>Algorithmic smart bidding, continuous A/B split testing of ad creative, and proactive negative keyword exclusion.</p>
                  </div>

                  <div className="seo-item-card">
                    <div className="sic-head">
                      <span className="sic-num mono">06</span>
                      <strong>Closed-Loop Attribution</strong>
                    </div>
                    <p>Server-side tracking, UTM standardization, and CRM integration to attribute closed revenue directly to campaign origin.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=PPC%20Advertising"
                    className="button button-primary"
                  >
                    Launch a PPC Campaign <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                07. GOOGLE ADS
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-google-ads">
              <span id="google-ads" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 07</span>
                <span className="sdb-pillar-badge">Pillar: Digital Growth</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Google Ads (Dedicated Capability)</h2>
                <blockquote className="sdb-quote">
                  “Capture high-intent customer demand at the exact moment of search.”
                </blockquote>

                <p className="sdb-lead-p">
                  Google Ads is a specialized ecosystem requiring dedicated algorithmic management. We engineer campaigns across
                  Google’s full inventory to place your business at the pinnacle of relevant search results.
                </p>

                <h3 className="sdb-sub-heading">Specialized Google Campaign Types:</h3>
                <div className="five-focus-grid">
                  <div className="ffg-card">
                    <span className="ffg-num mono">01</span>
                    <strong className="ffg-title">Google Search Ads</strong>
                    <p className="ffg-desc">Direct text ads displayed to buyers actively querying your products, services, or category competitors.</p>
                  </div>

                  <div className="ffg-card">
                    <span className="ffg-num mono">02</span>
                    <strong className="ffg-title">Performance Max (PMax)</strong>
                    <p className="ffg-desc">AI-driven cross-network automation allocating budget across Search, YouTube, Display, Maps, and Discover.</p>
                  </div>

                  <div className="ffg-card">
                    <span className="ffg-num mono">03</span>
                    <strong className="ffg-title">Shopping Campaigns</strong>
                    <p className="ffg-desc">Direct product feed integrations with pricing, stock status, and imagery for high-converting e-commerce sales.</p>
                  </div>

                  <div className="ffg-card">
                    <span className="ffg-num mono">04</span>
                    <strong className="ffg-title">Display Advertising</strong>
                    <p className="ffg-desc">Visual banner impressions across millions of partner websites, targeted by topic, placement, and custom intent.</p>
                  </div>

                  <div className="ffg-card">
                    <span className="ffg-num mono">05</span>
                    <strong className="ffg-title">YouTube Video Ads</strong>
                    <p className="ffg-desc">Targeted skippable and in-feed video ads reaching prospects consuming relevant industry and competitor content.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=Google%20Ads"
                    className="button button-primary"
                  >
                    Optimize Your Google Ads <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                08. EMAIL MARKETING
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-email-marketing">
              <span id="email-marketing" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 08</span>
                <span className="sdb-pillar-badge">Pillar: Automation & Retention</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Email Marketing</h2>
                <blockquote className="sdb-quote">
                  “Turn Customer Connections into Business Growth.”
                </blockquote>

                <p className="sdb-lead-p">
                  Email remains the highest-ROI digital channel when treated as a personalized, lifecycle relationship tool.
                  Chazon designs and automates email systems that nurture leads, onboard clients, recover abandoned carts, and maximize customer lifetime value (LTV).
                </p>

                <h3 className="sdb-sub-heading">Nine Core Email Capabilities We Provide:</h3>
                <div className="nine-caps-grid">
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Editorial Industry Newsletters</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Promotional Campaign Blasts</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Automated Welcome Customer Journeys</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Multi-Stage B2B Lead Nurturing</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Behavioral Customer Segmentation</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Dynamic Personalized Content</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Automated Re-engagement & Follow-ups</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Post-Purchase & Loyalty Sequences</span></div>
                  <div className="nc-item"><Check size={16} className="text-accent" /><span>Revenue & Open-Rate Analytics</span></div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=AUTOMATE&service=Email%20Marketing"
                    className="button button-primary"
                  >
                    Automate Your Email Marketing <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                09. AFFILIATE & INFLUENCER MARKETING
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-affiliate-influencer-marketing">
              <span id="affiliate-influencer-marketing" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 09</span>
                <span className="sdb-pillar-badge">Pillar: Revenue & Commerce</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">Affiliate & Influencer Marketing</h2>
                <blockquote className="sdb-quote">
                  “Turn Influence Into Revenue.”
                </blockquote>

                <p className="sdb-lead-p">
                  Consumers trust people over corporate advertising. Chazon establishes verified, performance-oriented creator partnerships
                  and affiliate ecosystems that generate authentic third-party endorsements and measurable commercial transactions.
                </p>

                <h3 className="sdb-sub-heading">What Chazon Provides:</h3>
                <div className="creator-partnership-flow">
                  <div className="cpf-step">
                    <span className="cpf-num mono">01</span>
                    <strong>Creator Identification</strong>
                    <p>Sourcing brand representatives whose audience demographics, values, and engagement rates match your target buyers.</p>
                  </div>
                  <div className="cpf-step">
                    <span className="cpf-num mono">02</span>
                    <strong>Credibility Vetting</strong>
                    <p>Auditing creator authenticity, fake follower ratios, comment sentiment, and previous brand collaboration track records.</p>
                  </div>
                  <div className="cpf-step">
                    <span className="cpf-num mono">03</span>
                    <strong>Scalable Contracts</strong>
                    <p>Structuring fair, performance-driven partnership agreements with defined deliverables, usage rights, and tracking codes.</p>
                  </div>
                  <div className="cpf-step">
                    <span className="cpf-num mono">04</span>
                    <strong>Affiliate Infrastructure</strong>
                    <p>Setting up dedicated affiliate portals, unique tracking links, cookie attribution windows, and automated commission payouts.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=GROW&service=Affiliate%20%26%20Influencer%20Marketing"
                    className="button button-primary"
                  >
                    Explore Creator Partnerships <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {/* -------------------------------------------------------------
                10. UI/UX DESIGN
                ------------------------------------------------------------- */}
            <article className="service-detail-block" id="detail-ui-ux-design">
              <span id="ui-ux-design" className="scroll-anchor" />
              <div className="sdb-head-meta">
                <span className="sdb-eyebrow">SERVICE · 10</span>
                <span className="sdb-pillar-badge">Pillar: Digital Foundation</span>
              </div>

              <div className="sdb-wide-layout">
                <h2 className="sdb-title">UI/UX Design</h2>
                <blockquote className="sdb-quote">
                  “Designing Experiences That Drive Engagement and Growth.”
                </blockquote>

                <p className="sdb-lead-p">
                  Good digital design goes far beyond visual aesthetics. It is the science of removing cognitive friction, guiding attention,
                  and making user navigation intuitive. Every wireframe and interface element Chazon designs is engineered around commercial outcomes.
                </p>

                <h3 className="sdb-sub-heading">Platforms & Touchpoints Covered:</h3>
                <div className="platforms-cards-grid">
                  <div className="pcm-card">
                    <strong className="pcm-title">Corporate Websites</strong>
                    <p>Clear narrative structures, trust-building typography, and intuitive service discovery for business leaders.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">E-commerce Platforms</strong>
                    <p>Frictionless cart ergonomics, streamlined 1-click checkouts, product zoom interfaces, and conversion triggers.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">Mobile Applications</strong>
                    <p>Touch-target ergonomics, native gesture navigation, offline-friendly states, and mobile accessibility standards.</p>
                  </div>

                  <div className="pcm-card">
                    <strong className="pcm-title">Dashboards & Portals</strong>
                    <p>Data visualization clarity, role-based workflows, high-contrast information density, and user task efficiency.</p>
                  </div>
                </div>

                <div className="sdb-action-row" style={{ marginTop: '28px' }}>
                  <Link
                    to="/contact?type=BUILD&service=UI%2FUX%20Design"
                    className="button button-primary"
                  >
                    Design for Conversion <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/services/ui-ux-design" className="sdb-secondary-link">
                    View Dedicated UI/UX Page →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* =========================================================
            SECTION 5: HOW OUR SERVICES WORK TOGETHER (CONNECTED ECOSYSTEM)
            ========================================================= */}
        <section className="services-ecosystem-interplay surface-cream-subtle" id="ecosystem-interplay">
          <div className="container">
            <div className="sei-head-center">
              <span className="services-eyebrow">CONNECTED GROWTH ECOSYSTEM</span>
              <h2 className="sei-title">
                How Our Services Work Together
              </h2>
              <p className="sei-desc">
                No single digital channel works in a silo. We connect capabilities into unified commercial engines
                tailored to your business stage and growth objectives.
              </p>
            </div>

            {/* Engine Tabs */}
            <div className="sei-tabs-row" role="tablist" aria-label="Connected Growth Engines">
              {CONNECTED_ENGINES.map((eng) => (
                <button
                  key={eng.id}
                  type="button"
                  role="tab"
                  aria-selected={activeEngineId === eng.id}
                  className={`sei-tab-btn ${activeEngineId === eng.id ? 'is-active' : ''}`}
                  onClick={() => setActiveEngineId(eng.id)}
                >
                  <span className="sei-tab-badge mono">{eng.badge}</span>
                  <span className="sei-tab-name">{eng.title}</span>
                </button>
              ))}
            </div>

            {/* Engine Display Card */}
            {(() => {
              const eng = CONNECTED_ENGINES.find((e) => e.id === activeEngineId) || CONNECTED_ENGINES[0]
              return (
                <div className="sei-active-card">
                  <div className="sei-card-top">
                    <span className="sei-badge-accent">{eng.badge}</span>
                    <h3 className="sei-card-title">{eng.title}</h3>
                    <div className="sei-services-formula">
                      <Sparkles size={16} className="text-accent" aria-hidden="true" />
                      <strong>Formula:</strong> <span>{eng.services}</span>
                    </div>
                  </div>

                  <p className="sei-card-desc">{eng.description}</p>

                  <div className="sei-card-impact">
                    <strong>Commercial Business Impact:</strong>
                    <span>{eng.impact}</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </section>

        {/* =========================================================
            SECTION 6: OUR DELIVERY PROCESS
            ========================================================= */}
        <section className="services-delivery-process surface-cream" id="delivery-process">
          <div className="container">
            <div className="sdp-header">
              <span className="services-eyebrow">HOW WE DELIVER</span>
              <h2 className="sdp-title">
                A clear, outcome-driven process.
              </h2>
              <p className="sdp-desc">
                From understanding your business to continuous optimisation, we follow a transparent six-stage process that delivers results.
              </p>
            </div>

            <div className="sdp-timeline-grid">
              {DELIVERY_STAGES.map((stg) => (
                <div key={stg.num} className="sdp-step-card">
                  <div className="sdp-num-badge mono">{stg.num}</div>
                  <h3 className="sdp-step-name">{stg.name}</h3>
                  <strong className="sdp-step-lead">{stg.lead}</strong>
                  <p className="sdp-step-detail">{stg.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 7: DARK CONTRAST CONVERSION BANNER
            ========================================================= */}
        <section className="services-conversion-banner" aria-labelledby="scb-headline">
          <div className="container scb-inner">
            <div className="scb-copy">
              <h2 id="scb-headline" className="scb-title">
                Let’s turn your goals into <span className="serif-italic-accent">measurable growth.</span>
              </h2>
              <p className="scb-sub">
                Discuss your requirements with the Chazon team and get a tailored digital growth plan for your business.
              </p>
            </div>
            <div className="scb-action">
              <Link to="/contact" className="button button-primary">
                Get in Touch <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 8: EXPLORE MORE SERVICES / SPOTLIGHT CARDS
            ========================================================= */}
        <section className="services-spotlight-section surface-cream" aria-labelledby="spotlight-heading">
          <div className="container">
            <span className="services-eyebrow">EXPLORE MORE SERVICES</span>
            <h2 id="spotlight-heading" className="spotlight-section-title">
              Deepen Your Capabilities
            </h2>

            <div className="services-spotlight-grid">
              {/* Card 1 */}
              <article className="spotlight-card">
                <div className="spotlight-img-frame">
                  <picture>
                    <source srcSet="/assets/about-team-story.webp" type="image/webp" />
                    <img
                      src="/assets/about-team-story.png"
                      alt="Strategic Digital Marketing at Chazon"
                      className="spotlight-img"
                      width={380}
                      height={220}
                      loading="lazy"
                    />
                  </picture>
                  <span className="spotlight-badge">Digital Growth</span>
                </div>
                <div className="spotlight-body">
                  <h3 className="spotlight-title">Digital Marketing</h3>
                  <p className="spotlight-desc">
                    Grow your brand, reach and revenue with a complete full-funnel digital strategy and continuous attribution.
                  </p>
                  <Link
                    to="/services/digital-marketing"
                    className="spotlight-link"
                    onClick={() => scrollTo('detail-digital-marketing')}
                  >
                    <span>Explore Digital Marketing</span> <ArrowRight size={16} />
                  </Link>
                </div>
              </article>

              {/* Card 2 */}
              <article className="spotlight-card">
                <div className="spotlight-img-frame">
                  <picture>
                    <source srcSet="/assets/service-seo-spotlight.webp" type="image/webp" />
                    <img
                      src="/assets/service-seo-spotlight.jpg"
                      alt="Search Engine Optimisation analytics and growth performance at Chazon"
                      className="spotlight-img"
                      width={380}
                      height={220}
                      loading="lazy"
                    />
                  </picture>
                  <span className="spotlight-badge">Organic Authority</span>
                </div>
                <div className="spotlight-body">
                  <h3 className="spotlight-title">Search Engine Optimisation</h3>
                  <p className="spotlight-desc">
                    Improve visibility, rankings and organic traffic for sustainable long-term commercial discoverability.
                  </p>
                  <Link
                    to="/services/seo-services"
                    className="spotlight-link"
                    onClick={() => scrollTo('detail-seo-services')}
                  >
                    <span>Explore SEO Capabilities</span> <ArrowRight size={16} />
                  </Link>
                </div>
              </article>

              {/* Card 3 */}
              <article className="spotlight-card">
                <div className="spotlight-img-frame">
                  <picture>
                    <source srcSet="/assets/about-hero-studio.webp" type="image/webp" />
                    <img
                      src="/assets/about-hero-studio.jpg"
                      alt="UI/UX design wireframing, architecture, and prototype craft at Chazon"
                      className="spotlight-img"
                      width={380}
                      height={220}
                      loading="lazy"
                    />
                  </picture>
                  <span className="spotlight-badge">User Experience</span>
                </div>
                <div className="spotlight-body">
                  <h3 className="spotlight-title">UI/UX Design</h3>
                  <p className="spotlight-desc">
                    Create intuitive, engaging and conversion-focused digital experiences that reduce customer drop-off.
                  </p>
                  <Link
                    to="/services/ui-ux-design"
                    className="spotlight-link"
                    onClick={() => scrollTo('detail-ui-ux-design')}
                  >
                    <span>Explore UI/UX Design</span> <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}

// -------------------------------------------------------------
// INDIVIDUAL PILLAR PAGE VIEW (PRESERVED FOR DEDICATED PILLAR ROUTES)
// -------------------------------------------------------------
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

  const contact = `/contact?type=${encodeURIComponent(p.key)}&service=${encodeURIComponent(p.slug)}`

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
