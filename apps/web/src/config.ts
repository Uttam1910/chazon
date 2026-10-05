// Chazon API origin. In development it defaults to the local API started by `npm run dev`; in production set
// VITE_API_URL to enable CMS content and online enquiries. With no API, the site renders its built-in content.
const apiUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '')

/** Demo mode (VITE_DEMO_MODE=true): published content comes from built-in sample data; enquiries are not sent. */
export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const config = {
  siteUrl: import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || '',
  apiUrl,
  email: import.meta.env.VITE_CONTACT_EMAIL || '',
  phone: import.meta.env.VITE_PHONE || '',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  // An explicit endpoint wins; otherwise enquiries go to the Chazon API when one is configured.
  enquiryEndpoint: import.meta.env.VITE_ENQUIRY_ENDPOINT || (apiUrl ? `${apiUrl}/api/public/enquiries` : ''),
  instagram: import.meta.env.VITE_INSTAGRAM_URL || '',
  linkedin: import.meta.env.VITE_LINKEDIN_URL || '',
  facebook: import.meta.env.VITE_FACEBOOK_URL || '',
}

// Social profiles are shown only for HTTPS URLs on the platform's own domain, so a typo can't publish a broken or foreign link.
function profile(value: string, domain: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? url.href : ''
  } catch { return '' }
}

export type ChannelKey = 'whatsapp' | 'email' | 'phone' | 'instagram' | 'linkedin' | 'facebook'
export type Channel = { key: ChannelKey; label: string; action: string; detail: string; href: string; external: boolean }
export type ContactValues = { email: string; phone: string; whatsapp: string; instagram: string; linkedin: string; facebook: string }

/** Every configured way to reach Chazon. Unconfigured or invalid channels are simply absent — nothing is invented. */
export function buildChannels(values: ContactValues) {
  const whatsappReady = /^\d{7,15}$/.test(values.whatsapp)
  const whatsappHref = `https://wa.me/${values.whatsapp}`
  const phoneDigits = values.phone.replace(/[^\d+]/g, '')
  const channels: Channel[] = [
    whatsappReady && { key: 'whatsapp', label: 'WhatsApp', action: 'Start a WhatsApp chat', detail: 'Chat now', href: whatsappHref, external: true },
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) && { key: 'email', label: 'Email', action: `Email ${values.email}`, detail: values.email, href: `mailto:${values.email}`, external: false },
    /^\+?\d{7,15}$/.test(phoneDigits) && { key: 'phone', label: 'Call', action: `Call ${values.phone}`, detail: values.phone, href: `tel:${phoneDigits}`, external: false },
    profile(values.instagram, 'instagram.com') && { key: 'instagram', label: 'Instagram', action: 'Chazon on Instagram', detail: 'Follow', href: profile(values.instagram, 'instagram.com'), external: true },
    profile(values.linkedin, 'linkedin.com') && { key: 'linkedin', label: 'LinkedIn', action: 'Chazon on LinkedIn', detail: 'Connect', href: profile(values.linkedin, 'linkedin.com'), external: true },
    profile(values.facebook, 'facebook.com') && { key: 'facebook', label: 'Facebook', action: 'Chazon on Facebook', detail: 'Follow', href: profile(values.facebook, 'facebook.com'), external: true },
  ].filter((c): c is Channel => !!c)
  return {
    channels,
    whatsappReady,
    whatsappHref,
    directChannels: channels.filter(c => ['whatsapp', 'email', 'phone'].includes(c.key)),
    socialChannels: channels.filter(c => ['instagram', 'linkedin', 'facebook'].includes(c.key)),
  }
}
export type Channels = ReturnType<typeof buildChannels>

export function track(event: string, details: Record<string, string> = {}) {
  // Connect an approved analytics adapter here. Never send form values or personal data.
  window.dispatchEvent(new CustomEvent('chazon:analytics', { detail: { event, ...details } }))
}

/** Where the visitor came from (campaign or referring site), kept for this browser session and sent with enquiries. */
export const sourceDetail = (() => {
  try {
    const stored = sessionStorage.getItem('chazon:source')
    if (stored !== null) return stored
    const params = new URLSearchParams(window.location.search)
    let source = params.get('utm_source') || ''
    if (!source && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host && host !== window.location.hostname.replace(/^www\./, '')) source = host
    }
    source = source.slice(0, 120)
    sessionStorage.setItem('chazon:source', source)
    return source
  } catch { return '' }
})()
