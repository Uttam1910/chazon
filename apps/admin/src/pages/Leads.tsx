import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink, Mail, MessageCircle, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
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
export type Lead = {
  id: string; name: string; businessName: string; email: string; phone: string; website: string | null; category: string | null; service: string | null
  budget: string | null; message: string | null; source: string; sourceDetail: string | null; status: LeadStatus; archivedAt: string | null; createdAt: string; updatedAt: string
  _count?: { notes: number }; notes?: Note[]; activities?: Activity[]
}

const statusOptions = [{ value: '', label: 'All statuses' }, ...LEAD_STATUSES.map(s => ({ value: s, label: LEAD_STATUS_LABELS[s] }))]
const viewOptions = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }, { value: 'all', label: 'All' }]
const sortOptions = [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'business', label: 'Business A–Z' }, { value: 'status', label: 'Status' }]
const serviceSuggestions = [...Object.values(PILLAR_INFO).map(p => p.title), 'Digital Growth Audit', 'Website', 'Digital Marketing', 'Performance Marketing', 'Social Media', 'E-commerce', 'Business Automation', 'Digital Revenue Strategy', 'Other']

export function Leads() {
  const { values, page, set } = useListParams({ q: '', status: '', view: 'active', sort: 'newest', service: '' })
  const { data, meta, error, loading, reload } = useApi<Lead[]>(`/leads${qs({ ...values, page })}`)
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const filtered = values.q || values.status || values.service || values.view !== 'active'
  return <>
    <PageHeader title="Leads" description="Enquiries from the website’s “Let’s Talk” form, plus leads you add manually."
      actions={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true"/>Add lead</button>}/>
    <Toolbar>
      <SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search name, business, email, phone…"/>
      <FilterSelect label="Status" value={values.status} onChange={v => set('status', v)} options={statusOptions}/>
      <FilterSelect label="Show" value={values.view} onChange={v => set('view', v)} options={viewOptions}/>
      <FilterSelect label="Sort" value={values.sort} onChange={v => set('sort', v)} options={sortOptions}/>
      {values.service && <button className="chip-filter" onClick={() => set('service', '')}>Service: {values.service} ✕</button>}
    </Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !data?.length
      ? <EmptyState title={filtered ? 'No leads match these filters' : 'No leads yet'} message={filtered ? 'Try a different search or filter.' : 'Enquiries submitted through the website will appear here automatically.'}/>
      : <div className={`table-wrap ${loading ? 'is-loading' : ''}`}><table className="table">
        <thead><tr><th>Name</th><th>Contact</th><th>Requirement</th><th>Status</th><th>Received</th></tr></thead>
        <tbody>{data.map(lead => <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="clickable">
          <td data-label="Name"><Link to={`/leads/${lead.id}`} onClick={e => e.stopPropagation()}><strong>{lead.name}</strong></Link><small>{lead.businessName}</small></td>
          <td data-label="Contact"><span className="truncate">{lead.email}</span><small>{lead.phone}</small></td>
          <td data-label="Requirement"><span>{lead.service ?? '—'}</span>{lead.budget && <small>{lead.budget}</small>}</td>
          <td data-label="Status"><Badge value={lead.status} label={LEAD_STATUS_LABELS[lead.status]}/>{lead.archivedAt && <Badge label="Archived" tone="grey"/>}</td>
          <td data-label="Received"><span>{formatDate(lead.createdAt)}</span><small>{lead.source === 'Website' ? 'Website' : lead.source}</small></td>
        </tr>)}</tbody>
      </table></div>}
    <Pagination meta={meta} onPage={p => set('page', p)}/>
    <Modal open={adding} onClose={() => setAdding(false)} title="Add lead">
      <LeadForm onCancel={() => setAdding(false)} onSaved={lead => { setAdding(false); navigate(`/leads/${lead.id}`) }}/>
    </Modal>
  </>
}

type FormValues = { name: string; businessName: string; email: string; phone: string; website: string; category: string; service: string; budget: string; message: string }
const toForm = (lead?: Lead): FormValues => ({
  name: lead?.name ?? '', businessName: lead?.businessName ?? '', email: lead?.email ?? '', phone: lead?.phone ?? '', website: lead?.website ?? '',
  category: lead?.category ?? '', service: lead?.service ?? '', budget: lead?.budget ?? '', message: lead?.message ?? '',
})

