import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Quote, ShieldAlert, Trash2 } from 'lucide-react'
import { api, errorMessage, fieldErrors, mediaUrl, useApi } from '../api'
import { Card, PageHeader } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { Switch, TextArea, TextInput } from '../ui/Form'
import { ImageField } from '../ui/Media'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { isEqual } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { moved } from './list-utils'

type Testimonial = { id: string; name: string; company: string | null; designation: string | null; quote: string; photoUrl: string | null; order: number; published: boolean }

export function Testimonials() {
  const { data, error, loading, reload, setData } = useApi<Testimonial[]>('/testimonials')
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const list = data ?? []

  const reorder = async (index: number, delta: number) => {
    const next = moved(list, index, delta)
    setData(next); setBusy(true)
    try { await api.post('/testimonials/reorder', { ids: next.map(t => t.id) }); toast.success('Order saved') } catch (err) { toast.error(errorMessage(err)); reload() } finally { setBusy(false) }
  }
  const toggle = async (t: Testimonial) => {
    if (!t.published && !(await confirm({ title: 'Publish this testimonial?', message: 'Only publish quotes the client has approved, in their own words.', confirmLabel: 'Publish' }))) return
    try { const saved = await api.patch<Testimonial>(`/testimonials/${t.id}`, { published: !t.published }); setData(list.map(x => (x.id === saved.id ? saved : x))); toast.success(saved.published ? 'Testimonial published' : 'Testimonial hidden') } catch (err) { toast.error(errorMessage(err)) }
  }
  const remove = async (t: Testimonial) => {
    if (!(await confirm({ title: 'Delete this testimonial?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/testimonials/${t.id}`); setData(list.filter(x => x.id !== t.id)); toast.success('Testimonial deleted') } catch (err) { toast.error(errorMessage(err)) }
  }

  return <>
    <PageHeader title="Testimonials" description="Client quotes for the website. The testimonial section stays hidden until at least one is published."
      actions={<button className="btn primary" onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true"/>Add testimonial</button>}/>
    <p className="notice"><ShieldAlert size={16} aria-hidden="true"/>Add only genuine testimonials with the client’s written approval. Never write or edit quotes on a client’s behalf.</p>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !list.length
      ? <EmptyState icon={<Quote size={22}/>} title="No testimonials yet" message="When a client approves a quote, add it here and publish it."/>
      : <Card><ul className="sortable">{list.map((t, i) => <li key={t.id} className={t.published ? '' : 'is-muted'}>
        <span className="order-btns">
          <button className="icon-btn" aria-label={`Move ${t.name} up`} disabled={busy || i === 0} onClick={() => reorder(i, -1)}><ArrowUp size={15}/></button>
          <button className="icon-btn" aria-label={`Move ${t.name} down`} disabled={busy || i === list.length - 1} onClick={() => reorder(i, 1)}><ArrowDown size={15}/></button>
        </span>
        {t.photoUrl ? <img className="avatar-img" src={mediaUrl(t.photoUrl)} alt=""/> : <span className="avatar" aria-hidden="true">{t.name[0]}</span>}
        <button type="button" className="sortable-label" onClick={() => setEditing(t)}><strong>{t.name}{t.company ? ` · ${t.company}` : ''}</strong><small className="clamp-2">“{t.quote}”</small></button>
        <button type="button" role="switch" aria-checked={t.published} aria-label={`${t.name} published`} className="switch small" onClick={() => toggle(t)}><span/></button>
        <button className="icon-btn" aria-label={`Edit testimonial from ${t.name}`} onClick={() => setEditing(t)}><Pencil size={15}/></button>
        <button className="icon-btn danger-text" aria-label={`Delete testimonial from ${t.name}`} onClick={() => remove(t)}><Trash2 size={15}/></button>
      </li>)}</ul></Card>}
    {editing && <TestimonialDialog testimonial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={saved => { setData(editing === 'new' ? [...list, saved] : list.map(x => (x.id === saved.id ? saved : x))); setEditing(null) }}/>}
  </>
}

function TestimonialDialog({ testimonial: t, onClose, onSaved }: { testimonial?: Testimonial; onClose: () => void; onSaved: (t: Testimonial) => void }) {
  const initial = { name: t?.name ?? '', company: t?.company ?? '', designation: t?.designation ?? '', quote: t?.quote ?? '', photoUrl: t?.photoUrl ?? '', published: t?.published ?? false }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const set = <K extends keyof typeof initial>(k: K) => (v: (typeof initial)[K]) => setForm(f => ({ ...f, [k]: v }))
  const close = async () => { if (isEqual(form, initial) || await confirm({ title: 'Discard changes?', message: 'Your edits will be lost.', confirmLabel: 'Discard', danger: true })) onClose() }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try { const saved = t ? await api.patch<Testimonial>(`/testimonials/${t.id}`, form) : await api.post<Testimonial>('/testimonials', form); toast.success('Testimonial saved'); onSaved(saved) } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Modal open onClose={close} title={t ? 'Edit testimonial' : 'Add testimonial'}>
    <form onSubmit={submit} className="form-grid">
      <TextInput label="Name" required value={form.name} onChange={set('name')} error={errors.name} maxLength={100}/>
      <TextInput label="Designation" value={form.designation} onChange={set('designation')} error={errors.designation} placeholder="e.g. Founder"/>
      <TextInput label="Company" className="full" value={form.company} onChange={set('company')} error={errors.company}/>
      <TextArea label="Testimonial" className="full" required value={form.quote} onChange={set('quote')} error={errors.quote} rows={5} counter={{ max: 1500 }} hint="The client’s exact, approved words."/>
      <div className="full"><ImageField label="Photo (optional)" value={form.photoUrl} onChange={set('photoUrl')} error={errors.photoUrl}/></div>
      <div className="full"><Switch checked={form.published} onChange={set('published')} label="Published" description="Confirm the client has approved this quote before publishing."/></div>
      <div className="form-actions full"><button type="button" className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
    </form>
  </Modal>
}
