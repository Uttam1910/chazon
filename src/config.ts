export const config = {
  siteUrl: import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || '',
  email: import.meta.env.VITE_CONTACT_EMAIL || '',
  phone: import.meta.env.VITE_PHONE || '',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  enquiryEndpoint: import.meta.env.VITE_ENQUIRY_ENDPOINT || '',
  instagram: import.meta.env.VITE_INSTAGRAM_URL || '',
  linkedin: import.meta.env.VITE_LINKEDIN_URL || '',
  facebook: import.meta.env.VITE_FACEBOOK_URL || '',
}
export const whatsappReady = /^\d{7,15}$/.test(config.whatsapp)
export const whatsappHref = `https://wa.me/${config.whatsapp}`

// Social profiles are shown only for HTTPS URLs on the platform's own domain, so a typo can't publish a broken or foreign link.
function profile(value: string, domain: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? url.href : ''
  } catch { return '' }
}
const phoneDigits = config.phone.replace(/[^\d+]/g, '')

export type ChannelKey = 'whatsapp' | 'email' | 'phone' | 'instagram' | 'linkedin' | 'facebook'
export type Channel = { key: ChannelKey; label: string; action: string; detail: string; href: string; external: boolean }

/** Every configured way to reach Chazon. Unconfigured channels are simply absent — nothing is invented. */
export const channels: Channel[] = [
  whatsappReady && { key: 'whatsapp', label: 'WhatsApp', action: 'Start a WhatsApp chat', detail: 'Chat now', href: whatsappHref, external: true },
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) && { key: 'email', label: 'Email', action: `Email ${config.email}`, detail: config.email, href: `mailto:${config.email}`, external: false },
  /^\+?\d{7,15}$/.test(phoneDigits) && { key: 'phone', label: 'Call', action: `Call ${config.phone}`, detail: config.phone, href: `tel:${phoneDigits}`, external: false },
  profile(config.instagram, 'instagram.com') && { key: 'instagram', label: 'Instagram', action: 'Chazon on Instagram', detail: 'Follow', href: profile(config.instagram, 'instagram.com'), external: true },
  profile(config.linkedin, 'linkedin.com') && { key: 'linkedin', label: 'LinkedIn', action: 'Chazon on LinkedIn', detail: 'Connect', href: profile(config.linkedin, 'linkedin.com'), external: true },
  profile(config.facebook, 'facebook.com') && { key: 'facebook', label: 'Facebook', action: 'Chazon on Facebook', detail: 'Follow', href: profile(config.facebook, 'facebook.com'), external: true },
].filter((c): c is Channel => !!c)
export const directChannels = channels.filter(c => ['whatsapp', 'email', 'phone'].includes(c.key))
export const socialChannels = channels.filter(c => ['instagram', 'linkedin', 'facebook'].includes(c.key))

export function track(event: string, details: Record<string, string> = {}) {
  // Connect an approved analytics adapter here. Never send form values or personal data.
  window.dispatchEvent(new CustomEvent('chazon:analytics', { detail: { event, ...details } }))
}
