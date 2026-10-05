import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { AUDIT_STATUSES, AUDIT_STATUS_LABELS, type AuditStatus } from '@chazon/shared'
import { api, errorMessage, fieldErrors, qs, useApi } from '../api'
import { Badge, Card, PageHeader, Pagination } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { TextArea, TextInput } from '../ui/Form'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { Timeline } from './Leads'
import { FilterSelect, SearchBox, Toolbar } from './list'
import { useAuth } from '../auth-context'
import { formatDate, isEqual, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { useListParams } from './list-utils'

type Audit = {
  id: string; name: string; businessName: string; email: string; phone: string; website: string | null; category: string | null; requirements: string | null
  budget: string | null; source: string; sourceDetail: string | null; status: AuditStatus; notes: string | null; archivedAt: string | null; createdAt: string
  activities?: { id: string; type: string; message: string; createdAt: string; actor: { name: string } | null }[]
}

const statusOptions = [{ value: '', label: 'All statuses' }, ...AUDIT_STATUSES.map(s => ({ value: s, label: AUDIT_STATUS_LABELS[s] }))]
const viewOptions = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }, { value: 'all', label: 'All' }]
const sortOptions = [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'business', label: 'Business A–Z' }, { value: 'status', label: 'Status' }]

export function Audits() {
  const { values, page, set } = useListParams({ q: '', status: '', view: 'active', sort: 'newest' })
  const { data, meta, error, loading, reload } = useApi<Audit[]>(`/audits${qs({ ...values, page })}`)
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const filtered = values.q || values.status || values.view !== 'active'
  return <>
    <PageHeader title="Growth Audits" description="Digital Growth Audit requests from the website."
      actions={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true"/>Add request</button>}/>
    <Toolbar>
      <SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search name, business, website…"/>
      <FilterSelect label="Status" value={values.status} onChange={v => set('status', v)} options={statusOptions}/>
      <FilterSelect label="Show" value={values.view} onChange={v => set('view', v)} options={viewOptions}/>
      <FilterSelect label="Sort" value={values.sort} onChange={v => set('sort', v)} options={sortOptions}/>
    </Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !data?.length
      ? <EmptyState title={filtered ? 'No audit requests match' : 'No audit requests yet'} message={filtered ? 'Try a different search or filter.' : 'Requests made through “Get a Digital Growth Audit” on the website will appear here.'}/>
      : <div className={`table-wrap ${loading ? 'is-loading' : ''}`}><table className="table">
        <thead><tr><th>Name</th><th>Website</th><th>Category</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>{data.map(a => <tr key={a.id} className="clickable" onClick={() => navigate(`/audits/${a.id}`)}>
          <td data-label="Name"><Link to={`/audits/${a.id}`} onClick={e => e.stopPropagation()}><strong>{a.name}</strong></Link><small>{a.businessName}</small></td>
          <td data-label="Website"><span className="truncate">{a.website || '—'}</span><small>{a.email}</small></td>
          <td data-label="Category">{a.category || '—'}</td>
          <td data-label="Status"><Badge value={a.status} label={AUDIT_STATUS_LABELS[a.status]}/>{a.archivedAt && <Badge label="Archived" tone="grey"/>}</td>
          <td data-label="Submitted">{formatDate(a.createdAt)}</td>
        </tr>)}</tbody>
      </table></div>}
    <Pagination meta={meta} onPage={p => set('page', p)}/>
    <Modal open={adding} onClose={() => setAdding(false)} title="Add audit request">
      <AuditForm onCancel={() => setAdding(false)} onSaved={a => { setAdding(false); navigate(`/audits/${a.id}`) }}/>
    </Modal>
  </>
}

type FormValues = { name: string; businessName: string; email: string; phone: string; website: string; category: string; budget: string; requirements: string }
const toForm = (a?: Audit): FormValues => ({ name: a?.name ?? '', businessName: a?.businessName ?? '', email: a?.email ?? '', phone: a?.phone ?? '', website: a?.website ?? '', category: a?.category ?? '', budget: a?.budget ?? '', requirements: a?.requirements ?? '' })

function AuditForm({ audit, onSaved, onCancel, onDirty }: { audit?: Audit; onSaved: (a: Audit) => void; onCancel: () => void; onDirty?: (d: boolean) => void }) {
  const [form, setForm] = useState(toForm(audit))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const set = (key: keyof FormValues) => (value: string) => { const next = { ...form, [key]: value }; setForm(next); onDirty?.(!isEqual(next, toForm(audit))) }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const saved = audit ? await api.patch<Audit>(`/audits/${audit.id}`, form) : await api.post<Audit>('/audits', form)
      toast.success(audit ? 'Audit request updated' : 'Audit request added'); onDirty?.(false); onSaved(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="form-grid">
    <TextInput label="Name" required value={form.name} onChange={set('name')} error={errors.name}/>
    <TextInput label="Business" required value={form.businessName} onChange={set('businessName')} error={errors.businessName}/>
    <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email}/>
    <TextInput label="Phone" type="tel" required value={form.phone} onChange={set('phone')} error={errors.phone}/>
    <TextInput label="Website" value={form.website} onChange={set('website')} error={errors.website}/>
    <TextInput label="Business category" value={form.category} onChange={set('category')} error={errors.category}/>
    <TextInput label="Monthly marketing budget" value={form.budget} onChange={set('budget')} error={errors.budget}/>
    <TextArea label="Audit requirements" className="full" value={form.requirements} onChange={set('requirements')} error={errors.requirements}/>
    <div className="form-actions full"><button type="button" className="btn" onClick={onCancel}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : audit ? 'Save changes' : 'Add request'}</button></div>
  </form>
}

