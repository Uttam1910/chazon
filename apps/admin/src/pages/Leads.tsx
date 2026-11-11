import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, PILLAR_INFO, type LeadStatus } from '@chazon/shared'
import { api, errorMessage, fieldErrors, qs, useApi } from '../api'
import { Badge, Card, PageHeader, Pagination } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { TextArea, TextInput } from '../ui/Form'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { FilterSelect, SearchBox, Toolbar } from './list'
import { useAuth } from '../auth-context'
import { formatDate, isEqual, timeAgo, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { useListParams } from './list-utils'

type Activity = { id: string; type: string; message: string; createdAt: string; actor: { name: string } | null }
type Note = { id: string; body: string; createdAt: string; author: { id: string; name: string } | null }

export type DynamicEnquiryDetails = {
  goals?: string[]
  build?: {
    isNewOrRedesign?: string
    projectType?: string
    websiteType?: string
    hasDomain?: string
    contentReady?: string
    contentStatus?: string
    pagesExpected?: string
    pageCount?: string
    needsPayment?: boolean
    customFeatures?: string
    features?: string[]
    referenceUrl?: string
  }
  grow?: {
    hasWebsite?: boolean
    websiteUrl?: string
    currentUrl?: string
    primaryGoal?: string
    focus?: string
    currentlyInvests?: string
    currentInvestment?: string
    usesSearchConsole?: string
    targetMarkets?: string
    targetLocations?: string
    priorityKeywords?: string
    targetKeywords?: string
  }
  convert?: {
    desiredAction?: string
    targetAction?: string
    conversionProblem?: string
    hasWebsite?: boolean
    websiteUrl?: string
    currentlyTracking?: string
    trackingStatus?: string
    targetJourney?: string
    journeyToImprove?: string
  }
  automate?: {
    targetProcess?: string
    processesToAutomate?: string[]
    automations?: string[]
    currentCrm?: string
    usesCrm?: string
    receivesWhatsApp?: boolean
    whatsAppVolume?: string
    needsAutoFollowup?: boolean
    needsAutoFollowUp?: boolean
    manualWorkflowNotes?: string
    manualWorkflowDescription?: string
  }
  ecommerce?: {
    hasStore?: boolean
    platform?: string
    productCount?: string
    needsPayment?: boolean
    needsShipping?: boolean
  }
  ai?: {
    primaryUseCase?: string
    capability?: string
    aiCapabilities?: string[]
    needsChatbot?: boolean
    needsSupportAutomation?: boolean
    customAppDetails?: string
    details?: string
    description?: string
  }
}

export type AuditDetailData = {
  url?: string
  domain?: string
  scannedAt?: string
  overallScore?: number
  executiveSummary?: string
  categories?: {
    performance?: { score?: number }
    seo?: { score?: number }
    mobile?: { score?: number }
    conversion?: { score?: number }
  }
  scores?: {
    performance?: number
    seo?: number
    mobile?: number
    conversion?: number
  }
}

export type Lead = {
  id: string
  reference?: string | null
  name: string
  businessName: string
  email: string
  phone: string
  preferredContact?: string | null
  website: string | null
  category: string | null
  service: string | null
  services?: string[] | string | null
  businessStage?: string | null
  targetAudience?: string | null
  businessDescription?: string | null
  budget: string | null
  timeline?: string | null
  message: string | null
  dynamicAnswers?: DynamicEnquiryDetails | null
  consentToContact?: boolean
  marketingConsent?: boolean
  auditRef?: string | null
  auditData?: AuditDetailData | null
  source: string
  sourceDetail: string | null
  status: LeadStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { notes: number }
  notes?: Note[]
  activities?: Activity[]
}

const statusOptions = [{ value: '', label: 'All statuses' }, ...LEAD_STATUSES.map(s => ({ value: s, label: LEAD_STATUS_LABELS[s] }))]
const viewOptions = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }, { value: 'all', label: 'All' }]
const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'business', label: 'Business A–Z' },
  { value: 'status', label: 'Status' },
]
const serviceSuggestions = [
  ...Object.values(PILLAR_INFO).map(p => p.title),
  'Digital Growth Audit',
  'Website Development',
  'Landing Page Development',
  'E-commerce Development',
  'SEO Services',
  'Local SEO',
  'Conversion Rate Optimisation',
  'Business Process Automation',
  'AI Integration',
  'Other',
]

