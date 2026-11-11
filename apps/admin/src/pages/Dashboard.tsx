import { Link } from 'react-router'
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Gauge,
  Newspaper,
  RefreshCw,
  SearchCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { AUDIT_STATUS_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS, type AuditStatus, type LeadStatus } from '@chazon/shared'
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
  const scans = data?.websiteScans
  const totalPublishedCatalog =
    (data?.content.publishedServices ?? 0) +
    (data?.content.publishedCaseStudies ?? 0) +
    (data?.content.publishedInsights ?? 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data?.generatedAt
            ? `Synced with live website funnels & catalog · Updated ${timeAgo(data.generatedAt)}`
            : 'Your live website pipeline, instant audits, and published content at a glance.'
        }
        actions={
          <div className="button-group">
            {data?.storageMode && (
              <Badge
                label={data.storageMode === 'database' ? 'PostgreSQL Live' : 'Session Memory Sync'}
                tone={data.storageMode === 'database' ? 'green' : 'blue'}
              />
            )}
            <button type="button" className="btn" onClick={() => reload(true)} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} aria-hidden="true" />
              {loading ? 'Syncing…' : 'Sync now'}
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
            <div className="kpis">
              <Kpi
                icon={Users}
                label="Total leads"
                value={data.leads.total}
                sub={`${data.leads.last30Days} last 30d · ${data.leads.withAuditCount ?? 0} w/ audit`}
                to="/leads"
              />
              <Kpi icon={Sparkles} label="New enquiries" value={data.leads.new} sub="Awaiting first contact" to="/leads?status=NEW" accent />
              <Kpi icon={UserRound} label="Qualified" value={data.leads.qualified} sub="Worth pursuing" to="/leads?status=QUALIFIED" />
              <Kpi icon={CheckCircle2} label="Won" value={data.leads.converted} sub="Converted engagements" to="/leads?status=WON" />
              <Kpi
                icon={Gauge}
                label="Website scans"
                value={scans?.total ?? 0}
                sub={
                  scans?.running
                    ? `${scans.running} running now · Avg ${scans.avgOverallScore}/100`
                    : `${scans?.avgOverallScore ?? 0}/100 avg · ${scans?.convertedToLeads ?? 0} converted`
                }
                to="/audits?tab=scans"
                accent={(scans?.running ?? 0) > 0}
              />
              <Kpi icon={SearchCheck} label="Growth audits" value={data.audits.total} sub={`${data.audits.new} new requests`} to="/audits?tab=requests" />
              <Kpi
                icon={Briefcase}
                label="Live services"
                value={data.content.publishedServices ?? totalPublishedCatalog}
                sub={`${data.content.publishedIndustries ?? 0} industries · ${data.content.publishedCaseStudies} work`}
                to="/services"
              />
              <Kpi
                icon={Newspaper}
                label="Published content"
                value={data.content.publishedCaseStudies + data.content.publishedInsights}
                sub={`${data.content.publishedCaseStudies} case studies · ${data.content.publishedInsights} insights`}
                to="/insights?status=PUBLISHED"
              />
            </div>

            {scans && (
              <Card
                title="Website Audit Engine Health"
                className="span-2"
                actions={
                  <Link className="link" to="/audits?tab=scans">
                    Inspect all scans <ArrowUpRight size={14} />
                  </Link>
                }
              >
                <div className="audit-score-strip" style={{ marginTop: 4, marginBottom: 4 }}>
                  <div className="audit-mini-score">
                    <strong style={{ color: 'var(--orange-text)' }}>{scans.avgOverallScore || '—'}</strong>
                    <small>Avg Overall</small>
                  </div>
                  <div className="audit-mini-score">
                    <strong>{scans.avgPerformanceScore || '—'}</strong>
                    <small>Avg Performance</small>
                  </div>
                  <div className="audit-mini-score">
                    <strong>{scans.avgSeoScore || '—'}</strong>
                    <small>Avg Technical SEO</small>
                  </div>
                  <div className="audit-mini-score">
                    <strong>{scans.avgMobileScore || '—'}</strong>
                    <small>Avg Mobile UX</small>
                  </div>
                  <div className="audit-mini-score">
                    <strong>{scans.avgConversionScore || '—'}</strong>
                    <small>Avg Conversion</small>
                  </div>
                  <div className="audit-mini-score">
                    <strong style={{ color: 'var(--green)' }}>{scans.convertedToLeads}</strong>
                    <small>Scan → Lead</small>
                  </div>
                </div>
              </Card>
            )}

            <div className="dash-grid" style={{ marginTop: 16 }}>
              <Card
                title="Recent enquiries"
                actions={
                  <Link className="link" to="/leads">
                    View all <ArrowUpRight size={14} />
                  </Link>
                }
              >
                {data.recentLeads.length ? (
                  <ul className="recent-list">
                    {data.recentLeads.map(l => {
                      const svc = formatLeadService(l)
                      return (
                        <li key={l.id}>
                          <Link to={`/leads/${l.id}`}>
                            <span>
                              <strong>
                                {l.name}
                                {l.reference ? <span className="mono muted" style={{ marginLeft: 6, fontSize: '0.78rem', fontWeight: 500 }}>[{l.reference}]</span> : null}
                              </strong>
                              <small>
                                {l.businessName}
                                {svc ? ` · ${svc}` : ''}
                                {l.auditRef ? ' · Audit Attached' : ''}
                              </small>
                            </span>
                            <span className="recent-meta">
                              <Badge value={l.status} label={LEAD_STATUS_LABELS[l.status]} />
                              <small>{timeAgo(l.createdAt)}</small>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    title="No enquiries yet"
                    message="Enquiries submitted through the website Smart Scope Planner or contact forms will appear here."
                  />
                )}
              </Card>

              <Card
                title="Recent live website scans"
                actions={
                  <Link className="link" to="/audits?tab=scans">
                    View scanner logs <ArrowUpRight size={14} />
                  </Link>
                }
              >
                {scans?.recentScans.length ? (
                  <ul className="recent-list">
                    {scans.recentScans.map(s => (
                      <li key={s.id}>
                        <Link to={s.leadId ? `/leads/${s.leadId}` : `/audits?tab=scans&q=${encodeURIComponent(s.normalizedUrl || s.url)}`}>
                          <span>
                            <strong>{s.normalizedUrl || s.url}</strong>
                            <small>
                              {s.strategy === 'desktop' ? 'Desktop' : 'Mobile'} · {s.pagesInspected || 1} page{s.pagesInspected === 1 ? '' : 's'}
                              {s.leadReference ? ` · Lead ${s.leadReference}` : ''}
                            </small>
                          </span>
                          <span className="recent-meta">
                            {s.state === 'running' ? (
                              <Badge label="Scanning…" tone="blue" />
                            ) : s.state === 'failed' ? (
                              <Badge label="Failed" tone="grey" />
                            ) : (
                              <Badge label={`${s.overallScore}/100`} tone={scoreTone(s.overallScore)} />
                            )}
                            <small>{timeAgo(s.createdAt)}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No website scans yet"
                    message="Live scans launched from the Hero quick-audit, Homepage, or /website-audit page will stream here automatically."
                  />
                )}
              </Card>

              <Card title="Enquiry focus areas (6 website categories)">
                {data.leads.byCategory?.length ? (
                  <Bars
                    items={data.leads.byCategory.map(c => ({
                      label: c.label,
                      count: c.count,
                      to: `/leads?category=${encodeURIComponent(c.label)}`,
                    }))}
                  />
                ) : (
                  <EmptyState title="No category data yet" message="Shows distribution across BUILD, GROW, CONVERT, AUTOMATE, E-COMMERCE, and AI." />
                )}
              </Card>

              <Card title="Lead status pipeline">
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
                  <EmptyState title="No leads yet" message="Status breakdown appears once enquiries arrive." />
                )}
              </Card>

              <Card title="Most requested services">
                {data.topServices.length ? (
                  <Bars items={data.topServices.map(s => ({ ...s, to: `/leads?service=${encodeURIComponent(s.label)}` }))} />
                ) : (
                  <EmptyState title="No service data yet" message="Shows what services website visitors select most." />
                )}
              </Card>

              <Card
                title="Growth audit requests"
                actions={
                  <Link className="link" to="/audits?tab=requests">
                    Manage <ArrowUpRight size={14} />
                  </Link>
                }
              >
                {data.recentAudits.length ? (
                  <ul className="recent-list">
                    {data.recentAudits.map(a => (
                      <li key={a.id}>
                        <Link to={`/audits/${a.id}`}>
                          <span>
                            <strong>{a.name}</strong>
                            <small>
                              {a.businessName}
                              {a.website ? ` · ${a.website}` : ''}
                            </small>
                          </span>
                          <span className="recent-meta">
                            <Badge value={a.status} label={AUDIT_STATUS_LABELS[a.status]} />
                            <small>{timeAgo(a.createdAt)}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No growth audit requests yet" message="Advisory audit requests submitted on /growth-audit appear here." />
                )}
              </Card>

              <Card title="Lead sources & acquisition entry points" className="span-2">
                {data.sources.length ? (
                  <Bars items={data.sources} />
                ) : (
                  <EmptyState
                    title="No source data yet"
                    message="Captures hero_audit, home_audit_section, direct_contact_form, smart_enquiry, and UTM campaign parameters."
                  />
                )}
              </Card>
            </div>
          </>
        )
      )}
    </>
  )
}

function Kpi({ icon: Icon, label, value, sub, to, accent }: { icon: typeof Users; label: string; value: number; sub?: string; to: string; accent?: boolean }) {
  return (
    <Link to={to} className={`kpi ${accent && value > 0 ? 'accent' : ''}`}>
      <span className="kpi-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value.toLocaleString('en-IN')}</strong>
      {sub && <span className="kpi-sub">{sub}</span>}
    </Link>
  )
}

void Activity

/** Simple horizontal bars — enough to compare a handful of counts without a chart library. */
function Bars({ items }: { items: { label: string; count: number; to?: string; tone?: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <ul className="bars">
      {items.map(item => {
        const body = (
          <>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track">
              <span className={`bar-fill ${item.tone ? `tone-${item.tone}` : ''}`} style={{ width: `${item.count > 0 ? (item.count / max) * 100 : 0}%` }} />
            </span>
            <span className="bar-count">{item.count}</span>
          </>
        )
        return <li key={item.label}>{item.to ? <Link to={item.to}>{body}</Link> : <div>{body}</div>}</li>
      })}
    </ul>
  )
}
