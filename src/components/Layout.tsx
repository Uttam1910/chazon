import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Menu, X, Mail, Phone, Instagram, Linkedin, Facebook } from 'lucide-react'
import { channels, socialChannels, track, whatsappReady, whatsappHref, type Channel } from '../config'
import { nav, footerCompany, footerServices } from '../content'
import { openEnquiry, openPillar, type EnquiryMode } from '../actions'

export function Brand() {
  return <a className="brand" href="#home" aria-label="Chazon Digital Ventures home"><span className="brand-mark" aria-hidden="true">c<span>↗</span></span><span>CHAZON<small>DIGITAL VENTURES</small></span></a>
}

/** Primary/secondary CTA. Links to #contact open the enquiry form in the requested mode. */
export function Button({ children, href = '#contact', secondary = false, mode = 'talk', service, className = '' }: { children: ReactNode; href?: string; secondary?: boolean; mode?: EnquiryMode; service?: string; className?: string }) {
  return <a className={`button ${secondary ? 'secondary' : ''} ${className}`} href={href} onClick={href === '#contact' ? () => openEnquiry(mode, service) : undefined}>{children}<ArrowUpRight size={18} aria-hidden="true"/></a>
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="eyebrow"><span aria-hidden="true"/>{children}</p>
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const wide = window.matchMedia('(min-width: 851px)')
    const reset = () => { if (wide.matches) setOpen(false) }
    window.addEventListener('keydown', close)
    wide.addEventListener('change', reset)
    return () => { window.removeEventListener('keydown', close); wide.removeEventListener('change', reset) }
  }, [])
  useEffect(() => {
    // Each homepage section declares which navigation item it belongs to (data-nav), so the highlight
    // stays meaningful between the five destinations; sections with an empty value clear it.
    const sections = document.querySelectorAll<HTMLElement>('main [data-nav]')
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.nav || '') }), { rootMargin: '-45% 0px -50% 0px' })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  return <header className="header">
    <div className="container nav-wrap">
      <Brand/>
      <nav id="main-nav" className={open ? 'nav open' : 'nav'} aria-label="Main navigation">
        {nav.map(([name, id]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'true' : undefined} onClick={() => setOpen(false)}>{name}</a>)}
        <a className="nav-cta" href="#contact" onClick={() => { setOpen(false); openEnquiry('talk') }}>Let’s Talk <ArrowUpRight size={18} aria-hidden="true"/></a>
      </nav>
      <a className="header-cta" href="#contact" onClick={() => { setOpen(false); openEnquiry('talk') }}>LET’S TALK <ArrowUpRight size={15} aria-hidden="true"/></a>
      <button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
  </header>
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

/** Mobile-only action bar: a compact pair of pills in the corner. Hidden over Services, Contact and the footer
 *  (so it never covers service chips, CTAs, form fields or footer links) and — unless WhatsApp is configured — over the
 *  hero, which already shows Let's Talk. */
export function MobileActions() {
  const [hidden, setHidden] = useState(!whatsappReady)
  useEffect(() => {
    const watched = [document.getElementById('services'), document.getElementById('contact'), document.querySelector('footer'), whatsappReady ? null : document.getElementById('home')].filter((el): el is HTMLElement => !!el)
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
      setHidden(visible.size > 0)
    }, { threshold: 0.05 })
    watched.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return <div className={`mobile-actions ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden || undefined} inert={hidden || undefined}>
    {whatsappReady && <a className="mobile-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { location: 'mobile_bar' })}><WhatsAppIcon size={19}/>WhatsApp<span className="visually-hidden"> (opens in a new tab)</span></a>}
    <a className="mobile-talk" href="#contact" onClick={() => { track('contact_click', { location: 'mobile_bar' }); openEnquiry('talk') }}>Let’s Talk<ArrowUpRight size={17} aria-hidden="true"/></a>
  </div>
}

export function Footer() {
  return <footer>
    <div className="container">
      <p className="footer-statement">Don’t just build a digital presence. <em>Build a digital revenue engine.</em></p>
      <div className="footer-grid">
        <div><Brand/><p>Revenue-Led Digital Transformation</p><span className="footer-tag">Strategy meets execution.<br/>Digital meets business growth.</span></div>
        <div><h2>Services</h2>{footerServices.map(([name, pillar]) => <a key={name} href="#services" onClick={() => openPillar(pillar)}>{name}</a>)}</div>
        <div><h2>Company</h2>{footerCompany.map(([name, id]) => <a key={id} href={`#${id}`}>{name}</a>)}</div>
        <div>
          <h2>Connect</h2>
          {channels.filter(c => c.key !== 'email' && c.key !== 'phone').map(c => <ChannelLink key={c.key} channel={c} location="footer" className="footer-link"><ChannelIcon channel={c} size={15}/>{c.label}</ChannelLink>)}
          {!whatsappReady && !socialChannels.length && <span className="pending-contact">WhatsApp and official social<br/>profiles coming soon</span>}
          {whatsappReady && !socialChannels.length && <span className="pending-contact">Official social profiles coming soon</span>}
          <h2 className="footer-sub">Contact</h2>
          <p>Mumbai, Maharashtra</p>
          {channels.filter(c => c.key === 'email' || c.key === 'phone').map(c => <ChannelLink key={c.key} channel={c} location="footer" className="footer-link"><ChannelIcon channel={c} size={15}/>{c.detail}</ChannelLink>)}
          <a href="#contact" onClick={() => openEnquiry('talk')}>Start a conversation <ArrowUpRight size={14} aria-hidden="true"/></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Chazon Digital Ventures</span>
        <div>
          <details><summary>Privacy Policy</summary><p>Enquiry details are used to respond to your request. No analytics integrations are enabled by default. A complete privacy policy, including retention and contact details, will be published before launch.</p></details>
          <details><summary>Terms & Conditions</summary><p>This website introduces Chazon’s capabilities. Project scope, fees and deliverables are agreed separately in writing. Full website terms will be published before launch.</p></details>
        </div>
        <a href="#home">Back to top ↑</a>
      </div>
    </div>
  </footer>
}
