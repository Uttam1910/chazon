import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Facebook,
  Filter,
  Instagram,
  Laptop,
  Layers,
  Linkedin,
  Mail,
  Megaphone,
  Menu,
  Phone,
  TrendingUp,
  X,
} from 'lucide-react'
import { track, type Channel } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { useSite } from '../site-data'

/** 5 Service Categories for Horizontal Mega-Menu */
export const SERVICE_CATEGORIES = [
  {
    id: 'build' as const,
    label: 'Build',
    subtitle: 'Websites & Digital Platforms',
    icon: Laptop,
    eyebrow: 'BUILD',
    title: 'Websites & Digital Platforms',
    description:
      'Design and develop responsive, scalable and business-focused digital platforms that generate leads, sales and growth.',
    primaryCta: {
      label: 'Explore Website Development',
      to: '/services/website-development',
    },
    exploreHeading: 'EXPLORE BUILD SERVICES',
    services: [
      { label: 'Business & Corporate Websites', to: '/services/website-development' },
      { label: 'E-commerce Websites', to: '/services/ecommerce-development' },
      { label: 'Portfolio Websites', to: '/services/website-development' },
      { label: 'Booking & Appointment Websites', to: '/services/website-development' },
      { label: 'Blogs & Content Platforms', to: '/services/website-development' },
      { label: 'Educational & eLearning Websites', to: '/services/website-development' },
      { label: 'Community & Membership Platforms', to: '/services/website-development' },
      { label: 'Nonprofit & NGO Websites', to: '/services/website-development' },
    ],
    related: [
      { label: 'UI/UX Design', to: '/services/ui-ux-design' },
      { label: 'SEO', to: '/services/seo-services' },
      { label: 'Content Marketing', to: '/services/content-marketing' },
    ],
  },
  {
    id: 'market' as const,
    label: 'Market',
    subtitle: 'Reach, Promote & Grow',
    icon: Megaphone,
    eyebrow: 'MARKET',
    title: 'Reach, Promote & Grow',
    description:
      'Build brand visibility, attract relevant audiences and generate business opportunities through integrated digital marketing.',
    primaryCta: {
      label: 'Explore Digital Marketing',
      to: '/services/digital-marketing',
    },
    exploreHeading: 'EXPLORE MARKET SERVICES',
    services: [
      { label: 'Digital Marketing', to: '/services/digital-marketing' },
      { label: 'Search Engine Optimisation (SEO)', to: '/services/seo-services' },
      { label: 'Content Marketing', to: '/services/content-marketing' },
      { label: 'Social Media Marketing', to: '/services/social-media-marketing' },
      { label: 'Pay-Per-Click Advertising', to: '/services/ppc-advertising' },
      { label: 'Google Ads', to: '/services/google-ads' },
      { label: 'Affiliate & Influencer Marketing', to: '/services/affiliate-influencer-marketing' },
      { label: 'Local SEO & Search Authority', to: '/services/local-seo' },
    ],
    related: [
      { label: 'Website Development', to: '/services/website-development' },
      { label: 'UI/UX Design', to: '/services/ui-ux-design' },
      { label: 'Email Marketing', to: '/services/email-marketing' },
    ],
  },
  {
    id: 'convert' as const,
    label: 'Convert',
    subtitle: 'Turn Interest into Sales',
    icon: Filter,
    eyebrow: 'CONVERT',
    title: 'Turn Interest into Sales',
    description:
      'Create effective digital experiences that turn visitors and interested audiences into enquiries and customers.',
    primaryCta: {
      label: 'Explore Conversion Solutions',
      to: '/services/landing-page-development',
    },
    exploreHeading: 'EXPLORE CONVERSION CAPABILITIES',
    services: [
      { label: 'UI/UX Design & Prototyping', to: '/services/ui-ux-design' },
      { label: 'High-Converting Landing Pages', to: '/services/landing-page-development' },
      { label: 'E-commerce Sales Optimisation', to: '/services/ecommerce-development' },
      { label: 'Conversion Rate Optimisation (CRO)', to: '/services/conversion-optimisation' },
      { label: 'Lead Capture & Enquiry Systems', to: '/contact?type=CONVERT' },
      { label: 'User Journey Wireframing', to: '/services/ui-ux-design' },
      { label: 'Value Proposition Architecture', to: '/services/content-marketing' },
      { label: 'Friction-Free Checkout Flows', to: '/services/ecommerce-development' },
    ],
    related: [
      { label: 'Website Development', to: '/services/website-development' },
      { label: 'Google Ads', to: '/services/google-ads' },
      { label: 'Email Marketing', to: '/services/email-marketing' },
    ],
  },
  {
    id: 'automate' as const,
    label: 'Automate',
    subtitle: 'Engage, Nurture & Retain',
    icon: Layers,
    eyebrow: 'AUTOMATE',
    title: 'Engage, Nurture & Retain',
    description:
      'Build stronger customer relationships through connected communication, follow-ups and automation.',
    primaryCta: {
      label: 'Explore Automation Solutions',
      to: '/services/business-automation',
    },
    exploreHeading: 'EXPLORE AUTOMATION CAPABILITIES',
    services: [
      { label: 'WhatsApp Business API Integration', to: '/contact?type=AUTOMATE&service=WhatsApp%20Business%20API' },
      { label: 'CRM Integration & Lead Routing', to: '/services/business-automation' },
      { label: 'Email Marketing & Newsletters', to: '/services/email-marketing' },
      { label: 'Automated Welcome Journeys', to: '/services/email-marketing' },
      { label: 'Abandoned Cart Re-engagement', to: '/services/email-marketing' },
      { label: 'Multi-Channel Follow-Up Automation', to: '/services/business-automation' },
      { label: 'Customer Data & Lifecycle Triggers', to: '/services/business-automation' },
      { label: 'AI & Workflow Automation', to: '/services/ai-integration' },
    ],
    related: [
      { label: 'Email Marketing', to: '/services/email-marketing' },
      { label: 'Website Development', to: '/services/website-development' },
      { label: 'Digital Marketing', to: '/services/digital-marketing' },
    ],
  },
  {
    id: 'optimise' as const,
    label: 'Optimise',
    subtitle: 'Improve Performance & ROI',
    icon: TrendingUp,
    eyebrow: 'OPTIMISE',
    title: 'Improve Performance & ROI',
    description:
      'Understand performance, improve digital experiences and continuously strengthen business results.',
    primaryCta: {
      label: 'Run Free Website Audit',
      to: '/website-audit',
    },
    exploreHeading: 'EXPLORE OPTIMISATION CAPABILITIES',
    services: [
      { label: 'Instant Website Performance Audit', to: '/website-audit' },
      { label: 'SEO Performance Monitoring', to: '/services/seo-services' },
      { label: 'Speed & Core Web Vitals Audit', to: '/website-audit' },
      { label: 'Analytics & Closed-Loop Attribution', to: '/services/digital-marketing' },
      { label: 'Conversion Funnel Auditing', to: '/services/conversion-optimisation' },
      { label: 'Campaign ROI & Ad Performance', to: '/services/ppc-advertising' },
      { label: 'Local Search Visibility Audit', to: '/services/local-seo' },
      { label: 'Growth Diagnostic Review', to: '/growth-audit' },
    ],
    related: [
      { label: 'Search Engine Optimisation', to: '/services/seo-services' },
      { label: 'Conversion Optimisation', to: '/services/conversion-optimisation' },
      { label: 'Digital Marketing', to: '/services/digital-marketing' },
    ],
  },
]

