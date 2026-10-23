import type { EnquiryType } from '@chazon/shared'

// Enquiry form rules and submission. Validation mirrors the API's schema (apps/api/src/routes/public.ts), so most
// mistakes are caught before sending; the API still validates everything and its field messages are shown as-is.

export const ENQUIRY_FIELDS = ['name', 'email', 'phone', 'business', 'website', 'category', 'service', 'budget', 'message'] as const
export type EnquiryField = (typeof ENQUIRY_FIELDS)[number]
export type EnquiryValues = Record<EnquiryField, string>
export type FieldErrors = Partial<Record<EnquiryField, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[+0-9() .-]{7,20}$/

export function validateEnquiry(v: EnquiryValues, type: EnquiryType): FieldErrors {
  const errors: FieldErrors = {}
  const name = v.name.trim(), email = v.email.trim(), phone = v.phone.trim()
  if (name.length < 2) errors.name = name ? 'Please enter your full name.' : 'Please enter your name.'
  else if (name.length > 100) errors.name = 'Please keep your name under 100 characters.'
  if (!email) errors.email = 'Please enter your email address.'
  else if (!EMAIL.test(email) || email.length > 200) errors.email = 'Enter an email address like name@business.com.'
  if (!phone) errors.phone = 'Please enter a phone or WhatsApp number.'
  else if (!PHONE.test(phone) || phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter a phone number with at least 7 digits, e.g. +91 98200 00000.'
  if (!v.business.trim()) errors.business = 'Please enter your business name.'
  else if (v.business.trim().length > 150) errors.business = 'Please keep the business name under 150 characters.'
  if (type === 'talk' && !v.service) errors.service = 'Please choose what you need help with.'
  if (v.website.trim().length > 200) errors.website = 'Please keep this under 200 characters.'
  if (v.message.trim().length > 3000) errors.message = 'Please keep your message under 3,000 characters.'
  return errors
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: 'validation'; errors: FieldErrors; message: string }
  | { ok: false; reason: 'rate_limited' | 'rejected' | 'server' | 'network'; message: string }

/** Sends the enquiry. Success is reported only when the endpoint accepts it (2xx). */
export async function submitEnquiry(endpoint: string, payload: Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<SubmitResult> {
  let response: Response
  try {
    response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } catch {
    return { ok: false, reason: 'network', message: 'We couldn’t reach our server. Please check your connection and try again.' }
  }
  if (response.ok) return { ok: true }
  const body = await response.json().catch(() => null) as { error?: { message?: string; details?: Record<string, string> } } | null
  if (response.status === 422 || response.status === 400) {
    const errors: FieldErrors = {}
    for (const [key, message] of Object.entries(body?.error?.details ?? {})) if ((ENQUIRY_FIELDS as readonly string[]).includes(key)) errors[key as EnquiryField] = message
    return { ok: false, reason: 'validation', errors, message: body?.error?.message || 'Please check the highlighted fields.' }
  }
  if (response.status === 429) return { ok: false, reason: 'rate_limited', message: 'Too many enquiries have been sent from this connection. Please wait a few minutes and try again.' }
  if (response.status === 403) return { ok: false, reason: 'rejected', message: 'This enquiry couldn’t be accepted from this address. Please send it from the Chazon website, or contact us directly.' }
  return { ok: false, reason: 'server', message: 'Something went wrong on our side and your enquiry was not sent. Please try again shortly.' }
}