function formatServicesList(lead: Pick<Lead, 'service' | 'services' | 'category'>): string {
  if (Array.isArray(lead.services) && lead.services.length > 0) return lead.services.join(', ')
  if (typeof lead.services === 'string' && lead.services.trim()) return lead.services
  return lead.service || lead.category || '—'
}

const categoryOptions = [
  { value: '', label: 'All focus areas' },
  { value: 'BUILD', label: 'BUILD' },
  { value: 'GROW', label: 'GROW' },
  { value: 'CONVERT', label: 'CONVERT' },
  { value: 'AUTOMATE', label: 'AUTOMATE' },
  { value: 'E-COMMERCE', label: 'E-COMMERCE' },
  { value: 'AI', label: 'AI' },
]

const auditFilterOptions = [
  { value: '', label: 'All enquiries' },
  { value: 'true', label: 'With Website Audit' },
  { value: 'false', label: 'Direct Enquiry only' },
]

function exportLeadsCsv(leads: Lead[]) {
  if (!leads.length) return
  const headers = [
    'Reference',
    'Name',
    'Business Name',
    'Email',
    'Phone',
    'Preferred Contact',
    'Services',
    'Budget',
    'Timeline',
    'Business Stage',
    'Status',
    'Source',
    'Received At',
  ]
  const rows = leads.map(l =>
    [
      l.reference || l.id,
      l.name,
      l.businessName,
      l.email,
      l.phone,
      l.preferredContact || '',
      formatServicesList(l),
      l.budget || '',
      l.timeline || '',
      l.businessStage || '',
      l.status,
      l.source,
      l.createdAt,
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )

  const csv = [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chazon-enquiries-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function Leads() {
  const { values, page, set } = useListParams({ q: '', status: '', category: '', hasAudit: '', view: 'active', sort: 'newest', service: '' })
  const { data, meta, error, loading, reload } = useApi<Lead[]>(`/leads${qs({ ...values, page })}`)
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const filtered = values.q || values.status || values.category || values.hasAudit || values.service || values.view !== 'active'

  const handleExport = () => {
    if (!data || !data.length) {
      toast.error('No leads available to export')
      return
    }
    exportLeadsCsv(data)
    toast.success(`Exported ${data.length} enquiries to CSV`)
  }

  return (
    <>
      <PageHeader
        title="Leads & Enquiries"
        description="Smart multi-step enquiries and audit leads submitted through the Chazon revenue engine."
        actions={
          <div className="button-group">
            <button className="btn" onClick={handleExport} disabled={!data?.length}>
              <Download size={15} aria-hidden="true" />
              Export CSV
            </button>
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden="true" />
              Add lead
            </button>
          </div>
        }
      />
      <Toolbar>
        <SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search reference, name, business, email, phone…" />
        <FilterSelect label="Focus" value={values.category} onChange={v => set('category', v)} options={categoryOptions} />
        <FilterSelect label="Status" value={values.status} onChange={v => set('status', v)} options={statusOptions} />
        <FilterSelect label="Audit" value={values.hasAudit} onChange={v => set('hasAudit', v)} options={auditFilterOptions} />
        <FilterSelect label="Show" value={values.view} onChange={v => set('view', v)} options={viewOptions} />
        <FilterSelect label="Sort" value={values.sort} onChange={v => set('sort', v)} options={sortOptions} />
        {values.service && (
          <button className="chip-filter" onClick={() => set('service', '')}>
            Service: {values.service} ✕
          </button>
        )}
      </Toolbar>
      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingRows />
      ) : !data?.length ? (
        <EmptyState
          title={filtered ? 'No leads match these filters' : 'No enquiries yet'}
          message={filtered ? 'Try a different search or filter.' : 'Enquiries submitted through the website will appear here automatically.'}
        />
      ) : (
        <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Enquiry / Client</th>
                <th>Contact</th>
                <th>Requirements</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {data.map(lead => (
                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="clickable">
                  <td data-label="Enquiry / Client">
                    <Link to={`/leads/${lead.id}`} onClick={e => e.stopPropagation()}>
                      <strong>{lead.name}</strong>
                    </Link>
                    <small>
                      {lead.businessName}
                      {lead.reference && <span className="mono" style={{ marginLeft: 6, color: 'var(--muted)' }}>[{lead.reference}]</span>}
                    </small>
                  </td>
                  <td data-label="Contact">
                    <span className="truncate">{lead.email}</span>
                    <small>
                      {lead.phone}
                      {lead.preferredContact && (
                        <span style={{ marginLeft: 6, textTransform: 'capitalize', fontWeight: 600, color: 'var(--orange-text)' }}>
                          via {lead.preferredContact}
                        </span>
                      )}
                    </small>
                  </td>
                  <td data-label="Requirements">
                    <span>{formatServicesList(lead)}</span>
                    <small>
                      {lead.budget ? lead.budget : 'Budget: TBD'}
                      {lead.timeline ? ` · ${lead.timeline}` : ''}
                    </small>
                  </td>
                  <td data-label="Status">
                    <Badge value={lead.status} label={LEAD_STATUS_LABELS[lead.status] || lead.status} />
                    {lead.auditRef && <Badge label="Audit Attached" tone="violet" />}
                    {lead.archivedAt && <Badge label="Archived" tone="grey" />}
                  </td>
                  <td data-label="Received">
                    <span>{formatDate(lead.createdAt)}</span>
                    <small>{lead.source === 'Website' ? 'Website Engine' : lead.source}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPage={p => set('page', p)} />
      <Modal open={adding} onClose={() => setAdding(false)} title="Add lead">
        <LeadForm
          onCancel={() => setAdding(false)}
          onSaved={lead => {
            setAdding(false)
            navigate(`/leads/${lead.id}`)
          }}
        />
      </Modal>
    </>
  )
}

type FormValues = {
  name: string
  businessName: string
  email: string
  phone: string
  preferredContact: string
  website: string
  category: string
  service: string
  budget: string
  timeline: string
  message: string
}

const toForm = (lead?: Lead): FormValues => ({
  name: lead?.name ?? '',
  businessName: lead?.businessName ?? '',
  email: lead?.email ?? '',
  phone: lead?.phone ?? '',
  preferredContact: lead?.preferredContact ?? 'whatsapp',
  website: lead?.website ?? '',
  category: lead?.category ?? '',
  service: lead?.service ?? '',
  budget: lead?.budget ?? '',
  timeline: lead?.timeline ?? '',
  message: lead?.message ?? '',
})

function LeadForm({
  lead,
  onSaved,
  onCancel,
  onDirty,
}: {
  lead?: Lead
  onSaved: (lead: Lead) => void
  onCancel: () => void
  onDirty?: (dirty: boolean) => void
}) {
  const [form, setForm] = useState(toForm(lead))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const set = (key: keyof FormValues) => (value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    onDirty?.(!isEqual(next, toForm(lead)))
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const saved = lead ? await api.patch<Lead>(`/leads/${lead.id}`, form) : await api.post<Lead>('/leads', form)
      toast.success(lead ? 'Lead updated' : 'Lead added')
      onDirty?.(false)
      onSaved(saved)
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="form-grid">
      <TextInput label="Name" required value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
      <TextInput label="Business name" required value={form.businessName} onChange={set('businessName')} error={errors.businessName} maxLength={150} />
      <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} />
      <TextInput label="Phone" type="tel" required value={form.phone} onChange={set('phone')} error={errors.phone} />
      <TextInput label="Preferred Contact Channel" value={form.preferredContact} onChange={set('preferredContact')} placeholder="whatsapp, phone, email" />
      <TextInput label="Website / Social" value={form.website} onChange={set('website')} error={errors.website} />
      <TextInput label="Business category" value={form.category} onChange={set('category')} error={errors.category} />
      <TextInput label="Requirement / service" value={form.service} onChange={set('service')} error={errors.service} list="service-suggestions" />
      <TextInput label="Budget" value={form.budget} onChange={set('budget')} error={errors.budget} />
      <TextInput label="Timeline" value={form.timeline} onChange={set('timeline')} error={errors.timeline} placeholder="Immediately, 2 weeks, 1 month" />
      <TextArea label="Message / Notes" className="full" value={form.message} onChange={set('message')} error={errors.message} rows={4} maxLength={3000} />
      <datalist id="service-suggestions">
        {serviceSuggestions.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="form-actions full">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}
        </button>
      </div>
    </form>
  )
}

export function LeadDetail() {
  const { id } = useParams()
  const { data: lead, error, loading, reload, setData } = useApi<Lead>(`/leads/${id}`)
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(editing && dirty)

  if (error)
    return (
      <>
        <PageHeader title="Lead" back={<BackLink />} />
        <ErrorState message={error.message} onRetry={reload} />
      </>
    )
  if ((loading && !lead) || !lead)
    return (
      <>
        <PageHeader title="Lead" back={<BackLink />} />
        <LoadingRows />
      </>
    )

  const update = async (body: Partial<Lead> & { archived?: boolean }, message: string) => {
    try {
      setData(await api.patch<Lead>(`/leads/${lead.id}`, body))
      toast.success(message)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const archive = async () => {
    if (lead.archivedAt) return update({ archived: false }, 'Lead restored')
    if (
      await confirm({
        title: 'Archive this lead?',
        message: 'Archived leads are hidden from the main list but kept with their notes. You can restore them at any time.',
        confirmLabel: 'Archive',
      })
    )
      update({ archived: true }, 'Lead archived')
  }

  const remove = async () => {
    if (
      !(await confirm({
        title: 'Delete this lead permanently?',
        message: (
          <>
            This deletes <strong>{lead.name}</strong> and all notes and history. This cannot be undone. Consider archiving instead.
          </>
        ),
        confirmLabel: 'Delete permanently',
        danger: true,
      }))
    )
      return
    try {
      await api.delete(`/leads/${lead.id}`)
      toast.success('Lead deleted')
      navigate('/leads')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const cleanPhone = lead.phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${lead.name}, thank you for reaching out to Chazon Digital Ventures regarding your enquiry (${lead.reference || 'Ref: ' + lead.id.slice(0, 8)}).`)}`
  const websiteHref =
    lead.website &&
    (/^https?:\/\//.test(lead.website)
      ? lead.website
      : lead.website.startsWith('@')
        ? `https://instagram.com/${lead.website.slice(1)}`
        : `https://${lead.website}`)

  const dynamic = lead.dynamicAnswers
  const audit = lead.auditData

  return (
    <>
      <PageHeader
        title={lead.name}
        back={<BackLink />}
        description={
          <>
            <strong>{lead.businessName}</strong>
            {lead.reference && (
              <span className="mono" style={{ marginLeft: 8 }}>
                Ref: {lead.reference}
              </span>
            )}
            {' · '}received {formatDate(lead.createdAt, true)} {lead.archivedAt && <Badge label="Archived" tone="grey" />}
          </>
        }
        actions={
          <>
            <label className="status-select">
              <span className="visually-hidden">Status</span>
              <select
                value={lead.status}
                onChange={e => update({ status: e.target.value as LeadStatus }, `Status set to ${LEAD_STATUS_LABELS[e.target.value as LeadStatus]}`)}
                className={`tone-${lead.status}`}
              >
                {LEAD_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn" onClick={() => setEditing(true)}>
              <Pencil size={15} aria-hidden="true" />
              Edit
            </button>
            <button className="btn" onClick={archive}>
              {lead.archivedAt ? (
                <>
                  <ArchiveRestore size={15} aria-hidden="true" />
                  Restore
                </>
              ) : (
                <>
                  <Archive size={15} aria-hidden="true" />
                  Archive
                </>
              )}
            </button>
            {user?.role === 'ADMIN' && (
              <button className="btn ghost danger-text" onClick={remove}>
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </button>
            )}
          </>
        }
      />

      <div className="detail-grid">
        <div className="stack">
          {/* Quick Contact & Communication Channel */}
          <Card title="Contact Channels">
            <dl className="details">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Preferred Method</dt>
                <dd>
                  <Badge
                    label={(lead.preferredContact || 'WhatsApp').toUpperCase()}
                    tone={lead.preferredContact === 'phone' ? 'blue' : lead.preferredContact === 'email' ? 'violet' : 'green'}
                  />
                </dd>
              </div>
              <div>
                <dt>Consent Confirmed</dt>
                <dd>{lead.consentToContact ? 'Yes (Opted-in)' : 'Standard'}</dd>
              </div>
            </dl>
            <div className="row-actions">
              <a className="btn" href={`mailto:${lead.email}`}>
                <Mail size={15} aria-hidden="true" />
                Email
              </a>
              <a className="btn" href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>
                <Phone size={15} aria-hidden="true" />
                Call
              </a>
              {cleanPhone.length >= 10 && (
                <a className="btn primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15} aria-hidden="true" />
                  WhatsApp Direct
                </a>
              )}
            </div>
          </Card>

          {/* Business & Revenue Profile */}
          <Card title="Business Profile">
            <dl className="details">
              <div>
                <dt>Business Name</dt>
                <dd>{lead.businessName}</dd>
              </div>
              <div>
                <dt>Stage</dt>
                <dd>{lead.businessStage || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Industry / Category</dt>
                <dd>{lead.category || '—'}</dd>
              </div>
              <div>
                <dt>Website / Digital Presence</dt>
                <dd>
                  {websiteHref ? (
                    <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                      {lead.website} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              {lead.targetAudience && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>Target Audience</dt>
                  <dd>{lead.targetAudience}</dd>
                </div>
              )}
              {lead.businessDescription && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>About The Business</dt>
                  <dd>{lead.businessDescription}</dd>
                </div>
              )}
              <div>
                <dt>Lead Source</dt>
                <dd>{lead.source}{lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}</dd>
              </div>
            </dl>
          </Card>

          {/* Dynamic Smart Enquiry Answers */}
          {dynamic && (
            <Card title="Smart Enquiry Specifics">
              {dynamic.goals && Array.isArray(dynamic.goals) && (
                <>
                  <span className="section-subhead">Selected Goals</span>
                  <div className="tag-list">
                    {dynamic.goals.map((g: string) => (
                      <span key={g} className="tag-chip accent">
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        {g.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {dynamic.build && (
                <>
                  <span className="section-subhead">Build Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>Project Scope</dt><dd>{dynamic.build.projectType || dynamic.build.isNewOrRedesign || '—'}</dd></div>
                    <div><dt>Website Type</dt><dd>{dynamic.build.websiteType || '—'}</dd></div>
                    <div><dt>Estimated Pages</dt><dd>{dynamic.build.pageCount || dynamic.build.pagesExpected || '—'}</dd></div>
                    <div><dt>Has Domain</dt><dd>{dynamic.build.hasDomain || '—'}</dd></div>
                    <div><dt>Content Ready</dt><dd>{dynamic.build.contentStatus || dynamic.build.contentReady || '—'}</dd></div>
                    <div><dt>Payment Gateway</dt><dd>{dynamic.build.needsPayment !== undefined ? (dynamic.build.needsPayment ? 'Yes' : 'No') : '—'}</dd></div>
                    <div><dt>Requested Features</dt><dd>{dynamic.build.features?.length ? dynamic.build.features.join(', ') : dynamic.build.customFeatures || 'None'}</dd></div>
                    <div><dt>Reference URL</dt><dd>{dynamic.build.referenceUrl || 'None'}</dd></div>
                  </dl>
                </>
              )}

              {dynamic.grow && (
                <>
                  <span className="section-subhead">Grow & SEO Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>Website URL</dt><dd>{dynamic.grow.websiteUrl || dynamic.grow.currentUrl || '—'}</dd></div>
                    <div><dt>Primary Goal</dt><dd>{dynamic.grow.primaryGoal || '—'}</dd></div>
                    <div><dt>Primary Focus</dt><dd>{dynamic.grow.focus || dynamic.grow.targetMarkets || dynamic.grow.targetLocations || '—'}</dd></div>
                    <div><dt>SEO Investment</dt><dd>{dynamic.grow.currentInvestment || dynamic.grow.currentlyInvests || '—'}</dd></div>
                    <div><dt>Priority Keywords</dt><dd>{dynamic.grow.targetKeywords || dynamic.grow.priorityKeywords || '—'}</dd></div>
                  </dl>
                </>
              )}

              {dynamic.convert && (
                <>
                  <span className="section-subhead">Conversion Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>Website URL</dt><dd>{dynamic.convert.websiteUrl || '—'}</dd></div>
                    <div><dt>Desired Action</dt><dd>{dynamic.convert.targetAction || dynamic.convert.desiredAction || '—'}</dd></div>
                    <div><dt>Conversion Bottleneck</dt><dd>{dynamic.convert.conversionProblem || '—'}</dd></div>
                    <div><dt>Tracking Installed</dt><dd>{dynamic.convert.trackingStatus || dynamic.convert.currentlyTracking || '—'}</dd></div>
                    <div><dt>Focal Journey</dt><dd>{dynamic.convert.journeyToImprove || dynamic.convert.targetJourney || '—'}</dd></div>
                  </dl>
                </>
              )}

              {dynamic.automate && (
                <>
                  <span className="section-subhead">Automation Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>Target Workflows</dt><dd>{dynamic.automate.automations?.length ? dynamic.automate.automations.join(', ') : dynamic.automate.processesToAutomate?.length ? dynamic.automate.processesToAutomate.join(', ') : dynamic.automate.targetProcess || '—'}</dd></div>
                    <div><dt>Current CRM / Tools</dt><dd>{dynamic.automate.currentCrm || dynamic.automate.usesCrm || '—'}</dd></div>
                    <div><dt>WhatsApp Enquiries</dt><dd>{dynamic.automate.whatsAppVolume || (dynamic.automate.receivesWhatsApp !== undefined ? (dynamic.automate.receivesWhatsApp ? 'Yes' : 'No') : '—')}</dd></div>
                    <div><dt>Auto Follow-ups</dt><dd>{(dynamic.automate.needsAutoFollowup ?? dynamic.automate.needsAutoFollowUp) ? 'Yes' : '—'}</dd></div>
                    <div><dt>Manual Workflow</dt><dd>{dynamic.automate.manualWorkflowNotes || dynamic.automate.manualWorkflowDescription || '—'}</dd></div>
                  </dl>
                </>
              )}

              {dynamic.ecommerce && (
                <>
                  <span className="section-subhead">E-Commerce Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>Has Store</dt><dd>{dynamic.ecommerce.hasStore !== undefined ? (dynamic.ecommerce.hasStore ? 'Yes' : 'No') : '—'}</dd></div>
                    <div><dt>Platform</dt><dd>{dynamic.ecommerce.platform || '—'}</dd></div>
                    <div><dt>Approx. Products</dt><dd>{dynamic.ecommerce.productCount || '—'}</dd></div>
                    <div><dt>Payment Gateway</dt><dd>{dynamic.ecommerce.needsPayment !== undefined ? (dynamic.ecommerce.needsPayment ? 'Yes' : 'No') : '—'}</dd></div>
                    <div><dt>Shipping</dt><dd>{dynamic.ecommerce.needsShipping !== undefined ? (dynamic.ecommerce.needsShipping ? 'Yes' : 'No') : '—'}</dd></div>
                  </dl>
                </>
              )}

              {dynamic.ai && (
                <>
                  <span className="section-subhead">AI Integration Requirements</span>
                  <dl className="details" style={{ marginBottom: 12 }}>
                    <div><dt>AI Capability / Use Case</dt><dd>{dynamic.ai.capability || dynamic.ai.primaryUseCase || dynamic.ai.aiCapabilities?.join(', ') || '—'}</dd></div>
                    <div><dt>Details / Custom Scope</dt><dd>{dynamic.ai.details || dynamic.ai.customAppDetails || dynamic.ai.description || '—'}</dd></div>
                    <div><dt>Chatbot Needed</dt><dd>{dynamic.ai.needsChatbot !== undefined ? (dynamic.ai.needsChatbot ? 'Yes' : 'No') : '—'}</dd></div>
                    <div><dt>Support Automation</dt><dd>{dynamic.ai.needsSupportAutomation !== undefined ? (dynamic.ai.needsSupportAutomation ? 'Yes' : 'No') : '—'}</dd></div>
                  </dl>
                </>
              )}
            </Card>
          )}

          {/* Attached Website Audit Scan */}
          {audit && (
            <Card title="Attached Website Audit">
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem' }}>
                {audit.url || audit.domain ? <>Scanned URL: <strong>{audit.url || audit.domain}</strong> · </> : null}
                {lead.auditRef ? <>Audit Ref: <span className="mono">{lead.auditRef}</span> · </> : null}
                Generated {formatDate(audit.scannedAt || lead.createdAt, true)}
              </p>
              <div className="audit-score-strip">
                <div className="audit-mini-score">
                  <strong style={{ color: 'var(--orange-text)' }}>{audit.overallScore ?? '—'}</strong>
                  <small>Overall</small>
                </div>
                <div className="audit-mini-score">
                  <strong>{audit.categories?.performance?.score ?? audit.scores?.performance ?? '—'}</strong>
                  <small>Performance</small>
                </div>
                <div className="audit-mini-score">
                  <strong>{audit.categories?.seo?.score ?? audit.scores?.seo ?? '—'}</strong>
                  <small>SEO</small>
                </div>
                <div className="audit-mini-score">
                  <strong>{audit.categories?.mobile?.score ?? audit.scores?.mobile ?? '—'}</strong>
                  <small>Mobile</small>
                </div>
                <div className="audit-mini-score">
                  <strong>{audit.categories?.conversion?.score ?? audit.scores?.conversion ?? '—'}</strong>
                  <small>Conversion</small>
                </div>
              </div>
              {audit.executiveSummary && (
                <div style={{ marginTop: 12, padding: 10, background: 'var(--surface-2)', borderRadius: 6 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{audit.executiveSummary}</p>
                </div>
              )}
            </Card>
          )}

          {/* Budget, Timeline & Project Scope */}
          <Card title="Budget & Project Scope">
            <dl className="details">
              <div>
                <dt>Primary Service</dt>
                <dd>{formatServicesList(lead)}</dd>
              </div>
              <div>
                <dt>Budget Range</dt>
                <dd>{lead.budget || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Start Timeline</dt>
                <dd>{lead.timeline || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Assigned To</dt>
                <dd>Founding Partner</dd>
              </div>
            </dl>
            <div className="message-block" style={{ marginTop: 14 }}>
              <p className="label-text">Customer Message</p>
              {lead.message ? <p className="pre">{lead.message}</p> : <p className="muted">No additional message provided.</p>}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Notes lead={lead} onChange={reload} />
          <Timeline items={lead.activities ?? []} />
        </div>
      </div>

      <Modal
        open={editing}
        onClose={async () => {
          if (
            !dirty ||
            (await confirm({
              title: 'Discard changes?',
              message: 'Your edits to this lead will be lost.',
              confirmLabel: 'Discard',
              danger: true,
            }))
          ) {
            setEditing(false)
            setDirty(false)
          }
        }}
        title="Edit lead"
      >
        <LeadForm
          lead={lead}
          onDirty={setDirty}
          onCancel={() => {
            setEditing(false)
            setDirty(false)
          }}
          onSaved={saved => {
            setData(saved)
            setEditing(false)
          }}
        />
      </Modal>
    </>
  )
}

const BackLink = () => (
  <Link to="/leads" className="back-link">
    <ArrowLeft size={15} aria-hidden="true" />
    Leads
  </Link>
)

function Notes({ lead, onChange }: { lead: Lead; onChange: () => void }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      await api.post(`/leads/${lead.id}/notes`, { body })
      setBody('')
      toast.success('Note added')
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  const remove = async (note: Note) => {
    if (
      !(await confirm({
        title: 'Delete this note?',
        message: 'This cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return
    try {
      await api.delete(`/leads/${lead.id}/notes/${note.id}`)
      toast.success('Note deleted')
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <Card title="Internal notes">
      <form onSubmit={add} className="note-form">
        <label className="visually-hidden" htmlFor="note">
          Add a note
        </label>
        <textarea
          id="note"
          rows={3}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Call summary, next step, decision maker…"
          maxLength={5000}
        />
        <button className="btn primary" disabled={busy || !body.trim()}>
          {busy ? 'Adding…' : 'Add note'}
        </button>
      </form>
      {lead.notes?.length ? (
        <ul className="notes">
          {lead.notes.map(note => (
            <li key={note.id}>
              <p className="pre">{note.body}</p>
              <footer>
                <span>
                  {note.author?.name ?? 'Former user'} · {timeAgo(note.createdAt)}
                </span>
                {(note.author?.id === user?.id || user?.role === 'ADMIN') && (
                  <button className="link danger-text" onClick={() => remove(note)}>
                    Delete
                  </button>
                )}
              </footer>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No notes yet. Notes are internal and never shared with the customer.</p>
      )}
    </Card>
  )
}

export function Timeline({ items }: { items: Activity[] }) {
  return (
    <Card title="Activity">
      {items.length ? (
        <ol className="timeline">
          {items.map(a => (
            <li key={a.id} className={`t-${a.type.toLowerCase()}`}>
              <span className="t-dot" aria-hidden="true" />
              <div>
                <p>{a.message}</p>
                <small>
                  {a.actor?.name ? `${a.actor.name} · ` : ''}
                  {formatDate(a.createdAt, true)}
                </small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">No activity yet.</p>
      )}
    </Card>
  )
}