function LeadForm({ lead, onSaved, onCancel, onDirty }: { lead?: Lead; onSaved: (lead: Lead) => void; onCancel: () => void; onDirty?: (dirty: boolean) => void }) {
  const [form, setForm] = useState(toForm(lead))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const set = (key: keyof FormValues) => (value: string) => { const next = { ...form, [key]: value }; setForm(next); onDirty?.(!isEqual(next, toForm(lead))) }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const saved = lead ? await api.patch<Lead>(`/leads/${lead.id}`, form) : await api.post<Lead>('/leads', form)
      toast.success(lead ? 'Lead updated' : 'Lead added')
      onDirty?.(false)
      onSaved(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="form-grid">
    <TextInput label="Name" required value={form.name} onChange={set('name')} error={errors.name} maxLength={100}/>
    <TextInput label="Business name" required value={form.businessName} onChange={set('businessName')} error={errors.businessName} maxLength={150}/>
    <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email}/>
    <TextInput label="Phone" type="tel" required value={form.phone} onChange={set('phone')} error={errors.phone}/>
    <TextInput label="Website / Instagram" value={form.website} onChange={set('website')} error={errors.website}/>
    <TextInput label="Business category" value={form.category} onChange={set('category')} error={errors.category}/>
    <TextInput label="Requirement / service" value={form.service} onChange={set('service')} error={errors.service} list="service-suggestions"/>
    <TextInput label="Approx. monthly marketing budget" value={form.budget} onChange={set('budget')} error={errors.budget}/>
    <TextArea label="Message" className="full" value={form.message} onChange={set('message')} error={errors.message} rows={4} maxLength={3000}/>
    <datalist id="service-suggestions">{serviceSuggestions.map(s => <option key={s} value={s}/>)}</datalist>
    <div className="form-actions full">
      <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}</button>
    </div>
  </form>
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

  if (error) return <><PageHeader title="Lead" back={<BackLink/>}/><ErrorState message={error.message} onRetry={reload}/></>
  if (loading && !lead || !lead) return <><PageHeader title="Lead" back={<BackLink/>}/><LoadingRows/></>

  const update = async (body: Partial<Lead> & { archived?: boolean }, message: string) => {
    try { setData(await api.patch<Lead>(`/leads/${lead.id}`, body)); toast.success(message) } catch (err) { toast.error(errorMessage(err)) }
  }
  const archive = async () => {
    if (lead.archivedAt) return update({ archived: false }, 'Lead restored')
    if (await confirm({ title: 'Archive this lead?', message: 'Archived leads are hidden from the main list but kept with their notes. You can restore them at any time.', confirmLabel: 'Archive' })) update({ archived: true }, 'Lead archived')
  }
  const remove = async () => {
    if (!(await confirm({ title: 'Delete this lead permanently?', message: <>This deletes <strong>{lead.name}</strong> and all notes and history. This cannot be undone. Consider archiving instead.</>, confirmLabel: 'Delete permanently', danger: true }))) return
    try { await api.delete(`/leads/${lead.id}`); toast.success('Lead deleted'); navigate('/leads') } catch (err) { toast.error(errorMessage(err)) }
  }
  const whatsapp = lead.phone.replace(/\D/g, '')
  const websiteHref = lead.website && (/^https?:\/\//.test(lead.website) ? lead.website : lead.website.startsWith('@') ? `https://instagram.com/${lead.website.slice(1)}` : `https://${lead.website}`)

  return <>
    <PageHeader title={lead.name} back={<BackLink/>}
      description={<>{lead.businessName} · received {formatDate(lead.createdAt, true)} {lead.archivedAt && <Badge label="Archived" tone="grey"/>}</>}
      actions={<>
        <label className="status-select"><span className="visually-hidden">Status</span>
          <select value={lead.status} onChange={e => update({ status: e.target.value as LeadStatus }, `Status set to ${LEAD_STATUS_LABELS[e.target.value as LeadStatus]}`)} className={`tone-${lead.status}`}>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select></label>
        <button className="btn" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden="true"/>Edit</button>
        <button className="btn" onClick={archive}>{lead.archivedAt ? <><ArchiveRestore size={15} aria-hidden="true"/>Restore</> : <><Archive size={15} aria-hidden="true"/>Archive</>}</button>
        {user?.role === 'ADMIN' && <button className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>}
      </>}/>
    <div className="detail-grid">
      <div className="stack">
        <Card title="Contact">
          <dl className="details">
            <div><dt>Email</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a></dd></div>
          </dl>
          <div className="row-actions">
            <a className="btn" href={`mailto:${lead.email}`}><Mail size={15} aria-hidden="true"/>Email</a>
            <a className="btn" href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}><Phone size={15} aria-hidden="true"/>Call</a>
            {whatsapp.length >= 10 && <a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} aria-hidden="true"/>WhatsApp</a>}
          </div>
        </Card>
        <Card title="Business">
          <dl className="details">
            <div><dt>Business</dt><dd>{lead.businessName}</dd></div>
            <div><dt>Category</dt><dd>{lead.category || '—'}</dd></div>
            <div><dt>Website / Instagram</dt><dd>{websiteHref ? <a href={websiteHref} target="_blank" rel="noopener noreferrer">{lead.website} <ExternalLink size={13} aria-hidden="true"/></a> : '—'}</dd></div>
            <div><dt>Source</dt><dd>{lead.source}{lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}</dd></div>
          </dl>
        </Card>
        <Card title="Requirement">
          <dl className="details">
            <div><dt>Service</dt><dd>{lead.service || '—'}</dd></div>
            <div><dt>Monthly marketing budget</dt><dd>{lead.budget || 'Not shared'}</dd></div>
          </dl>
          <div className="message-block"><p className="label-text">Message</p>{lead.message ? <p className="pre">{lead.message}</p> : <p className="muted">No message.</p>}</div>
        </Card>
      </div>
      <div className="stack">
        <Notes lead={lead} onChange={reload}/>
        <Timeline items={lead.activities ?? []}/>
      </div>
    </div>
    <Modal open={editing} onClose={async () => { if (!dirty || await confirm({ title: 'Discard changes?', message: 'Your edits to this lead will be lost.', confirmLabel: 'Discard', danger: true })) { setEditing(false); setDirty(false) } }} title="Edit lead">
      <LeadForm lead={lead} onDirty={setDirty} onCancel={() => { setEditing(false); setDirty(false) }} onSaved={saved => { setData(saved); setEditing(false) }}/>
    </Modal>
  </>
}

