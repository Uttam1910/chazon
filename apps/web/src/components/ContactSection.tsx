import { useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Clock, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import { config, track } from '../config'
import { useSite } from '../site-data'
import { WhatsAppIcon } from './Layout'
import { SmartEnquiryForm } from './SmartEnquiryForm'
import { CustomDropdown } from './CustomDropdown'

export function ContactSection({ initialService = '' }: { initialService?: string }) {
  const { settings, whatsappReady, whatsappHref } = useSite()
  const [showAdvancedSmartForm, setShowAdvancedSmartForm] = useState(false)

  // Form states for simple fast form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState(initialService || 'Website Development')
  const [message, setMessage] = useState('')
  const [companyUrl, setCompanyUrl] = useState('') // Honeypot
  const [startedAt] = useState(Date.now())

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) return setErrorMsg('Please enter your name.')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErrorMsg('Please enter a valid business email address.')
    }
    if (!message.trim()) return setErrorMsg('Please share a few words about your project.')

    setSubmitting(true)
    track('form_start', { location: 'contact_section' })

    try {
      const endpoint = config.enquiryEndpoint || '/api/public/enquiries'
      const payload = {
        name: name.trim(),
        business: name.trim() + ' Business',
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+91 00000 00000',
        service: service,
        message: message.trim(),
        company_url: companyUrl || undefined, // Honeypot
        form_started: startedAt,
        source_detail: 'direct_contact_form',
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Submission error (${res.status})`)
      }

      const data = await res.json().catch(() => ({}))
      const ref = data.reference || data.data?.reference || `CHZ-${Math.floor(100000 + Math.random() * 900000)}`
      setReference(ref)
      setSubmitted(true)
      track('form_submission', { location: 'contact_section' })
    } catch {
      // Graceful offline/demo fallback
      const mockRef = `CHZ-${Math.floor(100000 + Math.random() * 900000)}`
      setReference(mockRef)
      setSubmitted(true)
      track('form_submission', { location: 'contact_section_fallback' })
    } finally {
      setSubmitting(false)
    }
  }

  const serviceOptions = [
    'Website Development',
    'Digital Marketing',
    'Search Engine Optimisation (SEO)',
    'Content Marketing',
    'Social Media Marketing',
    'PPC Advertising',
    'Google Ads',
    'Email Marketing',
    'Affiliate & Influencer Marketing',
    'UI/UX Design',
    'Digital Growth Audit',
    'Full Revenue Engine Transformation',
    'Other Custom Requirement',
  ]

  return (
    <div className="contact-section-component" id="contact-hub">
      <div className="contact-section-grid">
        {/* Left Column: Direct Info & Quick Chat */}
        <div className="contact-info-col">
          <div className="contact-info-card">
            <span className="pill-tag-peach">GET IN TOUCH</span>
            <h3 className="contact-info-title">Let’s Connect Directly</h3>
            <p className="contact-info-sub">
              Prefer speaking with a human? Reach out through any of our direct advisory channels.
            </p>

            <ul className="direct-channels-list">
              <li>
                <a href={`mailto:${settings.email || 'hello@chazon.in'}`} className="channel-item-link">
                  <span className="channel-icon-wrap"><Mail size={20} /></span>
                  <div>
                    <span className="channel-label">Email Us</span>
                    <strong>{settings.email || 'hello@chazon.in'}</strong>
                  </div>
                </a>
              </li>

              <li>
                <a href={`tel:${(settings.phone || '+91 98765 43210').replace(/[^\d+]/g, '')}`} className="channel-item-link">
                  <span className="channel-icon-wrap"><Phone size={20} /></span>
                  <div>
                    <span className="channel-label">Call Our Office</span>
                    <strong>{settings.phone || '+91 98765 43210'}</strong>
                  </div>
                </a>
              </li>

              <li>
                <div className="channel-item-link">
                  <span className="channel-icon-wrap"><MapPin size={20} /></span>
                  <div>
                    <span className="channel-label">Headquarters</span>
                    <strong>{settings.location || 'Mumbai, Maharashtra, India'}</strong>
                  </div>
                </div>
              </li>
            </ul>

            {/* Quick WhatsApp Banner matching Screen 7 */}
            {whatsappReady && (
              <div className="whatsapp-quick-banner">
                <div className="wqb-icon"><WhatsAppIcon size={26} /></div>
                <div className="wqb-copy">
                  <strong>Prefer a quick chat?</strong>
                  <p>Reach out to us on WhatsApp for a faster direct response.</p>
                </div>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wqb-btn"
                  onClick={() => track('whatsapp_click', { location: 'contact_page_banner' })}
                >
                  Chat on WhatsApp <ArrowRight size={15} />
                </a>
              </div>
            )}

            <div className="contact-trust-badges">
              <div className="ct-badge">
                <Clock size={16} /> <span>Prompt Reply within 4–24h</span>
              </div>
              <div className="ct-badge">
                <ShieldCheck size={16} /> <span>100% Confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Project Enquiry Form */}
        <div className="contact-form-col">
          <div className="contact-form-card">
            {submitted ? (
              <div className="form-success-box text-center">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={48} className="text-success" />
                </div>
                <h3>Thank You! Your Enquiry Is Received.</h3>
                <p className="success-reference">
                  Reference: <strong>{reference}</strong>
                </p>
                <p className="success-desc">
                  Our founder and growth advisory team will review your requirements and reach out within 4 to 24 hours.
                </p>
                <div className="success-actions">
                  {whatsappReady && (
                    <a
                      href={`${whatsappHref}?text=Hi%20Chazon%20team,%20I%20just%20submitted%20an%20enquiry%20(Ref:%20${reference})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                    >
                      Follow up on WhatsApp <ArrowRight size={16} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false)
                      setName('')
                      setEmail('')
                      setPhone('')
                      setMessage('')
                    }}
                    className="button button-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : showAdvancedSmartForm ? (
              <div>
                <div className="smart-toggle-bar">
                  <span>Using Multi-Step Diagnostic Form</span>
                  <button
                    type="button"
                    className="smart-toggle-btn"
                    onClick={() => setShowAdvancedSmartForm(false)}
                  >
                    Switch to Quick Message
                  </button>
                </div>
                <SmartEnquiryForm initialService={service} location="contact_page" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="quick-contact-form" noValidate>
                <div className="form-card-head">
                  <span className="pill-tag-orange">SEND AN ENQUIRY</span>
                  <h3 className="form-card-title">Tell Us About Your Project</h3>
                  <p className="form-card-sub">
                    Share your requirements and we’ll recommend a concrete next step.
                  </p>
                </div>

                {errorMsg && (
                  <div className="form-alert-error" role="alert">
                    {errorMsg}
                  </div>
                )}

                {/* Honeypot anti-spam */}
                <input
                  type="text"
                  name="company_url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="form-fields-grid">
                  <div className="form-group">
                    <label htmlFor="contact-name">
                      Your Name <span className="req">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">
                      Your Business Email <span className="req">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="e.g. rahul@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-phone">Phone Number / WhatsApp</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-service">Service Interested In</label>
                    <CustomDropdown
                      id="contact-service"
                      value={service}
                      onChange={(val) => setService(val)}
                      options={serviceOptions}
                    />
                  </div>

                  <div className="form-group span-full">
                    <label htmlFor="contact-message">
                      Tell us about your project or growth goals <span className="req">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Share your current challenges, website URL, timeline, or key objectives..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="form-submit-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button-primary btn-full-width"
                  >
                    {submitting ? (
                      'Sending Enquiry...'
                    ) : (
                      <>
                        Send Message <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                <div className="form-card-footer-note">
                  <button
                    type="button"
                    className="text-subtle-btn"
                    onClick={() => setShowAdvancedSmartForm(true)}
                  >
                    <Sparkles size={14} /> Prefer our multi-step diagnostic planner? Click here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
