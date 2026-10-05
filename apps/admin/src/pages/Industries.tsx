import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { slugify } from '@chazon/shared'
import { api, errorMessage, fieldErrors, useApi } from '../api'
import { Card, PageHeader } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { Switch, TextArea, TextInput } from '../ui/Form'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { isEqual } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { moved } from './list-utils'

type Industry = { id: string; name: string; slug: string; description: string | null; order: number; published: boolean }

export function Industries() {
  const { data, error, loading, reload, setData } = useApi<Industry[]>('/industries')
  const [editing, setEditing] = useState<Industry | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const list = data ?? []

  const reorder = async (index: number, delta: number) => {
    const next = moved(list, index, delta)
    setData(next)
    setBusy(true)
    try { await api.post('/industries/reorder', { ids: next.map(i => i.id) }); toast.success('Order saved') } catch (err) { toast.error(errorMessage(err)); reload() } finally { setBusy(false) }
  }
  const toggle = async (industry: Industry) => {
    try { const saved = await api.patch<Industry>(`/industries/${industry.id}`, { published: !industry.published }); setData(list.map(i => (i.id === saved.id ? saved : i))); toast.success(saved.published ? `${saved.name} is shown on the website` : `${saved.name} hidden from the website`) } catch (err) { toast.error(errorMessage(err)) }
  }
  const remove = async (industry: Industry) => {
    if (!(await confirm({ title: `Delete “${industry.name}”?`, message: 'It will be removed from the website and the enquiry form’s category list. To hide it temporarily, unpublish it instead.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/industries/${industry.id}`); setData(list.filter(i => i.id !== industry.id)); toast.success('Industry deleted') } catch (err) { toast.error(errorMessage(err)) }
  }

  return <>
    <PageHeader title="Industries" description="The industries shown on the website and offered as business categories in the enquiry form."
      actions={<button className="btn primary" onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true"/>Add industry</button>}/>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !list.length
      ? <EmptyState title="No industries yet" message="Run the baseline seed (npm run db:seed) to load Chazon’s current industries, or add them here."/>
      : <Card><ul className="sortable">{list.map((industry, i) => <li key={industry.id} className={industry.published ? '' : 'is-muted'}>
        <span className="order-btns">
          <button className="icon-btn" aria-label={`Move ${industry.name} up`} disabled={busy || i === 0} onClick={() => reorder(i, -1)}><ArrowUp size={15}/></button>
          <button className="icon-btn" aria-label={`Move ${industry.name} down`} disabled={busy || i === list.length - 1} onClick={() => reorder(i, 1)}><ArrowDown size={15}/></button>
        </span>
        <button type="button" className="sortable-label" onClick={() => setEditing(industry)}><strong>{industry.name}</strong>{industry.description && <small>{industry.description}</small>}</button>
        <button type="button" role="switch" aria-checked={industry.published} aria-label={`${industry.name} published`} className="switch small" onClick={() => toggle(industry)}><span/></button>
        <button className="icon-btn" aria-label={`Edit ${industry.name}`} onClick={() => setEditing(industry)}><Pencil size={15}/></button>
        <button className="icon-btn danger-text" aria-label={`Delete ${industry.name}`} onClick={() => remove(industry)}><Trash2 size={15}/></button>
      </li>)}</ul></Card>}
    {editing && <IndustryDialog industry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={saved => { setData(editing === 'new' ? [...list, saved] : list.map(i => (i.id === saved.id ? saved : i))); setEditing(null) }}/>}
  </>
}

function IndustryDialog({ industry, onClose, onSaved }: { industry?: Industry; onClose: () => void; onSaved: (i: Industry) => void }) {
  const initial = { name: industry?.name ?? '', slug: industry?.slug ?? '', description: industry?.description ?? '', published: industry?.published ?? true }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const close = async () => { if (isEqual(form, initial) || await confirm({ title: 'Discard changes?', message: 'Your edits will be lost.', confirmLabel: 'Discard', danger: true })) onClose() }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try { const saved = industry ? await api.patch<Industry>(`/industries/${industry.id}`, form) : await api.post<Industry>('/industries', form); toast.success(industry ? 'Industry saved' : 'Industry added'); onSaved(saved) } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Modal open onClose={close} title={industry ? 'Edit industry' : 'Add industry'}>
    <form onSubmit={submit} className="stack">
      <TextInput label="Name" required value={form.name} onChange={v => setForm(f => ({ ...f, name: v, ...(!industry ? { slug: slugify(v) } : {}) }))} error={errors.name} maxLength={100}/>
      <TextInput label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} error={errors.slug}/>
      <TextArea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} error={errors.description} rows={3} counter={{ max: 500 }} hint="How Chazon helps businesses in this industry. Avoid claims you can’t support."/>
      <Switch checked={form.published} onChange={v => setForm(f => ({ ...f, published: v }))} label="Published" description="Shown on the website and in the enquiry form."/>
      <div className="form-actions"><button type="button" className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
    </form>
  </Modal>
}
