import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Mail, Phone, Instagram, Linkedin, Facebook, Menu, X } from 'lucide-react'
import { track, type Channel } from '../config'
import { pillarPath } from '../content'
import { useRouter } from '../location'
import { Link } from '../router'
import { useSite } from '../site-data'
import { Cta } from './ui'

/** The Chazon mark (C with a rising arrow) and wordmark. */
export function Brand({ className = '' }: { className?: string }) {
  return <Link to="/" className={`brand ${className}`} aria-label="Chazon Digital Ventures — home">
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14"/><path d="M43 20a18 18 0 1 0 0 24M32 20h12v12"/></svg>
    <span className="brand-word">Chazon<small>Digital Ventures</small></span>
  </Link>
}

// The WhatsApp mark (Lucide has no WhatsApp icon); drawn in currentColor so it follows each context's colour.
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/></svg>
}

export function ChannelIcon({ channel, size = 20 }: { channel: Channel; size?: number }) {
  const icons = { whatsapp: WhatsAppIcon, email: Mail, phone: Phone, instagram: Instagram, linkedin: Linkedin, facebook: Facebook }
  const Icon = icons[channel.key]
  return <Icon size={size} aria-hidden="true"/>
}

/** A direct, clearly-labelled action for one configured channel. External profiles open safely in a new tab. */
export function ChannelLink({ channel, location, className, children }: { channel: Channel; location: string; className: string; children: ReactNode }) {
  return <a className={className} data-channel={channel.key} href={channel.href} {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    onClick={() => track(channel.key === 'whatsapp' ? 'whatsapp_click' : 'contact_click', { channel: channel.key, location })}>
    {children}{channel.external && <span className="visually-hidden"> (opens in a new tab)</span>}
  </a>
}

/** Primary navigation anchors for single-page smooth scrolling. */
function useNavItems() {
  const { path } = useRouter()
  const isHome = path === '/'
  const target = (hash: string) => (isHome ? hash : `/${hash}`)
  return [
    ['Services', target('#system')],
    ['Approach', target('#approach')],
    ['Growth Audit', target('#audit')],
    ['About', target('#about')],
    ['Contact', target('#contact')],
  ] as const
}

export function Header() {
  const { settings } = useSite()
  const { path } = useRouter()
  const items = useNavItems()
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const isHome = path === '/'
  const contactTarget = isHome ? '#contact' : '/#contact'

  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    // While the mobile menu is open the rest of the page is inert and doesn't scroll; Escape closes it.
    const outside = [document.getElementById('main'), document.querySelector('footer'), document.querySelector('.mobile-bar')]
    outside.forEach(el => el?.toggleAttribute('inert', open))
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    const wide = window.matchMedia('(min-width: 1081px)')
    const onWide = () => { if (wide.matches) setOpen(false) }
    document.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => { document.removeEventListener('keydown', onKey); wide.removeEventListener('change', onWide); outside.forEach(el => el?.removeAttribute('inert')) }
  }, [open])

  return <header className="header" id="top">
    <div className="container header-inner">
      <Brand/>
      <nav className="nav-desktop" aria-label="Main">
        {items.map(([label, to]) => <Link key={label} to={to} className="nav-link">{label}</Link>)}
      </nav>
      <div className="header-actions">
        <Cta to={contactTarget} location="header" className="header-cta" size="sm">{settings.ctaTalkLabel}</Cta>
        <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(o => !o)}>
          {open ? <X size={22} aria-hidden="true"/> : <Menu size={22} aria-hidden="true"/>}<span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>
    </div>
    <nav id="mobile-menu" className="mobile-menu" aria-label="Main" hidden={!open}>
      <div className="container">
        <p className="mono mobile-menu-label">Navigation</p>
        <ul className="mobile-menu-links">
          {items.map(([label, to]) => <li key={label}><Link to={to} onClick={() => setOpen(false)}>{label}</Link></li>)}
        </ul>
        <Cta to={contactTarget} onClick={() => setOpen(false)} location="mobile_menu" className="mobile-menu-cta">{settings.ctaTalkLabel}</Cta>
      </div>
    </nav>
  </header>
}

