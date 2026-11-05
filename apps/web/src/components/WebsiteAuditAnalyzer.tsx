import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  LineChart,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Zap,
} from 'lucide-react'
import type { AuditAnalysisResult } from '@chazon/shared'
import { track } from '../config'

interface WebsiteAuditAnalyzerProps {
  initialUrl?: string
  onFixLeaksWithChazon?: (result: AuditAnalysisResult) => void
  showTitle?: boolean
}

export function WebsiteAuditAnalyzer({
  initialUrl = '',
  onFixLeaksWithChazon,
  showTitle = true,
}: WebsiteAuditAnalyzerProps) {
  const [url, setUrl] = useState(initialUrl)
  const [loading, setLoading] = useState(false)
  const [scanStep, setScanStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuditAnalysisResult | null>(null)
  const [viewMode, setViewMode] = useState<'normal' | 'technical'>('normal')
  const [activeTab, setActiveTab] = useState<
    'all' | 'critical' | 'measured' | 'detected' | 'manual' | 'conversion' | 'seo' | 'performance'
  >('all')

  const runAudit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a website URL to analyze.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    track('form_start', { form: 'website_audit_analyzer', location: 'audit_tool' })

    // Simulate scanning phases for realistic feedback
    setScanStep('Connecting to server & measuring response speed…')
    const timer1 = setTimeout(() => setScanStep('Auditing metadata, headings & Schema.org markup…'), 1200)
    const timer2 = setTimeout(() => setScanStep('Checking mobile viewport, forms & WhatsApp channels…'), 2400)
    const timer3 = setTimeout(() => setScanStep('Evaluating analytics & conversion tracking readiness…'), 3600)

    try {
      const response = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const msg = errorData?.error?.message || 'Failed to complete website audit.'
        setError(msg)
        setLoading(false)
        track('form_error', { form: 'website_audit_analyzer', reason: 'failed' })
        return
      }

      const resData = (await response.json()) as { data: AuditAnalysisResult }
      setResult(resData.data)
      track('form_submission', { form: 'website_audit_analyzer', location: 'audit_tool' })
    } catch {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      setError('Could not reach the audit analyzer service. Please check your connection or try again.')
      track('form_error', { form: 'website_audit_analyzer', reason: 'network' })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-green'
    if (score >= 60) return 'score-yellow'
    return 'score-red'
  }

  const getScoreRating = (score: number) => {
    if (score >= 80) return 'Strong Digital Foundation'
    if (score >= 60) return 'Moderate Leaks Detected'
    return 'Critical Revenue Leaks'
  }

  const filteredIssues = result?.issues.filter(i => {
    if (activeTab === 'all') return true
    if (activeTab === 'critical') return i.severity === 'critical'
    if (activeTab === 'measured') return i.type === 'measured'
    if (activeTab === 'detected') return i.type === 'detected'
    if (activeTab === 'manual') return i.type === 'manual_review'
    return i.category === activeTab
  })

  return (
    <div className="audit-analyzer-widget" id="website-audit-tool">
      {showTitle && (
        <div className="audit-widget-head">
          <span className="mono eyebrow-badge">Free Growth Diagnostic</span>
          <h2>Website Audit & Digital Growth Analyzer</h2>
          <p className="lead">
            Uncover invisible revenue leaks, slow response times, missing Google tags, and friction in your customer journey in seconds.
          </p>
        </div>
      )}

      {/* URL Input Form */}
      <form onSubmit={runAudit} className="audit-url-form">
        <div className="audit-input-wrap">
          <Globe className="audit-input-icon" size={20} aria-hidden="true" />
          <input
            type="text"
            required
            className="audit-url-input"
            placeholder="Enter your website URL (e.g. yourcompany.com)"
            value={url}
            onChange={e => {
              setUrl(e.target.value)
              if (error) setError(null)
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="button button-primary audit-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="spin" aria-hidden="true" />
                <span>Auditing Website…</span>
              </>
            ) : (
              <>
                <span>Run Free Audit</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="audit-error-card" role="alert">
          <AlertTriangle size={20} className="text-error" aria-hidden="true" />
          <div>
            <strong>Audit Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Loading Progress State */}
      {loading && (
        <div className="audit-scanning-card" role="status" aria-live="polite">
          <div className="scanning-pulse">
            <RefreshCw size={32} className="spin text-accent" />
          </div>
          <h3>Analyzing {url}…</h3>
          <p className="mono scan-step-text">{scanStep}</p>
          <div className="scan-progress-bar">
            <div className="scan-progress-indeterminate" />
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !loading && (
        <div className="audit-results-card" aria-label="Website Audit Results">
          {/* Header Bar */}
          <div className="audit-results-topbar">
            <div>
              <span className="mono text-muted">Audited Domain</span>
              <h3 className="audit-domain-title">
                {result.normalizedUrl}{' '}
                <a
                  href={result.normalizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-site-link"
                  aria-label="Open audited site in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </h3>
            </div>

            {/* Mode Switcher: Normal Mode (default) vs Technical */}
            <div className="audit-mode-switcher" role="group" aria-label="View mode">
              <button
                type="button"
                className={`mode-btn ${viewMode === 'normal' ? 'is-active' : ''}`}
                onClick={() => setViewMode('normal')}
              >
                Executive Summary
              </button>
              <button
                type="button"
                className={`mode-btn ${viewMode === 'technical' ? 'is-active' : ''}`}
                onClick={() => setViewMode('technical')}
              >
                Technical Breakdown
              </button>
            </div>
          </div>

          {/* Overall Score Dial */}
          <div className="audit-score-hero">
            <div className={`score-dial ${getScoreColor(result.overallScore)}`}>
              <span className="score-num">{result.overallScore}</span>
              <span className="score-label">/ 100</span>
            </div>
            <div className="score-verdict">
              <span className="mono score-tag">{getScoreRating(result.overallScore)}</span>
              <h3>
                {result.overallScore >= 80
                  ? 'Your digital presence has a solid baseline, with targeted opportunities to improve conversions.'
                  : result.overallScore >= 60
                  ? 'Your website has notable friction points where qualified visitors and search demand are leaking.'
                  : 'Critical bottlenecks detected: search discoverability, speed or enquiry pathways require immediate attention.'}
              </h3>
              <p>
                Audit Reference: <strong>{result.id}</strong> · Generated on {new Date(result.analyzedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* 4 Pillars Category Grid */}
          <div className="audit-pillar-grid">
            {/* 1. Performance */}
            <div className="audit-pillar-card">
              <div className="pillar-card-top">
                <span className="pillar-icon-box">
                  <Zap size={20} />
                </span>
                <span className={`pillar-score-badge ${getScoreColor(result.scores.performance)}`}>
                  {result.scores.performance}/100
                </span>
              </div>
              <h4>Performance & Speed</h4>
              <p>
                Response Time: <strong>{result.metrics.responseTimeMs}ms</strong>
              </p>
              <p>
                Page Weight: <strong>{result.metrics.pageSizeKb} KB</strong>
              </p>
              <span className="pillar-detail-pill">
                {result.metrics.hasSsl ? 'SSL Active (HTTPS)' : 'Insecure (HTTP)'}
              </span>
            </div>

            {/* 2. SEO */}
            <div className="audit-pillar-card">
              <div className="pillar-card-top">
                <span className="pillar-icon-box">
                  <Search size={20} />
                </span>
                <span className={`pillar-score-badge ${getScoreColor(result.scores.seo)}`}>
                  {result.scores.seo}/100
                </span>
              </div>
              <h4>Search & SEO</h4>
              <p>
                Title Tag: <strong>{result.metrics.title ? `${result.metrics.titleLength} chars` : 'Missing'}</strong>
              </p>
              <p>
                H1 Tag: <strong>{result.metrics.h1Count === 1 ? 'Optimal (1)' : `${result.metrics.h1Count} found`}</strong>
              </p>
              <span className="pillar-detail-pill">
                {result.metrics.hasOpenGraph ? 'Social Cards Active' : 'Missing OpenGraph'}
              </span>
            </div>

            {/* 3. Mobile UX */}
            <div className="audit-pillar-card">
              <div className="pillar-card-top">
                <span className="pillar-icon-box">
                  <Smartphone size={20} />
                </span>
                <span className={`pillar-score-badge ${getScoreColor(result.scores.mobile)}`}>
                  {result.scores.mobile}/100
                </span>
              </div>
              <h4>Mobile Experience</h4>
              <p>
                Responsive Viewport:{' '}
                <strong>{result.metrics.hasViewport ? 'Configured' : 'Missing'}</strong>
              </p>
              <p>
                Mobile Dial Triggers: <strong>{result.metrics.hasTelLink ? 'Yes' : 'No'}</strong>
              </p>
              <span className="pillar-detail-pill">
                {result.metrics.hasViewport ? 'Mobile Optimized' : 'Needs Viewport'}
              </span>
            </div>

            {/* 4. Conversion */}
            <div className="audit-pillar-card">
              <div className="pillar-card-top">
                <span className="pillar-icon-box">
                  <LineChart size={20} />
                </span>
                <span className={`pillar-score-badge ${getScoreColor(result.scores.conversion)}`}>
                  {result.scores.conversion}/100
                </span>
              </div>
              <h4>Conversion Engine</h4>
              <p>
                WhatsApp Channel: <strong>{result.metrics.hasWhatsApp ? 'Active' : 'Missing'}</strong>
              </p>
              <p>
                Conversion Tracking: <strong>{result.metrics.hasTracking ? 'Detected' : 'Missing'}</strong>
              </p>
              <span className="pillar-detail-pill">
                {result.metrics.hasForm ? 'Lead Form Present' : 'No Forms Found'}
              </span>
            </div>
          </div>

          {/* NORMAL MODE: Plain-English Findings */}
          {viewMode === 'normal' && (
            <div className="audit-findings-section">
              <div className="findings-filter-row">
                <h4>Identified Growth Roadblocks & Findings ({result.issues.length})</h4>
                <div className="findings-tabs" role="tablist">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Findings
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'critical' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('critical')}
                  >
                    Critical Leaks ({result.issues.filter(i => i.severity === 'critical').length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'measured' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('measured')}
                  >
                    Measured Metrics ({result.issues.filter(i => i.type === 'measured').length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'detected' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('detected')}
                  >
                    Detected Items ({result.issues.filter(i => i.type === 'detected').length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'manual' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                  >
                    Manual Review ({result.issues.filter(i => i.type === 'manual_review').length})
                  </button>
                </div>
              </div>

              <div className="issues-list">
                {filteredIssues?.map(issue => (
                  <div key={issue.id} className={`issue-card issue-${issue.severity}`}>
                    <div className="issue-head">
                      <span className="issue-severity-icon">
                        {issue.severity === 'critical' ? (
                          <ShieldAlert size={18} className="text-error" />
                        ) : issue.severity === 'warning' ? (
                          <AlertTriangle size={18} className="text-warning" />
                        ) : (
                          <CheckCircle2 size={18} className="text-success" />
                        )}
                      </span>
                      <strong>{issue.title}</strong>
                      <div className="issue-badges">
                        {issue.type && (
                          <span className={`mono issue-type-badge type-${issue.type}`}>
                            {issue.type === 'measured'
                              ? 'Measured Metric'
                              : issue.type === 'manual_review'
                              ? 'Manual Review'
                              : 'Detected'}
                          </span>
                        )}
                        <span className="mono issue-cat-badge">{issue.category}</span>
                      </div>
                    </div>
                    <p className="issue-desc">{issue.description}</p>
                    <div className="issue-recommendation">
                      <strong>Chazon Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TECHNICAL MODE: Deep DOM & Metric Inspection */}
          {viewMode === 'technical' && (
            <div className="audit-technical-section">
              <h4>Technical DOM & HTTP Metric Breakdown</h4>
              <div className="technical-table-wrap">
                <table className="technical-table">
                  <thead>
                    <tr>
                      <th>Inspection Parameter</th>
                      <th>Value / Detection</th>
                      <th>Status / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Time To First Byte / Latency</td>
                      <td>{result.metrics.responseTimeMs} ms</td>
                      <td>{result.metrics.responseTimeMs < 800 ? 'Optimal (<800ms)' : 'Exceeds target'}</td>
                    </tr>
                    <tr>
                      <td>Document Payload Weight</td>
                      <td>{result.metrics.pageSizeKb} KB</td>
                      <td>{result.metrics.pageSizeKb < 1500 ? 'Lightweight' : 'Heavy payload'}</td>
                    </tr>
                    <tr>
                      <td>SSL / TLS Encryption</td>
                      <td>{result.metrics.hasSsl ? 'HTTPS (TLS Active)' : 'Insecure HTTP'}</td>
                      <td>{result.metrics.hasSsl ? 'Secure' : 'Critical security issue'}</td>
                    </tr>
                    <tr>
                      <td>Page Title String</td>
                      <td>{result.metrics.title || 'None declared'}</td>
                      <td>{result.metrics.titleLength} characters</td>
                    </tr>
                    <tr>
                      <td>Meta Description</td>
                      <td>{result.metrics.metaDescription || 'None declared'}</td>
                      <td>{result.metrics.metaDescLength} characters</td>
                    </tr>
                    <tr>
                      <td>Canonical Link Tag</td>
                      <td>{result.metrics.hasCanonical ? 'Declared' : 'Not found'}</td>
                      <td>{result.metrics.hasCanonical ? 'Prevents duplicate content' : 'Missing canonical'}</td>
                    </tr>
                    <tr>
                      <td>OpenGraph Social Meta</td>
                      <td>{result.metrics.hasOpenGraph ? 'Present' : 'Missing'}</td>
                      <td>WhatsApp / LinkedIn preview rendering</td>
                    </tr>
                    <tr>
                      <td>Heading Hierarchy (H1 / H2)</td>
                      <td>
                        {result.metrics.h1Count} H1 tags, {result.metrics.h2Count} H2 tags
                      </td>
                      <td>{result.metrics.h1Count === 1 ? 'Optimal single H1' : 'Check heading hierarchy'}</td>
                    </tr>
                    <tr>
                      <td>Image Accessibility & Alt Text</td>
                      <td>
                        {result.metrics.imgWithoutAlt} of {result.metrics.imgTotal} images missing alt
                      </td>
                      <td>{result.metrics.imgWithoutAlt === 0 ? 'All images labeled' : 'SEO/A11y penalty'}</td>
                    </tr>
                    <tr>
                      <td>WhatsApp Business Channel</td>
                      <td>{result.metrics.hasWhatsApp ? 'Active link detected' : 'Not detected'}</td>
                      <td>Mobile conversion priority</td>
                    </tr>
                    <tr>
                      <td>Conversion Tracking (GA4 / Meta)</td>
                      <td>{result.metrics.hasTracking ? 'Active' : 'Not detected'}</td>
                      <td>ROI attribution visibility</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fix These Leaks Action Banner */}
          <div className="audit-cta-banner">
            <div className="audit-cta-copy">
              <span className="mono banner-tag">Next Step</span>
              <h3>Turn this diagnostic into a high-converting digital engine.</h3>
              <p>
                Request a strategic consultation with Chazon. We will attach this audit report directly to your project roadmap so we can resolve these bottlenecks together.
              </p>
            </div>
            <button
              type="button"
              className="button button-primary audit-fix-btn"
              onClick={() => {
                if (onFixLeaksWithChazon) {
                  onFixLeaksWithChazon(result)
                } else {
                  // Smooth scroll to contact section if present
                  const target = document.getElementById('contact')
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                  }
                }
              }}
            >
              <span>Get Help Fixing These Issues</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
