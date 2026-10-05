import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { PILLARS, PILLAR_INFO, slugify, type Pillar } from '@chazon/shared'
import { api, errorMessage, fieldErrors, qs, useApi } from '../api'
import { Badge, Card, PageHeader } from '../ui/Common'
import { Select, Switch, TextArea, TextInput } from '../ui/Form'
import { ImageField } from '../ui/Media'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { FilterSelect, Toolbar } from './list'
import { isEqual, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { moved, useListParams } from './list-utils'

type Service = { id: string; title: string; slug: string; pillar: Pillar; shortDescription: string | null; description: string | null; icon: string | null; imageUrl: string | null; order: number; published: boolean; archivedAt: string | null; updatedAt: string }

export function Services() {
  const { values, set } = useListParams({ view: 'active' })
  const { data, error, loading, reload, setData } = useApi<Service[]>(`/services${qs(values)}`)
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const reorder = async (pillar: Pillar, list: Service[], index: number, delta: number) => {
    const next = moved(list, index, delta)
    setData(all => (all ?? []).map(s => (s.pillar === pillar ? { ...s, order: next.findIndex(n => n.id === s.id) } : s)).sort((a, b) => PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar) || a.order - b.order))
    setBusy(true)
    try { await api.post('/services/reorder', { ids: next.map(s => s.id) }); toast.success('Order saved') } catch (err) { toast.error(errorMessage(err)); reload() } finally { setBusy(false) }
  }
  const togglePublished = async (service: Service) => {
    try {
      const saved = await api.patch<Service>(`/services/${service.id}`, { published: !service.published })
      setData(all => (all ?? []).map(s => (s.id === saved.id ? saved : s)))
      toast.success(saved.published ? `“${saved.title}” is live on the website` : `“${saved.title}” hidden from the website`)
    } catch (err) { toast.error(errorMessage(err)) }
  }

  return <>
    <PageHeader title="Services" description="The services listed under each of Chazon’s four pillars on the website. Order and visibility here are what visitors see."
      actions={<Link className="btn primary" to="/services/new"><Plus size={16} aria-hidden="true"/>New service</Link>}/>
    <Toolbar><FilterSelect label="Show" value={values.view} onChange={v => set('view', v)} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]}/></Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : <div className="pillar-grid">
      {PILLARS.map((pillar, p) => {
        const list = (data ?? []).filter(s => s.pillar === pillar)
        return <Card key={pillar} title={<><span className="pillar-num">0{p + 1} · {PILLAR_INFO[pillar].verb}</span>{PILLAR_INFO[pillar].title}</>}
          actions={values.view === 'active' && <Link className="link" to={`/services/new?pillar=${pillar}`}><Plus size={14} aria-hidden="true"/>Add</Link>}>
          {!list.length ? <EmptyState title={values.view === 'archived' ? 'No archived services' : 'No services in this pillar'} message={values.view === 'active' ? 'The website shows this pillar without a service list until you add one.' : undefined}/>
            : <ul className="sortable">{list.map((s, i) => <li key={s.id} className={s.published ? '' : 'is-muted'}>
              {values.view === 'active' && <span className="order-btns">
                <button className="icon-btn" aria-label={`Move ${s.title} up`} disabled={busy || i === 0} onClick={() => reorder(pillar, list, i, -1)}><ArrowUp size={15}/></button>
                <button className="icon-btn" aria-label={`Move ${s.title} down`} disabled={busy || i === list.length - 1} onClick={() => reorder(pillar, list, i, 1)}><ArrowDown size={15}/></button>
              </span>}
              <Link to={`/services/${s.id}`} className="sortable-label"><strong>{s.title}</strong>{s.shortDescription && <small>{s.shortDescription}</small>}</Link>
              {values.view === 'active'
                ? <button type="button" role="switch" aria-checked={s.published} aria-label={`${s.title} published`} className="switch small" onClick={() => togglePublished(s)}><span/></button>
                : <Badge label="Archived" tone="grey"/>}
              <Link to={`/services/${s.id}`} className="icon-btn" aria-label={`Edit ${s.title}`}><Pencil size={15}/></Link>
            </li>)}</ul>}
        </Card>
      })}
    </div>}
  </>
}

type FormValues = { title: string; slug: string; pillar: string; shortDescription: string; description: string; imageUrl: string; published: boolean }
const toForm = (s?: Service, pillar = ''): FormValues => ({ title: s?.title ?? '', slug: s?.slug ?? '', pillar: s?.pillar ?? pillar, shortDescription: s?.shortDescription ?? '', description: s?.description ?? '', imageUrl: s?.imageUrl ?? '', published: s?.published ?? true })

