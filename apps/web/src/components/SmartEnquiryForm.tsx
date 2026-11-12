import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Laptop,
  Lock,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { EnquiryCategory } from '@chazon/shared'
import { config, demoMode, getEnquiryEndpoints, sourceDetail, track } from '../config'
import { useRouter } from '../location'
import { CustomDropdown } from './CustomDropdown'

export type { EnquiryCategory }

export const ENQUIRY_CATEGORIES: {
  id: EnquiryCategory
  number: string
  title: string
  subtitle: string
  desc: string
  icon: typeof Laptop
  highlight: string
}[] = [
  {
    id: 'BUILD',
    number: '01',
    title: 'BUILD',
    subtitle: 'Website development, redesign and digital platforms',
    desc: 'High-performing business websites, web applications and client portals built for conversion.',
    icon: Laptop,
    highlight: 'Digital Foundation',
  },
  {
    id: 'GROW',
    number: '02',
    title: 'GROW',
    subtitle: 'SEO, digital marketing, content and audience growth',
    desc: 'First-page Google rankings, qualified organic traffic, content strategy and search visibility.',
    icon: TrendingUp,
    highlight: 'Organic Demand',
  },
  {
    id: 'CONVERT',
    number: '03',
    title: 'CONVERT',
    subtitle: 'Lead generation, landing pages, CRO and sales conversion',
    desc: 'High-converting landing pages, lead generation funnels and journey optimisation.',
    icon: Target,
    highlight: 'Conversion Engine',
  },
  {
    id: 'AUTOMATE',
    number: '04',
    title: 'AUTOMATE',
    subtitle: 'CRM, WhatsApp Business API, email and workflow automation',
    desc: 'Instant WhatsApp lead responses, automated nurture sequences and CRM integrations.',
    icon: Zap,
    highlight: 'Workflow Automation',
  },
  {
    id: 'E-COMMERCE',
    number: '05',
    title: 'E-COMMERCE',
    subtitle: 'Online stores, product catalogues, payments and e-commerce',
    desc: 'Modern online stores, streamlined checkouts, payment gateway integration and catalog systems.',
    icon: ShoppingBag,
    highlight: 'Digital Commerce',
  },
  {
    id: 'AI',
    number: '06',
    title: 'AI',
    subtitle: 'AI integrations, intelligent automation and custom AI solutions',
    desc: 'Intelligent 24/7 customer assistants, smart triage and bespoke AI workflow integrations.',
    icon: Bot,
    highlight: 'Intelligent AI',
  },
]

export function normalizeCategory(val: string | null | undefined): EnquiryCategory | null {
  if (!val) return null
  const clean = val.trim().toUpperCase()
  if (['BUILD', 'WEBSITE', 'WEBSITE-DEVELOPMENT', 'DEVELOPMENT', 'DESIGN', 'UI-UX'].includes(clean)) return 'BUILD'
  if (['GROW', 'SEO', 'MARKETING', 'DIGITAL-MARKETING', 'CONTENT', 'PPC', 'GOOGLE-ADS'].includes(clean)) return 'GROW'
  if (['CONVERT', 'CRO', 'LANDING-PAGE', 'LEAD-GEN', 'CONVERSION'].includes(clean)) return 'CONVERT'
  if (['AUTOMATE', 'AUTOMATION', 'CRM', 'WHATSAPP', 'WORKFLOW'].includes(clean)) return 'AUTOMATE'
  if (['E-COMMERCE', 'ECOMMERCE', 'COMMERCE', 'STORE', 'SHOPIFY'].includes(clean)) return 'E-COMMERCE'
  if (['AI', 'ARTIFICIAL-INTELLIGENCE', 'INTELLIGENT'].includes(clean)) return 'AI'
  return null
}

const BUDGET_OPTIONS = [
  'Under ₹50,000',
  '₹50,000–₹1,50,000',
  '₹1,50,000–₹3,00,000',
  '₹3,00,000–₹5,00,000',
  'Enterprise (₹5,00,000+)',
]

const TIMELINE_OPTIONS = [
  'Immediate (1–2 weeks)',
  'Within 1 month',
  '1–3 months',
  'Flexible / Exploring',
]

const SERVICE_DROPDOWN_OPTIONS = [
  { value: 'Website Development (BUILD)', label: 'Website Development & Redesign (BUILD)' },
  { value: 'SEO & Organic Growth (GROW)', label: 'SEO & Organic Search Visibility (GROW)' },
  { value: 'Digital Marketing & Ads (GROW)', label: 'Paid Advertising & Digital Marketing (GROW)' },
  { value: 'Conversion Rate Optimisation (CONVERT)', label: 'Landing Pages & CRO (CONVERT)' },
  { value: 'WhatsApp & CRM Automation (AUTOMATE)', label: 'WhatsApp & CRM Automation (AUTOMATE)' },
  { value: 'E-Commerce Online Store (E-COMMERCE)', label: 'E-Commerce Store & Payments (E-COMMERCE)' },
  { value: 'Custom AI Integration (AI)', label: 'Custom AI Assistants & Workflow AI (AI)' },
  { value: 'Full-Funnel Growth Partnership', label: 'Full-Funnel Digital Growth Partnership' },
  { value: 'General Consultation / Other', label: 'General Consultation / Other Enquiry' },
]

