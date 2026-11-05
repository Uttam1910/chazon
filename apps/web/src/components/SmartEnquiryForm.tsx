import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  Edit2,
  ExternalLink,
  Globe,
  Layers,
  Layout,
  LineChart,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type {
  AuditAnalysisResult,
  BusinessStage,
  DynamicAutomateAnswers,
  DynamicBuildAnswers,
  DynamicConvertAnswers,
  DynamicEcommerceAnswers,
  DynamicFormAnswers,
  DynamicGrowAnswers,
  EnquiryBusinessInfo,
  EnquiryContactInfo,
  EnquiryGoal,
  PreferredContactMethod,
  SmartEnquiryPayload,
  SmartEnquiryResponse,
} from '@chazon/shared'
import { config, demoMode, sourceDetail, track } from '../config'

const GOAL_OPTIONS: { id: EnquiryGoal; title: string; desc: string; icon: typeof Globe }[] = [
  { id: 'build-new', title: 'Build a new website', desc: 'Modern, high-converting digital foundation from scratch', icon: Layout },
  { id: 'improve-existing', title: 'Improve existing website', desc: 'Redesign, revamp UX, optimize speed and structure', icon: RefreshCw },
  { id: 'seo-visibility', title: 'Improve Google visibility & SEO', desc: 'Rank higher for commercial intent search queries', icon: Search },
  { id: 'generate-leads', title: 'Generate more leads & enquiries', desc: 'Predictable qualified acquisition and demand generation', icon: TrendingUp },
  { id: 'improve-conversions', title: 'Improve website conversions', desc: 'Frictionless customer journeys and CRO improvements', icon: LineChart },
  { id: 'automate-ops', title: 'Automate business operations', desc: 'WhatsApp workflows, CRM integration, lead routing', icon: Zap },
  { id: 'build-ecommerce', title: 'Build an e-commerce website', desc: 'Online store, payments, inventory, checkout systems', icon: ShoppingBag },
  { id: 'integrate-ai', title: 'Integrate AI into my business', desc: 'AI customer assistants, smart triage, custom workflows', icon: Bot },
  { id: 'multiple-services', title: 'I need multiple services', desc: 'Full-funnel digital revenue engine (Build + Grow + Convert)', icon: Layers },
  { id: 'need-guidance', title: 'Not sure yet — I need guidance', desc: 'Diagnostic consultation and strategic roadmap recommendation', icon: Compass },
]

const BUDGET_OPTIONS = [
  'Under ₹5,000',
  '₹5,000–₹10,000',
  '₹10,000–₹25,000',
  '₹25,000–₹50,000',
  '₹50,000–₹1,00,000',
  '₹1,00,000+',
  'Not sure yet',
]

const TIMELINE_OPTIONS = [
  'Immediately',
  'Within 2 weeks',
  'Within a month',
  'Within 2–3 months',
  'Just exploring',
]

const STAGE_OPTIONS: BusinessStage[] = [
  'New business',
  'Existing business',
  'Growing business',
  'Established business',
]

