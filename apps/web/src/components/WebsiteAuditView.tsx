import { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  FileText,
  Printer,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  LineChart,
  Link2,
} from 'lucide-react'
import type { AuditJobStatus, AuditReport } from '@chazon/shared'
import { auditApi, AuditApiError } from '../lib/audit-api'
import {
  getBusinessExplanation,
  getBusinessFriendlyTitle,
} from '../lib/findingExplanations'
import { track } from '../config'

export interface WebsiteAuditViewProps {
  initialUrl?: string
  mode?: 'full' | 'compact'
  asHeroH1?: boolean
  onFixWithChazon?: (data: { url: string; score: number; refId?: string }) => void
}

export function WebsiteAuditView({
  initialUrl = '',
  mode = 'full',
  asHeroH1 = true,
  onFixWithChazon,
}: WebsiteAuditViewProps) {
  void mode
  const [url, setUrl] = useState(initialUrl)
  const [scanning, setScanning] = useState(false)
  const [jobStatus, setJobStatus] = useState<AuditJobStatus | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'passed'>('all')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const userCancelledRef = useRef(false)
  const unmountAbortedRef = useRef(new WeakSet<AbortController>())

  useEffect(() => {
    isMountedRef.current = true
    const unmountAborted = unmountAbortedRef.current
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        unmountAborted.add(abortControllerRef.current)
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (initialUrl && !report && !scanning) {
      setUrl(initialUrl)
    }
  }, [initialUrl, report, scanning])

  const runAudit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a website URL to audit.')
      return
    }

    userCancelledRef.current = false
    setScanning(true)
    setError(null)
    setJobStatus(null)
    track('form_start', { form: 'website_audit_tool', location: 'audit_page' })

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const { id, status: initialStatus } = await auditApi.start(
        { url: trimmed, strategy: 'mobile', crawlLimit: 10, checkLinks: true },
        abortController.signal
      )

      const completedReport = await auditApi.pollUntilComplete(
        id,
        (status) => setJobStatus(status),
        abortController.signal,
        initialStatus
      )

      setReport(completedReport)
      track('form_submission', {
        form: 'website_audit_tool',
        location: 'audit_page',
        url: completedReport.finalUrl || completedReport.inputUrl,
      })

      // Smooth scroll to report card
      setTimeout(() => {
        document.getElementById('audit-report-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err: unknown) {
      if (unmountAbortedRef.current.has(abortController) || !isMountedRef.current) {
        return
      }
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
            `Unable to resolve domain "${trimmed}". Please verify the URL spelling and check that the website is live.`
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
        const msg =
          (err as Error)?.message ||
          'Unable to connect to the audit scanner service. Please verify your connection or check that the API service is running.'
        setError(msg)
      }
      track('form_error', { form: 'website_audit_tool', reason: String(err) })
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
        if (isMountedRef.current) setScanning(false)
      }
    }
  }

  const cancelScan = async () => {
    userCancelledRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (jobStatus?.id) {
      await auditApi.cancel(jobStatus.id).catch(() => {})
    }
    setScanning(false)
  }

  // Displayed domain
  let displayDomain = 'yourbusiness.com'
  let reportDate = 'Generated on 26 Oct 2026, 10:24 AM'

  if (report) {
    try {
      displayDomain = new URL(report.finalUrl || report.inputUrl).hostname.replace(/^www\./, '')
    } catch {
      displayDomain = report.inputUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    }
    reportDate = `Generated on ${new Date(report.completedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}, ${new Date(report.completedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  // Extract authentic live scores (sample preview shown only before a live report exists)
  const getScore = (key: string) => report?.scores.find((s) => s.key === key)?.value ?? null
  const overallVal: number | null = report ? getScore('overallHealth') : 82
  const seoVal: number | null = report ? getScore('technicalSeo') : 88
  const perfVal: number | null = report ? getScore('performance') : 76
  const techVal: number | null = report ? getScore('bestPractices') : 90
  const contentVal: number | null = report ? (getScore('accessibility') ?? getScore('mobileUx')) : 82
  const convVal: number | null = report ? getScore('conversionReadiness') : 74

  const overallScore = overallVal ?? 0
  const scoreRating = overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Needs Work' : 'Critical'
  const ratingBadgeClass = overallScore >= 80 ? 'badge-good' : overallScore >= 60 ? 'badge-warning' : 'badge-danger'
  const gaugeColor = overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'

  // SVG Gauge constants
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - overallScore / 100)

  // Filtered findings if report is present
  const allFindings = report?.findings || []
  const criticalFindings = allFindings.filter((f) => f.severity === 'critical')
  const warningFindings = allFindings.filter((f) => f.severity === 'high' || f.severity === 'medium')
  const passedChecksCount = report?.scores.reduce((acc, s) => acc + (s.counts?.passed || 0), 0) || 18

  const displayedFindings = allFindings.filter((f) => {
    if (activeTab === 'critical' && f.severity !== 'critical') return false
    if (activeTab === 'warning' && f.severity !== 'high' && f.severity !== 'medium') return false
    if (activeCategory !== 'all' && f.category !== activeCategory) return false
    return true
  })

  const handleFixClick = () => {
    const targetUrl = report?.finalUrl || report?.inputUrl || url || 'yourwebsite.com'
    if (onFixWithChazon) {
      onFixWithChazon({ url: targetUrl, score: overallScore, refId: report?.id })
    } else {
      const contactUrl = `/contact?service=audit&ref=${encodeURIComponent(report?.id || 'live')}&url=${encodeURIComponent(targetUrl)}&score=${overallScore}`
      window.location.href = contactUrl
    }
  }

  return (
    <div className="website-audit-experience" id="website-audit-container">
      {/* 1. HERO SECTION (Pixel-perfect match to visual reference) */}
      <section className="audit-hero-section">
        <div className="container audit-hero-grid">
          {/* Left Column: Heading, Value Proposition & Trust Badges */}
          <div className="audit-hero-content">
            <div className="audit-eyebrow-pill">
              <span className="audit-eyebrow-icon">
                <TrendingUp size={15} />
              </span>
              <span>Website Audit & Growth Analysis</span>
            </div>

            {asHeroH1 ? (
              <h1 className="audit-hero-title">
                Check Your Website’s Health, Visibility & Growth Potential
              </h1>
            ) : (
              <h2 className="audit-hero-title">
                Check Your Website’s Health, Visibility & Growth Potential
              </h2>
            )}

            <p className="audit-hero-description">
              Get a comprehensive audit of your website’s performance, SEO, discoverability and conversion opportunities — and a clear plan to grow your business online.
            </p>

            <div className="audit-feature-badges">
              <div className="audit-badge-item">
                <span className="badge-icon-orange">
                  <Zap size={15} />
                </span>
                <span>Instant Analysis</span>
              </div>
              <div className="audit-badge-item">
                <span className="badge-icon-orange">
                  <FileText size={15} />
                </span>
                <span>Actionable Insights</span>
              </div>
              <div className="audit-badge-item">
                <span className="badge-icon-orange">
                  <TrendingUp size={15} />
                </span>
                <span>Growth Recommendations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Form Card (Matching visual reference card) */}
          <div className="audit-hero-card-col">
            <div className="audit-hero-card">
              <div className="audit-hero-card-header">
                <div className="audit-search-icon-circle">
                  <Search size={22} />
                </div>
                <div>
                  <h3 className="audit-card-title">Run a Free Website Audit</h3>
                  <p className="audit-card-subtitle">
                    Enter your website URL to get a detailed performance and growth report.
                  </p>
                </div>
              </div>

              <form onSubmit={runAudit} className="audit-card-form">
                <div className="audit-card-input-wrap">
                  <span className="audit-card-link-icon">
                    <Link2 size={19} />
                  </span>
                  <input
                    type="text"
                    required
                    className="audit-card-input"
                    placeholder="https://yourwebsite.com"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={scanning}
                    aria-label="Website URL"
                  />
                  <button
                    type="submit"
                    className="audit-card-submit-btn"
                    disabled={scanning}
                  >
                    {scanning ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Auditing…</span>
                      </>
                    ) : (
                      <>
                        <span>Audit My Website</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="audit-hero-error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              {/* 4 Feature Checkmarks below input */}
              <div className="audit-card-features-grid">
                <div className="audit-card-feature">
                  <CheckCircle2 size={15} fill="#10B981" color="#FFFFFF" strokeWidth={2.5} />
                  <span>SEO & Discoverability</span>
                </div>
                <div className="audit-card-feature">
                  <CheckCircle2 size={15} fill="#10B981" color="#FFFFFF" strokeWidth={2.5} />
                  <span>Performance & Speed</span>
                </div>
                <div className="audit-card-feature">
                  <CheckCircle2 size={15} fill="#10B981" color="#FFFFFF" strokeWidth={2.5} />
                  <span>Technical Health</span>
                </div>
                <div className="audit-card-feature">
                  <CheckCircle2 size={15} fill="#10B981" color="#FFFFFF" strokeWidth={2.5} />
                  <span>Conversion Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCANNING PROGRESS STATE (Active during scan) */}
      {scanning && (
        <section className="audit-scanning-section" aria-live="polite">
          <div className="container">
            <div className="audit-scanning-card">
              <div className="scanning-head-row">
                <div className="scanning-pulse-circle">
                  <RefreshCw size={24} className="spin text-orange" />
                </div>
                <div>
                  <h3 className="scanning-title">Scanning {url}…</h3>
                  <p className="scanning-message">{jobStatus?.message || 'Auditing website architecture, speed and search factors…'}</p>
                </div>
                <button
                  type="button"
                  className="scanning-cancel-btn"
                  onClick={cancelScan}
                >
                  <X size={15} />
                  <span>Cancel Scan</span>
                </button>
              </div>

              {jobStatus?.steps && jobStatus.steps.length > 0 && (
                <div className="scanning-steps-list">
                  {jobStatus.steps.map((s) => (
                    <div key={s.key} className={`scanning-step-item step-${s.state}`}>
                      <span className="step-indicator">
                        {s.state === 'done' ? (
                          <CheckCircle2 size={16} fill="#10B981" color="#FFFFFF" strokeWidth={2.5} />
                        ) : s.state === 'running' ? (
                          <RefreshCw size={14} className="spin text-orange" />
                        ) : (
                          <span className="step-dot" />
                        )}
                      </span>
                      <span className="step-label">{s.label}</span>
                      {s.detail && <span className="step-detail">{s.detail}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. MID SECTION (Report Card on Left, "What You'll Get" on Right) */}
      <section className="audit-mid-section" id="audit-report-results">
        <div className="container audit-mid-grid">
          {/* Left Column: The Audit Report Dashboard Card */}
          <div className="audit-report-card-wrap">
            <div className="audit-report-card">
              {/* Card Topbar */}
              <div className="audit-report-topbar">
                <div className="audit-report-domain-group">
                  <div className="audit-report-brand-mark">
                    <img
                      src="/images/brand/chazon-logo-icon.png"
                      alt="Chazon Digital"
                      className="audit-report-brand-icon"
                      width={36}
                      height={36}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="audit-report-domain">
                      Audit Report: <strong>{displayDomain}</strong>
                    </h4>
                    <p className="audit-report-date">{reportDate}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="audit-download-btn"
                  onClick={() => {
                    if (report) {
                      window.open(auditApi.getPrintableReportUrl(report.id), '_blank')
                    } else {
                      window.print()
                    }
                  }}
                  title="Download / Print PDF Report"
                >
                  <Printer size={15} />
                  <span>Download PDF</span>
                </button>
              </div>

              {/* Card Body: Split Gauge + 5 Category Bars */}
              <div className="audit-report-body">
                {/* Left: Overall Circular Score Gauge */}
                <div className="audit-gauge-column">
                  <div className="audit-circular-gauge">
                    <svg viewBox="0 0 100 100" className="gauge-svg" aria-hidden="true">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#F4EFEA"
                        strokeWidth="8"
                      />
                      {/* Active Progress Stroke */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <div className="gauge-content">
                      <span className="gauge-number">{overallVal ?? 'N/A'}</span>
                      {overallVal !== null && <span className="gauge-denominator">/100</span>}
                    </div>
                  </div>

                  <span className="gauge-label">Overall Website Score</span>
                  <span className={`gauge-rating-badge ${ratingBadgeClass}`}>{scoreRating}</span>
                </div>

                {/* Right: 5 Category Score Bars */}
                <div className="audit-bars-column">
                  {/* 1. SEO & Visibility */}
                  <div className="audit-bar-row">
                    <div className="bar-label-group">
                      <div className="bar-title-wrap">
                        <span className="bar-icon-wrap">
                          <Search size={15} />
                        </span>
                        <span className="bar-title">SEO & Visibility</span>
                      </div>
                      <span className="bar-percent">{seoVal !== null ? `${seoVal}%` : 'N/A'}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-green"
                        style={{ width: `${seoVal ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Performance (Speed) */}
                  <div className="audit-bar-row">
                    <div className="bar-label-group">
                      <div className="bar-title-wrap">
                        <span className="bar-icon-wrap">
                          <Zap size={15} />
                        </span>
                        <span className="bar-title">Performance (Speed)</span>
                      </div>
                      <span className="bar-percent">{perfVal !== null ? `${perfVal}%` : 'N/A'}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-orange"
                        style={{ width: `${perfVal ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Technical Health */}
                  <div className="audit-bar-row">
                    <div className="bar-label-group">
                      <div className="bar-title-wrap">
                        <span className="bar-icon-wrap">
                          <ShieldCheck size={15} />
                        </span>
                        <span className="bar-title">Technical Health</span>
                      </div>
                      <span className="bar-percent">{techVal !== null ? `${techVal}%` : 'N/A'}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-green"
                        style={{ width: `${techVal ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* 4. Content Quality */}
                  <div className="audit-bar-row">
                    <div className="bar-label-group">
                      <div className="bar-title-wrap">
                        <span className="bar-icon-wrap">
                          <FileText size={15} />
                        </span>
                        <span className="bar-title">Content Quality</span>
                      </div>
                      <span className="bar-percent">{contentVal !== null ? `${contentVal}%` : 'N/A'}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-green"
                        style={{ width: `${contentVal ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* 5. Conversion Readiness */}
                  <div className="audit-bar-row">
                    <div className="bar-label-group">
                      <div className="bar-title-wrap">
                        <span className="bar-icon-wrap">
                          <LineChart size={15} />
                        </span>
                        <span className="bar-title">Conversion Readiness</span>
                      </div>
                      <span className="bar-percent">{convVal !== null ? `${convVal}%` : 'N/A'}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-orange"
                        style={{ width: `${convVal ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: "WHAT YOU'LL GET" 4 Cards */}
          <div className="audit-what-you-get">
            <span className="section-eyebrow-orange">WHAT YOU’LL GET</span>
            <h2 className="what-you-get-title">A Complete Website Health Report</h2>

            <div className="what-you-get-grid">
              {/* Card 1 */}
              <div className="wyg-card">
                <div className="wyg-icon-box">
                  <Search size={22} />
                </div>
                <div>
                  <h4 className="wyg-card-title">SEO & Discoverability</h4>
                  <p className="wyg-card-desc">
                    Check how easily customers can find your website on Google.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="wyg-card">
                <div className="wyg-icon-box">
                  <Zap size={22} />
                </div>
                <div>
                  <h4 className="wyg-card-title">Performance & Speed</h4>
                  <p className="wyg-card-desc">
                    Analyse loading speed and Core Web Vitals.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="wyg-card">
                <div className="wyg-icon-box">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="wyg-card-title">Technical Health</h4>
                  <p className="wyg-card-desc">
                    Identify issues that may be limiting your visibility.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="wyg-card">
                <div className="wyg-icon-box">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h4 className="wyg-card-title">Growth Opportunities</h4>
                  <p className="wyg-card-desc">
                    Actionable recommendations to improve traffic, leads and conversions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETAILED FINDINGS BREAKDOWN (When a real scan report is loaded) */}
      {report && (
        <section className="audit-findings-detail-section">
          <div className="container">
            <div className="findings-detail-box">
              <div className="findings-header-row">
                <div>
                  <span className="section-eyebrow-orange">DIAGNOSTIC FINDINGS</span>
                  <h3 className="findings-main-title">
                    Identified Growth Roadblocks & Opportunities ({allFindings.length})
                  </h3>
                  <p className="findings-sub-desc">
                    Plain-language breakdowns of bottlenecks affecting your search rankings, speed, and customer conversion flow.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="findings-severity-tabs" role="tablist">
                  <button
                    type="button"
                    className={`f-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Findings ({allFindings.length})
                  </button>
                  <button
                    type="button"
                    className={`f-tab ${activeTab === 'critical' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('critical')}
                  >
                    Critical Leaks ({criticalFindings.length})
                  </button>
                  <button
                    type="button"
                    className={`f-tab ${activeTab === 'warning' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('warning')}
                  >
                    Warnings & Improvements ({warningFindings.length})
                  </button>
                  <button
                    type="button"
                    className={`f-tab ${activeTab === 'passed' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('passed')}
                  >
                    Passed Checks ({passedChecksCount})
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="findings-category-row">
                {['all', 'performance', 'seo', 'accessibility', 'journey', 'technology'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-pill ${activeCategory === cat ? 'is-active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === 'all'
                      ? 'All Categories'
                      : cat === 'seo'
                      ? 'SEO & Search'
                      : cat === 'performance'
                      ? 'Performance'
                      : cat === 'accessibility'
                      ? 'Accessibility'
                      : cat === 'journey'
                      ? 'Conversion & UX'
                      : 'Technology'}
                  </button>
                ))}
              </div>

              {/* Findings List */}
              <div className="findings-cards-list">
                {displayedFindings.length === 0 ? (
                  <div className="findings-empty-notice">
                    <CheckCircle2 size={24} className="text-success" />
                    <span>No issues found matching this filter criteria!</span>
                  </div>
                ) : (
                  displayedFindings.map((finding) => {
                    const isExpanded = expandedId === finding.id
                    const explanation = getBusinessExplanation(finding)
                    const friendlyTitle = getBusinessFriendlyTitle(finding)
                    const severityClass =
                      finding.severity === 'critical'
                        ? 'sev-critical'
                        : finding.severity === 'high' || finding.severity === 'medium'
                        ? 'sev-warning'
                        : 'sev-info'

                    return (
                      <div
                        key={finding.id}
                        className={`finding-card-item ${severityClass} ${isExpanded ? 'is-expanded' : ''}`}
                      >
                        <div
                          className="finding-item-header"
                          onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setExpandedId(isExpanded ? null : finding.id)
                            }
                          }}
                        >
                          <div className="finding-title-group">
                            <span className={`finding-sev-pill ${severityClass}`}>
                              {finding.severity.toUpperCase()}
                            </span>
                            <span className="finding-category-tag">{finding.category}</span>
                            <h4 className="finding-card-headline">{friendlyTitle}</h4>
                          </div>

                          <button
                            type="button"
                            className="finding-expand-trigger"
                            aria-label={isExpanded ? 'Collapse finding details' : 'Expand finding details'}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>

                        {/* Collapsed short takeaway */}
                        {!isExpanded && (
                          <p className="finding-short-summary">{explanation.shortExplanation}</p>
                        )}

                        {/* Expanded complete explanation */}
                        {isExpanded && (
                          <div className="finding-expanded-body">
                            <div className="explanation-grid">
                              <div className="exp-block">
                                <strong>What Is the Issue?</strong>
                                <p>{explanation.whatIsWrong}</p>
                              </div>

                              <div className="exp-block">
                                <strong>Why Does It Matter?</strong>
                                <p>{explanation.whyItMatters}</p>
                              </div>

                              <div className="exp-block">
                                <strong>How It Affects Your Business:</strong>
                                <p>{explanation.businessImpact}</p>
                              </div>

                              <div className="exp-block exp-block-action">
                                <strong>Recommended Fix:</strong>
                                <p>{finding.recommendation || explanation.whatToDo}</p>
                              </div>
                            </div>

                            {finding.affected && finding.affected.length > 0 && (
                              <div className="finding-affected-urls">
                                <strong>Affected Pages ({finding.affected.length}):</strong>
                                <ul>
                                  {finding.affected.slice(0, 4).map((pageUrl, idx) => (
                                    <li key={idx}>
                                      <code>{pageUrl}</code>
                                    </li>
                                  ))}
                                  {finding.affected.length > 4 && (
                                    <li>
                                      <small>…and {finding.affected.length - 4} more pages</small>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            <div className="finding-footer-row">
                              <span className="pillar-tag">
                                Chazon Service Pillar: <strong>{finding.service}</strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Service Action Callout Banner */}
              <div className="findings-chazon-cta-box">
                <div className="f-cta-copy">
                  <span className="f-cta-eyebrow">CHAZON GROWTH SPRINT</span>
                  <h4 className="f-cta-title">Turn These Findings into a Revenue Engine</h4>
                  <p className="f-cta-desc">
                    Our engineering and digital marketing team can resolve these technical, speed, and conversion roadblocks for you in a focused growth sprint.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-primary f-cta-btn"
                  onClick={handleFixClick}
                >
                  <span>Fix These Issues with Chazon</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. "HOW IT WORKS" SECTION (Matching 2-column layout in visual reference) */}
      <section className="audit-how-it-works-section">
        <div className="container">
          <div className="how-it-works-container-card">
            <div className="hiw-left-col">
              <span className="section-eyebrow-orange">HOW IT WORKS</span>
              <h2 className="how-it-works-title">Get Your Audit in 3 Simple Steps</h2>
            </div>

            <div className="hiw-right-steps-col">
              {/* Step 1 */}
              <div className="hiw-step-col">
                <div className="hiw-step-number">1</div>
                <div>
                  <h4 className="hiw-step-heading">Enter Your Website URL</h4>
                  <p className="hiw-step-text">Share your website link above.</p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="hiw-arrow-separator" aria-hidden="true">
                <ArrowRight size={20} />
              </div>

              {/* Step 2 */}
              <div className="hiw-step-col">
                <div className="hiw-step-number">2</div>
                <div>
                  <h4 className="hiw-step-heading">We Analyse Your Website</h4>
                  <p className="hiw-step-text">
                    We check SEO, performance, technical health and business factors.
                  </p>
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="hiw-arrow-separator" aria-hidden="true">
                <ArrowRight size={20} />
              </div>

              {/* Step 3 */}
              <div className="hiw-step-col">
                <div className="hiw-step-number">3</div>
                <div>
                  <h4 className="hiw-step-heading">Get Your Detailed Report</h4>
                  <p className="hiw-step-text">
                    Receive a clear score, insights and growth recommendations instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM BANNER (Matching the deep brown CTA bar from visual reference) */}
      <section className="audit-bottom-banner-section">
        <div className="container">
          <div className="audit-bottom-banner-card">
            <div className="banner-icon-and-copy">
              <div className="banner-icon-square">
                <TrendingUp size={28} />
              </div>
              <div className="banner-copy-col">
                <h3 className="banner-heading">Want a Detailed Growth Plan?</h3>
                <p className="banner-subtext">
                  Go beyond the audit and get a personalised roadmap to increase your visibility, leads and revenue.
                </p>
              </div>
            </div>

            <a href="/growth-audit" className="banner-cta-btn">
              <span>Get a Growth Audit</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
