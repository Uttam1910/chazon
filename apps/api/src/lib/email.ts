import { emailConfigured, env } from '../env'
import { prisma } from '../db'

// Transactional email through Resend's HTTP API. Sending is best-effort: callers save the record first,
// then call notifySubmission() without awaiting it, so a failed email never loses an enquiry.

type Email = { to: string; subject: string; html: string; text: string; replyTo?: string }
type Result = { ok: true; id?: string } | { ok: false; error: string }

export async function sendEmail(email: Email): Promise<Result> {
  if (!emailConfigured) return { ok: false, error: 'Email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL).' }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [email.to], subject: email.subject, html: email.html, text: email.text, ...(email.replyTo ? { reply_to: email.replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    })
    const body = await response.json().catch(() => ({})) as { id?: string; message?: string }
    return response.ok ? { ok: true, id: body.id } : { ok: false, error: `Resend ${response.status}: ${body.message ?? 'request failed'}` }
  } catch (error) {
    return { ok: false, error: `Resend request failed: ${(error as Error).message}` }
  }
}

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const layout = (body: string) => `<!doctype html><html><body style="margin:0;background:#fafaf8;font-family:Arial,Helvetica,sans-serif;color:#181918">
<div style="max-width:560px;margin:0 auto;padding:32px 24px"><p style="font-weight:800;letter-spacing:1px;margin:0 0 24px">CHAZON <span style="color:#d44720">↗</span></p>${body}
<p style="margin-top:32px;font-size:12px;color:#8c8e88">Chazon Digital Ventures · Revenue-Led Digital Transformation</p></div></body></html>`

export type Submission = {
  id: string; kind: 'lead' | 'audit'; name: string; businessName: string; email: string; phone: string
  website?: string | null; category?: string | null; service?: string | null; budget?: string | null; message?: string | null
}

function notification(s: Submission): Email {
  const label = s.kind === 'audit' ? 'Digital Growth Audit request' : 'New enquiry'
  const rows: [string, string | null | undefined][] = [
    ['Name', s.name], ['Business', s.businessName], ['Email', s.email], ['Phone', s.phone], ['Website / Instagram', s.website],
    ['Category', s.category], ['Requirement', s.service], ['Monthly budget', s.budget], [s.kind === 'audit' ? 'Audit focus' : 'Message', s.message],
  ]
  const link = env.ADMIN_URL ? `${env.ADMIN_URL}/${s.kind === 'audit' ? 'audits' : 'leads'}/${s.id}` : ''
  return {
    to: env.CHAZON_NOTIFICATION_EMAIL!,
    replyTo: s.email,
    subject: `${label}: ${s.businessName} (${s.name})`,
    text: `${label}\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')}${link ? `\n\nOpen in Admin: ${link}` : ''}`,
    html: layout(`<h1 style="font-size:20px;margin:0 0 16px">${label}</h1><table style="border-collapse:collapse;width:100%;font-size:14px">${rows.filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#686a65;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;white-space:pre-wrap">${escape(v!)}</td></tr>`).join('')}</table>
      ${link ? `<p style="margin-top:24px"><a href="${escape(link)}" style="background:#c9421d;color:#fff;padding:12px 18px;text-decoration:none;border-radius:2px">Open in Chazon Admin</a></p>` : ''}`),
  }
}

function confirmation(s: Submission): Email {
  const audit = s.kind === 'audit'
  const first = s.name.split(/\s+/)[0]
  const text = audit
    ? `Hi ${first},\n\nThank you for requesting a Digital Growth Audit for ${s.businessName}. We have received your details and will be in touch to confirm the scope before any work begins.\n\n— Team Chazon`
    : `Hi ${first},\n\nThank you for reaching out to Chazon Digital Ventures. We have received your enquiry about ${s.businessName} and look forward to learning more about your business. We will be in touch shortly.\n\n— Team Chazon`
  return {
    to: s.email,
    ...(env.CHAZON_NOTIFICATION_EMAIL ? { replyTo: env.CHAZON_NOTIFICATION_EMAIL } : {}),
    subject: audit ? 'We’ve received your Digital Growth Audit request' : 'Thank you for contacting Chazon',
    text,
    html: layout(text.split('\n\n').map(p => `<p style="font-size:15px;line-height:1.6;margin:0 0 16px">${escape(p).replace(/\n/g, '<br>')}</p>`).join('')),
  }
}

/** Sends the internal notification and the customer confirmation, recording each outcome on the timeline. */
export async function notifySubmission(s: Submission) {
  const target = s.kind === 'audit' ? { auditId: s.id } : { leadId: s.id }
  const log = (type: string, message: string) => prisma.activity.create({ data: { ...target, type, message } }).catch(e => console.error('Activity log failed', e))
  if (!emailConfigured) { await log('EMAIL_SKIPPED', 'Email notifications are not configured; no emails were sent.'); return }
  const jobs: [string, Email | null][] = [
    ['Team notification', env.CHAZON_NOTIFICATION_EMAIL ? notification(s) : null],
    ['Customer confirmation', confirmation(s)],
  ]
  for (const [label, email] of jobs) {
    if (!email) { await log('EMAIL_SKIPPED', `${label} skipped: CHAZON_NOTIFICATION_EMAIL is not set.`); continue }
    const result = await sendEmail(email)
    if (result.ok) await log('EMAIL_SENT', `${label} sent to ${email.to}.`)
    else { console.error(`${label} failed for ${s.kind} ${s.id}: ${result.error}`); await log('EMAIL_FAILED', `${label} to ${email.to} failed.`) }
  }
}