type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]['id']

/** Visual graphic for the center column of the mega-menu */
function MegaMenuVisual({ category }: { category: ServiceCategoryId }) {
  if (category === 'build') {
    return (
      <div className="mm-visual-card mm-visual-build">
        <div className="mm-browser-mockup">
          <div className="mm-browser-header">
            <div className="mm-browser-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="mm-browser-url">chazon.digital/platform</span>
          </div>
          <div className="mm-browser-screen">
            <div className="mm-screen-mountain-bg" />
            <div className="mm-screen-content">
              <span className="mm-screen-tag">Chazon Architecture</span>
              <strong className="mm-screen-heading">Build Your Digital Presence</strong>
              <p className="mm-screen-sub">Fast, responsive & commercial</p>
            </div>
          </div>
        </div>
        <div className="mm-floating-phone">
          <div className="mm-phone-notch" />
          <div className="mm-phone-card">
            <span className="mm-phone-img-box">🛋️</span>
            <span className="mm-phone-title">Modern Living</span>
            <span className="mm-phone-price">₹14,500</span>
            <span className="mm-phone-btn">Add to Cart</span>
          </div>
        </div>
        <div className="mm-floating-badge">
          <span className="mm-fb-icon">↗</span>
          <div>
            <strong>+74%</strong>
            <small>Traffic Growth</small>
          </div>
        </div>
      </div>
    )
  }

  if (category === 'market') {
    return (
      <div className="mm-visual-card mm-visual-market">
        <div className="mm-market-mockup">
          <div className="mm-search-bar-sim">
            <span className="mm-search-sim-icon">🔍</span>
            <span>google.com/search?q=revenue+growth</span>
          </div>
          <div className="mm-search-result-pill">
            <span className="mm-rank-badge">#1 Google Ranking</span>
            <strong>Chazon Digital Ventures</strong>
            <small>Integrated organic visibility & commercial intent</small>
          </div>
          <div className="mm-bars-preview">
            <div className="mm-bar" style={{ height: '35%' }} />
            <div className="mm-bar" style={{ height: '55%' }} />
            <div className="mm-bar" style={{ height: '75%' }} />
            <div className="mm-bar accent" style={{ height: '100%' }} />
          </div>
        </div>
        <div className="mm-floating-badge">
          <span className="mm-fb-icon">↗</span>
          <div>
            <strong>+68%</strong>
            <small>Organic Reach</small>
          </div>
        </div>
      </div>
    )
  }

  if (category === 'convert') {
    return (
      <div className="mm-visual-card mm-visual-convert">
        <div className="mm-convert-mockup">
          <div className="mm-wireframe-head">
            <span className="mm-wf-line title" />
            <span className="mm-wf-line sub" />
          </div>
          <div className="mm-wf-cta-pill">Request Strategic Proposal →</div>
          <div className="mm-wf-trust-row">
            <span className="mm-wf-pill">✓ Sub-600ms Speed</span>
            <span className="mm-wf-pill">✓ Friction-Free UX</span>
          </div>
        </div>
        <div className="mm-floating-badge">
          <span className="mm-fb-icon">🎯</span>
          <div>
            <strong>+42%</strong>
            <small>Conversion Rate</small>
          </div>
        </div>
      </div>
    )
  }

  if (category === 'automate') {
    return (
      <div className="mm-visual-card mm-visual-automate">
        <div className="mm-automate-mockup">
          <div className="mm-wa-bubble">
            <span className="mm-wa-head">WhatsApp Business API</span>
            <p>“New website enquiry received. Welcome sequence launched.”</p>
          </div>
          <div className="mm-crm-bubble">
            <span className="mm-crm-head">HubSpot CRM Sync</span>
            <p>Lead tagged, assigned & notification dispatched.</p>
          </div>
        </div>
        <div className="mm-floating-badge">
          <span className="mm-fb-icon">⚡</span>
          <div>
            <strong>24/7</strong>
            <small>Automated Pipeline</small>
          </div>
        </div>
      </div>
    )
  }

  // optimise
  return (
    <div className="mm-visual-card mm-visual-optimise">
      <div className="mm-optimise-mockup">
        <div className="mm-score-dial-wrap">
          <div className="mm-score-circle">
            <span className="mm-score-number">92</span>
            <span className="mm-score-max">/100</span>
          </div>
          <span className="mm-score-status">Optimal Performance</span>
        </div>
        <div className="mm-score-metrics-list">
          <span className="mm-metric-item">✓ SEO: 96/100</span>
          <span className="mm-metric-item">✓ Core Vitals: 0.4s</span>
        </div>
      </div>
      <div className="mm-floating-badge">
        <span className="mm-fb-icon">📈</span>
        <div>
          <strong>Sub-600ms</strong>
          <small>Continuous ROI Loop</small>
        </div>
      </div>
    </div>
  )
}

