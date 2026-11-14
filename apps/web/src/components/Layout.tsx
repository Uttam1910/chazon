import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  ChevronDown,
  CircleDollarSign,
  Facebook,
  FileText,
  Filter,
  Instagram,
  Laptop,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MousePointer2,
  Phone,
  Search,
  Share2,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
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

const marketServiceIcons: Record<string, LucideIcon> = {
  'Digital Marketing': Megaphone,
  'Pay-Per-Click Advertising': MousePointer2,
  'Search Engine Optimisation (SEO)': Search,
  'Google Ads': CircleDollarSign,
  'Content Marketing': FileText,
  'Affiliate & Influencer Marketing': Users,
  'Social Media Marketing': Share2,
  'Local SEO & Search Authority': MapPin,
}

/** Decorative growth illustration shown beside the service links. */
function MegaMenuVisual({ category }: { category: ServiceCategoryId }) {
  return (
    <div className={`mm-visual-container mm-visual-${category}`}>
      <div className="mm-visual-ambient-glow" />
      <svg className="mm-illustration-svg" viewBox="0 0 320 280" role="img" aria-label="Business growth chart">
        <defs>
          <linearGradient id="growth-panel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffb25f" />
            <stop offset="100%" stopColor="#ff6a00" />
          </linearGradient>
          <filter id="growth-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#9b4a1a" floodOpacity=".16" />
          </filter>
        </defs>
        <circle cx="160" cy="142" r="120" fill="#fff3eb" />
        <g filter="url(#growth-shadow)">
          <rect x="43" y="58" width="230" height="164" rx="18" fill="#fff" />
          <path d="M43 76a18 18 0 0 1 18-18h194a18 18 0 0 1 18 18v23H43z" fill="url(#growth-panel)" />
          <circle cx="62" cy="77" r="4" fill="#fff" />
          <circle cx="76" cy="77" r="4" fill="#fff" opacity=".8" />
          <circle cx="90" cy="77" r="4" fill="#fff" opacity=".65" />
          <rect x="59" y="116" width="74" height="12" rx="6" fill="#ffede4" />
          <rect x="59" y="138" width="48" height="9" rx="4.5" fill="#fff1e9" />
          <rect x="66" y="187" width="24" height="15" rx="4" fill="#ffb363" />
          <rect x="99" y="173" width="26" height="29" rx="4" fill="#ff9340" />
          <rect x="135" y="158" width="28" height="44" rx="4" fill="#ff8124" />
          <rect x="173" y="139" width="30" height="63" rx="4" fill="#ff7414" />
          <rect x="213" y="120" width="31" height="82" rx="4" fill="#f35a08" />
          <path d="M68 174c31-5 53-18 77-37 23-19 42-31 70-36" fill="none" stroke="#f15a0a" strokeWidth="4" strokeLinecap="round" />
          <path d="m205 91 13 9-11 11" fill="none" stroke="#f15a0a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="229" cy="94" r="31" fill="#ff9d47" opacity=".18" />
        <circle cx="229" cy="94" r="23" fill="url(#growth-panel)" />
        <circle cx="229" cy="94" r="15" fill="#fff" />
        <circle cx="229" cy="94" r="9" fill="#ff7918" />
        <circle cx="229" cy="94" r="4" fill="#fff" />
        <path d="m241 80 20-20m-10 0h10v10" fill="none" stroke="#f15a0a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
        setMobileOpen(false)
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
  const titleWords = currentCategoryData.title.split(' ')
  const titlePrefix = titleWords.slice(0, -1).join(' ')
  const titleAccent = titleWords[titleWords.length - 1]

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
                  <div className="mm-sidebar" role="tablist" aria-label="Service Categories">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isActive = activeCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          role="tab"
                          aria-selected={isActive}
                          type="button"
                          className={`mm-sidebar-item ${isActive ? 'is-active' : ''}`}
                          onMouseEnter={() => setActiveCategory(cat.id)}
                          onFocus={() => setActiveCategory(cat.id)}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          <span className="mm-sidebar-icon-wrap">
                            <Icon size={22} aria-hidden="true" />
                          </span>
                          <span className="mm-sidebar-text">
                            <strong className="mm-sidebar-title">{cat.label}</strong>
                            <span className="mm-sidebar-sub">{cat.subtitle}</span>
                          </span>
                          {isActive && (
                            <ArrowRight
                              className="mm-sidebar-chevron"
                              size={18}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mm-center-content" key={currentCategoryData.id}>
                    <div className="mm-eyebrow-pill-wrap">
                      <span className="mm-eyebrow-pill">
                        {currentCategoryData.label} Services
                      </span>
                    </div>
                    <h3 className="mm-main-heading">
                      {titlePrefix} <span className="mm-title-accent">{titleAccent}</span>
                    </h3>
                    <p className="mm-desc-lead">{currentCategoryData.description}</p>
                    <div className="mm-services-2col-grid">
                      {currentCategoryData.services.map((item) => {
                        const Icon = marketServiceIcons[item.label] || currentCategoryData.icon
                        return (
                          <Link
                            key={item.to + item.label}
                            to={item.to}
                            className="mm-service-card"
                            onClick={() => setServicesOpen(false)}
                          >
                            <span className="mm-sc-icon-wrap">
                              <Icon size={18} aria-hidden="true" />
                            </span>
                            <span className="mm-sc-label">{item.label}</span>
                            <ArrowRight
                              size={18}
                              className="mm-sc-arrow"
                              aria-hidden="true"
                            />
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mm-right-action-col">
                    <div className="mm-right-visual-wrap" aria-hidden="true">
                      <MegaMenuVisual category={currentCategoryData.id} />
                    </div>
                    <Link
                      to={currentCategoryData.primaryCta.to}
                      className="mm-explore-cta-btn"
                      onClick={() => setServicesOpen(false)}
                    >
                      Explore {currentCategoryData.label} Services
                      <ArrowRight size={17} aria-hidden="true" />
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
              Website Health Scanner
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
              <Link
                to="/"
                className={`mobile-nav-item ${path === '/' ? 'is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>Home</span>
                <ArrowRight size={16} className="mobile-nav-arrow" />
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={`mobile-nav-item ${path === '/about' ? 'is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>About</span>
                <ArrowRight size={16} className="mobile-nav-arrow" />
              </Link>
            </li>
            {/* Services Mobile Accordion */}
            <li className="mobile-nav-accordion-item">
              <button
                type="button"
                className={`mobile-accordion-toggle ${mobileServicesOpen ? 'is-expanded' : ''} ${path.startsWith('/services') ? 'is-active' : ''}`}
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen((v) => !v)}
              >
                <span>Services</span>
                <ArrowRight
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
              <Link
                to="/#framework"
                className="mobile-nav-item"
                onClick={() => setMobileOpen(false)}
              >
                <span>Growth Framework</span>
                <ArrowRight size={16} className="mobile-nav-arrow" />
              </Link>
            </li>
            <li>
              <Link
                to="/website-audit"
                className={`mobile-nav-item ${path.startsWith('/website-audit') || path.startsWith('/growth-audit') ? 'is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>Website Health Scanner</span>
                <ArrowRight size={16} className="mobile-nav-arrow" />
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={`mobile-nav-item ${path === '/contact' ? 'is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>Contact</span>
                <ArrowRight size={16} className="mobile-nav-arrow" />
              </Link>
            </li>
          </ul>

          <div className="mobile-drawer-cta">
            <Link
              to="/contact"
              className="button button-primary btn-full-width mobile-drawer-primary-btn"
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
  const socialChannels = channels.filter((c) => ['linkedin', 'instagram', 'facebook'].includes(c.key))

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
          <div className={`footer-col footer-col-social${socialChannels.length === 0 ? ' is-empty' : ''}`}>
            <h3 className="footer-col-title">Follow Us</h3>
            <div className="footer-social-row">
              <div className="social-links-icons">
                {socialChannels.map((c) => (
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