const BackLink = () => <Link to="/leads" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Leads</Link>

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
    try { await api.post(`/leads/${lead.id}/notes`, { body }); setBody(''); toast.success('Note added'); onChange() } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const remove = async (note: Note) => {
    if (!(await confirm({ title: 'Delete this note?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/leads/${lead.id}/notes/${note.id}`); toast.success('Note deleted'); onChange() } catch (err) { toast.error(errorMessage(err)) }
  }
  return <Card title="Internal notes">
    <form onSubmit={add} className="note-form">
      <label className="visually-hidden" htmlFor="note">Add a note</label>
      <textarea id="note" rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="Call summary, next step, decision maker…" maxLength={5000}/>
      <button className="btn primary" disabled={busy || !body.trim()}>{busy ? 'Adding…' : 'Add note'}</button>
    </form>
    {lead.notes?.length ? <ul className="notes">{lead.notes.map(note => <li key={note.id}>
      <p className="pre">{note.body}</p>
      <footer><span>{note.author?.name ?? 'Former user'} · {timeAgo(note.createdAt)}</span>
        {(note.author?.id === user?.id || user?.role === 'ADMIN') && <button className="link danger-text" onClick={() => remove(note)}>Delete</button>}</footer>
    </li>)}</ul> : <p className="muted small">No notes yet. Notes are internal and never shared with the customer.</p>}
  </Card>
}

export function Timeline({ items }: { items: Activity[] }) {
  return <Card title="Activity">
    {items.length ? <ol className="timeline">{items.map(a => <li key={a.id} className={`t-${a.type.toLowerCase()}`}>
      <span className="t-dot" aria-hidden="true"/>
      <div><p>{a.message}</p><small>{a.actor?.name ? `${a.actor.name} · ` : ''}{formatDate(a.createdAt, true)}</small></div>
    </li>)}</ol> : <p className="muted small">No activity yet.</p>}
  </Card>
}
