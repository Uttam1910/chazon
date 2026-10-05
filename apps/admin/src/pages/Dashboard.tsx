import { Link } from 'react-router'
import { ArrowUpRight, Briefcase, CheckCircle2, Newspaper, SearchCheck, Sparkles, UserRound, Users } from 'lucide-react'
import { AUDIT_STATUS_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS, type AuditStatus, type LeadStatus } from '@chazon/shared'
import { useApi } from '../api'
import { Badge, Card, PageHeader } from '../ui/Common'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { timeAgo } from '../ui/utils'

type Stats = {
  leads: { total: number; new: number; qualified: number; converted: number; last30Days: number; byStatus: Partial<Record<LeadStatus, number>> }
  audits: { total: number; new: number; last30Days: number; byStatus: Partial<Record<AuditStatus, number>> }
  content: { publishedCaseStudies: number; publishedInsights: number }
  recentLeads: { id: string; name: string; businessName: string; service: string | null; status: LeadStatus; createdAt: string }[]
  recentAudits: { id: string; name: string; businessName: string; website: string | null; status: AuditStatus; createdAt: string }[]
  topServices: { label: string; count: number }[]
  sources: { label: string; count: number }[]
}

export function Dashboard() {
  const { data, error, loading, reload } = useApi<Stats>('/dashboard')
  return <>
    <PageHeader title="Dashboard" description="Your pipeline and published content at a glance."/>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows rows={6}/> : data && <>
      <div className="kpis">
        <Kpi icon={Users} label="Total leads" value={data.leads.total} sub={`${data.leads.last30Days} in the last 30 days`} to="/leads"/>
        <Kpi icon={Sparkles} label="New leads" value={data.leads.new} sub="Awaiting first contact" to="/leads?status=NEW" accent/>
        <Kpi icon={UserRound} label="Qualified" value={data.leads.qualified} sub="Worth pursuing" to="/leads?status=QUALIFIED"/>
        <Kpi icon={CheckCircle2} label="Converted" value={data.leads.converted} sub="Marked as won" to="/leads?status=WON"/>
        <Kpi icon={SearchCheck} label="Audit requests" value={data.audits.total} sub={`${data.audits.new} new`} to="/audits"/>
        <Kpi icon={Briefcase} label="Published case studies" value={data.content.publishedCaseStudies} to="/case-studies?status=PUBLISHED"/>
        <Kpi icon={Newspaper} label="Published insights" value={data.content.publishedInsights} to="/insights?status=PUBLISHED"/>
      </div>
      <div className="dash-grid">
        <Card title="Recent leads" actions={<Link className="link" to="/leads">View all <ArrowUpRight size={14}/></Link>}>
          {data.recentLeads.length ? <ul className="recent-list">{data.recentLeads.map(l => <li key={l.id}><Link to={`/leads/${l.id}`}>
            <span><strong>{l.name}</strong><small>{l.businessName}{l.service ? ` · ${l.service}` : ''}</small></span>
            <span className="recent-meta"><Badge value={l.status} label={LEAD_STATUS_LABELS[l.status]}/><small>{timeAgo(l.createdAt)}</small></span>
          </Link></li>)}</ul> : <EmptyState title="No leads yet" message="Enquiries from the website’s “Let’s Talk” form will appear here."/>}
        </Card>
        <Card title="Recent audit requests" actions={<Link className="link" to="/audits">View all <ArrowUpRight size={14}/></Link>}>
          {data.recentAudits.length ? <ul className="recent-list">{data.recentAudits.map(a => <li key={a.id}><Link to={`/audits/${a.id}`}>
            <span><strong>{a.name}</strong><small>{a.businessName}{a.website ? ` · ${a.website}` : ''}</small></span>
            <span className="recent-meta"><Badge value={a.status} label={AUDIT_STATUS_LABELS[a.status]}/><small>{timeAgo(a.createdAt)}</small></span>
          </Link></li>)}</ul> : <EmptyState title="No audit requests yet" message="Digital Growth Audit requests from the website will appear here."/>}
        </Card>
        <Card title="Lead status overview">
          {data.leads.total ? <Bars items={LEAD_STATUSES.map(s => ({ label: LEAD_STATUS_LABELS[s], count: data.leads.byStatus[s] ?? 0, to: `/leads?status=${s}`, tone: s }))}/> : <EmptyState title="No leads yet" message="Status breakdown appears once leads arrive."/>}
        </Card>
        <Card title="Most requested services">
          {data.topServices.length ? <Bars items={data.topServices.map(s => ({ ...s, to: `/leads?service=${encodeURIComponent(s.label)}` }))}/> : <EmptyState title="No data yet" message="Shows what enquirers ask for most."/>}
        </Card>
        <Card title="Lead sources" className="span-2">
          {data.sources.length ? <Bars items={data.sources}/> : <EmptyState title="No data yet" message="Campaign (utm_source) or referring site, captured by the website form when available."/>}
        </Card>
      </div>
    </>}
  </>
}

function Kpi({ icon: Icon, label, value, sub, to, accent }: { icon: typeof Users; label: string; value: number; sub?: string; to: string; accent?: boolean }) {
  return <Link to={to} className={`kpi ${accent && value > 0 ? 'accent' : ''}`}>
    <span className="kpi-icon" aria-hidden="true"><Icon size={18}/></span>
    <span className="kpi-label">{label}</span>
    <strong className="kpi-value">{value.toLocaleString('en-IN')}</strong>
    {sub && <span className="kpi-sub">{sub}</span>}
  </Link>
}

/** Simple horizontal bars — enough to compare a handful of counts without a chart library. */
function Bars({ items }: { items: { label: string; count: number; to?: string; tone?: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return <ul className="bars">{items.map(item => {
    const body = <><span className="bar-label">{item.label}</span><span className="bar-track"><span className={`bar-fill ${item.tone ? `tone-${item.tone}` : ''}`} style={{ width: `${(item.count / max) * 100}%` }}/></span><span className="bar-count">{item.count}</span></>
    return <li key={item.label}>{item.to ? <Link to={item.to}>{body}</Link> : <div>{body}</div>}</li>
  })}</ul>
}