const CONTACT_METHODS: { id: PreferredContactMethod; label: string; icon: typeof MessageSquare }[] = [
  { id: 'WhatsApp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'Phone', label: 'Phone call', icon: Phone },
  { id: 'Email', label: 'Email', icon: MessageSquare },
]

interface SmartEnquiryFormProps {
  initialGoal?: string
  initialService?: string
  auditContext?: AuditAnalysisResult | null
  location?: string
  onComplete?: (response: SmartEnquiryResponse) => void
}

export function SmartEnquiryForm({
  initialGoal = '',
  initialService = '',
  auditContext = null,
  location = 'enquiry_hub',
  onComplete,
}: SmartEnquiryFormProps) {
  const started = useRef(Date.now())
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submittedResponse, setSubmittedResponse] = useState<SmartEnquiryResponse | null>(null)

  // Step 1: Goals (multi-select)
  const [selectedGoals, setSelectedGoals] = useState<EnquiryGoal[]>(() => {
    if (initialGoal && GOAL_OPTIONS.some(g => g.id === initialGoal)) return [initialGoal as EnquiryGoal]
    if (initialService) {
      const lower = initialService.toLowerCase()
      if (lower.includes('website') || lower.includes('build')) return ['build-new']
      if (lower.includes('seo') || lower.includes('google')) return ['seo-visibility']
      if (lower.includes('convert') || lower.includes('cro')) return ['improve-conversions']
      if (lower.includes('automate') || lower.includes('crm')) return ['automate-ops']
      if (lower.includes('commerce') || lower.includes('store')) return ['build-ecommerce']
      if (lower.includes('ai')) return ['integrate-ai']
    }
    return []
  })

  // Step 2: Dynamic Service Answers
  const [dynamicAnswers, setDynamicAnswers] = useState<DynamicFormAnswers>({
    build: {
      isNewOrRedesign: 'New website',
      websiteType: 'Business website',
      hasDomain: 'Yes',
      contentStatus: 'Ready',
      pageCount: '6–15 pages',
      needsPayment: false,
      features: [],
      referenceUrl: '',
    },
    grow: {
      hasWebsite: true,
      websiteUrl: auditContext?.url || '',
      primaryGoal: 'More Google visibility',
      currentInvestment: 'Never invested',
      usesSearchConsole: 'Not sure',
      targetLocations: 'Pan-India',
      targetKeywords: '',
    },
    convert: {
      targetAction: 'Submit an enquiry',
      conversionProblem: 'High traffic low enquiries',
      hasWebsite: true,
      websiteUrl: auditContext?.url || '',
      trackingStatus: 'Basic tracking',
      journeyToImprove: 'Homepage to enquiry',
    },
    automate: {
      processesToAutomate: ['WhatsApp notifications', 'Lead capture & instant reply'],
      currentTools: '',
      usesCrm: 'Looking for one',
      whatsAppVolume: 'Moderate',
      needsAutoFollowUp: true,
      needsAi: 'Not sure',
      externalIntegrations: '',
      manualWorkflowDescription: '',
    },
    ecommerce: {
      hasStore: false,
      platform: 'Shopify',
      productCount: '11–100 products',
      needsPayment: true,
      needsShipping: true,
      needsInventory: true,
      needsAccounts: true,
      needsOrderManagement: true,
    },
    ai: {
      aiCapabilities: ['AI chatbot / customer assistant'],
      hasSoftware: false,
      description: '',
    },
  })

  // Step 3: Business Information
  const [businessInfo, setBusinessInfo] = useState<EnquiryBusinessInfo>({
    businessName: '',
    industry: 'Professional Services',
    website: auditContext?.url || '',
    location: '',
    businessStage: 'Growing business',
    targetAudience: 'B2B & Commercial Clients',
    description: '',
  })

  // Step 4: Budget & Timeline
  const [budget, setBudget] = useState<string>('₹25,000–₹50,000')
  const [timeline, setTimeline] = useState<string>('Within 2 weeks')

  // Step 5: Contact Information & Consent
  const [contactInfo, setContactInfo] = useState<EnquiryContactInfo>({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'WhatsApp',
    message: '',
    consentToContact: true,
    marketingConsent: false,
  })

  // Audit attachment toggle
  const [includeAudit, setIncludeAudit] = useState(!!auditContext)

  // Track form start
  useEffect(() => {
    track('form_start', { form: 'smart_enquiry', location })
  }, [location])

  const toggleGoal = (id: EnquiryGoal) => {
    setSelectedGoals(prev => {
      if (id === 'multiple-services' || id === 'need-guidance') {
        return [id]
      }
      const filtered = prev.filter(g => g !== 'multiple-services' && g !== 'need-guidance')
      if (filtered.includes(id)) {
        return filtered.filter(g => g !== id)
      }
      return [...filtered, id]
    })
    setFieldErrors(e => ({ ...e, goals: '' }))
  }

  // Active branches in Step 2 based on selected goals
  const hasBuild = selectedGoals.some(g => g === 'build-new' || g === 'improve-existing' || g === 'multiple-services')
  const hasGrow = selectedGoals.some(g => g === 'seo-visibility' || g === 'generate-leads' || g === 'multiple-services')
  const hasConvert = selectedGoals.some(g => g === 'improve-conversions' || g === 'multiple-services')
  const hasAutomate = selectedGoals.some(g => g === 'automate-ops' || g === 'multiple-services')
  const hasEcommerce = selectedGoals.some(g => g === 'build-ecommerce')
  const hasAi = selectedGoals.some(g => g === 'integrate-ai')
  const isGuidanceOnly = selectedGoals.length === 1 && selectedGoals[0] === 'need-guidance'

  // Validation per step
  const validateCurrentStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (selectedGoals.length === 0) {
        errors.goals = 'Please select at least one objective to continue.'
      }
    } else if (step === 3) {
      if (!businessInfo.businessName.trim()) {
        errors.businessName = 'Please enter your business or project name.'
      }
    } else if (step === 5) {
      if (!contactInfo.name.trim() || contactInfo.name.trim().length < 2) {
        errors.name = 'Please enter your full name.'
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      if (!contactInfo.email.trim() || !emailRegex.test(contactInfo.email.trim())) {
        errors.email = 'Please enter a valid work email address.'
      }
      const phoneDigits = contactInfo.phone.replace(/\D/g, '')
      if (!contactInfo.phone.trim() || phoneDigits.length < 7) {
        errors.phone = 'Please enter a phone or WhatsApp number with country code (e.g. +91 98200 00000).'
      }
      if (!contactInfo.consentToContact) {
        errors.consent = 'Your consent is required for Chazon to contact you regarding this enquiry.'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep(currentStep)) return
    setErrorMessage(null)
    // If user only selected guidance, skip deep service questions (Step 2) straight to business info (Step 3)
    if (currentStep === 1 && isGuidanceOnly) {
      setCurrentStep(3)
    } else {
      setCurrentStep(s => Math.min(6, s + 1))
    }
  }

  const handleBack = () => {
    setErrorMessage(null)
    if (currentStep === 3 && isGuidanceOnly) {
      setCurrentStep(1)
    } else {
      setCurrentStep(s => Math.max(1, s - 1))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateCurrentStep(5)) return
    setBusy(true)
    setErrorMessage(null)

    const payload: SmartEnquiryPayload = {
      goals: selectedGoals,
      dynamicAnswers,
      business: businessInfo,
      budget,
      timeline,
      contact: contactInfo,
      auditRef: includeAudit && auditContext ? auditContext.id : undefined,
      auditSummary:
        includeAudit && auditContext
          ? {
              overallScore: auditContext.overallScore,
              scores: auditContext.scores,
              topBottlenecks: auditContext.issues
                .filter(i => i.severity === 'critical')
                .map(i => i.title)
                .slice(0, 3),
            }
          : undefined,
      form_started: started.current,
      source_detail: sourceDetail(),
    }

    if (demoMode) {
      await new Promise(r => setTimeout(r, 600))
      const demoRef = `CHZ-${new Date().getFullYear()}-DEMO`
      const demoRes: SmartEnquiryResponse = {
        received: true,
        reference: demoRef,
        message: 'Demo mode preview: your enquiry was simulated successfully.',
        nextSteps: [
          'Review of your digital foundation and current bottlenecks.',
          'Formulation of strategic recommendations and scope assessment.',
          'Direct contact via ' + contactInfo.preferredContact + ' within 4 to 24 business hours.',
        ],
        whatsAppHref: `https://wa.me/919820000000?text=${encodeURIComponent(`Hi Chazon team, test enquiry ${demoRef}`)}`,
      }
      setSubmittedResponse(demoRes)
      setBusy(false)
      onComplete?.(demoRes)
      return
    }

    try {
      const endpoint = config.enquiryEndpoint || '/api/enquiries'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const msg = errorData?.error?.message || 'We could not submit your enquiry. Please try again.'
        setErrorMessage(msg)
        setBusy(false)
        track('form_error', { form: 'smart_enquiry', reason: 'server_rejection' })
        return
      }

      const result = (await response.json()) as { data: SmartEnquiryResponse }
      const resData = result.data || {
        received: true,
        reference: `CHZ-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        message: 'Your enquiry has been received.',
        nextSteps: [
          'Founder and lead architect review of your requirements.',
          'Preparation of preliminary roadmap and scope validation.',
          'Direct outreach via ' + contactInfo.preferredContact + ' within 4 to 24 hours.',
        ],
      }
      setSubmittedResponse(resData)
      track('form_submission', { form: 'smart_enquiry', location })
      onComplete?.(resData)
    } catch {
      setErrorMessage('Network connection error. Please check your connectivity or reach us via WhatsApp.')
      track('form_error', { form: 'smart_enquiry', reason: 'network' })
    } finally {
      setBusy(false)
    }
  }

  // Confirmation view
  if (submittedResponse) {
    return (
      <div className="smart-done-card" role="status" aria-live="polite">
        <div className="smart-done-badge">
          <CheckCircle2 size={38} className="text-success" aria-hidden="true" />
        </div>
        <span className="mono smart-done-ref">Enquiry Reference: {submittedResponse.reference}</span>
        <h3>Thank you, {contactInfo.name.split(' ')[0]}. Your enquiry is confirmed.</h3>
        <p className="smart-done-lead">{submittedResponse.message}</p>

        <div className="smart-done-steps">
          <span className="mono steps-label">What happens next:</span>
          <ol className="steps-list">
            {submittedResponse.nextSteps.map((step, i) => (
              <li key={step}>
                <span className="mono">0{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="smart-done-actions">
          {submittedResponse.whatsAppHref && (
            <a
              href={submittedResponse.whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary smart-wa-btn"
            >
              <MessageCircle size={18} aria-hidden="true" />
              <span>Connect on WhatsApp with Reference</span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          <p className="smart-done-meta">
            Expected response time: <strong>Under 4 hours</strong> during business hours (10:00–19:00 IST) · NDA & strict confidentiality guaranteed.
          </p>
        </div>
      </div>
    )
  }

  const totalSteps = isGuidanceOnly ? 5 : 6

  return (
    <div className="smart-enquiry-container" id="smart-enquiry">
      {/* Audit Banner if attached */}
      {auditContext && (
        <div className="audit-context-pill">
          <ShieldCheck size={18} className="text-accent" aria-hidden="true" />
          <div className="audit-context-text">
            <strong>Website Audit Attached:</strong> {auditContext.url} (Overall Score: {auditContext.overallScore}/100)
          </div>
          <label className="audit-context-check">
            <input
              type="checkbox"
              checked={includeAudit}
              onChange={e => setIncludeAudit(e.target.checked)}
            />
            <span>Include in enquiry</span>
          </label>
        </div>
      )}

      {/* Progress Bar */}
      <div className="smart-progress-bar" aria-label={`Step ${currentStep} of ${totalSteps}`}>
        <div className="smart-progress-head">
          <span className="mono step-tag">
            Step 0{currentStep} of 0{totalSteps}
          </span>
          <span className="step-title-hint">
            {currentStep === 1 && 'Your Objectives'}
            {currentStep === 2 && 'Service Scope'}
            {currentStep === 3 && 'Business Details'}
            {currentStep === 4 && 'Budget & Timeline'}
            {currentStep === 5 && 'Contact Information'}
            {currentStep === 6 && 'Review & Submit'}
          </span>
        </div>
        <div className="smart-progress-track">
          <div
            className="smart-progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="smart-error-banner" role="alert">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Understand the visitor */}
      {currentStep === 1 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>What would you like to achieve for your business?</h2>
            <p className="lead">
              Select one or multiple areas where your business needs digital growth. We adapt our questions to your goals.
            </p>
          </div>

          {fieldErrors.goals && <p className="field-error-msg">{fieldErrors.goals}</p>}

          <div className="smart-goal-grid" role="group" aria-label="Business objectives">
            {GOAL_OPTIONS.map(opt => {
              const isSelected = selectedGoals.includes(opt.id)
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`smart-goal-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => toggleGoal(opt.id)}
                  aria-pressed={isSelected}
                >
                  <div className="smart-card-top">
                    <span className="smart-card-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="smart-card-check">
                      {isSelected ? <Check size={16} aria-hidden="true" /> : null}
                    </span>
                  </div>
                  <strong>{opt.title}</strong>
                  <p>{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Dynamic service-specific questions */}
      {currentStep === 2 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>Tell us about your specific requirements.</h2>
            <p className="lead">
              Answer the areas relevant to your selected services. Only questions matching your goals are shown.
            </p>
          </div>

          <div className="smart-dynamic-sections">
            {/* BUILD Questions */}
            {hasBuild && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <Layout size={20} className="text-accent" aria-hidden="true" />
                  <h3>BUILD — Website & Platform Specifications</h3>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Project Type
                    <select
                      className="smart-select"
                      value={dynamicAnswers.build?.isNewOrRedesign}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, isNewOrRedesign: e.target.value as DynamicBuildAnswers['isNewOrRedesign'] },
                        }))
                      }
                    >
                      <option value="New website">New website (starting fresh)</option>
                      <option value="Existing website redesign">Existing website redesign / upgrade</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Category of Website
                    <select
                      className="smart-select"
                      value={dynamicAnswers.build?.websiteType}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, websiteType: e.target.value as DynamicBuildAnswers['websiteType'] },
                        }))
                      }
                    >
                      <option value="Business website">Business Website (Lead Generation)</option>
                      <option value="Landing page">High-Converting Landing Page</option>
                      <option value="E-commerce">E-commerce / Online Store</option>
                      <option value="Portfolio">Portfolio / Practice Showcase</option>
                      <option value="Web application">Custom Web Application / SaaS</option>
                      <option value="Custom platform">Custom Platform & Client Portal</option>
                    </select>
                  </label>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Domain Status
                    <select
                      className="smart-select"
                      value={dynamicAnswers.build?.hasDomain}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, hasDomain: e.target.value as DynamicBuildAnswers['hasDomain'] },
                        }))
                      }
                    >
                      <option value="Yes">Yes, domain already acquired</option>
                      <option value="No">No domain yet</option>
                      <option value="Need help choosing">Need guidance choosing domain & hosting</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Content & Imagery
                    <select
                      className="smart-select"
                      value={dynamicAnswers.build?.contentStatus}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, contentStatus: e.target.value as DynamicBuildAnswers['contentStatus'] },
                        }))
                      }
                    >
                      <option value="Ready">Ready to implement</option>
                      <option value="In progress">In progress / partial</option>
                      <option value="Need Chazon to create">Need Chazon to craft copy & visual strategy</option>
                    </select>
                  </label>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Approximate Page Count
                    <select
                      className="smart-select"
                      value={dynamicAnswers.build?.pageCount}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, pageCount: e.target.value as DynamicBuildAnswers['pageCount'] },
                        }))
                      }
                    >
                      <option value="1–5 pages">1–5 pages (Focused / Single-page)</option>
                      <option value="6–15 pages">6–15 pages (Standard Company Site)</option>
                      <option value="15–30 pages">15–30 pages (Multi-service / Catalog)</option>
                      <option value="30+ pages">30+ pages (Enterprise / Large Portal)</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Reference Website (Optional)
                    <input
                      type="url"
                      className="smart-input"
                      placeholder="https://example.com"
                      value={dynamicAnswers.build?.referenceUrl || ''}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          build: { ...prev.build, referenceUrl: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            {/* GROW Questions */}
            {hasGrow && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <Search size={20} className="text-accent" aria-hidden="true" />
                  <h3>GROW — Search Engine & Organic Demand</h3>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Current Website URL
                    <input
                      type="url"
                      className="smart-input"
                      placeholder="https://yourwebsite.com"
                      value={dynamicAnswers.grow?.websiteUrl || ''}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          grow: { ...prev.grow, websiteUrl: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="smart-label">
                    Primary SEO Goal
                    <select
                      className="smart-select"
                      value={dynamicAnswers.grow?.primaryGoal}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          grow: { ...prev.grow, primaryGoal: e.target.value as DynamicGrowAnswers['primaryGoal'] },
                        }))
                      }
                    >
                      <option value="More Google visibility">First-page Google visibility</option>
                      <option value="More organic visitors">More qualified organic visitors</option>
                      <option value="Local customers">Local search & Google Business ranking</option>
                      <option value="More enquiries">Converting existing organic traffic</option>
                      <option value="Better content strategy">Strategic commercial content & authority</option>
                    </select>
                  </label>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Current SEO Investment
                    <select
                      className="smart-select"
                      value={dynamicAnswers.grow?.currentInvestment}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          grow: { ...prev.grow, currentInvestment: e.target.value as DynamicGrowAnswers['currentInvestment'] },
                        }))
                      }
                    >
                      <option value="Never invested">Never invested in SEO</option>
                      <option value="Tried in past">Tried in the past with unclear ROI</option>
                      <option value="Currently investing">Currently investing but looking for better partner</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Target Geographic Markets
                    <input
                      type="text"
                      className="smart-input"
                      placeholder="e.g. Mumbai, Pan-India, US/UK"
                      value={dynamicAnswers.grow?.targetLocations || ''}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          grow: { ...prev.grow, targetLocations: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            {/* CONVERT Questions */}
            {hasConvert && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <LineChart size={20} className="text-accent" aria-hidden="true" />
                  <h3>CONVERT — Conversion Rate & Journey Optimisation</h3>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Primary Conversion Action Desired
                    <select
                      className="smart-select"
                      value={dynamicAnswers.convert?.targetAction}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          convert: { ...prev.convert, targetAction: e.target.value as DynamicConvertAnswers['targetAction'] },
                        }))
                      }
                    >
                      <option value="Submit an enquiry">Submit a detailed enquiry form</option>
                      <option value="Contact through WhatsApp">Instant WhatsApp Business chat</option>
                      <option value="Book an appointment">Book a calendar discovery call</option>
                      <option value="Call">Direct phone call</option>
                      <option value="Purchase">Immediate digital purchase</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Current Bottleneck
                    <select
                      className="smart-select"
                      value={dynamicAnswers.convert?.conversionProblem}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          convert: { ...prev.convert, conversionProblem: e.target.value as DynamicConvertAnswers['conversionProblem'] },
                        }))
                      }
                    >
                      <option value="High traffic low enquiries">Visitors arrive but don't enquire</option>
                      <option value="High bounce rate">High bounce rate on landing pages</option>
                      <option value="Poor mobile conversions">Mobile experience drops off</option>
                      <option value="Drop-off at checkout/form">Form abandonment / checkout drop-off</option>
                      <option value="Not sure">Not sure — need expert teardown</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* AUTOMATE Questions */}
            {hasAutomate && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <Zap size={20} className="text-accent" aria-hidden="true" />
                  <h3>AUTOMATE — Workflow & Retention Infrastructure</h3>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    CRM Usage
                    <select
                      className="smart-select"
                      value={dynamicAnswers.automate?.usesCrm}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          automate: { ...prev.automate, usesCrm: e.target.value as DynamicAutomateAnswers['usesCrm'] },
                        }))
                      }
                    >
                      <option value="Looking for one">No CRM yet (need recommendation & setup)</option>
                      <option value="Yes">Yes, already using Zoho / HubSpot / Salesforce</option>
                      <option value="No">No, currently using Google Sheets / Email</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    WhatsApp Enquiry Volume
                    <select
                      className="smart-select"
                      value={dynamicAnswers.automate?.whatsAppVolume}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          automate: { ...prev.automate, whatsAppVolume: e.target.value as DynamicAutomateAnswers['whatsAppVolume'] },
                        }))
                      }
                    >
                      <option value="Moderate">Moderate (5–20 chats / week)</option>
                      <option value="High volume">High volume (20+ chats / week)</option>
                      <option value="Want to start">Want to introduce WhatsApp channel</option>
                      <option value="None">None</option>
                    </select>
                  </label>
                </div>

                <label className="smart-label">
                  Describe Your Current Manual Bottleneck
                  <textarea
                    className="smart-textarea"
                    rows={2}
                    placeholder="e.g. Enquiries come in through forms and WhatsApp but follow-ups take 24h because team handles them manually..."
                    value={dynamicAnswers.automate?.manualWorkflowDescription || ''}
                    onChange={e =>
                      setDynamicAnswers(prev => ({
                        ...prev,
                        automate: { ...prev.automate, manualWorkflowDescription: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}

            {/* E-COMMERCE Questions */}
            {hasEcommerce && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <ShoppingBag size={20} className="text-accent" aria-hidden="true" />
                  <h3>E-Commerce & Digital Commerce Requirements</h3>
                </div>

                <div className="smart-field-row">
                  <label className="smart-label">
                    Platform Preference
                    <select
                      className="smart-select"
                      value={dynamicAnswers.ecommerce?.platform}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          ecommerce: { ...prev.ecommerce, platform: e.target.value as DynamicEcommerceAnswers['platform'] },
                        }))
                      }
                    >
                      <option value="Shopify">Shopify (Recommended for D2C/Retail)</option>
                      <option value="WooCommerce">WooCommerce (WordPress)</option>
                      <option value="Custom platform">Custom Next.js / Headless E-commerce</option>
                      <option value="None yet">Need Chazon recommendation</option>
                    </select>
                  </label>

                  <label className="smart-label">
                    Expected Catalog Size
                    <select
                      className="smart-select"
                      value={dynamicAnswers.ecommerce?.productCount}
                      onChange={e =>
                        setDynamicAnswers(prev => ({
                          ...prev,
                          ecommerce: { ...prev.ecommerce, productCount: e.target.value as DynamicEcommerceAnswers['productCount'] },
                        }))
                      }
                    >
                      <option value="1–10 products">1–10 curated products</option>
                      <option value="11–100 products">11–100 products</option>
                      <option value="100–1,000 products">100–1,000 products</option>
                      <option value="1,000+ products">1,000+ products</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* AI Solutions */}
            {hasAi && (
              <div className="smart-dynamic-box">
                <div className="smart-dynamic-title">
                  <Bot size={20} className="text-accent" aria-hidden="true" />
                  <h3>AI Integration & Automated Assistants</h3>
                </div>

                <label className="smart-label">
                  What would you like AI to assist with?
                  <textarea
                    className="smart-textarea"
                    rows={2}
                    placeholder="e.g. 24/7 intelligent customer inquiry answering, smart lead qualification, document processing..."
                    value={dynamicAnswers.ai?.description || ''}
                    onChange={e =>
                      setDynamicAnswers(prev => ({
                        ...prev,
                        ai: { ...prev.ai, description: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Business Information */}
      {currentStep === 3 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>Tell us about your business.</h2>
            <p className="lead">
              Context matters. We design digital engines specifically around your commercial model and stage.
            </p>
          </div>

          <div className="smart-form-grid">
            <div className="smart-field-row">
              <label className="smart-label">
                Business Name <span className="req">*</span>
                <input
                  type="text"
                  required
                  className={`smart-input ${fieldErrors.businessName ? 'is-invalid' : ''}`}
                  placeholder="e.g. Apex Health & Nutrition"
                  value={businessInfo.businessName}
                  onChange={e => {
                    setBusinessInfo(b => ({ ...b, businessName: e.target.value }))
                    if (e.target.value.trim()) setFieldErrors(err => ({ ...err, businessName: '' }))
                  }}
                />
                {fieldErrors.businessName && <span className="field-error-msg">{fieldErrors.businessName}</span>}
              </label>

              <label className="smart-label">
                Industry Sector
                <select
                  className="smart-select"
                  value={businessInfo.industry}
                  onChange={e => setBusinessInfo(b => ({ ...b, industry: e.target.value }))}
                >
                  <option value="Professional Services">Professional & B2B Services</option>
                  <option value="D2C & E-commerce">D2C & E-Commerce</option>
                  <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                  <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                  <option value="Real Estate & Architecture">Real Estate & Architecture</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Retail & Consumer Brands">Retail & Consumer Brands</option>
                  <option value="Technology & Start-up">Technology & Software</option>
                  <option value="Other">Other Unique Industry</option>
                </select>
              </label>
            </div>

            <div className="smart-field-row">
              <label className="smart-label">
                Current Website or Profile URL (Optional)
                <input
                  type="text"
                  className="smart-input"
                  placeholder="https://yourbusiness.com"
                  value={businessInfo.website || ''}
                  onChange={e => setBusinessInfo(b => ({ ...b, website: e.target.value }))}
                />
              </label>

              <label className="smart-label">
                Business Location (City / Region)
                <input
                  type="text"
                  className="smart-input"
                  placeholder="e.g. Mumbai, Delhi NCR, Bangalore, International"
                  value={businessInfo.location || ''}
                  onChange={e => setBusinessInfo(b => ({ ...b, location: e.target.value }))}
                />
              </label>
            </div>

            <div className="smart-field-row">
              <label className="smart-label">
                Business Stage
                <select
                  className="smart-select"
                  value={businessInfo.businessStage}
                  onChange={e => setBusinessInfo(b => ({ ...b, businessStage: e.target.value as BusinessStage }))}
                >
                  {STAGE_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="smart-label">
                Target Audience
                <input
                  type="text"
                  className="smart-input"
                  placeholder="e.g. High-net-worth individuals, SME founders, D2C consumers"
                  value={businessInfo.targetAudience}
                  onChange={e => setBusinessInfo(b => ({ ...b, targetAudience: e.target.value }))}
                />
              </label>
            </div>

            <label className="smart-label">
              Short Description of Your Business
              <textarea
                className="smart-textarea"
                rows={2}
                placeholder="Briefly describe what your business offers and what makes your product/service distinctive..."
                value={businessInfo.description || ''}
                onChange={e => setBusinessInfo(b => ({ ...b, description: e.target.value }))}
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 4: Budget & Timeline */}
      {currentStep === 4 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>Planned Investment & Timeline</h2>
            <p className="lead">
              Transparent, realistic planning allows us to recommend the right deliverables without wasted back-and-forth.
            </p>
          </div>

          <div className="smart-investment-section">
            <label className="smart-section-label">
              Target Monthly / Project Budget
              <small>Choose an estimated range. Budget is optional if you prefer guidance during consultation.</small>
            </label>
            <div className="smart-pill-grid" role="radiogroup" aria-label="Budget options">
              {BUDGET_OPTIONS.map(b => (
                <button
                  key={b}
                  type="button"
                  className={`smart-pill-btn ${budget === b ? 'is-selected' : ''}`}
                  onClick={() => setBudget(b)}
                  role="radio"
                  aria-checked={budget === b}
                >
                  {budget === b && <Check size={14} className="mr-1" aria-hidden="true" />}
                  {b}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '28px' }}>
              <label className="smart-section-label">
                When would you like to begin implementation?
              </label>
              <div className="smart-pill-grid" role="radiogroup" aria-label="Timeline options">
                {TIMELINE_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`smart-pill-btn ${timeline === t ? 'is-selected' : ''}`}
                    onClick={() => setTimeline(t)}
                    role="radio"
                    aria-checked={timeline === t}
                  >
                    {timeline === t && <Check size={14} className="mr-1" aria-hidden="true" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Contact Information & Consent */}
      {currentStep === 5 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>How should we get in touch?</h2>
            <p className="lead">
              We respond promptly with practical recommendations. No aggressive sales pitches.
            </p>
          </div>

          <div className="smart-form-grid">
            <div className="smart-field-row">
              <label className="smart-label">
                Full Name <span className="req">*</span>
                <input
                  type="text"
                  required
                  className={`smart-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Vikram Malhotra"
                  value={contactInfo.name}
                  onChange={e => {
                    setContactInfo(c => ({ ...c, name: e.target.value }))
                    if (e.target.value.trim().length >= 2) setFieldErrors(err => ({ ...err, name: '' }))
                  }}
                />
                {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
              </label>

              <label className="smart-label">
                Work Email <span className="req">*</span>
                <input
                  type="email"
                  required
                  className={`smart-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="name@business.com"
                  value={contactInfo.email}
                  onChange={e => {
                    setContactInfo(c => ({ ...c, email: e.target.value }))
                    if (e.target.value.includes('@')) setFieldErrors(err => ({ ...err, email: '' }))
                  }}
                />
                {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
              </label>
            </div>

            <div className="smart-field-row">
              <label className="smart-label">
                Phone Number with Country Code <span className="req">*</span>
                <input
                  type="tel"
                  required
                  className={`smart-input ${fieldErrors.phone ? 'is-invalid' : ''}`}
                  placeholder="+91 98200 00000"
                  value={contactInfo.phone}
                  onChange={e => {
                    setContactInfo(c => ({ ...c, phone: e.target.value }))
                    if (e.target.value.length > 7) setFieldErrors(err => ({ ...err, phone: '' }))
                  }}
                />
                {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
              </label>

              <div>
                <label className="smart-label">Preferred Contact Channel</label>
                <div className="smart-contact-method-row" role="radiogroup">
                  {CONTACT_METHODS.map(m => {
                    const isSelected = contactInfo.preferredContact === m.id
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`smart-method-btn ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setContactInfo(c => ({ ...c, preferredContact: m.id }))}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <label className="smart-label">
              Additional Details or Specific Requirements (Optional)
              <textarea
                className="smart-textarea"
                rows={3}
                placeholder="Share any specific constraints, current conversion frustrations, or targets..."
                value={contactInfo.message || ''}
                onChange={e => setContactInfo(c => ({ ...c, message: e.target.value }))}
              />
            </label>

            <div className="smart-consent-box">
              <label className="smart-checkbox-label">
                <input
                  type="checkbox"
                  required
                  checked={contactInfo.consentToContact}
                  onChange={e => {
                    setContactInfo(c => ({ ...c, consentToContact: e.target.checked }))
                    if (e.target.checked) setFieldErrors(err => ({ ...err, consent: '' }))
                  }}
                />
                <span>
                  I consent to Chazon Digital Ventures contacting me regarding this project enquiry. <span className="req">*</span>
                </span>
              </label>
              {fieldErrors.consent && <p className="field-error-msg">{fieldErrors.consent}</p>}

              <label className="smart-checkbox-label text-muted">
                <input
                  type="checkbox"
                  checked={contactInfo.marketingConsent}
                  onChange={e => setContactInfo(c => ({ ...c, marketingConsent: e.target.checked }))}
                />
                <span>(Optional) Send me occasional growth insights and digital teardowns.</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Submit */}
      {currentStep === 6 && (
        <div className="smart-step-body">
          <div className="smart-step-intro">
            <h2>Review Your Enquiry Summary</h2>
            <p className="lead">
              Review your details before submission. Click any edit button to make adjustments.
            </p>
          </div>

          <div className="smart-review-grid">
            {/* Review Block 1: Objectives */}
            <div className="smart-review-card">
              <div className="smart-review-card-head">
                <strong>01. Selected Objectives</strong>
                <button
                  type="button"
                  className="smart-edit-link"
                  onClick={() => setCurrentStep(1)}
                  aria-label="Edit selected objectives"
                >
                  <Edit2 size={14} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
              <ul className="smart-review-tags">
                {selectedGoals.map(g => {
                  const match = GOAL_OPTIONS.find(o => o.id === g)
                  return <li key={g}>{match?.title || g}</li>
                })}
              </ul>
            </div>

            {/* Review Block 2: Business Info */}
            <div className="smart-review-card">
              <div className="smart-review-card-head">
                <strong>02. Business Context</strong>
                <button
                  type="button"
                  className="smart-edit-link"
                  onClick={() => setCurrentStep(3)}
                  aria-label="Edit business information"
                >
                  <Edit2 size={14} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
              <dl className="smart-review-dl">
                <div>
                  <dt>Business:</dt>
                  <dd>{businessInfo.businessName}</dd>
                </div>
                <div>
                  <dt>Industry:</dt>
                  <dd>{businessInfo.industry}</dd>
                </div>
                {businessInfo.website && (
                  <div>
                    <dt>Website:</dt>
                    <dd>{businessInfo.website}</dd>
                  </div>
                )}
                <div>
                  <dt>Stage:</dt>
                  <dd>{businessInfo.businessStage}</dd>
                </div>
              </dl>
            </div>

            {/* Review Block 3: Budget & Timeline */}
            <div className="smart-review-card">
              <div className="smart-review-card-head">
                <strong>03. Investment & Timeline</strong>
                <button
                  type="button"
                  className="smart-edit-link"
                  onClick={() => setCurrentStep(4)}
                  aria-label="Edit budget and timeline"
                >
                  <Edit2 size={14} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
              <dl className="smart-review-dl">
                <div>
                  <dt>Budget:</dt>
                  <dd>{budget}</dd>
                </div>
                <div>
                  <dt>Start Timeline:</dt>
                  <dd>{timeline}</dd>
                </div>
              </dl>
            </div>

            {/* Review Block 4: Contact */}
            <div className="smart-review-card">
              <div className="smart-review-card-head">
                <strong>04. Contact Details</strong>
                <button
                  type="button"
                  className="smart-edit-link"
                  onClick={() => setCurrentStep(5)}
                  aria-label="Edit contact details"
                >
                  <Edit2 size={14} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
              <dl className="smart-review-dl">
                <div>
                  <dt>Name:</dt>
                  <dd>{contactInfo.name}</dd>
                </div>
                <div>
                  <dt>Email:</dt>
                  <dd>{contactInfo.email}</dd>
                </div>
                <div>
                  <dt>Phone:</dt>
                  <dd>{contactInfo.phone}</dd>
                </div>
                <div>
                  <dt>Channel:</dt>
                  <dd>{contactInfo.preferredContact}</dd>
                </div>
              </dl>
            </div>

            {includeAudit && auditContext && (
              <div className="smart-review-card smart-audit-card">
                <div className="smart-review-card-head">
                  <strong>Attached Website Audit Context</strong>
                  <span className="mono badge-score">{auditContext.overallScore}/100</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Target: {auditContext.url} · {auditContext.issues.filter(i => i.severity === 'critical').length} critical leaks detected
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="smart-form-nav">
        {currentStep > 1 && (
          <button
            type="button"
            className="button button-secondary"
            onClick={handleBack}
            disabled={busy}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            className="button button-primary smart-nav-next"
            onClick={handleNext}
          >
            <span>Continue</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="button button-primary smart-nav-submit"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <>
                <RefreshCw size={18} className="spin" aria-hidden="true" />
                <span>Submitting Enquiry…</span>
              </>
            ) : (
              <>
                <Send size={18} aria-hidden="true" />
                <span>Submit Business Enquiry</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