export interface SmartEnquiryFormProps {
  initialCategory?: EnquiryCategory
  initialGoal?: string
  initialService?: string
  auditUrl?: string
  auditRef?: string
  auditScore?: string | number
  location?: string
  onComplete?: (ref: string) => void
}

export function SmartEnquiryForm({
  initialCategory,
  initialService,
  auditUrl,
  auditRef,
  auditScore,
  location = 'contact_page',
  onComplete,
}: SmartEnquiryFormProps) {
  const router = useRouter()
  const started = useRef(Date.now())

  // Parse URL search parameters on client & SSR
  const getUrlParams = () => {
    if (router?.search) return new URLSearchParams(router.search)
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search)
    return new URLSearchParams()
  }

  const params = getUrlParams()
  const detectedCategory =
    normalizeCategory(initialCategory) ||
    normalizeCategory(params.get('type') || params.get('category') || params.get('service')) ||
    (initialService ? normalizeCategory(initialService) : null)

  const effectiveAuditUrl = auditUrl || params.get('url') || undefined
  const effectiveAuditRef = auditRef || params.get('ref') || undefined
  const effectiveAuditScore = auditScore || params.get('score') || undefined

  // Mode: 'planner' (Interactive 3-step scope) vs 'message' (Quick contact form)
  // Defaults to 'planner' if a specific type/service/audit is in URL; otherwise 'message' for fast drop-in note.
  const [mode, setMode] = useState<'message' | 'planner'>(() => {
    if (params.get('mode') === 'planner' || detectedCategory || effectiveAuditUrl) {
      return 'planner'
    }
    return 'message'
  })

  // -------------------------------------------------------------
  // Quick Message Form State
  // -------------------------------------------------------------
  const [quickName, setQuickName] = useState('')
  const [quickEmail, setQuickEmail] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickBusiness, setQuickBusiness] = useState('')
  const [quickService, setQuickService] = useState(() => {
    if (detectedCategory === 'BUILD') return 'Website Development (BUILD)'
    if (detectedCategory === 'GROW') return 'SEO & Organic Growth (GROW)'
    if (detectedCategory === 'CONVERT') return 'Conversion Rate Optimisation (CONVERT)'
    if (detectedCategory === 'AUTOMATE') return 'WhatsApp & CRM Automation (AUTOMATE)'
    if (detectedCategory === 'E-COMMERCE') return 'E-Commerce Online Store (E-COMMERCE)'
    if (detectedCategory === 'AI') return 'Custom AI Integration (AI)'
    return 'Website Development (BUILD)'
  })
  const [quickMessage, setQuickMessage] = useState('')

  // -------------------------------------------------------------
  // Interactive Planner State (3 concise steps: 1. Focus -> 2. Scope -> 3. Info)
  // -------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<EnquiryCategory>(() => detectedCategory || 'BUILD')
  const [plannerStep, setPlannerStep] = useState<number>(() => (detectedCategory ? 2 : 1))

  // Step 2 Specs per category
  const [buildType, setBuildType] = useState('Business Website (Lead Gen)')
  const [buildScale, setBuildScale] = useState('6–15 pages (Standard)')
  const [buildFeatures, setBuildFeatures] = useState<string[]>(['CRM / Lead Routing', 'WhatsApp Integration'])
  const [buildRefUrl, setBuildRefUrl] = useState('')

  const [growGoal, setGrowGoal] = useState('First-page Google rankings & SEO')
  const [growUrl, setGrowUrl] = useState('')
  const [growFocus, setGrowFocus] = useState('High-intent commercial keywords')

  const [convertUrl, setConvertUrl] = useState('')
  const [convertGoal, setConvertGoal] = useState('Increase qualified lead generation')
  const [convertProblem, setConvertProblem] = useState('Visitors leave without enquiring')

  const [autoTool, setAutoTool] = useState('Looking for guidance on CRM setup')
  const [autoNeeds, setAutoNeeds] = useState<string[]>(['WhatsApp Instant Reply', 'Lead Routing to Team'])

  const [ecomPlatform, setEcomPlatform] = useState('Shopify')
  const [ecomCatalog, setEcomCatalog] = useState('10–100 products')

  const [aiFocus, setAiFocus] = useState('24/7 Smart Customer Assistant')
  const [aiDetails, setAiDetails] = useState('')

  // Shared Scope Investment
  const [selectedBudget, setSelectedBudget] = useState('₹50,000–₹1,50,000')
  const [selectedTimeline, setSelectedTimeline] = useState('Within 1 month')

  // Step 3 Contact info
  const [plannerName, setPlannerName] = useState('')
  const [plannerEmail, setPlannerEmail] = useState('')
  const [plannerPhone, setPlannerPhone] = useState('')
  const [plannerBusiness, setPlannerBusiness] = useState('')
  const [plannerNote, setPlannerNote] = useState('')

  // Submission & UI feedback state
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    reference: string
    name: string
    whatsAppHref?: string
  } | null>(null)

  // Track start
  useEffect(() => {
    track('form_start', { form: mode === 'planner' ? 'interactive_scope' : 'quick_message', location })
  }, [mode, location])

  const toggleFeature = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const submitEnquiryPayload = async (
    payload: Record<string, unknown>,
    meta: { form: 'quick_message' | 'interactive_scope'; name: string; errorKeyMap: Record<string, string> },
  ) => {
    setBusy(true)
    const endpoints = getEnquiryEndpoints()
    let res: Response | null = null

    try {
      for (const endpoint of endpoints) {
        try {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          break
        } catch {
          res = null
        }
      }

      if (!res) {
        throw new Error('Network error')
      }

      if (res.ok) {
        const json = await res.json().catch(() => ({})) as { data?: { reference?: string; whatsAppHref?: string }; reference?: string; whatsAppHref?: string }
        const data = json.data ?? json
        const ref = data.reference || `CHZ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        setSuccessData({
          reference: ref,
          name: meta.name,
          whatsAppHref: data.whatsAppHref,
        })
        setIsSuccess(true)
        track('form_submit_success', { form: meta.form, reference: ref })
        if (onComplete) onComplete(ref)
        return
      }

      const errJson = await res.json().catch(() => ({})) as { error?: { message?: string; details?: Record<string, string> } }
      const details = errJson.error?.details
      const mappedErrors: Record<string, string> = {}
      const unmappedMessages: string[] = []

      if (details) {
        for (const [key, detailMsg] of Object.entries(details)) {
          const targetKey = meta.errorKeyMap[key]
          if (targetKey) mappedErrors[targetKey] = detailMsg
          else unmappedMessages.push(detailMsg)
        }
      }

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors(mappedErrors)
      }

      const msg =
        unmappedMessages[0] ||
        errJson.error?.message ||
        'Submission failed. Please check the fields and try again.'
      setErrorMessage(msg)
    } catch {
      if (demoMode) {
        const ref = `CHZ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        setSuccessData({ reference: ref, name: meta.name })
        setIsSuccess(true)
        if (onComplete) onComplete(ref)
      } else {
        setErrorMessage('We could not reach the server. Please check your connection or contact us via WhatsApp.')
      }
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------
  // Quick Message Submit Handler
  // -------------------------------------------------------------
  const handleQuickSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const errors: Record<string, string> = {}

    if (!quickName.trim() || quickName.trim().length < 2) {
      errors.quickName = 'Please enter your name.'
    }
    if (!quickEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(quickEmail.trim())) {
      errors.quickEmail = 'Please enter a valid work email address.'
    }
    if (!quickMessage.trim() || quickMessage.trim().length < 5) {
      errors.quickMessage = 'Please enter a short message describing your requirement.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    const serviceCategoryTag = quickService.match(/\(([^)]+)\)$/)?.[1]
    const payload = {
      name: quickName.trim(),
      email: quickEmail.trim(),
      phone: quickPhone.trim() || undefined,
      business: quickBusiness.trim() || 'Not specified',
      service: quickService,
      category: normalizeCategory(serviceCategoryTag || quickService) || 'BUILD',
      message: quickMessage.trim(),
      auditRef: effectiveAuditRef,
      form_started: started.current,
      source_detail: sourceDetail(),
    }

    await submitEnquiryPayload(payload, {
      form: 'quick_message',
      name: quickName.trim(),
      errorKeyMap: { name: 'quickName', email: 'quickEmail', message: 'quickMessage' },
    })
  }

  // -------------------------------------------------------------
  // Interactive Scope Planner Submit Handler
  // -------------------------------------------------------------
  const handlePlannerSubmit = async () => {
    setErrorMessage(null)
    const errors: Record<string, string> = {}

    if (!plannerName.trim() || plannerName.trim().length < 2) {
      errors.plannerName = 'Please enter your name.'
    }
    if (!plannerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(plannerEmail.trim())) {
      errors.plannerEmail = 'Please enter a valid work email address.'
    }
    if (!plannerPhone.trim() || plannerPhone.trim().length < 7) {
      errors.plannerPhone = 'Please enter a phone or WhatsApp number.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    // Assemble category-specific answers
    const dynamicAnswers: Record<string, unknown> = {}
    if (selectedCategory === 'BUILD') {
      dynamicAnswers.build = {
        websiteType: buildType,
        pageCount: buildScale,
        features: buildFeatures,
        referenceUrl: buildRefUrl || undefined,
      }
    } else if (selectedCategory === 'GROW') {
      dynamicAnswers.grow = {
        primaryGoal: growGoal,
        websiteUrl: growUrl || undefined,
        focus: growFocus,
      }
    } else if (selectedCategory === 'CONVERT') {
      dynamicAnswers.convert = {
        websiteUrl: convertUrl || undefined,
        targetAction: convertGoal,
        conversionProblem: convertProblem,
      }
    } else if (selectedCategory === 'AUTOMATE') {
      dynamicAnswers.automate = {
        currentCrm: autoTool,
        automations: autoNeeds,
      }
    } else if (selectedCategory === 'E-COMMERCE') {
      dynamicAnswers.ecommerce = {
        platform: ecomPlatform,
        productCount: ecomCatalog,
      }
    } else if (selectedCategory === 'AI') {
      dynamicAnswers.ai = {
        capability: aiFocus,
        details: aiDetails || undefined,
      }
    }

    const payload = {
      category: selectedCategory,
      goals: [selectedCategory],
      dynamicAnswers,
      business: {
        businessName: plannerBusiness.trim() || 'Not specified',
        industry: 'General',
      },
      budget: selectedBudget,
      timeline: selectedTimeline,
      contact: {
        name: plannerName.trim(),
        email: plannerEmail.trim(),
        phone: plannerPhone.trim(),
        preferredContact: 'WhatsApp',
        message: plannerNote.trim() || `${selectedCategory} Project Scope Enquiry`,
        consentToContact: true,
      },
      auditRef: effectiveAuditRef,
      auditSummary: effectiveAuditScore ? { overallScore: Number(effectiveAuditScore) } : undefined,
      form_started: started.current,
      source_detail: sourceDetail(),
    }

    await submitEnquiryPayload(payload, {
      form: 'interactive_scope',
      name: plannerName.trim(),
      errorKeyMap: {
        'contact.name': 'plannerName',
        'contact.email': 'plannerEmail',
        'contact.phone': 'plannerPhone',
      },
    })
  }

  // Active Category Meta
  const activeCategoryMeta = ENQUIRY_CATEGORIES.find(c => c.id === selectedCategory)

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (isSuccess && successData) {
    const waDigits = config.whatsapp.replace(/\D/g, '') || '919820000000'
    const defaultWa = `https://wa.me/${waDigits}?text=${encodeURIComponent(
      `Hi Chazon team, I just submitted an enquiry (Ref: ${successData.reference}). Looking forward to discussing our project.`
    )}`

    return (
      <div className="smart-success-card">
        <div className="ssc-check-wrap" aria-hidden="true">
          <CheckCircle2 size={44} />
        </div>
        <h2 className="ssc-title">Enquiry Received</h2>
        <p className="ssc-intro">
          Thank you, <strong>{successData.name}</strong>. Your project enquiry has been routed directly to our
          founding team.
        </p>

        <div className="ssc-ref-box">
          <span className="ssc-ref-label">Reference Code</span>
          <strong className="ssc-ref-code mono">{successData.reference}</strong>
        </div>

        <div className="ssc-steps-list">
          <div className="ssc-step-item">
            <span className="ssc-step-num mono">01</span>
            <span>Founder & growth team review your requirements and verify strategic fit.</span>
          </div>
          <div className="ssc-step-item">
            <span className="ssc-step-num mono">02</span>
            <span>We prepare a direct, actionable scope roadmap tailored to your goals.</span>
          </div>
          <div className="ssc-step-item">
            <span className="ssc-step-num mono">03</span>
            <span>We reach out directly via WhatsApp or Email within 4–24 hours.</span>
          </div>
        </div>

        <div className="ssc-actions">
          <a
            href={successData.whatsAppHref || defaultWa}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-whatsapp"
          >
            <MessageCircle size={18} aria-hidden="true" />
            <span>Chat on WhatsApp with Reference</span>
          </a>

          <button
            type="button"
            className="ssc-reset-btn"
            onClick={() => {
              setIsSuccess(false)
              setSuccessData(null)
              setPlannerStep(1)
            }}
          >
            Submit Another Enquiry
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // MAIN FORM RENDER (DUAL MODE: QUICK MESSAGE VS INTERACTIVE PLANNER)
  // -------------------------------------------------------------
  return (
    <div className="smart-enquiry-container">
      {/* Top Dual Mode Switcher Tabs */}
      <div className="contact-mode-switcher" role="tablist" aria-label="Choose enquiry format">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'message'}
          className={`cms-tab ${mode === 'message' ? 'is-active' : ''}`}
          onClick={() => {
            setMode('message')
            setErrorMessage(null)
            setFieldErrors({})
          }}
        >
          <MessageSquare size={15} aria-hidden="true" />
          <span>Quick Message</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'planner'}
          className={`cms-tab ${mode === 'planner' ? 'is-active' : ''}`}
          onClick={() => {
            setMode('planner')
            setErrorMessage(null)
            setFieldErrors({})
          }}
        >
          <Sparkles size={15} aria-hidden="true" />
          <span>Interactive Scope Planner</span>
          <span className="cms-badge">Fast</span>
        </button>
      </div>

      {errorMessage && (
        <div className="smart-error-banner" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================
          MODE 1: QUICK MESSAGE (Standard / Random Contact Form)
          Matches visual reference: "Send us a message"
          ========================================================= */}
      {mode === 'message' && (
        <form className="quick-message-form" onSubmit={handleQuickSubmit} noValidate>
          <div className="qmf-head">
            <h2 className="qmf-title">Send us a message</h2>
            <p className="qmf-desc">
              Have a question or project requirement? Share a few details and we will get back to you promptly.
            </p>
          </div>

          <div className="qmf-fields">
            {/* Your Name */}
            <label className="smart-label">
              Your Name <span className="req">*</span>
              <input
                type="text"
                required
                className={`smart-input ${fieldErrors.quickName ? 'is-invalid' : ''}`}
                placeholder="Enter your name"
                value={quickName}
                onChange={e => {
                  setQuickName(e.target.value)
                  if (e.target.value.trim().length >= 2) {
                    setFieldErrors(prev => ({ ...prev, quickName: '' }))
                  }
                }}
              />
              {fieldErrors.quickName && <span className="field-error-msg">{fieldErrors.quickName}</span>}
            </label>

            {/* Email Address */}
            <label className="smart-label">
              Email Address <span className="req">*</span>
              <input
                type="email"
                required
                className={`smart-input ${fieldErrors.quickEmail ? 'is-invalid' : ''}`}
                placeholder="Enter your work email"
                value={quickEmail}
                onChange={e => {
                  setQuickEmail(e.target.value)
                  if (e.target.value.includes('@')) {
                    setFieldErrors(prev => ({ ...prev, quickEmail: '' }))
                  }
                }}
              />
              {fieldErrors.quickEmail && <span className="field-error-msg">{fieldErrors.quickEmail}</span>}
            </label>

            {/* Phone or WhatsApp */}
            <label className="smart-label">
              Phone or WhatsApp (Optional)
              <input
                type="tel"
                className="smart-input"
                placeholder="+91 98200 00000"
                value={quickPhone}
                onChange={e => setQuickPhone(e.target.value)}
              />
            </label>

            {/* Your Business */}
            <label className="smart-label">
              Your Business (Optional)
              <input
                type="text"
                className="smart-input"
                placeholder="e.g. E-commerce, Consulting, Healthcare"
                value={quickBusiness}
                onChange={e => setQuickBusiness(e.target.value)}
              />
            </label>

            {/* Service or Enquiry Type */}
            <div className="smart-label">
              Service or Enquiry Type
              <CustomDropdown
                value={quickService}
                onChange={val => setQuickService(val)}
                options={SERVICE_DROPDOWN_OPTIONS}
              />
            </div>

            {/* Message */}
            <label className="smart-label">
              How can we help you? <span className="req">*</span>
              <textarea
                required
                rows={4}
                className={`smart-textarea ${fieldErrors.quickMessage ? 'is-invalid' : ''}`}
                placeholder="Tell us about your requirement, goal or project..."
                value={quickMessage}
                onChange={e => {
                  setQuickMessage(e.target.value)
                  if (e.target.value.trim().length >= 5) {
                    setFieldErrors(prev => ({ ...prev, quickMessage: '' }))
                  }
                }}
              />
              {fieldErrors.quickMessage && (
                <span className="field-error-msg">{fieldErrors.quickMessage}</span>
              )}
            </label>
          </div>

          <button type="submit" className="button button-primary qmf-submit-btn" disabled={busy}>
            {busy ? (
              <>
                <RefreshCw size={16} className="spin" aria-hidden="true" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>

          <div className="smart-privacy-assurance">
            <Lock size={14} aria-hidden="true" />
            <span>We respect your privacy. Your information is kept strictly confidential.</span>
          </div>
        </form>
      )}

      {/* =========================================================
          MODE 2: INTERACTIVE SCOPE PLANNER (3 Fast, Simple Steps!)
          Step 1: Focus Area (1 Click)
          Step 2: Key Specifications & Scale
          Step 3: Contact Details & Proposal Request
          ========================================================= */}
      {mode === 'planner' && (
        <div className="planner-flow-wrapper">
          {/* 3-Step Progress Indicator */}
          <div className="smart-progress-bar" aria-label={`Step ${plannerStep} of 3`}>
            <div className="smart-progress-head">
              <span className="mono step-tag">Step 0{plannerStep} of 03</span>
              <span className="step-title-hint">
                {plannerStep === 1 && 'Choose Focus'}
                {plannerStep === 2 && `${activeCategoryMeta?.title || 'Scope'} Specifications`}
                {plannerStep === 3 && 'Contact & Proposal'}
              </span>
            </div>
            <div className="smart-progress-track">
              <div
                className="smart-progress-fill"
                style={{ width: `${(plannerStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: Focus Area (1-Click Select & Advance) */}
          {plannerStep === 1 && (
            <div className="planner-step-body">
              <div className="planner-step-intro">
                <h2 className="planner-step-title">Select Your Focus Area</h2>
                <p className="planner-step-desc">
                  Choose the primary area where your business needs digital growth.
                </p>
              </div>

              <div className="smart-category-grid" role="radiogroup" aria-label="Enquiry categories">
                {ENQUIRY_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`smart-category-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setPlannerStep(2)
                      }}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className="smart-card-top">
                        <span className="smart-card-num mono">{cat.number}</span>
                        <span className="smart-card-icon">
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <span className="smart-card-check">
                          {isSelected ? <Check size={14} aria-hidden="true" /> : null}
                        </span>
                      </div>
                      <strong className="smart-card-title">{cat.title}</strong>
                      <span className="smart-card-subtitle">{cat.subtitle}</span>
                      <p className="smart-card-desc">{cat.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Key Specifications & Scale */}
          {plannerStep === 2 && activeCategoryMeta && (
            <div className="planner-step-body">
              {/* Category Pill with Change link */}
              <div className="smart-category-pill-bar">
                <div className="scpb-left">
                  <span className="scpb-badge">{activeCategoryMeta.title}</span>
                  <span className="scpb-subtitle">{activeCategoryMeta.subtitle}</span>
                </div>
                <button
                  type="button"
                  className="scpb-change-btn"
                  onClick={() => setPlannerStep(1)}
                  aria-label="Change category"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  <span>Change</span>
                </button>
              </div>

              <div className="planner-step-intro">
                <h2 className="planner-step-title">{activeCategoryMeta.title} Specifications</h2>
                <p className="planner-step-desc">
                  Tailor the essential scope and priorities for your {activeCategoryMeta.title.toLowerCase()} solution.
                </p>
              </div>

              {/* Dynamic inputs per category */}
              <div className="smart-dynamic-box">
                {selectedCategory === 'BUILD' && (
                  <>
                    <div className="smart-label">
                      Website / Application Type
                      <CustomDropdown
                        value={buildType}
                        onChange={val => setBuildType(val)}
                        options={[
                          { value: 'Business Website (Lead Gen)', label: 'Business Website (Lead Generation)' },
                          { value: 'High-Converting Landing Page', label: 'High-Converting Landing Page' },
                          { value: 'Existing Website Redesign', label: 'Existing Website Redesign & Modernisation' },
                          { value: 'Custom Web Application / SaaS', label: 'Custom Web Application / Portal' },
                          { value: 'Portfolio / Practice Showcase', label: 'Portfolio / Practice Showcase' },
                        ]}
                      />
                    </div>

                    <div className="smart-label">
                      Approximate Scope & Page Count
                      <CustomDropdown
                        value={buildScale}
                        onChange={val => setBuildScale(val)}
                        options={[
                          { value: '1–5 pages (Focused)', label: '1–5 pages (Focused / Single-page)' },
                          { value: '6–15 pages (Standard)', label: '6–15 pages (Standard Corporate Site)' },
                          { value: '15–30 pages (Multi-service)', label: '15–30 pages (Multi-service / Catalog)' },
                          { value: '30+ pages (Enterprise)', label: '30+ pages (Enterprise / Large Portal)' },
                        ]}
                      />
                    </div>

                    <div>
                      <span className="smart-label">Key Features Needed</span>
                      <div className="smart-checkbox-grid">
                        {[
                          'CRM / Lead Routing',
                          'WhatsApp Integration',
                          'Blog / Content Hub',
                          'Payment Gateway',
                          'Multi-language Support',
                          'Client Portal',
                        ].map(feat => {
                          const checked = buildFeatures.includes(feat)
                          return (
                            <button
                              key={feat}
                              type="button"
                              className={`smart-check-card ${checked ? 'is-checked' : ''}`}
                              onClick={() => toggleFeature(buildFeatures, setBuildFeatures, feat)}
                            >
                              <span className={`custom-chk ${checked ? 'is-active' : ''}`}>
                                {checked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <span>{feat}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <label className="smart-label">
                      Design Reference or Current Website URL (Optional)
                      <input
                        type="url"
                        className="smart-input"
                        placeholder="https://example.com"
                        value={buildRefUrl}
                        onChange={e => setBuildRefUrl(e.target.value)}
                      />
                    </label>
                  </>
                )}

                {selectedCategory === 'GROW' && (
                  <>
                    <div className="smart-label">
                      Primary SEO & Growth Objective
                      <CustomDropdown
                        value={growGoal}
                        onChange={val => setGrowGoal(val)}
                        options={[
                          { value: 'First-page Google rankings & SEO', label: 'First-Page Google Rankings & Organic Traffic' },
                          { value: 'Qualified commercial lead generation', label: 'More Qualified Inbound Leads & Calls' },
                          { value: 'Local search & Google Business Profile', label: 'Local Search & Google Business Profile' },
                          { value: 'Paid Google & Meta Ads ROI', label: 'Paid Advertising (Google & Meta Ads) Optimisation' },
                          { value: 'Content & Authority Marketing', label: 'Strategic Commercial Content & Authority' },
                        ]}
                      />
                    </div>

                    <label className="smart-label">
                      Current Website URL (Optional)
                      <input
                        type="url"
                        className="smart-input"
                        placeholder="https://yourbusiness.com"
                        value={growUrl}
                        onChange={e => setGrowUrl(e.target.value)}
                      />
                    </label>

                    <label className="smart-label">
                      Priority Target Keyword or Challenge
                      <input
                        type="text"
                        className="smart-input"
                        placeholder="e.g. Outranking competitors for industrial equipment"
                        value={growFocus}
                        onChange={e => setGrowFocus(e.target.value)}
                      />
                    </label>
                  </>
                )}

                {selectedCategory === 'CONVERT' && (
                  <>
                    <label className="smart-label">
                      Existing Website or Landing Page URL
                      <input
                        type="url"
                        className="smart-input"
                        placeholder="https://yourbusiness.com"
                        value={convertUrl}
                        onChange={e => setConvertUrl(e.target.value)}
                      />
                    </label>

                    <div className="smart-label">
                      Primary Conversion Goal
                      <CustomDropdown
                        value={convertGoal}
                        onChange={val => setConvertGoal(val)}
                        options={[
                          { value: 'Increase qualified lead generation', label: 'Increase Qualified Enquiries / Calls' },
                          { value: 'Improve WhatsApp clicks to chat', label: 'Increase WhatsApp Inbound Conversations' },
                          { value: 'Higher landing page opt-ins', label: 'Higher Conversion on Paid Ad Traffic' },
                          { value: 'Checkout / purchase rate', label: 'Lower Drop-off at Checkout' },
                        ]}
                      />
                    </div>

                    <label className="smart-label">
                      Main Challenge to Solve
                      <input
                        type="text"
                        className="smart-input"
                        placeholder="e.g. Getting website visits but very few conversions"
                        value={convertProblem}
                        onChange={e => setConvertProblem(e.target.value)}
                      />
                    </label>
                  </>
                )}

                {selectedCategory === 'AUTOMATE' && (
                  <>
                    <div className="smart-label">
                      Current CRM / Lead Tracking System
                      <CustomDropdown
                        value={autoTool}
                        onChange={val => setAutoTool(val)}
                        options={[
                          { value: 'Looking for guidance on CRM setup', label: 'No CRM yet — need guidance choosing & setting up' },
                          { value: 'Using WhatsApp Business manually', label: 'Using WhatsApp Business app manually' },
                          { value: 'Zoho / HubSpot / Salesforce', label: 'Already using Zoho, HubSpot, or Salesforce' },
                          { value: 'Google Sheets / Excel', label: 'Managing leads in Google Sheets / Excel' },
                        ]}
                      />
                    </div>

                    <div>
                      <span className="smart-label">Desired Automations</span>
                      <div className="smart-checkbox-grid">
                        {[
                          'WhatsApp Instant Reply',
                          'Lead Routing to Team',
                          'Automated Nurture Sequence',
                          'Payment / Invoice Alerts',
                          'CRM Integration',
                          'Customer Triage Bot',
                        ].map(item => {
                          const checked = autoNeeds.includes(item)
                          return (
                            <button
                              key={item}
                              type="button"
                              className={`smart-check-card ${checked ? 'is-checked' : ''}`}
                              onClick={() => toggleFeature(autoNeeds, setAutoNeeds, item)}
                            >
                              <span className={`custom-chk ${checked ? 'is-active' : ''}`}>
                                {checked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <span>{item}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {selectedCategory === 'E-COMMERCE' && (
                  <>
                    <div className="smart-label">
                      Platform Preference
                      <CustomDropdown
                        value={ecomPlatform}
                        onChange={val => setEcomPlatform(val)}
                        options={[
                          { value: 'Shopify', label: 'Shopify (Fast, reliable, scalable)' },
                          { value: 'WooCommerce', label: 'WooCommerce / WordPress' },
                          { value: 'Custom Headless Store', label: 'Custom Modern Headless Store (Next.js)' },
                          { value: 'Need guidance choosing platform', label: 'Need guidance choosing the best platform' },
                        ]}
                      />
                    </div>

                    <div className="smart-label">
                      Product Catalogue Size
                      <CustomDropdown
                        value={ecomCatalog}
                        onChange={val => setEcomCatalog(val)}
                        options={[
                          { value: '1–10 products (Curated)', label: '1–10 products (Curated / Single product brand)' },
                          { value: '10–100 products (Growing store)', label: '10–100 products (Growing online store)' },
                          { value: '100–1,000 products (Full catalog)', label: '100–1,000 products (Extensive catalog)' },
                          { value: '1,000+ products (Enterprise)', label: '1,000+ products (Enterprise scale)' },
                        ]}
                      />
                    </div>
                  </>
                )}

                {selectedCategory === 'AI' && (
                  <>
                    <div className="smart-label">
                      Primary AI Functionality
                      <CustomDropdown
                        value={aiFocus}
                        onChange={val => setAiFocus(val)}
                        options={[
                          { value: '24/7 Smart Customer Assistant', label: '24/7 Smart Customer Assistant (Web & WhatsApp)' },
                          { value: 'Automated Lead Qualification Bot', label: 'Automated Lead Qualification & Triage Bot' },
                          { value: 'Internal Document & Knowledge AI', label: 'Internal Document AI & Staff Assistant' },
                          { value: 'Custom Predictive AI Integration', label: 'Custom Business Process Automation AI' },
                        ]}
                      />
                    </div>

                    <label className="smart-label">
                      Business Challenge to Solve with AI
                      <textarea
                        rows={2}
                        className="smart-textarea"
                        placeholder="Describe what manual process you would like AI to handle..."
                        value={aiDetails}
                        onChange={e => setAiDetails(e.target.value)}
                      />
                    </label>
                  </>
                )}

                {/* Investment & Timeline quick pills */}
                <div className="planner-investment-block">
                  <span className="smart-label">Estimated Investment Bracket</span>
                  <div className="smart-pill-grid" role="radiogroup" aria-label="Budget options">
                    {BUDGET_OPTIONS.map(b => (
                      <button
                        key={b}
                        type="button"
                        className={`smart-pill-btn ${selectedBudget === b ? 'is-selected' : ''}`}
                        onClick={() => setSelectedBudget(b)}
                        role="radio"
                        aria-checked={selectedBudget === b}
                      >
                        {selectedBudget === b && <Check size={13} className="mr-1" aria-hidden="true" />}
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="smart-label">Target Implementation Timeline</span>
                  <div className="smart-pill-grid" role="radiogroup" aria-label="Timeline options">
                    {TIMELINE_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`smart-pill-btn ${selectedTimeline === t ? 'is-selected' : ''}`}
                        onClick={() => setSelectedTimeline(t)}
                        role="radio"
                        aria-checked={selectedTimeline === t}
                      >
                        {selectedTimeline === t && <Check size={13} className="mr-1" aria-hidden="true" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="smart-form-nav">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setPlannerStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="button button-primary smart-nav-next"
                  onClick={() => setPlannerStep(3)}
                >
                  <span>Continue to Contact</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Contact Details & Submit */}
          {plannerStep === 3 && (
            <div className="planner-step-body">
              <div className="planner-step-intro">
                <h2 className="planner-step-title">Where Should We Send Your Scope?</h2>
                <p className="planner-step-desc">
                  We review your specifications and prepare a strategic recommendation. No automated spam.
                </p>
              </div>

              {/* Scope Summary Preview Chip */}
              <div className="planner-scope-summary-pill">
                <span className="scpb-badge">{selectedCategory}</span>
                <span className="pss-text">
                  Scope: {selectedBudget} · {selectedTimeline}
                </span>
                <button
                  type="button"
                  className="pss-edit-btn"
                  onClick={() => setPlannerStep(2)}
                  aria-label="Edit scope"
                >
                  Edit
                </button>
              </div>

              <div className="qmf-fields">
                <label className="smart-label">
                  Your Full Name <span className="req">*</span>
                  <input
                    type="text"
                    required
                    className={`smart-input ${fieldErrors.plannerName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Vikram Malhotra"
                    value={plannerName}
                    onChange={e => {
                      setPlannerName(e.target.value)
                      if (e.target.value.trim().length >= 2) {
                        setFieldErrors(prev => ({ ...prev, plannerName: '' }))
                      }
                    }}
                  />
                  {fieldErrors.plannerName && (
                    <span className="field-error-msg">{fieldErrors.plannerName}</span>
                  )}
                </label>

                <label className="smart-label">
                  Work Email <span className="req">*</span>
                  <input
                    type="email"
                    required
                    className={`smart-input ${fieldErrors.plannerEmail ? 'is-invalid' : ''}`}
                    placeholder="name@business.com"
                    value={plannerEmail}
                    onChange={e => {
                      setPlannerEmail(e.target.value)
                      if (e.target.value.includes('@')) {
                        setFieldErrors(prev => ({ ...prev, plannerEmail: '' }))
                      }
                    }}
                  />
                  {fieldErrors.plannerEmail && (
                    <span className="field-error-msg">{fieldErrors.plannerEmail}</span>
                  )}
                </label>

                <label className="smart-label">
                  WhatsApp or Phone Number <span className="req">*</span>
                  <input
                    type="tel"
                    required
                    className={`smart-input ${fieldErrors.plannerPhone ? 'is-invalid' : ''}`}
                    placeholder="+91 98200 00000"
                    value={plannerPhone}
                    onChange={e => {
                      setPlannerPhone(e.target.value)
                      if (e.target.value.trim().length >= 7) {
                        setFieldErrors(prev => ({ ...prev, plannerPhone: '' }))
                      }
                    }}
                  />
                  {fieldErrors.plannerPhone && (
                    <span className="field-error-msg">{fieldErrors.plannerPhone}</span>
                  )}
                </label>

                <label className="smart-label">
                  Business / Company Name (Optional)
                  <input
                    type="text"
                    className="smart-input"
                    placeholder="e.g. Apex Health & Nutrition"
                    value={plannerBusiness}
                    onChange={e => setPlannerBusiness(e.target.value)}
                  />
                </label>

                <label className="smart-label">
                  Any Specific Goals or Notes (Optional)
                  <textarea
                    rows={2}
                    className="smart-textarea"
                    placeholder="Tell us any specific challenges, existing links or questions..."
                    value={plannerNote}
                    onChange={e => setPlannerNote(e.target.value)}
                  />
                </label>
              </div>

              {/* Navigation buttons */}
              <div className="smart-form-nav">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setPlannerStep(2)}
                  disabled={busy}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="button button-primary smart-nav-submit"
                  onClick={handlePlannerSubmit}
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <RefreshCw size={16} className="spin" aria-hidden="true" />
                      <span>Submitting Scope...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Strategic Proposal</span>
                      <Send size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>

              <div className="smart-privacy-assurance">
                <Lock size={14} aria-hidden="true" />
                <span>Your information is strictly protected under NDA. We never share client data.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
