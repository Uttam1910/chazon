import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS, slugify, type ContentStatus } from '@chazon/shared'
import { Markdown } from '@chazon/shared/markdown'
import { api, errorMessage, fieldErrors, mediaUrl, qs, useApi } from '../api'
import { Badge, Card, PageHeader, Pagination } from '../ui/Common'
import { ListInput, TextArea, TextInput } from '../ui/Form'
import { ImageField, MediaPicker } from '../ui/Media'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { ModeSwitch, PUBLIC_SITE, PublishCard, SeoCard } from './editorial'
import { FilterSelect, SearchBox, Toolbar } from './list'
import { formatDate, isEqual, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { useListParams } from './list-utils'

type Metric = { label: string; value: string }
type CaseStudy = {
  id: string; title: string; slug: string; industry: string | null; summary: string | null; challenge: string | null; strategy: string | null; execution: string | null
  deliverables: string[]; result: string | null; metrics: Metric[]; coverImage: string | null; images: string[]; seoTitle: string | null; metaDescription: string | null
  ogImage: string | null; status: ContentStatus; publishedAt: string | null; updatedAt: string
}

export function CaseStudies() {
  const { values, page, set } = useListParams({ q: '', status: '' })
  const { data, meta, error, loading, reload } = useApi<CaseStudy[]>(`/case-studies${qs({ ...values, page })}`)
  const navigate = useNavigate()
  return <>
    <PageHeader title="Work / Case Studies" description="Verified client stories for the website’s Work section. Publish only what the client has approved."
      actions={<Link className="btn primary" to="/case-studies/new"><Plus size={16} aria-hidden="true"/>New case study</Link>}/>
    <Toolbar>
      <SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search client, industry…"/>
      <FilterSelect label="Status" value={values.status} onChange={v => set('status', v)} options={[{ value: '', label: 'All statuses' }, ...CONTENT_STATUSES.map(s => ({ value: s, label: CONTENT_STATUS_LABELS[s] }))]}/>
    </Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !data?.length
      ? <EmptyState title={values.q || values.status ? 'No case studies match' : 'No case studies yet'} message={values.q || values.status ? 'Try a different search or filter.' : 'Until one is published, the website shows its illustrative “case study in preparation” frameworks.'} action={!values.q && !values.status && <Link className="btn" to="/case-studies/new">Write the first case study</Link>}/>
      : <div className={`table-wrap ${loading ? 'is-loading' : ''}`}><table className="table">
        <thead><tr><th>Client / project</th><th>Industry</th><th>Status</th><th>Last updated</th></tr></thead>
        <tbody>{data.map(c => <tr key={c.id} className="clickable" onClick={() => navigate(`/case-studies/${c.id}`)}>
          <td data-label="Project"><div className="with-thumb">{c.coverImage ? <img src={mediaUrl(c.coverImage)} alt=""/> : <span className="thumb-empty"/>}<span><Link to={`/case-studies/${c.id}`} onClick={e => e.stopPropagation()}><strong>{c.title}</strong></Link><small>/work/{c.slug}</small></span></div></td>
          <td data-label="Industry">{c.industry || '—'}</td>
          <td data-label="Status"><Badge value={c.status} label={CONTENT_STATUS_LABELS[c.status]}/></td>
          <td data-label="Updated">{formatDate(c.updatedAt)}</td>
        </tr>)}</tbody>
      </table></div>}
    <Pagination meta={meta} onPage={p => set('page', p)}/>
  </>
}

type FormValues = {
  title: string; slug: string; industry: string; summary: string; challenge: string; strategy: string; execution: string; deliverables: string[]; result: string
  metrics: Metric[]; coverImage: string; images: string[]; seoTitle: string; metaDescription: string; ogImage: string
}
const toForm = (c?: CaseStudy): FormValues => ({
  title: c?.title ?? '', slug: c?.slug ?? '', industry: c?.industry ?? '', summary: c?.summary ?? '', challenge: c?.challenge ?? '', strategy: c?.strategy ?? '',
  execution: c?.execution ?? '', deliverables: c?.deliverables ?? [], result: c?.result ?? '', metrics: c?.metrics ?? [], coverImage: c?.coverImage ?? '',
  images: c?.images ?? [], seoTitle: c?.seoTitle ?? '', metaDescription: c?.metaDescription ?? '', ogImage: c?.ogImage ?? '',
})

export function CaseStudyEdit() {
  const { id = 'new' } = useParams()
  return <CaseStudyEditor key={id} id={id}/>
}

function CaseStudyEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const { data: item, error, reload, setData } = useApi<CaseStudy>(isNew ? null : `/case-studies/${id}`)
  const industries = useApi<{ id: string; name: string }[]>('/industries')
  const [form, setForm] = useState(toForm())
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [gallery, setGallery] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  useEffect(() => { if (item) setForm(toForm(item)) }, [item])
  const dirty = !isEqual(form, toForm(item))
  useUnsavedChanges(dirty && !busy)
  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setForm(f => ({ ...f, [key]: value, ...(key === 'title' && !slugTouched ? { slug: slugify(String(value)) } : {}) }))

  async function save(status?: ContentStatus) {
    if (status === 'PUBLISHED' && !form.result.trim() && !form.metrics.length && !(await confirm({ title: 'Publish without a result?', message: 'This case study has no result or metrics. That’s fine for ongoing work — make sure the copy says so. Never publish results that haven’t been verified.', confirmLabel: 'Publish' }))) return
    if (status === 'ARCHIVED' && !(await confirm({ title: 'Archive this case study?', message: 'It will be removed from the website. You can publish it again later.', confirmLabel: 'Archive' }))) return
    setBusy(true); setErrors({})
    try {
      const body = { ...form, metrics: form.metrics.filter(m => m.label.trim() || m.value.trim()), ...(status ? { status } : {}) }
      const saved = isNew ? await api.post<CaseStudy>('/case-studies', body) : await api.patch<CaseStudy>(`/case-studies/${id}`, body)
      toast.success(status === 'PUBLISHED' ? 'Published to the website' : status === 'DRAFT' && item?.status === 'PUBLISHED' ? 'Unpublished — now a draft' : status === 'ARCHIVED' ? 'Case study archived' : 'Saved')
      if (isNew) navigate(`/case-studies/${saved.id}`, { replace: true }); else setData(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!item || !(await confirm({ title: 'Delete this case study?', message: 'This permanently deletes it. Consider archiving instead.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/case-studies/${item.id}`); toast.success('Case study deleted'); navigate('/case-studies') } catch (err) { toast.error(errorMessage(err)) }
  }

  const back = <Link to="/case-studies" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Case studies</Link>
  if (error) return <><PageHeader title="Case study" back={back}/><ErrorState message={error.message} onRetry={reload}/></>
  if (!isNew && !item) return <><PageHeader title="Case study" back={back}/><LoadingRows/></>
  const status = item?.status ?? 'DRAFT'

  return <>
    <PageHeader title={isNew ? 'New case study' : item!.title} back={back} actions={<>
      <ModeSwitch mode={mode} onChange={setMode}/>
      {!isNew && <button className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>}
    </>}/>
    <div className="editor-grid">
      {mode === 'preview' ? <Card className="preview-card"><CaseStudyPreview form={form}/></Card> : <div className="stack">
        <Card title="Basics">
          <div className="form-grid">
            <TextInput label="Client / project name" required value={form.title} onChange={set('title')} error={errors.title} maxLength={160}/>
            <TextInput label="Industry" value={form.industry} onChange={set('industry')} error={errors.industry} list="industry-options"/>
            <datalist id="industry-options">{industries.data?.map(i => <option key={i.id} value={i.name}/>)}</datalist>
            <TextInput label="Slug" className="full" value={form.slug} onChange={v => { setSlugTouched(true); set('slug')(v) }} error={errors.slug} hint={`Public URL: /work/${form.slug || '…'}`}/>
            <TextArea label="Short description" className="full" value={form.summary} onChange={set('summary')} error={errors.summary} rows={2} counter={{ max: 600 }} hint="Shown on the Work card."/>
          </div>
        </Card>
        <Card title="The story">
          <div className="stack">
            <p className="field-hint">Every Chazon case study answers four questions. Text supports Markdown (**bold**, lists, links).</p>
            <TextArea label="The challenge — what was the business problem?" value={form.challenge} onChange={set('challenge')} error={errors.challenge} rows={5}/>
            <TextArea label="The strategy — what did Chazon recommend?" value={form.strategy} onChange={set('strategy')} error={errors.strategy} rows={5}/>
            <TextArea label="The execution — what was implemented?" value={form.execution} onChange={set('execution')} error={errors.execution} rows={5}/>
            <ListInput label="Deliverables" values={form.deliverables} onChange={set('deliverables')} placeholder="e.g. E-commerce website" hint="Press Enter to add. Separate several with commas." max={40}/>
            <TextArea label="The result — what changed?" value={form.result} onChange={set('result')} error={errors.result} rows={5} hint="Only verified outcomes. Leave empty, or describe the project as ongoing, if results aren’t confirmed yet."/>
          </div>
        </Card>
        <Card title="Metrics" actions={<button type="button" className="btn" onClick={() => set('metrics')([...form.metrics, { label: '', value: '' }])} disabled={form.metrics.length >= 16}><Plus size={15} aria-hidden="true"/>Add metric</button>}>
          <p className="field-hint">Add metrics only when they are measured and approved by the client — e.g. “Leads generated: 1,240 in 6 months”.</p>
          {form.metrics.length ? <ul className="metric-rows">{form.metrics.map((m, i) => <li key={i}>
            <input aria-label={`Metric ${i + 1} label`} placeholder="Label (e.g. Cost per lead)" value={m.label} onChange={e => set('metrics')(form.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} maxLength={80}/>
            <input aria-label={`Metric ${i + 1} value`} placeholder="Value (e.g. −32%)" value={m.value} onChange={e => set('metrics')(form.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} maxLength={80}/>
            <button type="button" className="icon-btn" aria-label={`Remove metric ${i + 1}`} onClick={() => set('metrics')(form.metrics.filter((_, j) => j !== i))}><X size={16}/></button>
          </li>)}</ul> : <p className="muted small">No metrics added.</p>}
          {Object.keys(errors).some(k => k.startsWith('metrics')) && <p className="field-error">Each metric needs a label and a value.</p>}
        </Card>
        <Card title="Gallery" actions={<button type="button" className="btn" onClick={() => setGallery(true)} disabled={form.images.length >= 24}><Plus size={15} aria-hidden="true"/>Add image</button>}>
          {form.images.length ? <ul className="media-grid small">{form.images.map((url, i) => <li key={url + i} className="gallery-item">
            <img src={mediaUrl(url)} alt=""/>
            <button type="button" className="icon-btn" aria-label={`Remove image ${i + 1}`} onClick={() => set('images')(form.images.filter((_, j) => j !== i))}><X size={15}/></button>
          </li>)}</ul> : <p className="muted small">No gallery images.</p>}
          <MediaPicker open={gallery} onClose={() => setGallery(false)} onSelect={m => set('images')([...form.images, m.url])}/>
        </Card>
        <SeoCard values={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} errors={errors} fallbackTitle={form.title} fallbackDescription={form.summary}/>
      </div>}
      <div className="stack sticky-side">
        <PublishCard status={status} publishedAt={item?.publishedAt ?? null} isNew={isNew} busy={busy} dirty={dirty} onSave={save} publicUrl={item && PUBLIC_SITE ? `${PUBLIC_SITE}/work/${item.slug}` : undefined}/>
        <Card title="Cover image"><ImageField label="Cover" value={form.coverImage} onChange={set('coverImage')} error={errors.coverImage} hint="Shown on the Work card and at the top of the story."/></Card>
      </div>
    </div>
  </>
}

function CaseStudyPreview({ form }: { form: FormValues }) {
  const sections = [['The challenge', form.challenge], ['The strategy', form.strategy], ['The execution', form.execution]] as const
  return <article className="preview prose">
    <p className="eyebrow-text">{form.industry || 'Industry'} · Case study</p>
    <h1>{form.title || 'Untitled case study'}</h1>
    {form.summary && <p className="lead">{form.summary}</p>}
    {form.coverImage && <img src={mediaUrl(form.coverImage)} alt=""/>}
    {sections.map(([title, body]) => body.trim() && <section key={title}><h2>{title}</h2><Markdown source={body} resolveUrl={mediaUrl}/></section>)}
    {form.deliverables.length > 0 && <section><h2>Deliverables</h2><ul>{form.deliverables.map(d => <li key={d}>{d}</li>)}</ul></section>}
    <section><h2>The result</h2>{form.result.trim() ? <Markdown source={form.result} resolveUrl={mediaUrl}/> : <p className="muted">Results will be shared once verified — this project is ongoing.</p>}</section>
    {form.metrics.some(m => m.label && m.value) && <dl className="preview-metrics">{form.metrics.filter(m => m.label && m.value).map((m, i) => <div key={i}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>}
    {form.images.length > 0 && <div className="preview-gallery">{form.images.map((u, i) => <img key={i} src={mediaUrl(u)} alt=""/>)}</div>}
  </article>
}
