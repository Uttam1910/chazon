import { useState } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type AuditStatus, type LeadStatus } from '@chazon/shared'
import { useApi } from '../api'
import { Badge, Card, PageHeader } from '../ui/Common'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { timeAgo } from '../ui/utils'

type WebsiteScanSummary = {
  id: string
  reference: string
  url: string
  normalizedUrl: string
  strategy: 'mobile' | 'desktop'
  state: 'running' | 'completed' | 'failed'
  overallScore: number
  performanceScore: number
  seoScore: number
  mobileScore: number
  conversionScore: number
  pagesInspected: number
  durationMs: number | null
  headline: string | null
  leadId: string | null
  leadReference: string | null
  createdAt: string
}

type Stats = {
  storageMode?: 'database' | 'memory'
  generatedAt?: string
  timeline?: {
    month: string
    leads: number
    audits: number
    scans: number
    won: number
    total: number
  }[]
  growthRates?: {
    leads: number
    audits: number
  }
  leads: {
    total: number
    new: number
    qualified: number
    converted: number
    last30Days: number
    withAuditCount?: number
    byStatus: Partial<Record<LeadStatus, number>>
    byCategory?: { label: string; count: number }[]
    byPreferredContact?: { label: string; count: number }[]
  }
  audits: { total: number; new: number; last30Days: number; byStatus: Partial<Record<AuditStatus, number>> }
  websiteScans?: {
    total: number
    running: number
    last30Days: number
    convertedToLeads: number
    avgOverallScore: number
    avgPerformanceScore: number
    avgSeoScore: number
    avgMobileScore: number
    avgConversionScore: number
    recentScans: WebsiteScanSummary[]
  }
  content: {
    publishedServices?: number
    totalServices?: number
    publishedCaseStudies: number
    publishedInsights: number
    publishedIndustries?: number
    publishedTestimonials?: number
  }
  recentLeads: {
    id: string
    reference?: string | null
    name: string
    businessName: string
    category?: string | null
    service: string | null
    services?: string[] | string | null
    preferredContact?: string | null
    auditRef?: string | null
    budget?: string | null
    status: LeadStatus
    createdAt: string
  }[]
  recentAudits: {
    id: string
    name: string
    businessName: string
    website: string | null
    category?: string | null
    status: AuditStatus
    createdAt: string
  }[]
  topServices: { label: string; count: number }[]
  sources: { label: string; count: number }[]
}

function formatLeadService(lead: Stats['recentLeads'][number]) {
  if (Array.isArray(lead.services) && lead.services.length > 0) return lead.services.join(', ')
  if (typeof lead.services === 'string' && lead.services.trim()) return lead.services
  return lead.service || lead.category || ''
}

function scoreTone(score: number) {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'orange'
}

