import { useState, useRef, useEffect, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Globe,
  History,
  Info,
  Link2,
  MessageCircle,
  MinusCircle,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  XCircle,
  Zap,
} from 'lucide-react'
import type { AuditJobStatus, AuditReport, ScoreKey } from '@chazon/shared'
import {
  AUDIT_TAB_META,
  AUDIT_TAB_ORDER,
  getActionableFindingsForTab,
  getChecksForTab,
  getFindingsForTab,
  getReportScoreValue,
  type AuditTabKey,
} from '../lib/audit-report-tabs'
import { auditApi, AuditApiError } from '../lib/audit-api'
import {
  getBusinessFriendlyTitle,
  getBusinessExplanation,
  getBusinessImpacts,
  type BusinessImpactItem,
} from '../lib/findingExplanations'
import { config, getEnquiryEndpoints, track } from '../config'
import { useRouter } from '../location'
import { Link } from '../router'
import { breadcrumbSchema, faqSchema, usePageMeta, webApplicationSchema } from '../seo'
import { PageShell } from '../components/Layout'

const auditFaqs: [string, string][] = [
  [
    'How does the free website health scanner work?',
    'Enter your website URL, and our engine runs automated diagnostics across Core Web Vitals, mobile responsiveness, search engine crawlability, meta tags, and conversion bottlenecks in under 30 seconds.',
  ],
  [
    'Is the website audit really free?',
    'Yes, the instant diagnostic scan and 0–100 Website Health Score report are completely free with no credit card required.',
  ],
  [
    'What Core Web Vitals and SEO metrics are analyzed?',
    'The scanner calculates performance speed index, Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), indexability, heading hierarchies, Open Graph previews, and mobile viewport readiness.',
  ],
  [
    'How do I fix the bottlenecks found in my audit report?',
    'Each finding in the report includes clear, prioritized developer takeaways and business impact summaries. You can also connect directly with Chazon’s engineering team for hands-on resolution.',
  ],
]

const STORAGE_KEY_SESSION = 'chazon_audit_session_history_v1'
const STORAGE_KEY_DEVICE = 'chazon_audit_device_history_v1'

export interface AuditHistoryEntry {
  id: string
  url: string
  displayDomain: string
  timestamp: number
  overallScore: number | null
  scores: {
    performance: number | null
    seo: number | null
    accessibility: number | null
    practices: number | null
    mobile: number | null
  }
  report?: AuditReport
}

function formatAuditTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 45) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function generateAutofillMessage(report: AuditReport, score: number | null): string {
  let domain = 'yourwebsite.com'
  try {
    domain = new URL(report.finalUrl || report.inputUrl).hostname.replace(/^www\./, '')
  } catch {
    domain = (report.finalUrl || report.inputUrl).replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  }
  const scoreText = score !== null ? `${score}/100` : 'Not computed'

  const topFindings = (report.findings || [])
    .filter((f) => f.severity !== 'info')
    .slice(0, 3)
    .map((f) => `• ${getBusinessFriendlyTitle(f) || f.title}`)
    .join('\n')

  return `Target: ${report.finalUrl || report.inputUrl} (${domain})
Health Score: ${scoreText}
${topFindings ? `Key Bottlenecks Detected:\n${topFindings}\n` : ''}
Hi Chazon Team, I reviewed our website audit diagnostic and would like to request the full comprehensive 20+ page engineering report and discuss having your team resolve these performance and SEO bottlenecks. Please contact us with next steps.`
}

