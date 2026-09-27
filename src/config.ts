export const config = {
  siteUrl: import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || '',
  email: import.meta.env.VITE_CONTACT_EMAIL || '',
  phone: import.meta.env.VITE_PHONE || '',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  enquiryEndpoint: import.meta.env.VITE_ENQUIRY_ENDPOINT || '',
}
export function track(event: string, details: Record<string, string> = {}) {
  // Connect an approved analytics adapter here. Never send form values or personal data.
  window.dispatchEvent(new CustomEvent('chazon:analytics', { detail: { event, ...details } }))
}