export function AuditDetail() {
  const { id } = useParams()
  const { data: audit, error, reload, setData } = useApi<Audit>(`/audits/${id}`)
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notes, setNotes] = useState('')
  useEffect(() => { setNotes(audit?.notes ?? '') }, [audit?.notes])
  const notesDirty = !!audit && notes !== (audit.notes ?? '')
  useUnsavedChanges((editing && dirty) || notesDirty)

  const back = <Link to="/audits" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Growth Audits</Link>
  if (error) return <><PageHeader title="Audit request" back={back}/><ErrorState message={error.message} onRetry={reload}/></>
  if (!audit) return <><PageHeader title="Audit request" back={back}/><LoadingRows/></>

  const update = async (body: Record<string, unknown>, message: string) => {
    try { setData(await api.patch<Audit>(`/audits/${audit.id}`, body)); toast.success(message) } catch (err) { toast.error(errorMessage(err)) }
  }
  const archive = async () => {
    if (audit.archivedAt) return update({ archived: false }, 'Audit request restored')
    if (await confirm({ title: 'Archive this audit request?', message: 'It will be hidden from the main list. You can restore it at any time.', confirmLabel: 'Archive' })) update({ archived: true }, 'Audit request archived')
  }
  const remove = async () => {
    if (!(await confirm({ title: 'Delete permanently?', message: 'This deletes the audit request and its history. This cannot be undone.', confirmLabel: 'Delete permanently', danger: true }))) return
    try { await api.delete(`/audits/${audit.id}`); toast.success('Audit request deleted'); navigate('/audits') } catch (err) { toast.error(errorMessage(err)) }
  }
  const site = audit.website && (/^https?:\/\//.test(audit.website) ? audit.website : `https://${audit.website.replace(/^@/, 'instagram.com/')}`)

  return <>
    <PageHeader title={audit.name} back={back} description={<>{audit.businessName} · submitted {formatDate(audit.createdAt, true)} {audit.archivedAt && <Badge label="Archived" tone="grey"/>}</>}
      actions={<>
        <label className="status-select"><span className="visually-hidden">Status</span>
          <select value={audit.status} className={`tone-${audit.status}`} onChange={e => update({ status: e.target.value }, `Status set to ${AUDIT_STATUS_LABELS[e.target.value as AuditStatus]}`)}>
            {AUDIT_STATUSES.map(s => <option key={s} value={s}>{AUDIT_STATUS_LABELS[s]}</option>)}
          </select></label>
        <button className="btn" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden="true"/>Edit</button>
        <button className="btn" onClick={archive}>{audit.archivedAt ? <><ArchiveRestore size={15} aria-hidden="true"/>Restore</> : <><Archive size={15} aria-hidden="true"/>Archive</>}</button>
        {user?.role === 'ADMIN' && <button className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>}
      </>}/>
    <div className="detail-grid">
      <div className="stack">
        <Card title="Contact & business">
          <dl className="details">
            <div><dt>Email</dt><dd><a href={`mailto:${audit.email}`}>{audit.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:${audit.phone.replace(/[^\d+]/g, '')}`}>{audit.phone}</a></dd></div>
            <div><dt>Business</dt><dd>{audit.businessName}</dd></div>
            <div><dt>Category</dt><dd>{audit.category || '—'}</dd></div>
            <div><dt>Website</dt><dd>{site ? <a href={site} target="_blank" rel="noopener noreferrer">{audit.website} <ExternalLink size={13} aria-hidden="true"/></a> : '—'}</dd></div>
            <div><dt>Budget</dt><dd>{audit.budget || 'Not shared'}</dd></div>
          </dl>
          <div className="row-actions">
            <a className="btn" href={`mailto:${audit.email}`}><Mail size={15} aria-hidden="true"/>Email</a>
            <a className="btn" href={`tel:${audit.phone.replace(/[^\d+]/g, '')}`}><Phone size={15} aria-hidden="true"/>Call</a>
          </div>
        </Card>
        <Card title="Audit requirements">{audit.requirements ? <p className="pre">{audit.requirements}</p> : <p className="muted">No specific focus given.</p>}</Card>
      </div>
      <div className="stack">
        <Card title="Internal notes">
          <div className="stack">
            <TextArea label="Notes" value={notes} onChange={setNotes} rows={6} hint="Findings, scope, next steps. Never shared with the customer." maxLength={10000}/>
            <div className="row-actions"><button className="btn primary" disabled={!notesDirty} onClick={() => update({ notes }, 'Notes saved')}>Save notes</button>
              {notesDirty && <button className="btn ghost" onClick={() => setNotes(audit.notes ?? '')}>Discard</button>}</div>
          </div>
        </Card>
        <Timeline items={audit.activities ?? []}/>
      </div>
    </div>
    <Modal open={editing} onClose={async () => { if (!dirty || await confirm({ title: 'Discard changes?', message: 'Your edits will be lost.', confirmLabel: 'Discard', danger: true })) { setEditing(false); setDirty(false) } }} title="Edit audit request">
      <AuditForm audit={audit} onDirty={setDirty} onCancel={() => { setEditing(false); setDirty(false) }} onSaved={saved => { setData(saved); setEditing(false) }}/>
    </Modal>
  </>
}