/** Official Chazon Brand Logo Component */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`brand ${className}`}
      aria-label="Chazon Digital – Revenue-Led Digital Transformation"
    >
      <picture className="brand-picture">
        <source
          media="(max-width: 640px)"
          srcSet="/images/brand/chazon-logo-mobile.webp"
          type="image/webp"
        />
        <source
          media="(max-width: 640px)"
          srcSet="/images/brand/chazon-logo-mobile.png"
          type="image/png"
        />
        <source
          srcSet="/images/brand/chazon-logo-desktop.webp"
          type="image/webp"
        />
        <img
          src="/images/brand/chazon-logo-desktop.png"
          alt="Chazon Digital – Revenue-Led Digital Transformation"
          className="brand-logo-img"
          width={754}
          height={148}
          loading="eager"
          decoding="async"
        />
      </picture>
    </Link>
  )
}

/** Official WhatsApp Icon */
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z" />
    </svg>
  )
}

export function ChannelIcon({ channel, size = 20 }: { channel: Channel; size?: number }) {
  const icons = {
    whatsapp: WhatsAppIcon,
    email: Mail,
    phone: Phone,
    instagram: Instagram,
    linkedin: Linkedin,
    facebook: Facebook,
  }
  const Icon = icons[channel.key]
  return <Icon size={size} aria-hidden="true" />
}