export function Dashboard() {
  const { data, error, loading, reload } = useApi<Stats>('/dashboard')
  const [chartMode, setChartMode] = useState<'revenue' | 'leads' | 'traffic'>('revenue')
  const [messagesFilter, setMessagesFilter] = useState<'all' | 'new' | 'audits'>('all')

  const scans = data?.websiteScans

  // Filtered recent messages directly from DB
  const filteredLeads = (data?.recentLeads ?? []).filter(lead => {
    if (messagesFilter === 'new') return lead.status === 'NEW'
    if (messagesFilter === 'audits') return Boolean(lead.auditRef)
    return true
  })

  // Dynamic SVG Chart Plotting directly from DB Timeline Records
  const timeline = data?.timeline && data.timeline.length ? data.timeline : [
    { month: 'Month 1', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
    { month: 'Month 2', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
    { month: 'Month 3', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
    { month: 'Month 4', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
    { month: 'Month 5', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
    { month: 'Today', leads: 0, audits: 0, scans: 0, won: 0, total: 0 },
  ]

  const getPointValue = (p: typeof timeline[number]) => {
    if (chartMode === 'revenue') return p.won
    if (chartMode === 'leads') return p.leads
    return p.scans
  }

  const values = timeline.map(getPointValue)
  const maxVal = Math.max(1, ...values)

  const chartPoints = timeline.map((p, idx) => {
    const val = getPointValue(p)
    const x = 60 + idx * 168
    const y = maxVal > 0 ? 215 - (val / maxVal) * 160 : 215
    return { x, y, val, month: p.month }
  })

  let curveD = chartPoints.length ? `M ${chartPoints[0].x} ${chartPoints[0].y}` : ''
  for (let i = 0; i < chartPoints.length - 1; i++) {
    const p0 = chartPoints[i]
    const p1 = chartPoints[i + 1]
    const mx = p0.x + (p1.x - p0.x) / 2
    curveD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
  }

  const areaD = chartPoints.length
    ? `${curveD} L ${chartPoints[chartPoints.length - 1].x} 215 L ${chartPoints[0].x} 215 Z`
    : ''

  return (
    <div className="growth-dashboard-root">
      <PageHeader
        title="Business Growth Dashboard"
        description={
          data?.generatedAt
            ? `Real-time Pipeline, Client Inquiries & Revenue Trajectory from Database · Updated ${timeAgo(data.generatedAt)}`
            : 'Real-time Pipeline, Client Inquiries & Revenue Trajectory from Database.'
        }
        actions={
          <div className="button-group">
            {data?.storageMode && (
              <Badge
                label={data.storageMode === 'database' ? 'PostgreSQL Live' : 'Session Memory'}
                tone={data.storageMode === 'database' ? 'green' : 'blue'}
              />
            )}
            <Link to="/audits?tab=scans" className="btn primary" style={{ gap: 6 }}>
              <Zap size={15} aria-hidden="true" />
              <span>Run Health Scan</span>
            </Link>
            <button type="button" className="btn" onClick={() => reload(true)} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} aria-hidden="true" />
              <span>{loading ? 'Syncing…' : 'Sync now'}</span>
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={() => reload(true)} />
      ) : loading && !data ? (
        <LoadingRows rows={6} />
      ) : (
        data && (
          <>
            {/* ROW 1: TOP 4 EXECUTIVE GROWTH METRICS (100% Genuine Database Records) */}
            <div className="hero-mockup-kpis">
              {/* Metric 1: Total Leads & Inquiries */}
              <Link to="/leads" className="growth-metric-card link-card">
                <div className="gmc-header">
                  <div className="gmc-icon-wrap amber">
                    <MessageSquare size={20} />
                  </div>
                  {data.growthRates && data.growthRates.leads !== 0 ? (
                    <span className={`trend-badge ${data.growthRates.leads > 0 ? 'positive' : 'negative'}`}>
                      <TrendingUp size={12} />
                      <span>{data.growthRates.leads > 0 ? `+${data.growthRates.leads}%` : `${data.growthRates.leads}%`} MoM</span>
                    </span>
                  ) : (
                    <span className="trend-badge neutral">
                      <span>{data.leads.new} New</span>
                    </span>
                  )}
                </div>
                <div className="gmc-body">
                  <span className="gmc-label">Total Leads &amp; Inquiries</span>
                  <div className="gmc-number-row">
                    <strong className="gmc-value">{data.leads.total.toLocaleString('en-IN')}</strong>
                    <span className="gmc-period">leads</span>
                  </div>
                  <span className="gmc-subtext">
                    <strong style={{ color: 'var(--orange-text)' }}>{data.leads.new} awaiting response</strong> · {data.leads.last30Days} in last 30d
                  </span>
                </div>
              </Link>

              {/* Metric 2: Growth Audits */}
              <Link to="/audits" className="growth-metric-card link-card">
                <div className="gmc-header">
                  <div className="gmc-icon-wrap blue">
                    <Activity size={20} />
                  </div>
                  {data.growthRates && data.growthRates.audits !== 0 ? (
                    <span className={`trend-badge ${data.growthRates.audits > 0 ? 'positive' : 'negative'}`}>
                      <TrendingUp size={12} />
                      <span>{data.growthRates.audits > 0 ? `+${data.growthRates.audits}%` : `${data.growthRates.audits}%`} MoM</span>
                    </span>
                  ) : (
                    <span className="trend-badge neutral">
                      <span>{data.audits.new} New</span>
                    </span>
                  )}
                </div>
                <div className="gmc-body">
                  <span className="gmc-label">Growth Audits Requested</span>
                  <div className="gmc-number-row">
                    <strong className="gmc-value">{data.audits.total.toLocaleString('en-IN')}</strong>
                    <span className="gmc-period">audits</span>
                  </div>
                  <span className="gmc-subtext">
                    <strong style={{ color: 'var(--accent)' }}>{data.audits.new} awaiting review</strong> · {data.audits.last30Days} in last 30d
                  </span>
                </div>
              </Link>

              {/* Metric 3: Converted Clients (Won) */}
              <Link to="/leads?status=WON" className="growth-metric-card link-card">
                <div className="gmc-header">
                  <div className="gmc-icon-wrap green">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="trend-badge positive">
                    <CheckCircle2 size={12} />
                    <span>{data.leads.total > 0 ? `${Math.round((data.leads.converted / data.leads.total) * 100)}% Win Rate` : 'Pipeline active'}</span>
                  </span>
                </div>
                <div className="gmc-body">
                  <span className="gmc-label">Converted Clients (Won)</span>
                  <div className="gmc-number-row">
                    <strong className="gmc-value">{data.leads.converted.toLocaleString('en-IN')}</strong>
                    <span className="gmc-period">won</span>
                  </div>
                  <span className="gmc-subtext">
                    {data.leads.qualified} qualified in pipeline · {data.leads.byStatus.PROPOSAL_SENT ?? 0} proposals sent
                  </span>
                </div>
              </Link>

              {/* Metric 4: Website Health Scanner Diagnostics */}
              <Link to="/audits?tab=scans" className="growth-metric-card link-card highlight">
                <div className="gmc-header">
                  <div className="gmc-icon-wrap violet">
                    <Sparkles size={20} />
                  </div>
                  <span className="health-score-pill">
                    <span>{scans && scans.total > 0 ? `Avg: ${scans.avgOverallScore}/100` : '0 scans logged'}</span>
                  </span>
                </div>
                <div className="gmc-body">
                  <span className="gmc-label">Website Health Scans</span>
                  <div className="gmc-number-row">
                    <strong className="gmc-value" style={{ color: 'var(--orange)' }}>
                      {scans?.total ?? 0}
                    </strong>
                    <span className="gmc-period">scans</span>
                  </div>
                  <span className="gmc-subtext">
                    {scans && scans.total > 0
                      ? `Speed ${scans.avgPerformanceScore}% · SEO ${scans.avgSeoScore}% · UX ${scans.avgMobileScore}%`
                      : 'Live scans from /website-audit appear here'}
                  </span>
                </div>
              </Link>
            </div>

            {/* ROW 2: INTERACTIVE REVENUE & GROWTH TRAJECTORY CHART (Directly from DB Timeline) */}
            <div className="chart-hero-container">
              <div className="chart-header-row">
                <div className="chart-title-group">
                  <div className="chart-title-lead">
                    <BarChart2 size={18} style={{ color: 'var(--orange)' }} />
                    <h3>Business Growth Trajectory</h3>
                  </div>
                  <p>Real-time monthly historical trajectory aggregated directly from database records.</p>
                </div>

                <div className="chart-pills-bar">
                  <button
                    type="button"
                    className={`chart-pill-btn ${chartMode === 'revenue' ? 'active' : ''}`}
                    onClick={() => setChartMode('revenue')}
                  >
                    Won Clients ({data.leads.converted})
                  </button>
                  <button
                    type="button"
                    className={`chart-pill-btn ${chartMode === 'leads' ? 'active' : ''}`}
                    onClick={() => setChartMode('leads')}
                  >
                    Leads Inquiries ({data.leads.total})
                  </button>
                  <button
                    type="button"
                    className={`chart-pill-btn ${chartMode === 'traffic' ? 'active' : ''}`}
                    onClick={() => setChartMode('traffic')}
                  >
                    Website Scans ({scans?.total ?? 0})
                  </button>
                </div>
              </div>

              {/* Floating Pill Badges from Genuine DB Records */}
              <div className="hero-laptop-floating-badges" aria-hidden="true">
                <div className="hl-badge hl-badge-leads">
                  <Users size={14} />
                  <span>Qualified Leads: <strong>{data.leads.qualified}</strong> ({data.leads.new} new)</span>
                </div>
                <div className="hl-badge hl-badge-revenue">
                  <CheckCircle2 size={14} />
                  <span>Won Engagements: <strong>{data.leads.converted}</strong></span>
                </div>
                <div className="hl-badge hl-badge-audit">
                  <Sparkles size={14} />
                  <span>Health Scans: <strong>{scans?.total ?? 0}</strong> {scans && scans.total > 0 ? `(Avg ${scans.avgOverallScore})` : ''}</span>
                </div>
              </div>

              {/* Responsive SVG Smooth Area Chart Plotted from Database */}
              <div className="chart-svg-wrap">
                <svg viewBox="0 0 960 260" preserveAspectRatio="none" className="growth-area-svg">
                  <defs>
                    <linearGradient id="growthWarmGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fa5500" stopOpacity="0.32" />
                      <stop offset="50%" stopColor="#fa5500" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#fa5500" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="growthStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff7b39" />
                      <stop offset="50%" stopColor="#fa5500" />
                      <stop offset="100%" stopColor="#d93800" />
                    </linearGradient>
                    <filter id="glowDrop" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#f24d00" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="40" y1="50" x2="920" y2="50" stroke="#f0e9e4" strokeDasharray="4 4" />
                  <line x1="40" y1="105" x2="920" y2="105" stroke="#f0e9e4" strokeDasharray="4 4" />
                  <line x1="40" y1="160" x2="920" y2="160" stroke="#f0e9e4" strokeDasharray="4 4" />
                  <line x1="40" y1="215" x2="920" y2="215" stroke="#f0e9e4" strokeDasharray="4 4" />

                  {/* Dynamic Shaded Area Fill from DB */}
                  {areaD && <path d={areaD} fill="url(#growthWarmGradient)" />}

                  {/* Dynamic Smooth Bezier Line from DB */}
                  {curveD && (
                    <path
                      d={curveD}
                      fill="none"
                      stroke="url(#growthStrokeGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#glowDrop)"
                    />
                  )}

                  {/* Dynamic Data Points on the line with Tooltips and Values */}
                  {chartPoints.map((pt, idx) => (
                    <g key={pt.month + idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === chartPoints.length - 1 ? 5.5 : 4.5}
                        fill="#fff"
                        stroke={idx === chartPoints.length - 1 ? '#d93800' : '#fa5500'}
                        strokeWidth={idx === chartPoints.length - 1 ? 3 : 2.5}
                      >
                        <title>{pt.month}: {pt.val} {chartMode}</title>
                      </circle>
                      {pt.val > 0 && (
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {pt.val}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {/* X Axis Labels directly from DB Timeline */}
                <div className="chart-x-axis">
                  {chartPoints.map((pt, idx) => (
                    <span key={pt.month + idx}>{pt.month}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 3: CLIENT MESSAGES & ENQUIRIES + WEBSITE HEALTH SCANNER STREAM */}
            <div className="dash-grid-primary" style={{ marginTop: 24 }}>
              {/* Left Column: Recent Client Messages & Inquiries ("MSGS AND ALL") */}
              <div className="modern-card">
                <div className="mc-head">
                  <div className="mc-head-title">
                    <MessageSquare size={18} style={{ color: 'var(--orange)' }} />
                    <h3>Client Inquiries &amp; Messages</h3>
                    <span className="badge-count-pill">{data.leads.total}</span>
                  </div>
                  <Link to="/leads" className="mc-link">
                    <span>View Inbox</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Sub-filter tabs */}
                <div className="mc-sub-tabs">
                  <button
                    type="button"
                    className={`sub-tab-btn ${messagesFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMessagesFilter('all')}
                  >
                    All Inquiries ({data.recentLeads.length})
                  </button>
                  <button
                    type="button"
                    className={`sub-tab-btn ${messagesFilter === 'new' ? 'active' : ''}`}
                    onClick={() => setMessagesFilter('new')}
                  >
                    Awaiting Contact ({data.leads.new})
                  </button>
                  <button
                    type="button"
                    className={`sub-tab-btn ${messagesFilter === 'audits' ? 'active' : ''}`}
                    onClick={() => setMessagesFilter('audits')}
                  >
                    With Audit Attached ({data.leads.withAuditCount ?? 0})
                  </button>
                </div>

                {filteredLeads.length ? (
                  <div className="modern-message-list">
                    {filteredLeads.map(lead => {
                      const svc = formatLeadService(lead)
                      const initials = lead.name
                        .split(/\s+/)
                        .map(p => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()

                      return (
                        <Link to={`/leads/${lead.id}`} key={lead.id} className="modern-msg-item">
                          <div className="mmi-avatar" aria-hidden="true">
                            {initials || 'CL'}
                          </div>

                          <div className="mmi-content">
                            <div className="mmi-top-row">
                              <strong className="mmi-name">{lead.name}</strong>
                              {lead.reference && (
                                <span className="mmi-ref-badge">[{lead.reference}]</span>
                              )}
                              <span className="mmi-time">{timeAgo(lead.createdAt)}</span>
                            </div>

                            <div className="mmi-biz-row">
                              <span className="mmi-biz">{lead.businessName || 'Business Owner'}</span>
                              {svc && <span className="mmi-svc-pill">{svc}</span>}
                            </div>

                            <div className="mmi-meta-tags">
                              {/* Contact channel */}
                              {lead.preferredContact?.toLowerCase().includes('whatsapp') ? (
                                <span className="mmi-channel whatsapp">
                                  <MessageCircle size={12} /> WhatsApp
                                </span>
                              ) : lead.preferredContact?.toLowerCase().includes('phone') ? (
                                <span className="mmi-channel phone">
                                  <Phone size={12} /> Phone
                                </span>
                              ) : (
                                <span className="mmi-channel email">
                                  <Mail size={12} /> Email
                                </span>
                              )}

                              {lead.auditRef && (
                                <span className="mmi-audit-attached">
                                  <Sparkles size={11} /> Audit Attached
                                </span>
                              )}

                              <Badge value={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                            </div>
                          </div>

                          <div className="mmi-arrow">
                            <ArrowRight size={15} />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No messages in this filter"
                    message="Client messages submitted via the 'Let's Talk' form or Smart Scope Planner will appear here."
                  />
                )}
              </div>

              {/* Right Column: Live Website Health Scanner Stream */}
              <div className="modern-card">
                <div className="mc-head">
                  <div className="mc-head-title">
                    <Sparkles size={18} style={{ color: 'var(--orange)' }} />
                    <h3>Website Health Scanner Diagnostics</h3>
                    <span className="badge-count-pill">{scans?.total ?? 0}</span>
                  </div>
                  <Link to="/audits?tab=scans" className="mc-link">
                    <span>Scanner Logs</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Score Summary Banner */}
                {scans && (
                  <div className="audit-engine-summary-bar">
                    <div className="aes-item">
                      <strong style={{ color: 'var(--orange)' }}>
                        {scans.total > 0 ? scans.avgOverallScore : '—'}
                      </strong>
                      <small>Avg Health</small>
                    </div>
                    <div className="aes-item">
                      <strong>{scans.total > 0 ? scans.avgPerformanceScore : '—'}</strong>
                      <small>Speed</small>
                    </div>
                    <div className="aes-item">
                      <strong>{scans.total > 0 ? scans.avgSeoScore : '—'}</strong>
                      <small>SEO Index</small>
                    </div>
                    <div className="aes-item">
                      <strong>{scans.total > 0 ? scans.avgMobileScore : '—'}</strong>
                      <small>Mobile UX</small>
                    </div>
                    <div className="aes-item">
                      <strong style={{ color: 'var(--green)' }}>{scans.convertedToLeads || 0}</strong>
                      <small>Leads Converted</small>
                    </div>
                  </div>
                )}

                {scans?.recentScans.length ? (
                  <div className="modern-scan-list">
                    {scans.recentScans.slice(0, 6).map(s => (
                      <Link
                        key={s.id}
                        to={s.leadId ? `/leads/${s.leadId}` : `/audits?tab=scans&q=${encodeURIComponent(s.normalizedUrl || s.url)}`}
                        className="modern-scan-item"
                      >
                        <div className="msi-icon">
                          <Globe size={18} />
                        </div>

                        <div className="msi-content">
                          <div className="msi-url-row">
                            <strong className="msi-url">{s.normalizedUrl || s.url}</strong>
                            <span className="msi-time">{timeAgo(s.createdAt)}</span>
                          </div>

                          <div className="msi-details-row">
                            <span className="msi-device-badge">
                              {s.strategy === 'desktop' ? 'Desktop' : 'Mobile'}
                            </span>
                            <span className="msi-pages">
                              {s.pagesInspected || 1} page{s.pagesInspected === 1 ? '' : 's'} audited
                            </span>
                            {s.leadReference && (
                              <span className="msi-lead-tag">Lead [{s.leadReference}]</span>
                            )}
                          </div>
                        </div>

                        <div className="msi-score-badge">
                          {s.state === 'running' ? (
                            <Badge label="Scanning…" tone="blue" />
                          ) : s.state === 'failed' ? (
                            <Badge label="Failed" tone="grey" />
                          ) : (
                            <div className={`scan-score-bubble tone-${scoreTone(s.overallScore)}`}>
                              <strong>{s.overallScore}</strong>
                              <small>/100</small>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No live website scans yet"
                    message="Scans launched from the Hero Website Health Scanner or /website-audit page will stream here automatically."
                  />
                )}
              </div>
            </div>

            {/* ROW 4: FUNNEL ANALYTICS & BREAKDOWNS */}
            <div className="dash-grid-secondary" style={{ marginTop: 24 }}>
              {/* Pipeline Status Breakdown */}
              <Card title="Lead Pipeline Status">
                {data.leads.total ? (
                  <Bars
                    items={LEAD_STATUSES.map(s => ({
                      label: LEAD_STATUS_LABELS[s],
                      count: data.leads.byStatus[s] ?? 0,
                      to: `/leads?status=${s}`,
                      tone: s,
                    }))}
                  />
                ) : (
                  <EmptyState title="No leads in pipeline yet" message="Pipeline breakdown updates as client inquiries arrive." />
                )}
              </Card>

              {/* Service Pillar Distribution */}
              <Card title="Growth Pillars (Demand Breakdown)">
                {data.leads.byCategory?.length ? (
                  <Bars
                    items={data.leads.byCategory.map(c => ({
                      label: c.label,
                      count: c.count,
                      to: `/leads?category=${encodeURIComponent(c.label)}`,
                    }))}
                  />
                ) : (
                  <EmptyState title="No pillar data yet" message="Shows demand across BUILD, GROW, CONVERT, and AUTOMATE." />
                )}
              </Card>

              {/* Most Requested Services */}
              <Card title="Top Requested Digital Services">
                {data.topServices.length ? (
                  <Bars items={data.topServices.map(s => ({ ...s, to: `/leads?service=${encodeURIComponent(s.label)}` }))} />
                ) : (
                  <EmptyState title="No service data yet" message="Shows which services prospective clients select most." />
                )}
              </Card>

              {/* Lead Acquisition Channels */}
              <Card title="Client Acquisition Entry Points">
                {data.sources.length ? (
                  <Bars items={data.sources} />
                ) : (
                  <EmptyState
                    title="No source data yet"
                    message="Tracks hero_audit, home_instant_scanner, direct_contact_form, and campaigns."
                  />
                )}
              </Card>
            </div>
          </>
        )
      )}
    </div>
  )
}

/** Simple horizontal progress bars */
function Bars({ items }: { items: { label: string; count: number; to?: string; tone?: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <ul className="bars">
      {items.map(item => {
        const body = (
          <>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track">
              <span
                className={`bar-fill ${item.tone ? `tone-${item.tone}` : ''}`}
                style={{ width: `${item.count > 0 ? (item.count / max) * 100 : 0}%` }}
              />
            </span>
            <span className="bar-count">{item.count}</span>
          </>
        )
        return <li key={item.label}>{item.to ? <Link to={item.to}>{body}</Link> : <div>{body}</div>}</li>
      })}
    </ul>
  )
}
