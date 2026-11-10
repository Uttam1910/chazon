import { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Gauge,
  Globe,
  Info,
  Link2,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Target,
  UserCheck,
  Zap,
} from 'lucide-react'
import type { AuditJobStatus, AuditReport } from '@chazon/shared'
import { auditApi, AuditApiError } from '../lib/audit-api'
import { getBusinessFriendlyTitle } from '../lib/findingExplanations'
import { track } from '../config'
import { Link } from '../router'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'

export function WebsiteAudit() {
  usePageMeta({
    title: 'Free Website Audit: Performance & SEO Diagnostic | Chazon Digital',
    description:
      'Know how your website performs. Get a detailed, instant analysis of your website’s performance, SEO, user experience and growth opportunities.',
    path: '/website-audit',
    schema: breadcrumbSchema([['Website Audit', '/website-audit']]),
  })

  // URL & Scanning States
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progressPercent, setProgressPercent] = useState(15)
  const [jobStatus, setJobStatus] = useState<AuditJobStatus | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState(false)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all')
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStartedRef = useRef(false)
  const isScanningRef = useRef(false)

  // Clean up timer on unmount & auto-start if URL param present (guarded against React StrictMode duplicate calls)
  useEffect(() => {
    if (typeof window !== 'undefined' && !autoStartedRef.current) {
      const params = new URLSearchParams(window.location.search)
      const queryUrl = params.get('url')
      if (queryUrl) {
        autoStartedRef.current = true
        let trimmed = queryUrl.trim()
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          trimmed = `https://${trimmed}`
        }
        setUrl(trimmed)
        handleStartAudit(undefined, trimmed)
      }
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

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
      const { id } = await auditApi.start(
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
        abortController.signal
      )

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setProgressPercent(100)
      setReport(completedReport)
      track('form_submission', {
        form: 'website_audit',
        url: completedReport.finalUrl || completedReport.inputUrl,
      })
    } catch (err: unknown) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setReport(null)
      if (err instanceof AuditApiError) {
        if (err.code === 'CANCELLED') {
          setError('The audit scan was cancelled.')
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
      isScanningRef.current = false
      setScanning(false)
      abortControllerRef.current = null
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }

  // Cancel Scan
  const handleCancelScan = async () => {
    isScanningRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (jobStatus?.id) {
      await auditApi.cancel(jobStatus.id).catch(() => {})
    }
    setScanning(false)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
  }

  // Reset to State A
  const handleNewAudit = () => {
    setReport(null)
    setScanning(false)
    setError(null)
    setJobStatus(null)
    setUrl('')
    setProgressPercent(15)
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
  const getScoreValue = (key: string): number => {
    if (!report) return 82
    const scoreObj = report.scores.find((s) => s.key === key)
    return scoreObj?.value ?? 80
  }

  const overallScore = getScoreValue('overallHealth')
  const perfScore = getScoreValue('performance')
  const seoScore = getScoreValue('technicalSeo')
  const accessScore = getScoreValue('accessibility')
  const bestPracticeScore = getScoreValue('bestPractices')
  const mobileScore = getScoreValue('mobileUx')

  const scoreRating = overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Needs Work' : 'Critical'
  const ratingBadgeClass =
    overallScore >= 80 ? 'badge-good' : overallScore >= 60 ? 'badge-warning' : 'badge-danger'
  const gaugeColor = overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'

  // Findings
  const allFindings = report?.findings || []
  const positiveHighlights = [
    perfScore >= 80 && `Great performance score (${perfScore}/100)`,
    seoScore >= 80 && `SEO foundation is well optimised (${seoScore}/100)`,
    mobileScore >= 80 && `Mobile user experience is strong (${mobileScore}/100)`,
    bestPracticeScore >= 80 && `Modern best practices verified (${bestPracticeScore}/100)`,
    accessScore < 80 && `Accessibility can be improved (${accessScore}/100)`,
    perfScore < 80 && `Performance bottlenecks detected (${perfScore}/100)`,
  ].filter(Boolean) as string[]

  const actionableFindings = allFindings
    .filter((f) => f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium')
    .slice(0, 6)

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
                        strokeDashoffset={220 * (1 - overallScore / 100)}
                      />
                    </svg>
                    <div className="arv-overall-score-center">
                      <span className="arv-score-big">{overallScore}</span>
                      <span className="arv-score-denom">/100</span>
                    </div>
                  </div>

                  <div className={`arv-rating-pill ${ratingBadgeClass}`}>
                    {scoreRating}
                  </div>
                  <p className="arv-overall-summary-copy">
                    {overallScore >= 80
                      ? 'Your website is performing well with some room for strategic improvement.'
                      : overallScore >= 60
                        ? 'Your website has noticeable performance and visibility gaps holding back conversion.'
                        : 'Critical bottlenecks detected across speed, mobile readiness and search visibility.'}
                  </p>
                </div>

                {/* Right: 5 Category Score Cards */}
                <div className="arv-categories-grid">
                  {/* Category 1: Performance */}
                  <div className="arv-cat-card">
                    <div className="acc-head">
                      <Gauge size={20} className="acc-icon-orange" />
                    </div>
                    <div className="acc-name">Performance</div>
                    <div className="acc-score-wrap">
                      <span className="acc-val">{perfScore}</span>
                      <span className="acc-den">/100</span>
                    </div>
                  </div>

                  {/* Category 2: SEO */}
                  <div className="arv-cat-card">
                    <div className="acc-head">
                      <Search size={20} className="acc-icon-orange" />
                    </div>
                    <div className="acc-name">SEO</div>
                    <div className="acc-score-wrap">
                      <span className="acc-val">{seoScore}</span>
                      <span className="acc-den">/100</span>
                    </div>
                  </div>

                  {/* Category 3: Accessibility */}
                  <div className="arv-cat-card">
                    <div className="acc-head">
                      <UserCheck size={20} className="acc-icon-orange" />
                    </div>
                    <div className="acc-name">Accessibility</div>
                    <div className="acc-score-wrap">
                      <span className="acc-val">{accessScore}</span>
                      <span className="acc-den">/100</span>
                    </div>
                  </div>

                  {/* Category 4: Best Practices */}
                  <div className="arv-cat-card">
                    <div className="acc-head">
                      <ShieldCheck size={20} className="acc-icon-orange" />
                    </div>
                    <div className="acc-name">Best Practices</div>
                    <div className="acc-score-wrap">
                      <span className="acc-val">{bestPracticeScore}</span>
                      <span className="acc-den">/100</span>
                    </div>
                  </div>

                  {/* Category 5: Mobile Readiness */}
                  <div className="arv-cat-card">
                    <div className="acc-head">
                      <Smartphone size={20} className="acc-icon-orange" />
                    </div>
                    <div className="acc-name">Mobile Readiness</div>
                    <div className="acc-score-wrap">
                      <span className="acc-val">{mobileScore}</span>
                      <span className="acc-den">/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="arv-tabs-row" role="tablist" aria-label="Audit Report Categories">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'all'}
                  className={`arv-tab-pill ${activeCategoryTab === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('all')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'performance'}
                  className={`arv-tab-pill ${activeCategoryTab === 'performance' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('performance')}
                >
                  Performance
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'seo'}
                  className={`arv-tab-pill ${activeCategoryTab === 'seo' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('seo')}
                >
                  SEO
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'accessibility'}
                  className={`arv-tab-pill ${activeCategoryTab === 'accessibility' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('accessibility')}
                >
                  Accessibility
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'practices'}
                  className={`arv-tab-pill ${activeCategoryTab === 'practices' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('practices')}
                >
                  Best Practices
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryTab === 'mobile'}
                  className={`arv-tab-pill ${activeCategoryTab === 'mobile' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryTab('mobile')}
                >
                  Mobile
                </button>
              </div>

              {/* Key Insights & Top Recommendations Cards */}
              <div className="arv-details-split">
                {/* Left Card: Key Insights */}
                <div className="arv-insights-card">
                  <h3 className="arv-card-heading">Key Insights</h3>
                  <ul className="arv-insights-list">
                    {positiveHighlights.map((text, idx) => (
                      <li key={idx} className="arv-insight-item">
                        <CheckCircle2 size={18} className="aii-check-icon" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Card: Top Recommendations */}
                <div className="arv-recs-card">
                  <h3 className="arv-card-heading">Top Recommendations</h3>
                  <div className="arv-recs-list">
                    {actionableFindings.length > 0 ? (
                      actionableFindings.map((finding) => {
                        const isExpanded = expandedFindingId === finding.id
                        const friendlyTitle = getBusinessFriendlyTitle(finding) || finding.title
                        const explanationText = finding.plainSummary || finding.explanation || finding.observed || finding.title
                        return (
                          <div
                            key={finding.id}
                            className={`arv-rec-item ${isExpanded ? 'is-expanded' : ''}`}
                            onClick={() =>
                              setExpandedFindingId(isExpanded ? null : finding.id)
                            }
                          >
                            <div className="ari-head">
                              <span
                                className={`ari-sev-dot ${
                                  finding.severity === 'critical'
                                    ? 'dot-critical'
                                    : finding.severity === 'high'
                                      ? 'dot-high'
                                      : 'dot-medium'
                                }`}
                              />
                              <span className="ari-title">{friendlyTitle}</span>
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
                                {finding.recommendation && (
                                  <div className="ari-fix-box">
                                    <strong>Recommended Action:</strong> {finding.recommendation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="arv-empty-recs">
                        <CheckCircle2 size={24} className="aii-check-icon" />
                        <p>No critical recommendations. The audited page passed the primary baseline checks!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Conversion Callout */}
              <div className="arv-conversion-banner">
                <div className="acb-copy">
                  <h3>Want Chazon to Fix These Performance &amp; Conversion Leaks?</h3>
                  <p>
                    We build high-performance, fast-loading digital engines that eliminate friction and convert
                    traffic into profitable customers.
                  </p>
                </div>
                <div className="acb-actions">
                  <Link
                    to={`/contact?type=CONVERT&service=audit&url=${encodeURIComponent(
                      report.finalUrl || report.inputUrl
                    )}&score=${overallScore}&ref=${encodeURIComponent(report.id)}`}
                    className="button button-primary acb-btn"
                  >
                    Fix These Issues with Chazon <ArrowRight size={16} />
                  </Link>
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

                {/* Right Side: Laptop with Audit Mockup */}
                <div className="audit-hero-right">
                  <div className="audit-hero-laptop-scene">
                    <picture className="audit-laptop-picture">
                      <source srcSet="/assets/hero-laptop-desk.webp" type="image/webp" />
                      <img
                        src="/assets/hero-laptop-desk.png"
                        alt="Website Audit diagnostic on laptop on desk"
                        className="audit-laptop-img"
                        width={2064}
                        height={1152}
                        loading="eager"
                      />
                    </picture>

                    {/* Floating Diagnostic Card on Laptop */}
                    <div className="audit-laptop-screen-overlay" aria-hidden="true">
                      <div className="also-card">
                        <div className="also-score-side">
                          <div className="also-circle">
                            <span className="also-num">87</span>
                            <span className="also-sub">Website Score</span>
                          </div>
                        </div>
                        <div className="also-checks-side">
                          <div className="also-check-row">
                            <span>Performance</span> <Check size={14} className="also-check-icon" />
                          </div>
                          <div className="also-check-row">
                            <span>SEO</span> <Check size={14} className="also-check-icon" />
                          </div>
                          <div className="also-check-row">
                            <span>Accessibility</span> <Check size={14} className="also-check-icon" />
                          </div>
                          <div className="also-check-row">
                            <span>Best Practices</span> <Check size={14} className="also-check-icon" />
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
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