export function ChannelLink({
  channel,
  location,
  className,
  children,
}: {
  channel: Channel
  location: string
  className: string
  children: ReactNode
}) {
  return (
    <a
      className={className}
      data-channel={channel.key}
      href={channel.href}
      {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={() =>
        track(channel.key === 'whatsapp' ? 'whatsapp_click' : 'contact_click', {
          channel: channel.key,
          location,
        })
      }
    >
      {children}
      {channel.external && <span className="visually-hidden"> (opens in a new tab)</span>}
    </a>
  )
}

export function Header({
  defaultServicesOpen = false,
  defaultCategory = 'build' as ServiceCategoryId,
  defaultMobileOpen = false,
  defaultMobileServicesOpen = false,
}: {
  defaultServicesOpen?: boolean
  defaultCategory?: ServiceCategoryId
  defaultMobileOpen?: boolean
  defaultMobileServicesOpen?: boolean
} = {}) {
  const { path } = useRouter()
  const [mobileOpen, setMobileOpen] = useState(defaultMobileOpen)
  const [servicesOpen, setServicesOpen] = useState(defaultServicesOpen)
  const [activeCategory, setActiveCategory] = useState<ServiceCategoryId>(defaultCategory)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(defaultMobileServicesOpen)
  const [mobileExpandedCat, setMobileExpandedCat] = useState<ServiceCategoryId | null>('build')
  const servicesDropdownRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear hover debounce on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setServicesOpen(false)
    setMobileServicesOpen(false)
  }, [path])

  // Click outside to close services dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServicesOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock body scroll on mobile menu
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', mobileOpen)
    return () => document.documentElement.classList.remove('menu-open')
  }, [mobileOpen])

  // Mouse hover debounce handlers to prevent cursor flicker
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setServicesOpen(true)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setServicesOpen(false)
    }, 180)
  }

  const currentCategoryData =
    SERVICE_CATEGORIES.find((c) => c.id === activeCategory) || SERVICE_CATEGORIES[0]

  return (
    <>
      <header className="header" id="top">
        <div className="container header-inner">
          <Brand />

          {/* Desktop Navigation */}
          <nav className="nav-desktop" aria-label="Main Navigation">
            <Link
              to="/"
              className={`nav-link ${path === '/' ? 'is-active' : ''}`}
            >
              Home
            </Link>

            <Link
              to="/about"
              className={`nav-link ${path === '/about' ? 'is-active' : ''}`}
            >
              About
            </Link>

            {/* Services with Horizontal Mega-Menu */}
            <div
              className="nav-dropdown-wrapper"
              ref={servicesDropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-link has-dropdown ${path.startsWith('/services') || servicesOpen ? 'is-active' : ''}`}
                aria-expanded={servicesOpen}
                aria-haspopup="dialog"
                onClick={() => setServicesOpen((v) => !v)}
              >
                <span>Services</span>
                <ChevronDown
                  size={14}
                  className={`dropdown-caret ${servicesOpen ? 'is-open' : ''}`}
                />
              </button>

              {servicesOpen && (
                <div
                  className="services-dropdown-panel"
                  role="dialog"
                  aria-label="Services Navigation Mega-Menu"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Top Row: 5 Horizontal Category Tabs */}
                  <div className="mm-tabs-row" role="tablist" aria-label="Service Categories">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isActive = activeCategory === cat.id
                      return (
                        <Link
                          key={cat.id}
                          to={`/services?category=${cat.id}#services-grid`}
                          role="tab"
                          aria-selected={isActive}
                          className={`mm-tab-btn ${isActive ? 'is-active' : ''}`}
                          onMouseEnter={() => setActiveCategory(cat.id)}
                          onFocus={() => setActiveCategory(cat.id)}
                          onClick={() => {
                            setActiveCategory(cat.id)
                            setServicesOpen(false)
                          }}
                        >
                          <span className="mm-tab-icon">
                            <Icon size={18} />
                          </span>
                          <div className="mm-tab-text">
                            <strong className="mm-tab-label">{cat.label}</strong>
                            <span className="mm-tab-subtitle">{cat.subtitle}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Middle Area: Interactive Category Content Grid */}
                  <div className="mm-content-grid" key={currentCategoryData.id}>
                    {/* Left Column: Heading, Description, Primary CTA */}
                    <div className="mm-left-col">
                      <span className="mm-eyebrow">{currentCategoryData.eyebrow}</span>
                      <Link
                        to={`/services?category=${currentCategoryData.id}#services-grid`}
                        className="mm-title-link"
                        onClick={() => setServicesOpen(false)}
                      >
                        <h3 className="mm-title">{currentCategoryData.title}</h3>
                      </Link>
                      <p className="mm-desc">{currentCategoryData.description}</p>
                      <Link
                        to={currentCategoryData.primaryCta.to}
                        className="button button-primary mm-cta-btn"
                        onClick={() => setServicesOpen(false)}
                      >
                        <span>{currentCategoryData.primaryCta.label}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>

                    {/* Center Column: Visual Graphic Mockup */}
                    <div className="mm-center-col" aria-hidden="true">
                      <MegaMenuVisual category={currentCategoryData.id} />
                    </div>

                    {/* Right Column: Explore Services Grid */}
                    <div className="mm-right-col">
                      <span className="mm-list-eyebrow">{currentCategoryData.exploreHeading}</span>
                      <div className="mm-services-columns">
                        <div className="mm-service-col">
                          {currentCategoryData.services.slice(0, 4).map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.to}
                              className="mm-service-link"
                              onClick={() => setServicesOpen(false)}
                            >
                              <span className="mm-link-label">{item.label}</span>
                              <ArrowRight size={13} className="mm-link-arrow" />
                            </Link>
                          ))}
                        </div>
                        <div className="mm-service-col">
                          {currentCategoryData.services.slice(4, 8).map((item, idx) => (
                            <Link
                              key={idx + 4}
                              to={item.to}
                              className="mm-service-link"
                              onClick={() => setServicesOpen(false)}
                            >
                              <span className="mm-link-label">{item.label}</span>
                              <ArrowRight size={13} className="mm-link-arrow" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Related Services & View All Link */}
                  <div className="mm-footer-bar">
                    <div className="mm-footer-related">
                      <Layers size={16} className="mm-related-icon" />
                      <span className="mm-related-label">Related Services:</span>
                      <div className="mm-related-pills">
                        {currentCategoryData.related.map((rel, idx) => (
                          <Link
                            key={idx}
                            to={rel.to}
                            className="mm-related-pill"
                            onClick={() => setServicesOpen(false)}
                          >
                            {rel.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Link
                      to="/services"
                      className="mm-view-all-link"
                      onClick={() => setServicesOpen(false)}
                    >
                      <span>View All Services</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/#framework"
              className="nav-link"
            >
              Growth Framework
            </Link>

            <Link
              to="/website-audit"
              className={`nav-link ${path.startsWith('/website-audit') || path.startsWith('/growth-audit') ? 'is-active' : ''}`}
            >
              Website Audit
            </Link>

            <Link
              to="/contact"
              className={`nav-link ${path === '/contact' ? 'is-active' : ''}`}
            >
              Contact
            </Link>
          </nav>

          {/* Header Action Buttons matching Design Reference */}
          <div className="header-actions">
            <Link
              to="/contact"
              className="button button-primary header-talk-pill-btn"
              onClick={() => track('cta_click', { location: 'header_talk' })}
            >
              Let’s Talk
            </Link>

            {/* Mobile menu hamburger */}
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <nav
        id="mobile-drawer"
        className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`}
        aria-label="Mobile Navigation"
        hidden={!mobileOpen}
      >
        <div className="container mobile-drawer-inner">
          <div className="mobile-drawer-top">
            <span className="drawer-badge">Digital Growth Partner · Mumbai</span>
          </div>

          <ul className="mobile-nav-links">
            <li>
              <Link to="/" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
            </li>
            {/* Services Mobile Accordion */}
            <li className="mobile-nav-accordion-item">
              <button
                type="button"
                className={`mobile-accordion-toggle ${mobileServicesOpen ? 'is-expanded' : ''}`}
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen((v) => !v)}
              >
                <span>Services</span>
                <ChevronDown
                  size={18}
                  className={`mobile-accordion-caret ${mobileServicesOpen ? 'is-open' : ''}`}
                />
              </button>

              {mobileServicesOpen && (
                <div className="mobile-accordion-content">
                  <Link
                    to="/services"
                    className="mobile-services-all-link"
                    onClick={() => {
                      setMobileOpen(false)
                      setMobileServicesOpen(false)
                    }}
                  >
                    <strong>View Complete Services Overview</strong>
                    <ArrowRight size={14} />
                  </Link>

                  <div className="mobile-categories-list">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isCatOpen = mobileExpandedCat === cat.id
                      return (
                        <div key={cat.id} className="mobile-category-block">
                          <button
                            type="button"
                            className={`mobile-category-toggle ${isCatOpen ? 'is-open' : ''}`}
                            onClick={() =>
                              setMobileExpandedCat(isCatOpen ? null : cat.id)
                            }
                          >
                            <div className="mct-info">
                              <span className="mct-icon-wrap">
                                <Icon size={16} />
                              </span>
                              <div className="mct-text">
                                <strong className="mct-title">{cat.label}</strong>
                                <span className="mct-desc">{cat.subtitle}</span>
                              </div>
                            </div>
                            <ChevronDown
                              size={14}
                              className={`mct-caret ${isCatOpen ? 'is-open' : ''}`}
                            />
                          </button>

                          {isCatOpen && (
                            <ul className="mobile-category-sublinks">
                              {cat.services.map((item, idx) => (
                                <li key={idx}>
                                  <Link
                                    to={item.to}
                                    className="mobile-sublink-item"
                                    onClick={() => {
                                      setMobileOpen(false)
                                      setMobileServicesOpen(false)
                                    }}
                                  >
                                    <span>{item.label}</span>
                                    <ArrowRight size={12} className="mobile-sublink-arrow" />
                                  </Link>
                                </li>
                              ))}
                              <li>
                                <Link
                                  to={cat.primaryCta.to}
                                  className="mobile-category-cta-link"
                                  onClick={() => {
                                    setMobileOpen(false)
                                    setMobileServicesOpen(false)
                                  }}
                                >
                                  <span>{cat.primaryCta.label}</span>
                                  <ArrowRight size={13} />
                                </Link>
                              </li>
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </li>
            <li>
              <Link to="/work" onClick={() => setMobileOpen(false)}>
                Our Work & Case Studies
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setMobileOpen(false)}>
                About Chazon & Leadership
              </Link>
            </li>
            <li>
              <Link to="/website-audit" onClick={() => setMobileOpen(false)}>
                Free Website Audit Diagnostic
              </Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => setMobileOpen(false)}>
                Contact & Inquiries
              </Link>
            </li>
          </ul>

          <div className="mobile-drawer-cta">
            <Link
              to="/contact"
              className="button button-primary btn-full-width"
              onClick={() => setMobileOpen(false)}
            >
              Let’s Talk About Your Project <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export function Footer({ hideCta = false }: { hideCta?: boolean }) {
  const { channels, settings } = useSite()
  const { path } = useRouter()
  const currentYear = new Date().getFullYear()

  // Only show fallback callout band on subpages that do not already have a dedicated CTA banner (such as Home, About, Contact)
  const showCtaBand =
    !hideCta && path !== '/' && path !== '/about' && path !== '/contact'

  return (
    <footer className="footer-redesigned surface-dark-footer">
      <div className="container">
        {/* Top Callout only on subpages */}
        {showCtaBand && (
          <div className="footer-cta-band">
            <div className="fcb-copy">
              <h2 className="fcb-title">
                Don’t Just Build a Digital Presence. <em>Build a Revenue Engine.</em>
              </h2>
              <p className="fcb-subtitle">
                We connect technology, marketing, conversion journeys and automation into one growth system.
              </p>
            </div>
            <div className="fcb-actions">
              <Link to="/contact" className="button button-primary">
                Let’s Talk <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* Multi-Column Grid matching reference */}
        <div className="footer-main-grid">
          {/* Col 1: Brand & Bio */}
          <div className="footer-col footer-col-brand">
            <Brand />
            <p className="footer-bio-text">
              A digital growth partner helping businesses build, market and grow online.
            </p>
            <p className="footer-copyright-note">
              © {currentYear} Chazon Digital Ventures. All rights reserved.
            </p>
          </div>

          {/* Col 2: Company */}
          <div className="footer-col">
            <h3 className="footer-col-title">Company</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/approach">Our Approach</Link>
              </li>
              <li>
                <Link to="/about">Careers</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div className="footer-col">
            <h3 className="footer-col-title">Services</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/services/website-development">Website Development</Link>
              </li>
              <li>
                <Link to="/services/digital-marketing">Digital Marketing</Link>
              </li>
              <li>
                <Link to="/services/seo-services">SEO & Content</Link>
              </li>
              <li>
                <Link to="/services" className="footer-all-link">All Services →</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Links */}
          <div className="footer-col">
            <h3 className="footer-col-title">Quick Links</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/#framework">Growth Framework</Link>
              </li>
              <li>
                <Link to="/website-audit">Website Audit</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact Us */}
          <div className="footer-col">
            <h3 className="footer-col-title">Contact Us</h3>
            <ul className="footer-contact-list">
              <li>
                <a href={`tel:${(settings.phone || '+91 98765 43210').replace(/[^\d+]/g, '')}`}>
                  <Phone size={14} /> {settings.phone || '+91 98765 43210'}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email || 'hello@chazon.com'}`}>
                  <Mail size={14} /> {settings.email || 'hello@chazon.com'}
                </a>
              </li>
              <li>
                <span className="footer-address-line">
                  India
                </span>
              </li>
            </ul>
          </div>

          {/* Col 6: Follow Us */}
          <div className="footer-col">
            <h3 className="footer-col-title">Follow Us</h3>
            <div className="footer-social-row">
              <div className="social-links-icons">
                {channels
                  .filter((c) => ['linkedin', 'instagram', 'facebook'].includes(c.key))
                  .map((c) => (
                    <ChannelLink
                      key={c.key}
                      channel={c}
                      location="footer_social"
                      className="footer-social-icon-btn"
                    >
                      <ChannelIcon channel={c} size={18} />
                    </ChannelLink>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="sep">|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

/** The single persistent floating WhatsApp action button on the bottom right */
export function FloatingWhatsApp() {
  const { whatsappReady, whatsappHref } = useSite()
  if (!whatsappReady) return null
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp-fab"
      aria-label="Direct WhatsApp chat with Founder"
      title="Chat directly on WhatsApp"
      onClick={() => track('whatsapp_click', { location: 'floating_fab' })}
    >
      <WhatsAppIcon size={26} />
      <span className="visually-hidden">Chat directly on WhatsApp (opens in a new tab)</span>
    </a>
  )
}

export function PageShell({
  children,
  hideFooterCta = false,
}: {
  children: ReactNode
  hideFooterCta?: boolean
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer hideCta={hideFooterCta} />
      <FloatingWhatsApp />
    </>
  )
}
