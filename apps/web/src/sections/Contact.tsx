import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, MessageCircle, SearchCheck } from 'lucide-react'
import { ChannelIcon, ChannelLink, Label } from '../components/Layout'
import { config, demoMode, sourceDetail, track } from '../config'
import { auditScope, budgets, enquiryServices } from '../content'
import { useSite } from '../site-data'
import type { EnquiryDetail, EnquiryMode } from '../actions'

function EnquiryForm({ mode, service, setService }: { mode: EnquiryMode; service: string; setService: (s: string) => void }) {
  const { industries, pillars } = useSite()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [started] = useState(() => Date.now())
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (data.company_url) return
    if (demoMode) {
      setBusy(true)
      await new Promise(r => setTimeout(r, 600))
      setBusy(false)
      setStatus('Demo mode: your enquiry would be received now. (Nothing was sent — no API is connected.)')
      form.reset(); setService('')
      return
    }
    if (!config.enquiryEndpoint) { setStatus('Online enquiries are not connected yet. Your details have not been sent. Please use the contact email when available.'); return }
    setBusy(true); setStatus('')
    try {
      const response = await fetch(config.enquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!response.ok) throw new Error('Submission failed')
      setStatus('Thank you. Your enquiry has been received. We look forward to learning about your business.')
      track('form_submission', { form: mode === 'audit' ? 'growth_audit' : 'growth_enquiry' })
      form.reset(); setService('')
    } catch { setStatus('Your enquiry could not be sent. Please try again or use the contact email.') } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="contact-form" aria-label={mode === 'audit' ? 'Digital Growth Audit request' : 'Enquiry form'}>
    <input type="hidden" name="enquiry_type" value={mode}/>
    <input type="hidden" name="form_started" value={started}/>
    <input type="hidden" name="source_detail" value={sourceDetail}/>
    <div className="form-grid">
      <label>Name <span aria-hidden="true">*</span><input name="name" autoComplete="name" required maxLength={100} placeholder="Your name"/></label>
      <label>Business name <span aria-hidden="true">*</span><input name="business" autoComplete="organization" required maxLength={150} placeholder="Your business"/></label>
      <label>Phone <span aria-hidden="true">*</span><input type="tel" name="phone" autoComplete="tel" required pattern="[+0-9\(\) .\-]{7,20}" title="Enter a phone number with 7–20 characters." placeholder="Your phone number"/></label>
      <label>Email <span aria-hidden="true">*</span><input type="email" name="email" autoComplete="email" required placeholder="you@business.com"/></label>
      <label>Website / Instagram<input name="website" placeholder="Website or @handle" maxLength={200}/></label>
      <label>Business category <span aria-hidden="true">*</span><select name="category" defaultValue="" required><option value="" disabled>Select your industry</option>{industries.map(([x]) => <option key={x}>{x}</option>)}<option>Other</option></select></label>
      <label>What do you need help with? <span aria-hidden="true">*</span><select name="service" value={service} onChange={e => setService(e.target.value)} required><option value="" disabled>Select a service</option><optgroup label="Service pillars">{pillars.map(p => <option key={p.title}>{p.title}</option>)}</optgroup><optgroup label="Specific needs">{enquiryServices.map(x => <option key={x}>{x}</option>)}</optgroup></select></label>
      <label>Monthly marketing budget <small>(optional)</small><select name="budget" defaultValue=""><option value="">Select a range</option>{budgets.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="full">Message<textarea name="message" rows={4} maxLength={3000} placeholder={mode === 'audit' ? 'What would you like the audit to focus on?' : 'Where is your business today, and what are you trying to achieve?'}/></label>
    </div>
    <div className="honeypot" aria-hidden="true"><label>Leave blank<input name="company_url" tabIndex={-1} autoComplete="off"/></label></div>
    <p className="form-note">Fields marked * are required. We’ll use these details only to respond to your enquiry — please don’t include sensitive information.</p>
    {!config.enquiryEndpoint && !demoMode && <p className="setup-notice">Enquiry form preview — online submission is awaiting configuration.</p>}
    <button type="submit" className="button" disabled={busy}>{busy ? 'Sending…' : mode === 'audit' ? 'Request Your Audit' : 'Send Enquiry'}<ArrowUpRight size={18} aria-hidden="true"/></button>
    <p className="form-status" role="status">{status}</p>
  </form>
}

export function Contact() {
  const { directChannels, socialChannels, settings } = useSite()
  const [mode, setMode] = useState<EnquiryMode | null>(null)
  const [service, setService] = useState('')
  const choose = useCallback((next: EnquiryMode, preset?: string) => {
    setMode(next)
    if (preset) setService(preset)
    else if (next === 'audit') setService('Digital Growth Audit')
    else setService(s => (s === 'Digital Growth Audit' ? '' : s))
    track('enquiry_open', { mode: next })
  }, [])
  useEffect(() => {
    const open = (e: Event) => { const { mode: next, service: preset } = (e as CustomEvent<EnquiryDetail>).detail; choose(next, preset) }
    window.addEventListener('chazon:enquiry', open)
    return () => window.removeEventListener('chazon:enquiry', open)
  }, [choose])
  // Links from other pages (/?enquiry=audit#contact) arrive with the form already open in the right mode.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('enquiry')
    if (requested !== 'talk' && requested !== 'audit') return
    choose(requested)
    window.history.replaceState(null, '', `/${window.location.hash}`)
  }, [choose])
  const options = [
    ['talk', settings.ctaTalkLabel, 'A conversation about your goals and where digital can help.', MessageCircle],
    ['audit', settings.ctaAuditLabel, 'A structured review of how hard your digital presence is working.', SearchCheck],
  ] as const
  return <section id="contact" data-nav="contact" className="section contact" aria-labelledby="contact-title">
    <div className="container">
      <div className="contact-grid">
        <div className="contact-lead">
          <Label>Let’s talk</Label>
          <h2 id="contact-title">Let’s build your next <em>digital growth engine.</em></h2>
          <p className="lead">Tell us where your business is today, what you’re trying to achieve, and where you’re stuck.</p>
          {settings.location && <p className="contact-meta">Based in <strong>{settings.location}</strong></p>}
        </div>
        {/* Three connected steps — Talk → Connect → Grow. Each channel is a direct action and appears only once configured. */}
        <div className="connect" role="group" aria-labelledby="connect-title">
          <p className="connect-head"><span id="connect-title">Connect with Chazon</span><span aria-hidden="true">Talk → Connect → Grow</span></p>
          <ol className="connect-steps">
            <li>
              <span className="connect-marker" aria-hidden="true">01</span>
              <h3>Talk</h3>
              <div className="choices" role="group" aria-label="How would you like to start?">
                {options.map(([key, title, text, Icon]) => <button type="button" key={key} className="choice" aria-expanded={mode === key} aria-controls="enquiry" onClick={() => choose(key)}>
                  <Icon size={20} aria-hidden="true"/><strong>{title}</strong><span>{text}</span><ArrowUpRight className="choice-arrow" size={18} aria-hidden="true"/>
                </button>)}
              </div>
            </li>
            <li>
              <span className="connect-marker" aria-hidden="true">02</span>
              <h3>Connect directly</h3>
              {directChannels.length
                ? <ul className="direct-list">{directChannels.map(c => <li key={c.key}><ChannelLink channel={c} location="contact" className={`direct-link ${c.key === 'whatsapp' ? 'is-primary' : ''}`}>
                    <span className="channel-icon"><ChannelIcon channel={c}/></span><span className="channel-text"><strong>{c.label}</strong><small>{c.detail}</small></span><ArrowUpRight className="channel-arrow" size={18} aria-hidden="true"/>
                  </ChannelLink></li>)}</ul>
                : <p className="connect-pending">WhatsApp, email and phone details will appear here once confirmed.</p>}
            </li>
            <li>
              <span className="connect-marker" aria-hidden="true">03</span>
              <h3>Grow with us</h3>
              {socialChannels.length
                ? <ul className="social-list">{socialChannels.map(c => <li key={c.key}><ChannelLink channel={c} location="contact" className="social-link"><ChannelIcon channel={c} size={18}/><span>{c.label}</span></ChannelLink></li>)}</ul>
                : <p className="connect-pending">Official Instagram, LinkedIn and Facebook profiles will appear here once confirmed.</p>}
            </li>
          </ol>
        </div>
      </div>
      <div id="enquiry" className={`enquiry ${mode === 'audit' ? 'is-audit' : ''}`} hidden={!mode}>
        {mode && <>
          <aside className="enquiry-aside">
            {mode === 'audit'
              ? <><h3>What the audit looks at</h3><ol>{auditScope.map((x, i) => <li key={x}><span>{String(i + 1).padStart(2, '0')}</span>{x}</li>)}</ol><p>You’ll get a clear view of where the pieces could work better together. Scope and commercial terms are confirmed before any work begins.</p></>
              : <><h3>What happens next</h3><ol>{['Share where your business is today and what you want to achieve.', 'We arrange a conversation to understand your objectives.', 'We recommend a practical next step — a project, ongoing support or an audit.'].map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol><p>A specific project or a long-term growth partner — we’ll find the right fit.</p></>}
          </aside>
          <EnquiryForm mode={mode} service={service} setService={setService}/>
        </>}
      </div>
    </div>
  </section>
}
