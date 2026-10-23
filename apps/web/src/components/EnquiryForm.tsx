import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { EnquiryType } from '@chazon/shared'
import { config, demoMode, sourceDetail, track } from '../config'
import { budgets, enquiryServices } from '../content'
import { ENQUIRY_FIELDS, submitEnquiry, validateEnquiry, type EnquiryField, type EnquiryValues, type FieldErrors } from '../enquiry'
import { Link } from '../router'
import { useSite } from '../site-data'
import { ChannelIcon, ChannelLink } from './Layout'

const labels: Record<EnquiryField, string> = {
  name: 'Your name', email: 'Email', phone: 'Phone or WhatsApp', business: 'Business name', website: 'Website or Instagram',
  category: 'Industry', service: 'What do you need help with?', budget: 'Monthly marketing budget', message: 'Message',
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; demo: boolean } | { kind: 'error'; message: string }

/** The enquiry form: "talk" creates a Lead, "audit" a Digital Growth Audit request (both via the Chazon API). */
export function EnquiryForm({ type, initialService = '', location }: { type: EnquiryType; initialService?: string; location: string }) {
  const { industries, pillars, directChannels } = useSite()
  const form = useRef<HTMLFormElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const done = useRef<HTMLHeadingElement>(null)
  const started = useRef(0)
  const touched = useRef(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const uid = useId()
  const formName = type === 'audit' ? 'growth_audit' : 'enquiry'
  const ready = demoMode || !!config.enquiryEndpoint

  useEffect(() => { started.current = Date.now() }, [])
  useEffect(() => { if (status.kind === 'sent') done.current?.focus() }, [status.kind])

  const values = (): EnquiryValues => {
    const data = new FormData(form.current!)
    return Object.fromEntries(ENQUIRY_FIELDS.map(f => [f, String(data.get(f) ?? '')])) as EnquiryValues
  }
  const onFirstInput = () => {
    if (touched.current) return
    touched.current = true
    track('form_start', { form: formName, location })
  }
  // A flagged field is re-checked as the visitor edits it, so the message clears as soon as it's fixed. (Not on blur:
  // removing a message as focus moves to the submit button would shift the button mid-click and swallow the click.)
  const recheck = (field: EnquiryField) => {
    if (!errors[field]) return
    const next = validateEnquiry(values(), type)[field]
    setErrors(e => ({ ...e, [field]: next }))
  }
  const focusFirst = (found: FieldErrors) => {
    const first = ENQUIRY_FIELDS.find(f => found[f])
    if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status.kind === 'sending' || !ready) return
    const v = values()
    const found = validateEnquiry(v, type)
    setErrors(found)
    if (Object.keys(found).length) {
      setStatus({ kind: 'idle' })
      track('form_error', { form: formName, reason: 'validation' })
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setStatus({ kind: 'sending' })
    if (demoMode) {
      await new Promise(r => setTimeout(r, 500))
      setStatus({ kind: 'sent', demo: true })
      return
    }
    const honeypot = String(new FormData(form.current!).get('company_url') ?? '')
    const result = await submitEnquiry(config.enquiryEndpoint, {
      ...v, service: type === 'audit' ? 'Digital Growth Audit' : v.service,
      enquiry_type: type, company_url: honeypot, form_started: started.current, source_detail: sourceDetail(),
    })
    if (result.ok) {
      track('form_submission', { form: formName, location })
      setStatus({ kind: 'sent', demo: false })
      return
    }
    track('form_error', { form: formName, reason: result.reason })
    if (result.reason === 'validation') {
      setErrors(result.errors)
      focusFirst(result.errors)
    }
    setStatus({ kind: 'error', message: result.message })
  }

  if (status.kind === 'sent') {
    return <div className="form-done" role="status">
      <CheckCircle2 size={32} aria-hidden="true"/>
      <h3 ref={done} tabIndex={-1}>{status.demo ? 'Demo mode: nothing was sent' : type === 'audit' ? 'Thank you — your audit request has been received.' : 'Thank you — your enquiry has been received.'}</h3>
      <p>{status.demo ? 'This preview isn’t connected to the Chazon API, so the details were not sent or stored.' : 'Here’s what happens next:'}</p>
      {!status.demo && <ol className="steps-list">{(type === 'audit'
        ? ['We review the details you shared and the areas you want us to look at.', 'We contact you to confirm the scope and any commercial terms before work begins.', 'We share what we found and the practical next steps.']
        : ['We review what you’ve shared about your business.', 'We contact you to arrange a conversation about your objectives.', 'We recommend a practical next step — a project, ongoing support or an audit.']).map((step, i) => <li key={step}><span className="mono">0{i + 1}</span>{step}</li>)}</ol>}
      <p className="form-done-links"><Link to="/approach" className="text-link">See how we work<ArrowRight size={17} aria-hidden="true"/></Link></p>
    </div>
  }

  const errorList = ENQUIRY_FIELDS.filter(f => errors[f])
  const field = (name: EnquiryField, input: (props: { id: string; name: string; 'aria-invalid'?: true; 'aria-describedby'?: string; onChange: () => void }) => ReactNode, { optional = false, hint = '', wide = false } = {}) => {
    const id = `${uid}-${name}`
    const describedBy = [hint && `${id}-hint`, errors[name] && `${id}-error`].filter(Boolean).join(' ') || undefined
    return <div className={`field ${wide ? 'field-wide' : ''} ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={id}>{labels[name]}{optional && <span className="field-optional"> (optional)</span>}</label>
      {input({ id, name, onChange: () => recheck(name), ...(errors[name] ? { 'aria-invalid': true as const } : {}), ...(describedBy ? { 'aria-describedby': describedBy } : {}) })}
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {errors[name] && <p className="field-error" id={`${id}-error`}><AlertCircle size={15} aria-hidden="true"/>{errors[name]}</p>}
    </div>
  }

  return <form ref={form} className="enquiry-form" onSubmit={submit} onFocus={onFirstInput} noValidate aria-label={type === 'audit' ? 'Digital Growth Audit request' : 'Project enquiry'}>
    {errorList.length > 0 && <div className="form-summary" ref={summary} tabIndex={-1} role="alert">
      <p><strong>{errorList.length === 1 ? 'One field needs attention:' : `${errorList.length} fields need attention:`}</strong></p>
      <ul>{errorList.map(f => <li key={f}><a href={`#${uid}-${f}`} onClick={e => { e.preventDefault(); form.current?.querySelector<HTMLElement>(`[name="${f}"]`)?.focus() }}>{labels[f]}: {errors[f]}</a></li>)}</ul>
    </div>}
    <div className="form-grid">
      {field('name', p => <input {...p} type="text" autoComplete="name" maxLength={100}/>)}
      {field('email', p => <input {...p} type="email" autoComplete="email" inputMode="email" maxLength={200}/>)}
      {field('phone', p => <input {...p} type="tel" autoComplete="tel" inputMode="tel" maxLength={20}/>, { hint: 'Include the country code if you’re outside India.' })}
      {field('business', p => <input {...p} type="text" autoComplete="organization" maxLength={150}/>)}
      {field('website', p => <input {...p} type="text" autoComplete="url" maxLength={200} placeholder="yourbusiness.com or @handle"/>, { optional: true })}
      {field('category', p => <select {...p} defaultValue=""><option value="">Select your industry</option>{industries.map(([x]) => <option key={x}>{x}</option>)}<option>Other</option></select>, { optional: true })}
      {type === 'talk' && field('service', p => <select {...p} defaultValue={initialService}>
        <option value="" disabled>Choose one</option>
        <optgroup label="Service pillars">{pillars.map(pillar => <option key={pillar.key} value={pillar.title}>{pillar.verb} — {pillar.scope}</option>)}</optgroup>
        <optgroup label="Specific needs">{enquiryServices.map(x => <option key={x}>{x}</option>)}</optgroup>
      </select>)}
      {field('budget', p => <select {...p} defaultValue=""><option value="">Select a range</option>{budgets.map(x => <option key={x}>{x}</option>)}</select>, { optional: true })}
      {field('message', p => <textarea {...p} rows={5} maxLength={3000}/>, {
        optional: true, wide: true,
        hint: type === 'audit' ? 'What should the audit focus on? Any goals or concerns help us prepare.' : 'Where is your business today, and what are you trying to achieve?',
      })}
    </div>
    <div className="honeypot" aria-hidden="true"><label>Leave this field empty<input name="company_url" tabIndex={-1} autoComplete="off"/></label></div>
    {!ready && <div className="form-notice" role="note">
      <p><strong>Online enquiries aren’t connected on this version of the site.</strong> Nothing you type here can be sent yet.{directChannels.length ? ' Please contact us directly instead:' : ''}</p>
      {directChannels.length > 0 && <ul>{directChannels.map(c => <li key={c.key}><ChannelLink channel={c} location={`${location}_unconfigured`} className="inline-channel"><ChannelIcon channel={c} size={16}/>{c.detail}</ChannelLink></li>)}</ul>}
    </div>}
    <div className="form-foot">
      <button type="submit" className="button button-primary" disabled={!ready || status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Sending…' : type === 'audit' ? 'Request your audit' : 'Send enquiry'}<ArrowRight size={18} aria-hidden="true"/>
      </button>
      <p className="form-privacy">We’ll use these details only to respond to your enquiry. Please don’t include sensitive personal information. Read our <Link to="/privacy">privacy notice</Link>.</p>
    </div>
    <div className="form-status" aria-live="polite">
      {status.kind === 'sending' && <span className="visually-hidden">Sending your enquiry…</span>}
      {status.kind === 'error' && <p className="form-error" role="alert"><AlertCircle size={18} aria-hidden="true"/>{status.message}</p>}
    </div>
    {status.kind === 'error' && directChannels.length > 0 && <ul className="form-fallback">{directChannels.map(c => <li key={c.key}><ChannelLink channel={c} location={`${location}_error`} className="inline-channel"><ChannelIcon channel={c} size={16}/>{c.detail}</ChannelLink></li>)}</ul>}
  </form>
}