/** Mobile-only action bar. Appears once the visitor has scrolled past the opening screen and hides wherever an
 *  enquiry form, closing call to action or the footer is on screen, so it never covers fields or links. */
export function MobileBar() {
  const { whatsappReady, whatsappHref, settings } = useSite()
  const { path } = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const formPage = path === '/contact' || path === '/growth-audit'

  useEffect(() => {
    if (formPage) return
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
      setBlocked(visible.size > 0)
    })
    document.querySelectorAll('[data-no-mobile-bar], footer').forEach(el => observer.observe(el))
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect() }
  }, [path, formPage])

  if (formPage) return null
  const hidden = !scrolled || blocked
  const contactTarget = path === '/' ? '#contact' : '/#contact'

  return <div className={`mobile-bar ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden || undefined} inert={hidden || undefined}>
    {whatsappReady && <a className="mobile-bar-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { location: 'mobile_bar' })}><WhatsAppIcon size={18}/>WhatsApp<span className="visually-hidden"> (opens in a new tab)</span></a>}
    <Cta to={contactTarget} location="mobile_bar" className="mobile-bar-cta" size="sm">{settings.ctaTalkLabel}</Cta>
  </div>
}

export function Footer() {
  const { channels, settings, pillars, caseStudies, insights } = useSite()
  const direct = channels.filter(c => c.key === 'email' || c.key === 'phone')
  const profiles = channels.filter(c => c.key !== 'email' && c.key !== 'phone')
  return <footer className="footer surface-ink">
    <div className="container">
      <div className="footer-lead">
        <p className="footer-statement">Don’t just build a digital presence. <em>Build a digital revenue engine.</em></p>
        <Link to="/contact" className="text-link">{settings.ctaTalkLabel}<ArrowRight size={17} aria-hidden="true"/></Link>
      </div>
      <div className="footer-grid">
        <div className="footer-brand">
          <Brand/>
          <p>{settings.tagline}</p>
          {settings.location && <p className="footer-location">{settings.location}</p>}
        </div>
        <div>
          <h2 className="mono">Services</h2>
          <ul>
            {pillars.map(p => <li key={p.key}><Link to={pillarPath(p)}>{p.verb} — {p.title}</Link></li>)}
            <li><Link to="/growth-audit">{settings.ctaAuditLabel}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mono">Company</h2>
          <ul>
            <li><Link to="/services">All services</Link></li>
            <li><Link to="/approach">Our approach</Link></li>
            <li><Link to="/about">About Chazon</Link></li>
            {caseStudies.length > 0 && <li><Link to="/work">Work</Link></li>}
            {insights.length > 0 && <li><Link to="/insights">Insights</Link></li>}
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mono">Contact</h2>
          <ul>
            {direct.map(c => <li key={c.key}><ChannelLink channel={c} location="footer" className="footer-channel"><ChannelIcon channel={c} size={16}/>{c.detail}</ChannelLink></li>)}
            {profiles.map(c => <li key={c.key}><ChannelLink channel={c} location="footer" className="footer-channel"><ChannelIcon channel={c} size={16}/>{c.label}</ChannelLink></li>)}
            <li><Link to="/contact">Send an enquiry</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span suppressHydrationWarning>© {new Date().getFullYear()} {settings.companyName}</span>
        <Link to="/privacy">Privacy notice</Link>
        <Link to="/terms">Website terms</Link>
        <a href="#top">Back to top</a>
      </div>
    </div>
  </footer>
}

export function PageShell({ children }: { children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header/>
    <main id="main" tabIndex={-1}>{children}</main>
    <Footer/>
    <MobileBar/>
  </>
}
