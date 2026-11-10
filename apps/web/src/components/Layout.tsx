import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  Phone,
  Sparkles,
  X,
} from 'lucide-react'
import { CORE_10_SERVICES, PILLAR_INFO, PILLAR_SLUGS, PILLARS } from '@chazon/shared'
import { track, type Channel } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { useSite } from '../site-data'

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

export function Header() {
  const { path } = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const servicesDropdownRef = useRef<HTMLDivElement>(null)

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setServicesOpen(false)
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

  // Lock body scroll on mobile menu
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', mobileOpen)
    return () => document.documentElement.classList.remove('menu-open')
  }, [mobileOpen])

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

            {/* Services with dropdown */}
            <div
              className="nav-dropdown-wrapper"
              ref={servicesDropdownRef}
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <Link
                to="/services"
                className={`nav-link has-dropdown ${path.startsWith('/services') ? 'is-active' : ''}`}
                aria-expanded={servicesOpen}
              >
                Services <ChevronDown size={14} className="dropdown-caret" />
              </Link>

              {servicesOpen && (
                <div className="services-dropdown-panel" role="menu">
                  <div className="dropdown-panel-grid">
                    <div className="dropdown-services-col">
                      <span className="dropdown-col-title">Core Services</span>
                      <ul className="dropdown-services-list">
                        {CORE_10_SERVICES.map((s) => (
                          <li key={s.id}>
                            <Link to={s.path} className="dropdown-service-item">
                              <strong>{s.title}</strong>
                              <small>{s.category}</small>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="dropdown-pillars-col">
                      <span className="dropdown-col-title">Strategic Pillars</span>
                      <ul className="dropdown-pillars-list">
                        {PILLARS.map((p) => (
                          <li key={p}>
                            <Link
                              to={`/services/${PILLAR_SLUGS[p]}`}
                              className="dropdown-pillar-item"
                            >
                              <strong>{PILLAR_INFO[p].title}</strong>
                              <small>The {PILLAR_INFO[p].verb} Engine</small>
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <div className="dropdown-audit-callout">
                        <div className="dac-head">
                          <Sparkles size={16} />
                          <span>Strategic Advisory</span>
                        </div>
                        <p>Discuss your digital growth roadmap directly with our founding team.</p>
                        <Link to="/contact" className="dac-link">
                          Book a Consultation <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-panel-footer">
                    <Link to="/services" className="dropdown-all-link">
                      View Complete Services Overview <ArrowRight size={14} />
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
              to="/insights"
              className={`nav-link ${path.startsWith('/insights') ? 'is-active' : ''}`}
            >
              Insights
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
            <li>
              <Link to="/services" onClick={() => setMobileOpen(false)}>
                Our Services (10 Solutions)
              </Link>
            </li>
            <li>
              <Link to="/approach" onClick={() => setMobileOpen(false)}>
                Our Approach (6-Stage Process)
              </Link>
            </li>
            <li>
              <Link to="/work" onClick={() => setMobileOpen(false)}>
                Our Work & Case Studies
              </Link>
            </li>
            <li>
              <Link to="/insights" onClick={() => setMobileOpen(false)}>
                Insights & Playbooks
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setMobileOpen(false)}>
                About Chazon & Leadership
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
                <Link to="/insights">Insights</Link>
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