// Keyed by id so moving from /services/new to the created service starts with fresh state.
export function ServiceEdit() {
  const { id = 'new' } = useParams()
  return <ServiceEditor key={id} id={id}/>
}

function ServiceEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const { data: service, error, reload, setData } = useApi<Service>(isNew ? null : `/services/${id}`)
  const presetPillar = new URLSearchParams(window.location.search).get('pillar') ?? ''
  const [form, setForm] = useState<FormValues>(toForm(undefined, PILLARS.includes(presetPillar as Pillar) ? presetPillar : ''))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  useEffect(() => { if (service) setForm(toForm(service)) }, [service])
  const baseline = isNew ? toForm(undefined, form.pillar) : toForm(service)
  const dirty = isNew ? !!form.title || !!form.shortDescription || !!form.description : !!service && !isEqual(form, baseline)
  useUnsavedChanges(dirty && !busy)

  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setForm(f => ({ ...f, [key]: value, ...(key === 'title' && !slugTouched ? { slug: slugify(String(value)) } : {}) }))
  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const saved = isNew ? await api.post<Service>('/services', form) : await api.patch<Service>(`/services/${id}`, form)
      toast.success(isNew ? 'Service created' : 'Service saved')
      if (isNew) navigate(`/services/${saved.id}`, { replace: true }); else setData(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const archive = async () => {
    if (!service) return
    const archived = !service.archivedAt
    if (archived && !(await confirm({ title: 'Archive this service?', message: 'It will be removed from the website and from the active list. You can restore it later.', confirmLabel: 'Archive' }))) return
    try { setData(await api.patch<Service>(`/services/${service.id}`, { archived })); toast.success(archived ? 'Service archived' : 'Service restored') } catch (err) { toast.error(errorMessage(err)) }
  }
  const remove = async () => {
    if (!service || !(await confirm({ title: 'Delete this service?', message: 'This permanently removes it. Consider archiving instead.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/services/${service.id}`); toast.success('Service deleted'); navigate('/services') } catch (err) { toast.error(errorMessage(err)) }
  }

  const back = <Link to="/services" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Services</Link>
  if (error) return <><PageHeader title="Service" back={back}/><ErrorState message={error.message} onRetry={reload}/></>
  if (!isNew && !service) return <><PageHeader title="Service" back={back}/><LoadingRows/></>

  return <form onSubmit={save}>
    <PageHeader title={isNew ? 'New service' : service!.title} back={back}
      description={service?.archivedAt ? <Badge label="Archived" tone="grey"/> : undefined}
      actions={<>
        {!isNew && <button type="button" className="btn" onClick={archive}>{service?.archivedAt ? 'Restore' : 'Archive'}</button>}
        {!isNew && <button type="button" className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>}
        <button className="btn primary" disabled={busy || (!isNew && !dirty)}>{busy ? 'Saving…' : isNew ? 'Create service' : 'Save changes'}</button>
      </>}/>
    <div className="editor-grid">
      <Card>
        <div className="form-grid">
          <TextInput label="Service title" required value={form.title} onChange={set('title')} error={errors.title} maxLength={120}/>
          <Select label="Pillar" required value={form.pillar} onChange={set('pillar')} error={errors.pillar} placeholder="Choose a pillar" options={PILLARS.map(p => ({ value: p, label: `${PILLAR_INFO[p].verb} — ${PILLAR_INFO[p].title}` }))}/>
          <TextInput label="Slug" className="full" value={form.slug} onChange={v => { setSlugTouched(true); set('slug')(v) }} error={errors.slug} hint="Used in links. Lowercase letters, numbers and hyphens." pattern="[a-z0-9]+(-[a-z0-9]+)*"/>
          <TextArea label="Short description" className="full" value={form.shortDescription} onChange={set('shortDescription')} error={errors.shortDescription} rows={2} counter={{ max: 300 }} hint="One line about the outcome for the client."/>
          <TextArea label="Full description" className="full" value={form.description} onChange={set('description')} error={errors.description} rows={8} counter={{ max: 5000 }}/>
        </div>
      </Card>
      <div className="stack">
        <Card title="Visibility">
          <Switch checked={form.published} onChange={set('published')} label={form.published ? 'Published' : 'Hidden'} description="Published services appear on the website under their pillar."/>
        </Card>
        <Card title="Image (optional)"><ImageField label="Service image" value={form.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl}/></Card>
      </div>
    </div>
  </form>
}