export function WebsiteAudit() {
  usePageMeta({
    title: 'Free Website Health Scanner: Core Web Vitals & SEO Diagnostic | Chazon Digital',
    description:
      'Test your website speed, Core Web Vitals and SEO health in 30 seconds. Get an instant 0–100 score with actionable developer and conversion fixes.',
    path: '/website-audit',
    schema: [
      ...breadcrumbSchema([['Website Audit', '/website-audit']]),
      ...webApplicationSchema({
        name: 'Chazon Website Health Scanner',
        path: '/website-audit',
        description: 'Instant 0–100 Website Health Score, Core Web Vitals diagnostic, and SEO bottleneck analyzer.',
      }),
      ...faqSchema(auditFaqs),
    ],
  })

  // URL & Scanning States
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progressPercent, setProgressPercent] = useState(15)
  const [jobStatus, setJobStatus] = useState<AuditJobStatus | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState(false)
  const [activeCategoryTab, setActiveCategoryTab] = useState<AuditTabKey>('all')
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null)
  const [history, setHistory] = useState<AuditHistoryEntry[]>([])
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  // Direct Enquiry Form State
  const [enquiryName, setEnquiryName] = useState('')
  const [enquiryEmail, setEnquiryEmail] = useState('')
  const [enquiryPhone, setEnquiryPhone] = useState('')
  const [enquiryMessage, setEnquiryMessage] = useState('')
  const [enquiryBusy, setEnquiryBusy] = useState(false)
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const [enquiryReference, setEnquiryReference] = useState<string | null>(null)
  const [enquiryWhatsAppHref, setEnquiryWhatsAppHref] = useState<string | null>(null)
  const [enquiryError, setEnquiryError] = useState<string | null>(null)
  const enquiryFormStarted = useRef(Date.now())
  const enquiryRef = useRef<HTMLDivElement | null>(null)

  const selectCategoryTab = (tab: AuditTabKey) => {
    setActiveCategoryTab(tab)
    setExpandedFindingId(null)
  }

  const { search } = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastAutoSearchRef = useRef<string | null>(null)
  const isScanningRef = useRef(false)
  const isMountedRef = useRef(true)
  const userCancelledRef = useRef(false)
  const unmountAbortedRef = useRef(new WeakSet<AbortController>())
  const startAuditRef = useRef<(e?: FormEvent, targetUrl?: string) => Promise<void>>(async () => {})

  // Clean up timers and in-flight requests on actual unmount
  useEffect(() => {
    isMountedRef.current = true
    const unmountAborted = unmountAbortedRef.current
    return () => {
      isMountedRef.current = false
      isScanningRef.current = false
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      if (abortControllerRef.current) {
        unmountAborted.add(abortControllerRef.current)
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  // Load session & device audit history on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const rawSession = window.sessionStorage.getItem(STORAGE_KEY_SESSION)
      const rawDevice = window.localStorage.getItem(STORAGE_KEY_DEVICE)
      const raw = rawSession || rawDevice
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch (err) {
      console.warn('Failed to load audit history from storage:', err)
    }
  }, [])

  // Auto-start when arriving with ?url=...; deferred by a tick so React StrictMode
  // double-invocation cancels the pending timer cleanly before aborting a live fetch.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(search || window.location.search)
    const queryUrl = params.get('url')?.trim()
    if (!queryUrl || lastAutoSearchRef.current === queryUrl) return

    let trimmed = queryUrl
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`
    }
    setUrl(trimmed)

    const timer = window.setTimeout(() => {
      if (!isMountedRef.current) return
      lastAutoSearchRef.current = queryUrl
      void startAuditRef.current(undefined, trimmed)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [search])

  // Start Real Audit
  const handleStartAudit = async (e?: FormEvent, targetUrl?: string) => {
    if (e) e.preventDefault()
    if (isScanningRef.current) return
    let trimmed = (targetUrl ?? url).trim()

    if (!trimmed) {
      setError('Please enter your website URL to run the audit.')
      return
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`
      setUrl(trimmed)
    }

    userCancelledRef.current = false
    isScanningRef.current = true
    setScanning(true)
    setError(null)
    setReport(null)
    setJobStatus(null)
    setProgressPercent(18)
    track('form_start', { form: 'website_audit', url: trimmed })

    // Smooth progress simulation while real scanner performs async checks
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 92) return prev
        const increment = Math.max(1, Math.floor((92 - prev) * 0.12))
        return prev + increment
      })
    }, 1200)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const { id, status: initialStatus } = await auditApi.start(
        { url: trimmed, strategy: 'mobile', crawlLimit: 10, checkLinks: true },
        abortController.signal
      )

      const completedReport = await auditApi.pollUntilComplete(
        id,
        (status) => {
          setJobStatus(status)
          if (status.steps && status.steps.length > 0) {
            const completedCount = status.steps.filter((s) => s.state === 'done').length
            const computedPercent = Math.min(
              95,
              Math.max(20, Math.round((completedCount / status.steps.length) * 100))
            )
            setProgressPercent(computedPercent)
          }
        },
        abortController.signal,
        initialStatus
      )

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setProgressPercent(100)
      setReport(completedReport)
      track('form_submission', {
        form: 'website_audit',
        url: completedReport.finalUrl || completedReport.inputUrl,
      })

      // Add to session & device history
      let domain = 'yourwebsite.com'
      try {
        domain = new URL(completedReport.finalUrl || completedReport.inputUrl).hostname.replace(/^www\./, '')
      } catch {
        domain = (completedReport.finalUrl || completedReport.inputUrl).replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      }

      const overall = getReportScoreValue(completedReport, 'overallHealth')
      const perf = getReportScoreValue(completedReport, 'performance')
      const seo = getReportScoreValue(completedReport, 'technicalSeo')
      const access = getReportScoreValue(completedReport, 'accessibility')
      const practices = getReportScoreValue(completedReport, 'bestPractices')
      const mobile = getReportScoreValue(completedReport, 'mobileUx')

      const newEntry: AuditHistoryEntry = {
        id: completedReport.id,
        url: completedReport.finalUrl || completedReport.inputUrl,
        displayDomain: domain,
        timestamp: Date.now(),
        overallScore: overall,
        scores: {
          performance: perf,
          seo: seo,
          accessibility: access,
          practices: practices,
          mobile: mobile,
        },
        report: completedReport,
      }

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== newEntry.id && item.url !== newEntry.url)
        const updated = [newEntry, ...filtered].slice(0, 8)
        if (typeof window !== 'undefined') {
          try {
            const serialized = JSON.stringify(updated)
            window.sessionStorage.setItem(STORAGE_KEY_SESSION, serialized)
            window.localStorage.setItem(STORAGE_KEY_DEVICE, serialized)
          } catch {
            const slim = updated.map((entry) => ({
              id: entry.id,
              url: entry.url,
              displayDomain: entry.displayDomain,
              timestamp: entry.timestamp,
              overallScore: entry.overallScore,
              scores: entry.scores,
            }))
            try {
              window.sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(slim))
              window.localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(slim))
            } catch (storageErr) {
              // Ignore storage quota limits in private browsing
              void storageErr
            }
          }
        }
        return updated
      })
    } catch (err: unknown) {
      if (unmountAbortedRef.current.has(abortController) || !isMountedRef.current) {
        return
      }
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setReport(null)
      if (err instanceof AuditApiError) {
        if (err.code === 'CANCELLED') {
          setError(
            userCancelledRef.current
              ? 'The audit scan was cancelled.'
              : 'The connection to the audit service was interrupted. Please run the audit again.'
          )
        } else if (err.code === 'DNS_FAILURE') {
          setError(
            `Unable to resolve domain "${trimmed}". Please verify the URL spelling and check that the website is online.`
          )
        } else if (
          err.code === 'INVALID_TARGET' ||
          err.code === 'FORBIDDEN_HOST' ||
          err.code === 'SSRF_BLOCKED' ||
          err.code === 'UNSAFE_TARGET'
        ) {
          setError(
            'Security Policy: Internal network addresses, localhost, and private IP ranges cannot be scanned.'
          )
        } else if (err.code === 'RATE_LIMITED') {
          setError(
            'Audit rate limit reached: Too many scans started from this IP address. Please wait a few minutes before trying again.'
          )
        } else if (err.code === 'SERVER_BUSY') {
          setError(
            'The audit scanner is currently processing other scans. Please try again in a moment.'
          )
        } else {
          setError(err.message || 'Audit analysis failed. Please verify the URL and try again.')
        }
      } else {
        setError(
          (err as Error)?.message ||
            'Unable to connect to the audit scanner service. Please verify your connection and try again.'
        )
      }
      track('form_error', { form: 'website_audit', error: String(err) })
    } finally {
      if (abortControllerRef.current === abortController) {
        isScanningRef.current = false
        abortControllerRef.current = null
        if (isMountedRef.current) setScanning(false)
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current)
          progressTimerRef.current = null
        }
      }
    }
  }
  startAuditRef.current = handleStartAudit

  // Cancel Scan
  const handleCancelScan = async () => {
    userCancelledRef.current = true
    isScanningRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (jobStatus?.id) {
      await auditApi.cancel(jobStatus.id).catch(() => {})
    }
    setScanning(false)
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  // Reset to State A
  const handleNewAudit = () => {
    setReport(null)
    setScanning(false)
    setError(null)
    setJobStatus(null)
    setUrl('')
    setProgressPercent(15)
    setShowHistoryDrawer(false)
  }

  // Load a report from history (instant from memory/cache or fallback via API)
  const handleSelectHistoryReport = async (item: AuditHistoryEntry) => {
    if (item.report) {
      setReport(item.report)
      setUrl(item.url)
      setError(null)
      setScanning(false)
      setShowHistoryDrawer(false)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    try {
      setScanning(true)
      setProgressPercent(35)
      const fetched = await auditApi.getReport(item.id)
      setReport(fetched)
      setUrl(item.url)
      setError(null)
      setShowHistoryDrawer(false)
      setHistory((prev) => {
        const updated = prev.map((h) => (h.id === item.id ? { ...h, report: fetched } : h))
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updated))
            window.localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(updated))
          } catch (storageErr) {
            // Ignore storage write errors
            void storageErr
          }
        }
        return updated
      })
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Unable to load cached audit report from server. Please re-run the audit.')
      setUrl(item.url)
    } finally {
      setScanning(false)
    }
  }

  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updated))
          window.localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(updated))
        } catch (storageErr) {
          // Ignore storage write errors
          void storageErr
        }
      }
      return updated
    })
  }

  const handleClearHistory = () => {
    setHistory([])
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY_SESSION)
        window.localStorage.removeItem(STORAGE_KEY_DEVICE)
      } catch (storageErr) {
        // Ignore storage removal errors
        void storageErr
      }
    }
  }

  const handleRescanHistory = (itemUrl: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUrl(itemUrl)
    void handleStartAudit(undefined, itemUrl)
  }

  // Share Functionality
  const handleShare = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Website Audit Report: ${displayDomain}`,
          text: `Check out the website performance and SEO audit report for ${displayDomain} by Chazon Digital Ventures.`,
          url: shareUrl,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    }
  }

  // Print Functionality
  const handlePrint = () => {
    window.print()
  }

  // Report derivations
  let displayDomain = 'yourwebsite.com'
  let reportDate = 'Analysed just now'
  if (report) {
    try {
      displayDomain = new URL(report.finalUrl || report.inputUrl).hostname.replace(/^www\./, '')
    } catch {
      displayDomain = report.inputUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    }
    reportDate = `Analysed on ${new Date(report.completedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}, ${new Date(report.completedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  // Scores
  const getScoreResult = (key: ScoreKey) => report?.scores.find((s) => s.key === key) ?? null
  const getScoreValue = (key: ScoreKey): number | null => getReportScoreValue(report, key)

  const overallScore = getScoreValue('overallHealth')
  const perfScore = getScoreValue('performance')
  const seoScore = getScoreValue('technicalSeo')
  const accessScore = getScoreValue('accessibility')
  const bestPracticeScore = getScoreValue('bestPractices')
  const mobileScore = getScoreValue('mobileUx')

  const scoreRating =
    overallScore === null ? 'Unavailable' : overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Needs Work' : 'Critical'
  const ratingBadgeClass =
    overallScore === null || overallScore < 60
      ? 'badge-danger'
      : overallScore >= 80
        ? 'badge-good'
        : 'badge-warning'
  const gaugeColor =
    overallScore === null ? '#9CA3AF' : overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'
  const gaugeScoreValue = overallScore ?? 0

  // Autofill enquiry message whenever report changes
  useEffect(() => {
    if (report) {
      setEnquiryMessage(generateAutofillMessage(report, overallScore))
      setEnquirySuccess(false)
      setEnquiryError(null)
      setEnquiryReference(null)
      enquiryFormStarted.current = Date.now()
    }
  }, [report, overallScore])

  const scrollToEnquiry = () => {
    if (enquiryRef.current) {
      enquiryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const nameInput = enquiryRef.current.querySelector<HTMLInputElement>('input[name="enquiryName"]')
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 450)
      }
    }
  }

  const handleSubmitEnquiry = async (e: FormEvent) => {
    e.preventDefault()
    if (!report) return
    setEnquiryError(null)

    if (!enquiryName.trim() || enquiryName.trim().length < 2) {
      setEnquiryError('Please enter your full name.')
      return
    }
    if (!enquiryEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiryEmail.trim())) {
      setEnquiryError('Please enter a valid work email address.')
      return
    }

    setEnquiryBusy(true)

    const payload = {
      enquiry_type: 'audit',
      name: enquiryName.trim(),
      email: enquiryEmail.trim(),
      phone: enquiryPhone.trim() || 'Not provided',
      business: displayDomain || 'Not specified',
      website: report.finalUrl || report.inputUrl,
      category: 'Website Health Audit',
      service: 'Full Engineering Audit Report & Fix Roadmap',
      message: enquiryMessage.trim(),
      auditRef: report.id,
      form_started: enquiryFormStarted.current,
      source_detail: 'website_audit_instant_enquiry',
    }

    const endpoints = getEnquiryEndpoints()
    let succeeded = false
    let refCode = ''
    let waUrl = ''

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json().catch(() => ({})) as {
          data?: { received?: boolean; reference?: string; whatsAppHref?: string }
          received?: boolean
          reference?: string
          whatsAppHref?: string
        }
        const data = json.data ?? json
        if (res.ok && (data.received || res.status === 201 || res.status === 200)) {
          succeeded = true
          refCode = data.reference || `AUD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          if (data.whatsAppHref) {
            waUrl = data.whatsAppHref
          }
          break
        }
      } catch (postErr) {
        // try next endpoint
        void postErr
      }
    }

    if (succeeded) {
      setEnquiryReference(refCode)
      if (waUrl) setEnquiryWhatsAppHref(waUrl)
      setEnquirySuccess(true)
      track('form_submission', { form: 'website_audit_full_report_enquiry', url: report.finalUrl || report.inputUrl })
    } else {
      setEnquiryError('Could not send your request. Please check your connection or reach out directly via WhatsApp.')
    }
    setEnquiryBusy(false)
  }

  const waMessage = report
    ? `Hi Chazon Team! I just audited my website (${displayDomain}) on your Website Health Scanner and scored ${overallScore ?? 'N/A'}/100. I would like to request the full comprehensive engineering report and discuss fixing our website bottlenecks. (Ref: ${report.id.slice(0, 8)})`
    : 'Hi Chazon Team, I would like to request a website audit and consultation.'
  const waHref = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(waMessage)}`

  const actionableAll = (report?.findings || []).filter((f) => f.severity !== 'info')
  const businessImpactList: BusinessImpactItem[] = report ? getBusinessImpacts(report.findings || []) : []
  void businessImpactList

  const topCriticalFindings = [...actionableAll]
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })
    .slice(0, 3)

  // Findings & Checks per Tab
  const allFindings = report?.findings || []
  const allChecks = report?.checks || []

  const activeTabMeta = AUDIT_TAB_META[activeCategoryTab]
  const activeTabScoreObj = getScoreResult(activeTabMeta.scoreKey)
  const activeTabScore = activeTabScoreObj?.value ?? null
  const activeTabChecks = getChecksForTab(allChecks, activeCategoryTab)
  const actionableFindings = getActionableFindingsForTab(allFindings, activeCategoryTab)

  const overviewInsights: { tone: 'good' | 'warn' | 'info'; text: string }[] = []
  const scoreInsightRules: {
    score: number | null
    good: (n: number) => string
    warn: (n: number) => string
  }[] = [
    { score: perfScore, good: (n) => `Strong speed & delivery performance (${n}/100)`, warn: (n) => `Performance bottlenecks detected (${n}/100)` },
    { score: seoScore, good: (n) => `SEO foundation is well optimised (${n}/100)`, warn: (n) => `Technical SEO improvements needed (${n}/100)` },
    { score: accessScore, good: (n) => `Accessibility checks look solid (${n}/100)`, warn: (n) => `Accessibility barriers detected (${n}/100)` },
    { score: bestPracticeScore, good: (n) => `Modern security & best practices verified (${n}/100)`, warn: (n) => `Security or browser best-practice headers need hardening (${n}/100)` },
    { score: mobileScore, good: (n) => `Mobile readiness & viewport hygiene verified (${n}/100)`, warn: (n) => `Mobile readiness needs optimization (${n}/100)` },
  ]
  for (const rule of scoreInsightRules) {
    if (rule.score === null) continue
    overviewInsights.push({
      tone: rule.score >= 80 ? 'good' : 'warn',
      text: rule.score >= 80 ? rule.good(rule.score) : rule.warn(rule.score),
    })
  }
  if (report?.crawl) {
    const ttfbText =
      typeof report.http?.responseTimeMs === 'number'
        ? ` (${Math.round(report.http.responseTimeMs)} ms initial response)`
        : ''
    overviewInsights.push({
      tone: 'info',
      text: `Crawled ${report.crawl.visited} page${report.crawl.visited === 1 ? '' : 's'}${report.links?.ran ? ` and checked ${report.links.checked} links` : ''}${ttfbText}.`,
    })
  }
  if (report?.lighthouse?.metrics?.length) {
    const lcp = report.lighthouse.metrics.find((m) => m.id === 'largest-contentful-paint')
    const cls = report.lighthouse.metrics.find((m) => m.id === 'cumulative-layout-shift')
    if (lcp || cls) {
      overviewInsights.push({
        tone: 'info',
        text: `Google Lighthouse (${report.lighthouse.strategy}): ${lcp ? `LCP ${lcp.displayValue}` : ''}${lcp && cls ? ' · ' : ''}${cls ? `CLS ${cls.displayValue}` : ''}.`,
      })
    }
  } else if (report?.summary?.keyCaveats?.[0]) {
    overviewInsights.push({
      tone: 'info',
      text: report.summary.keyCaveats[0],
    })
  }

  const categoryCards: { tab: AuditTabKey; name: string; score: number | null; icon: ReactNode }[] = [
    { tab: 'performance', name: 'Performance', score: perfScore, icon: <Gauge size={20} className="acc-icon-orange" /> },
    { tab: 'seo', name: 'SEO', score: seoScore, icon: <Search size={20} className="acc-icon-orange" /> },
    { tab: 'accessibility', name: 'Accessibility', score: accessScore, icon: <UserCheck size={20} className="acc-icon-orange" /> },
    { tab: 'practices', name: 'Best Practices', score: bestPracticeScore, icon: <ShieldCheck size={20} className="acc-icon-orange" /> },
    { tab: 'mobile', name: 'Mobile Readiness', score: mobileScore, icon: <Smartphone size={20} className="acc-icon-orange" /> },
  ]

  // Step Status Helper
  const defaultSteps = [
    { key: 'connect', label: 'Connecting to website', state: 'done' as const },
    { key: 'perf', label: 'Checking performance', state: progressPercent > 35 ? ('done' as const) : ('running' as const) },
    { key: 'seo', label: 'Analysing SEO', state: progressPercent > 55 ? ('done' as const) : progressPercent > 35 ? ('running' as const) : ('pending' as const) },
    { key: 'access', label: 'Evaluating accessibility', state: progressPercent > 75 ? ('done' as const) : progressPercent > 55 ? ('running' as const) : ('pending' as const) },
    { key: 'practices', label: 'Reviewing best practices', state: progressPercent > 88 ? ('done' as const) : progressPercent > 75 ? ('running' as const) : ('pending' as const) },
    { key: 'insights', label: 'Generating insights', state: progressPercent >= 95 ? ('done' as const) : progressPercent > 88 ? ('running' as const) : ('pending' as const) },
  ]

  const stepsToDisplay = jobStatus?.steps && jobStatus.steps.length > 0 ? jobStatus.steps : defaultSteps

  return (
    <PageShell hideFooterCta>
      <div className="audit-page-wrapper surface-cream">
        <div className="container audit-page-container">
          {/* Breadcrumb Navigation */}
          <nav className="audit-page-breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb-diamond" aria-hidden="true">❖</span>
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">&gt;</span>
            <span className="breadcrumb-link">Website Audit</span>
            {report && (
              <>
                <span className="breadcrumb-sep" aria-hidden="true">&gt;</span>
                <span className="breadcrumb-current">Results</span>
              </>
            )}
          </nav>

          {/* =================================================================
              STATE B: SCANNING / LOADING STATE
              ================================================================= */}
          {scanning && (
            <div className="audit-scanning-view" role="status" aria-live="polite">
              <div className="asv-header">
                <h1 className="asv-title">Auditing Your Website</h1>
                <p className="asv-subtitle">
                  We’re analysing your website across multiple factors. This usually takes 30–60 seconds.
                </p>
              </div>

              <div className="asv-grid">
                {/* Left Side: Circular Progress Gauge & Target URL */}
                <div className="asv-left-col">
                  <div className="asv-gauge-card">
                    <div className="asv-circle-wrap">
                      <svg className="asv-circle-svg" viewBox="0 0 160 160">
                        {/* Background Track */}
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          fill="none"
                          stroke="rgba(216, 69, 2, 0.12)"
                          strokeWidth="10"
                        />
                        {/* Animated Progress Stroke */}
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          fill="none"
                          stroke="#D84502"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={427}
                          strokeDashoffset={427 * (1 - progressPercent / 100)}
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <div className="asv-circle-center">
                        <span className="asv-percent-num">{progressPercent}%</span>
                      </div>
                    </div>

                    <div className="asv-analyzing-text">Analysing your website...</div>
                    <div className="asv-target-url-pill">
                      <Globe size={14} />
                      <span>{url || 'https://yourwebsite.com'}</span>
                    </div>

                    <button
                      type="button"
                      className="asv-cancel-btn"
                      onClick={handleCancelScan}
                    >
                      Cancel Scan
                    </button>
                  </div>
                </div>

                {/* Right Side: Stepper Checklist */}
                <div className="asv-right-col">
                  <div className="asv-checklist-card">
                    <ul className="asv-steps-list">
                      {stepsToDisplay.map((step) => {
                        const isDone = step.state === 'done'
                        const isRunning = step.state === 'running'
                        return (
                          <li
                            key={step.key}
                            className={`asv-step-row ${isDone ? 'is-done' : isRunning ? 'is-running' : 'is-pending'}`}
                          >
                            <span className="asv-step-icon">
                              {isDone ? (
                                <Check size={16} className="icon-done" />
                              ) : isRunning ? (
                                <span className="icon-spinner" />
                              ) : (
                                <span className="icon-pending-dot" />
                              )}
                            </span>
                            <span className="asv-step-label">{step.label}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              STATE C: ACTUAL AUDIT RESULTS DASHBOARD
              ================================================================= */}
          {!scanning && report && (
            <div className="audit-results-view" id="audit-report-results">
              {/* Report Header Bar */}
              <div className="arv-header-bar">
                <div className="arv-header-left">
                  <div className="arv-eyebrow">
                    <span className="arv-diamond">❖</span> Audit Report
                  </div>
                  <div className="arv-domain-row">
                    <h1 className="arv-domain-name">{displayDomain}</h1>
                    <a
                      href={report.finalUrl || report.inputUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="arv-domain-link"
                      title="Open website in new tab"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  <div className="arv-timestamp-text">{reportDate}</div>
                </div>

                <div className="arv-header-right">
                  <button
                    type="button"
                    className="button button-primary arv-action-btn arv-get-report-btn"
                    onClick={scrollToEnquiry}
                    title="Request full 20+ page engineering report & developer fix roadmap"
                  >
                    <FileText size={16} />
                    <span>Request Full Report</span>
                  </button>
                  {history.length > 1 && (
                    <button
                      type="button"
                      className={`button button-secondary arv-action-btn arv-history-btn ${showHistoryDrawer ? 'is-active' : ''}`}
                      onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                      title="Switch between audits performed in this session"
                    >
                      <History size={16} /> Recent Scans ({history.length})
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-secondary arv-action-btn"
                    onClick={handleShare}
                  >
                    <Share2 size={16} /> Share Report
                  </button>
                  <button
                    type="button"
                    className="button button-secondary arv-action-btn"
                    onClick={handlePrint}
                  >
                    <Download size={16} /> Download PDF
                  </button>
                  <button
                    type="button"
                    className="button button-primary arv-new-audit-btn"
                    onClick={handleNewAudit}
                  >
                    <RotateCcw size={16} /> New Audit
                  </button>
                </div>
              </div>

              {/* Session History Quick-Switch Drawer */}
              {showHistoryDrawer && history.length > 0 && (
                <div className="arv-history-drawer" role="region" aria-label="Session audit history switcher">
                  <div className="ahd-drawer-header">
                    <div className="ahd-drawer-title">
                      <History size={15} />
                      <span>Switch to another scan from this session:</span>
                    </div>
                    <button
                      type="button"
                      className="ahd-close-btn"
                      onClick={() => setShowHistoryDrawer(false)}
                      aria-label="Close session history list"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="ahd-drawer-grid">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectHistoryReport(item)}
                        className={`ahd-item-pill ${item.id === report.id ? 'is-current' : ''}`}
                      >
                        <Globe size={13} className="ahd-globe" />
                        <span className="ahd-domain">{item.displayDomain}</span>
                        <span
                          className={`ahd-score ${
                            item.overallScore === null
                              ? 'score-gray'
                              : item.overallScore >= 80
                                ? 'score-green'
                                : item.overallScore >= 60
                                  ? 'score-amber'
                                  : 'score-red'
                          }`}
                        >
                          {item.overallScore ?? '—'}
                        </span>
                        {item.id === report.id && <span className="ahd-current-tag">Viewing</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Toast */}
              {shareToast && (
                <div className="arv-toast-alert" role="status">
                  <Check size={16} /> Report link copied to clipboard!
                </div>
              )}

              {/* Top Scores Grid */}
              <div className="arv-scores-grid">
                {/* Left: Overall Website Score */}
                <div className="arv-overall-card">
                  <h2 className="arv-overall-title">Overall Website Score</h2>
                  <div className="arv-overall-meter">
                    {/* Semicircle SVG Gauge */}
                    <svg className="arv-semicircle-svg" viewBox="0 0 180 100">
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke="rgba(36, 24, 19, 0.08)"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={220}
                        strokeDashoffset={220 * (1 - gaugeScoreValue / 100)}
                      />
                    </svg>
                    <div className="arv-overall-score-center">
                      <span className="arv-score-big">{overallScore ?? 'N/A'}</span>
                      {overallScore !== null && <span className="arv-score-denom">/100</span>}
                    </div>
                  </div>

                  <div className={`arv-rating-pill ${ratingBadgeClass}`}>
                    {scoreRating}
                  </div>
                  <p className="arv-overall-summary-copy">
                    {overallScore === null
                      ? 'Could not compute an overall score because the target site blocked or failed HTML retrieval.'
                      : overallScore >= 80
                        ? 'Your website is performing well with targeted room for strategic improvement.'
                        : overallScore >= 60
                          ? 'Your website has noticeable performance and visibility gaps holding back conversion.'
                          : 'Critical bottlenecks detected across speed, mobile readiness and search visibility.'}
                  </p>
                </div>

                {/* Right: 5 Category Score Cards */}
                <div className="arv-categories-grid">
                  {categoryCards.map((card) => (
                    <button
                      key={card.tab}
                      type="button"
                      className={`arv-cat-card ${activeCategoryTab === card.tab ? 'is-selected' : ''}`}
                      onClick={() => selectCategoryTab(card.tab)}
                      aria-pressed={activeCategoryTab === card.tab}
                    >
                      <div className="acc-head">{card.icon}</div>
                      <div className="acc-name">{card.name}</div>
                      <div className="acc-score-wrap">
                        <span className="acc-val">{card.score ?? 'N/A'}</span>
                        {card.score !== null && <span className="acc-den">/100</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* =============================================================
                  EXECUTIVE DIAGNOSTIC SUMMARY & PLAIN-ENGLISH SHORT REPORT
                  ============================================================= */}
              <div className="arv-executive-brief-card">
                <div className="aeb-header">
                  <div className="aeb-badge-row">
                    <span className="aeb-eyebrow">
                      <Sparkles size={14} /> Executive Diagnostic Brief
                    </span>
                    <span className={`aeb-status-chip ${ratingBadgeClass}`}>
                      {overallScore === null
                        ? 'Diagnostic Incomplete'
                        : overallScore < 60
                          ? 'High Revenue & Traffic Leak'
                          : overallScore < 80
                            ? 'Noticeable Friction Gaps'
                            : 'Solid Foundation'}
                    </span>
                  </div>

                  <h2 className="aeb-title">
                    {overallScore === null
                      ? 'Diagnostic Summary'
                      : overallScore < 60
                        ? `Critical bottlenecks on ${displayDomain} are suppressing your reach & conversions.`
                        : overallScore < 80
                          ? `Performance and SEO bottlenecks on ${displayDomain} are leaving customer growth on the table.`
                          : `${displayDomain} has a strong foundation with targeted conversion optimization opportunities.`}
                  </h2>

                  <p className="aeb-desc">
                    {overallScore === null
                      ? 'We were unable to complete all network requests for this domain. Please verify your server accessibility.'
                      : overallScore < 60
                        ? 'Our automated scanner detected major speed lags and search indexing obstacles. Prospective customers on mobile devices face excessive delays before viewing your offerings, directly inflating bounce rates and reducing inbound leads.'
                        : overallScore < 80
                          ? 'Your website is functional, but delayed visual rendering and technical SEO gaps create visitor friction. Addressing these high-impact findings will meaningfully improve your visitor retention and search engine rankings.'
                          : 'Your website outperforms the majority of industry peers in speed and hygiene. Fine-tuning Core Web Vitals stability and mobile conversion touchpoints will help maximize your inbound lead capture.'}
                  </p>
                </div>

                {/* 3 Business Impact Pillars */}
                <div className="aeb-impact-pillars-grid">
                  <div className="aeb-pillar-item">
                    <div className="api-icon-wrap is-speed">
                      <Gauge size={18} />
                    </div>
                    <div className="api-content">
                      <strong className="api-title">Speed &amp; Visitor Bounce Risk</strong>
                      <p className="api-text">
                        {perfScore !== null && perfScore < 70
                          ? 'High bounce risk: 53% of mobile visitors abandon pages taking over 3s to load.'
                          : 'Good delivery speed; minor script optimization will preserve mobile retention.'}
                      </p>
                    </div>
                  </div>

                  <div className="aeb-pillar-item">
                    <div className="api-icon-wrap is-seo">
                      <Search size={18} />
                    </div>
                    <div className="api-content">
                      <strong className="api-title">Google Search Visibility</strong>
                      <p className="api-text">
                        {seoScore !== null && seoScore < 75
                          ? 'Indexing barriers detected; search engine crawlers may limit prominent display in search results.'
                          : 'Solid technical SEO tags detected; structured metadata helps preserve ranking.'}
                      </p>
                    </div>
                  </div>

                  <div className="aeb-pillar-item">
                    <div className="api-icon-wrap is-convert">
                      <Target size={18} />
                    </div>
                    <div className="api-content">
                      <strong className="api-title">Inquiry &amp; Conversion Friction</strong>
                      <p className="api-text">
                        {mobileScore !== null && mobileScore < 75
                          ? 'Mobile usability and layout shifts make tapping buttons or completing contact forms harder for users.'
                          : 'Mobile viewport is responsive; clean interaction paths protect direct customer inquiries.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Critical Issues - Plain English Cards */}
                {topCriticalFindings.length > 0 && (
                  <div className="aeb-critical-issues-section">
                    <div className="acis-header">
                      <h3 className="acis-title">Top Priority Issues Requiring Attention (Plain English)</h3>
                      <span className="acis-subtitle">
                        Ranked by impact on search traffic, user retention and conversion.
                      </span>
                    </div>

                    <div className="acis-issues-grid">
                      {topCriticalFindings.map((finding, idx) => {
                        const exp = getBusinessExplanation(finding)
                        const title = getBusinessFriendlyTitle(finding) || finding.title
                        return (
                          <div key={finding.id} className="acis-issue-card">
                            <div className="aic-header">
                              <span className="aic-rank mono">#{idx + 1}</span>
                              <strong className="aic-title">{title}</strong>
                              <span className={`aic-severity sev-${finding.severity}`}>
                                {finding.severity}
                              </span>
                            </div>

                            <div className="aic-body">
                              <div className="aic-row">
                                <span className="aic-label">What is the problem:</span>
                                <p className="aic-val">{exp.whatIsWrong || finding.plainSummary || finding.observed || finding.title}</p>
                              </div>
                              <div className="aic-row is-impact">
                                <span className="aic-label">Why it hurts your business:</span>
                                <p className="aic-val">{exp.businessImpact || exp.whyItMatters || 'Delays user interaction and reduces visitor trust.'}</p>
                              </div>
                              <div className="aic-row is-fix">
                                <span className="aic-label">Recommended developer fix:</span>
                                <p className="aic-val">{exp.whatToDo || finding.recommendation || 'Optimize and refactor affected assets.'}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Direct CTA Bar inside Brief */}
                <div className="aeb-cta-bar">
                  <div className="acb-text">
                    <strong>Want these bottlenecks resolved by senior developers?</strong>
                    <span>We build high-performance websites and fix Core Web Vitals to convert visitors into paying clients.</span>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToEnquiry}
                    className="button button-primary aeb-scroll-btn"
                  >
                    <span>Request Full Report &amp; Fix Scope</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="arv-tabs-row" role="tablist" aria-label="Audit Report Categories">
                {AUDIT_TAB_ORDER.map((tabKey) => {
                  const meta = AUDIT_TAB_META[tabKey]
                  const count = getFindingsForTab(allFindings, tabKey).length
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      role="tab"
                      aria-selected={activeCategoryTab === tabKey}
                      className={`arv-tab-pill ${activeCategoryTab === tabKey ? 'is-active' : ''}`}
                      onClick={() => selectCategoryTab(tabKey)}
                    >
                      <span>{meta.label}</span>
                      {count > 0 && <span className="arv-tab-count">{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Key Insights / Checks & Recommendations Split */}
              <div className="arv-details-split">
                {/* Left Card: Overview Key Insights or Category Diagnostics */}
                <div className="arv-insights-card">
                  {activeCategoryTab === 'all' ? (
                    <>
                      <h3 className="arv-card-heading">Key Insights</h3>
                      <ul className="arv-insights-list">
                        {overviewInsights.map((item, idx) => (
                          <li key={idx} className="arv-insight-item">
                            {item.tone === 'good' ? (
                              <CheckCircle2 size={18} className="aii-check-icon" />
                            ) : item.tone === 'warn' ? (
                              <AlertTriangle size={18} className="aii-warn-icon" />
                            ) : (
                              <Info size={18} className="aii-info-icon" />
                            )}
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <div className="arv-card-heading-row">
                        <h3 className="arv-card-heading">{activeTabMeta.label} Diagnostics</h3>
                        <span className="arv-tab-score-badge">
                          {activeTabScore !== null ? `${activeTabScore}/100` : 'No data'}
                        </span>
                      </div>

                      {activeTabScoreObj?.note && (
                        <p className="arv-tab-source-note">
                          <span className="arv-source-chip">
                            {activeTabScoreObj.kind === 'lighthouse' ? 'Google Lighthouse' : 'HTTP & HTML Checks'}
                          </span>{' '}
                          {activeTabScoreObj.note}
                        </p>
                      )}

                      {(activeCategoryTab === 'performance' || activeCategoryTab === 'mobile') &&
                        (report.lighthouse?.metrics?.length ? (
                          <div className="arv-lab-metrics-grid">
                            {report.lighthouse.metrics.slice(0, 6).map((m) => (
                              <div key={m.id} className={`arv-lab-metric is-${m.rating ?? 'neutral'}`}>
                                <span className="alm-label">{m.label}</span>
                                <span className="alm-val">{m.displayValue}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="arv-lab-metrics-grid">
                            <div className="arv-lab-metric is-neutral">
                              <span className="alm-label">Initial HTML Fetch</span>
                              <span className="alm-val">
                                {typeof report.http?.responseTimeMs === 'number'
                                  ? `${Math.round(report.http.responseTimeMs)} ms`
                                  : '—'}
                              </span>
                            </div>
                            <div className="arv-lab-metric is-neutral">
                              <span className="alm-label">Pages Crawled</span>
                              <span className="alm-val">{report.crawl?.visited ?? 0}</span>
                            </div>
                            <div className="arv-lab-metric is-neutral">
                              <span className="alm-label">HTTPS Security</span>
                              <span className="alm-val">{report.http?.httpsUsed ? 'Enabled' : 'Not detected'}</span>
                            </div>
                          </div>
                        ))}

                      {activeTabChecks.length > 0 ? (
                        <ul className="arv-checks-list">
                          {activeTabChecks.map((chk) => (
                            <li key={chk.id} className={`arv-check-item status-${chk.status}`}>
                              <span className="aci-icon" aria-hidden="true">
                                {chk.status === 'pass' ? (
                                  <CheckCircle2 size={16} />
                                ) : chk.status === 'warn' ? (
                                  <AlertTriangle size={16} />
                                ) : chk.status === 'fail' ? (
                                  <XCircle size={16} />
                                ) : (
                                  <MinusCircle size={16} />
                                )}
                              </span>
                              <div className="aci-copy">
                                <span className="aci-label">{chk.label}</span>
                                <span className="aci-detail">{chk.detail}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="arv-tab-source-note">No detailed check telemetry returned for this category.</p>
                      )}
                    </>
                  )}
                </div>

                {/* Right Card: Filtered Recommendations */}
                <div className="arv-recs-card">
                  <h3 className="arv-card-heading">
                    {activeCategoryTab === 'all' ? 'Top Recommendations' : `${activeTabMeta.label} Recommendations`}
                  </h3>
                  <div className="arv-recs-list">
                    {actionableFindings.length > 0 ? (
                      actionableFindings.map((finding) => {
                        const isExpanded = expandedFindingId === finding.id
                        const friendlyTitle = getBusinessFriendlyTitle(finding) || finding.title
                        const explanationText = finding.plainSummary || finding.explanation || finding.observed || finding.title
                        const dotClass =
                          finding.severity === 'critical'
                            ? 'dot-critical'
                            : finding.severity === 'high'
                              ? 'dot-high'
                              : finding.severity === 'medium'
                                ? 'dot-medium'
                                : finding.severity === 'low'
                                  ? 'dot-low'
                                  : 'dot-info'
                        return (
                          <div
                            key={finding.id}
                            className={`arv-rec-item ${isExpanded ? 'is-expanded' : ''}`}
                            onClick={() =>
                              setExpandedFindingId(isExpanded ? null : finding.id)
                            }
                          >
                            <div className="ari-head">
                              <span className={`ari-sev-dot ${dotClass}`} />
                              <span className="ari-title">{friendlyTitle}</span>
                              <span className={`ari-sev-badge sev-${finding.severity}`}>{finding.severity}</span>
                              <ChevronRight
                                size={18}
                                className={`ari-chevron ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </div>
                            {isExpanded && (
                              <div className="ari-body">
                                <p className="ari-explanation">
                                  {explanationText}
                                </p>
                                {finding.observed && (
                                  <p className="ari-meta-line">
                                    <strong>Observed:</strong> {finding.observed}
                                  </p>
                                )}
                                {finding.expected && (
                                  <p className="ari-meta-line">
                                    <strong>Target:</strong> {finding.expected}
                                  </p>
                                )}
                                {finding.recommendation && (
                                  <div className="ari-fix-box">
                                    <strong>Recommended Action:</strong> {finding.recommendation}
                                  </div>
                                )}
                                {finding.evidence && finding.evidence.length > 0 && (
                                  <ul className="ari-evidence-list">
                                    {finding.evidence.slice(0, 3).map((ev, eIdx) => (
                                      <li key={eIdx}>{ev}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="arv-empty-recs">
                        <CheckCircle2 size={24} className="aii-check-icon" />
                        <p>
                          {activeCategoryTab === 'all'
                            ? 'No critical recommendations. The audited page passed the primary baseline checks!'
                            : `No ${activeTabMeta.label} issues detected — automated checks for this section passed cleanly!`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =============================================================
                  HIGH-CONVERTING DIRECT ENQUIRY SECTION (AUTOFILLED)
                  ============================================================= */}
              <div className="audit-enquiry-section" id="request-full-report" ref={enquiryRef}>
                <div className="aes-container-card">
                  <div className="aes-grid">
                    {/* Left Side: Value Proposition & Scope Breakdown */}
                    <div className="aes-left-info">
                      <div className="aes-badge">
                        <Sparkles size={14} />
                        <span>CHAZON ENGINEERING SCOPE</span>
                      </div>
                      <h3 className="aes-title">
                        Get the Full 20+ Page Engineering Report &amp; Fix Roadmap
                      </h3>
                      <p className="aes-subtitle">
                        Our technical architects review your codebase, Core Web Vitals telemetry, and conversion bottlenecks to build an actionable, step-by-step developer remediation roadmap.
                      </p>

                      <div className="aes-checklist">
                        <div className="aes-check-item">
                          <div className="aci-icon">
                            <Check size={16} />
                          </div>
                          <div>
                            <strong>Complete Codebase &amp; Architecture Review</strong>
                            <span>Deep-dive into render-blocking scripts, font loading, TTFB, and database/hosting latency.</span>
                          </div>
                        </div>

                        <div className="aes-check-item">
                          <div className="aci-icon">
                            <Check size={16} />
                          </div>
                          <div>
                            <strong>Line-by-Line Developer Remediation Guide</strong>
                            <span>Clear, reproducible instructions your developers can implement immediately to hit 90+ Lighthouse scores.</span>
                          </div>
                        </div>

                        <div className="aes-check-item">
                          <div className="aci-icon">
                            <Check size={16} />
                          </div>
                          <div>
                            <strong>Technical SEO &amp; Indexability Hardening</strong>
                            <span>Canonical tags, structured schema.org entities, sitemap hierarchies, and crawl optimization.</span>
                          </div>
                        </div>

                        <div className="aes-check-item">
                          <div className="aci-icon">
                            <Check size={16} />
                          </div>
                          <div>
                            <strong>Direct Technical Founder Consultation</strong>
                            <span>30-minute discovery call with our engineering leads to review your growth roadmap.</span>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Direct Alternative */}
                      <div className="aes-whatsapp-box">
                        <div className="awb-text">
                          <strong>Prefer an instant response?</strong>
                          <span>Chat directly with our founding team on WhatsApp with your audit data attached.</span>
                        </div>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-whatsapp aes-wa-btn"
                        >
                          <MessageCircle size={18} />
                          <span>Chat on WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Right Side: Autofilled Direct Enquiry Form */}
                    <div className="aes-right-form">
                      {enquirySuccess ? (
                        <div className="aes-success-box" role="status">
                          <div className="asb-icon-wrap">
                            <CheckCircle2 size={40} />
                          </div>
                          <h4 className="asb-title">Enquiry Sent to Engineering Team</h4>
                          <p className="asb-desc">
                            Thank you, <strong>{enquiryName}</strong>. Your full report request for <strong>{displayDomain}</strong> has been routed directly to our founders.
                          </p>

                          <div className="asb-ref-pill">
                            <span>Reference Code:</span>
                            <strong className="mono">{enquiryReference || 'CHZ-AUDIT'}</strong>
                          </div>

                          <div className="asb-next-steps">
                            <div className="ans-item">
                              <span className="ans-num mono">1</span>
                              <span>We review your audit diagnostics &amp; crawl telemetry.</span>
                            </div>
                            <div className="ans-item">
                              <span className="ans-num mono">2</span>
                              <span>We prepare your custom remediation roadmap.</span>
                            </div>
                            <div className="ans-item">
                              <span className="ans-num mono">3</span>
                              <span>We follow up directly via Email / WhatsApp within 4–24 hours.</span>
                            </div>
                          </div>

                          <a
                            href={
                              enquiryWhatsAppHref ||
                              `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(
                                `Hi Chazon! I just submitted an enquiry for ${displayDomain} (Ref: ${enquiryReference || 'CHZ-AUDIT'}).`
                              )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button-whatsapp asb-wa-btn"
                          >
                            <MessageCircle size={16} />
                            <span>Follow Up on WhatsApp Now</span>
                          </a>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitEnquiry} className="aes-form" noValidate>
                          <div className="aes-form-header">
                            <h4 className="afh-title">Direct Enquiry Form</h4>
                            <span className="afh-autofill-tag">
                              <Sparkles size={13} /> Audit Data Autofilled
                            </span>
                          </div>

                          {/* Autofilled Audit Context Badge */}
                          <div className="aes-context-pill">
                            <Globe size={14} />
                            <span className="acp-domain" title={report.finalUrl || report.inputUrl}>
                              {displayDomain}
                            </span>
                            <span className={`acp-score ${ratingBadgeClass}`}>
                              {overallScore !== null ? `Score: ${overallScore}/100` : 'Score N/A'}
                            </span>
                            <span className="acp-ref mono">Ref: #{report.id.slice(0, 8)}</span>
                          </div>

                          {enquiryError && (
                            <div className="aes-error-alert" role="alert">
                              <AlertTriangle size={15} />
                              <span>{enquiryError}</span>
                            </div>
                          )}

                          <div className="aes-fields-grid">
                            <div className="aes-field-group">
                              <label htmlFor="enquiry-name" className="aes-label">
                                Your Name <span className="req">*</span>
                              </label>
                              <input
                                id="enquiry-name"
                                name="enquiryName"
                                type="text"
                                required
                                value={enquiryName}
                                onChange={(e) => setEnquiryName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="aes-input"
                              />
                            </div>

                            <div className="aes-field-group">
                              <label htmlFor="enquiry-email" className="aes-label">
                                Work Email <span className="req">*</span>
                              </label>
                              <input
                                id="enquiry-email"
                                name="enquiryEmail"
                                type="email"
                                required
                                value={enquiryEmail}
                                onChange={(e) => setEnquiryEmail(e.target.value)}
                                placeholder="e.g. john@yourcompany.com"
                                className="aes-input"
                              />
                            </div>
                          </div>

                          <div className="aes-field-group">
                            <label htmlFor="enquiry-phone" className="aes-label">
                              Phone / WhatsApp Number <span className="opt">(Optional)</span>
                            </label>
                            <input
                              id="enquiry-phone"
                              name="enquiryPhone"
                              type="tel"
                              value={enquiryPhone}
                              onChange={(e) => setEnquiryPhone(e.target.value)}
                              placeholder="+91 98200 00000"
                              className="aes-input"
                            />
                          </div>

                          <div className="aes-field-group">
                            <div className="aes-msg-label-row">
                              <label htmlFor="enquiry-message" className="aes-label">
                                Project Message &amp; Diagnostic Details
                              </label>
                              <span className="aes-autofill-hint">Autofilled from your scan</span>
                            </div>
                            <textarea
                              id="enquiry-message"
                              name="enquiryMessage"
                              rows={5}
                              value={enquiryMessage}
                              onChange={(e) => setEnquiryMessage(e.target.value)}
                              className="aes-textarea"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={enquiryBusy}
                            className="button button-primary aes-submit-btn"
                          >
                            {enquiryBusy ? (
                              <span>Submitting Enquiry...</span>
                            ) : (
                              <>
                                <span>Send Enquiry &amp; Request Full Report</span>
                                <Send size={16} />
                              </>
                            )}
                          </button>

                          <div className="aes-form-footer-note">
                            <ShieldCheck size={14} />
                            <span>100% confidential. Directly emailed to our founding team with zero sales spam.</span>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              STATE A: INITIAL AUDIT INTRODUCTION & RUN AUDIT FORM
              ================================================================= */}
          {!scanning && !report && (
            <div className="audit-initial-view">
              {/* Hero Split */}
              <div className="audit-hero-split">
                {/* Left Side: Headline, Subtitle, 3 Value Points */}
                <div className="audit-hero-left">
                  <span className="audit-hero-eyebrow">FREE WEBSITE AUDIT</span>
                  <h1 className="audit-hero-headline">
                    Know how your website{' '}
                    <span className="serif-italic-accent">performs.</span>
                  </h1>
                  <p className="audit-hero-lead">
                    Get a detailed, instant audit of your website’s performance, SEO, user experience and growth
                    opportunities.
                  </p>

                  <div className="audit-hero-points-list">
                    {/* Point 1 */}
                    <div className="ahp-item">
                      <div className="ahp-icon-wrap" aria-hidden="true">
                        <Zap size={20} />
                      </div>
                      <div className="ahp-text-wrap">
                        <h2 className="ahp-title">Instant Analysis</h2>
                        <p className="ahp-desc">Get results in minutes.</p>
                      </div>
                    </div>

                    {/* Point 2 */}
                    <div className="ahp-item">
                      <div className="ahp-icon-wrap" aria-hidden="true">
                        <Target size={20} />
                      </div>
                      <div className="ahp-text-wrap">
                        <h2 className="ahp-title">Identify Issues</h2>
                        <p className="ahp-desc">Find what’s holding you back.</p>
                      </div>
                    </div>

                    {/* Point 3 */}
                    <div className="ahp-item">
                      <div className="ahp-icon-wrap" aria-hidden="true">
                        <BarChart3 size={20} />
                      </div>
                      <div className="ahp-text-wrap">
                        <h2 className="ahp-title">Actionable Insights</h2>
                        <p className="ahp-desc">Clear, practical recommendations.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Laptop Scene with Polished Glass HUD Diagnostics */}
                <div className="audit-hero-right">
                  <div className="audit-hero-scene-wrap">
                    <div className="audit-hero-backdrop-glow" aria-hidden="true" />
                    <div className="audit-hero-laptop-scene">
                      <picture className="audit-laptop-picture">
                        <source srcSet="/assets/website-audit-hero.webp" type="image/webp" />
                        <img
                          src="/assets/website-audit-hero.jpg"
                          alt="Website Audit diagnostic report and performance analysis on laptop"
                          className="audit-laptop-img"
                          width={1376}
                          height={768}
                          loading="eager"
                        />
                      </picture>

                      {/* Top-Right: Verified Core Web Vitals Badge */}
                      <div className="audit-hud-badge-top" aria-hidden="true">
                        <div className="ahb-icon-check">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="ahb-text">
                          <strong>Core Web Vitals Pass</strong>
                          <span>Sub-800ms speed index</span>
                        </div>
                      </div>

                      {/* Bottom-Left: Live Diagnostic Health Card */}
                      <div className="audit-hud-card-bottom" aria-hidden="true">
                        <div className="ahc-score-ring">
                          <span className="ahc-num">87</span>
                          <span className="ahc-label">SCORE</span>
                        </div>
                        <div className="ahc-info">
                          <div className="ahc-header">
                            <strong>Website Health Scanner</strong>
                            <span className="ahc-live-pill">
                              <span className="ahc-dot" /> LIVE
                            </span>
                          </div>
                          <div className="ahc-metrics-row">
                            <span className="ahc-metric">
                              <Check size={13} className="ahc-check" /> Performance
                            </span>
                            <span className="ahc-metric">
                              <Check size={13} className="ahc-check" /> SEO 100%
                            </span>
                            <span className="ahc-metric">
                              <Check size={13} className="ahc-check" /> Mobile Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prominent "Audit Your Website" Card */}
              <div className="audit-run-card">
                <h2 className="arc-title">Audit Your Website</h2>
                <p className="arc-subtitle">
                  Enter your website URL to get a comprehensive performance and SEO analysis.
                </p>

                {error && (
                  <div className="arc-error-alert" role="alert">
                    <Info size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleStartAudit} className="arc-form" noValidate>
                  <div className="arc-input-box">
                    <span className="arc-link-icon" aria-hidden="true">
                      <Link2 size={18} />
                    </span>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.yourwebsite.com"
                      className="arc-url-input"
                      aria-label="Website URL to audit"
                    />
                    <button type="submit" className="button button-primary arc-submit-btn">
                      <span>Run Website Audit</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>

                  <div className="arc-checklist-row">
                    <span className="arc-check-item">
                      <Check size={15} /> Performance
                    </span>
                    <span className="arc-check-item">
                      <Check size={15} /> SEO
                    </span>
                    <span className="arc-check-item">
                      <Check size={15} /> Accessibility
                    </span>
                    <span className="arc-check-item">
                      <Check size={15} /> Best Practices
                    </span>
                    <span className="arc-check-item">
                      <Check size={15} /> Mobile Readiness
                    </span>
                  </div>
                </form>
              </div>

              {/* Session / Device Audit History Section */}
              {history.length > 0 && (
                <div className="audit-history-section" id="session-audit-history">
                  <div className="ahist-header">
                    <div className="ahist-title-wrap">
                      <div className="ahist-icon-badge" aria-hidden="true">
                        <History size={18} />
                      </div>
                      <div>
                        <h3 className="ahist-title">Recent Audits in This Session</h3>
                        <p className="ahist-subtitle">
                          Saved locally on this device · Click any audit to view its full diagnostic report
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="ahist-clear-btn"
                      title="Clear session audit history"
                    >
                      <Trash2 size={13} />
                      <span>Clear History</span>
                    </button>
                  </div>

                  <div className="audit-history-grid">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistoryReport(item)}
                        className="ahist-card"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            void handleSelectHistoryReport(item)
                          }
                        }}
                      >
                        <div className="ahist-card-top">
                          <div className="ahist-domain-group">
                            <div className="ahist-globe-icon" aria-hidden="true">
                              <Globe size={16} />
                            </div>
                            <div className="ahist-domain-info">
                              <strong className="ahist-domain-name" title={item.url}>
                                {item.displayDomain}
                              </strong>
                              <span className="ahist-time-stamp">
                                <Clock size={12} />
                                {formatAuditTime(item.timestamp)}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`ahist-score-chip ${
                              item.overallScore === null
                                ? 'chip-gray'
                                : item.overallScore >= 80
                                  ? 'chip-green'
                                  : item.overallScore >= 60
                                    ? 'chip-amber'
                                    : 'chip-red'
                            }`}
                          >
                            <span className="ahist-score-val">{item.overallScore ?? '—'}</span>
                            <span className="ahist-score-suffix">/100</span>
                          </div>
                        </div>

                        {/* Category Score Preview */}
                        <div className="ahist-metrics-chips">
                          {item.scores.performance !== null && (
                            <span className="ahist-mchip">
                              <Gauge size={12} /> Perf {item.scores.performance}
                            </span>
                          )}
                          {item.scores.seo !== null && (
                            <span className="ahist-mchip">
                              <Search size={12} /> SEO {item.scores.seo}
                            </span>
                          )}
                          {item.scores.mobile !== null && (
                            <span className="ahist-mchip">
                              <Smartphone size={12} /> Mobile {item.scores.mobile}
                            </span>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="ahist-card-actions">
                          <span className="ahist-view-cta">
                            <span>View Full Report</span>
                            <ChevronRight size={15} />
                          </span>

                          <div className="ahist-secondary-actions">
                            <button
                              type="button"
                              onClick={(e) => handleRescanHistory(item.url, e)}
                              className="ahist-action-icon-btn"
                              title="Re-run audit for this URL"
                              aria-label={`Re-run audit for ${item.displayDomain}`}
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                              className="ahist-action-icon-btn delete-btn"
                              title="Remove from history"
                              aria-label={`Remove ${item.displayDomain} from history`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
