import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS, INSIGHT_CATEGORIES, slugify, type ContentStatus } from '@chazon/shared'
import { Markdown, markdownToText } from '@chazon/shared/markdown'
import { api, errorMessage, fieldErrors, mediaUrl, qs, useApi } from '../api'
import { Badge, Card, PageHeader, Pagination } from '../ui/Common'
import { ListInput, Select, TextArea, TextInput } from '../ui/Form'
import { ImageField } from '../ui/Media'
import { MarkdownEditor } from '../ui/MarkdownEditor'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { ModeSwitch, PUBLIC_SITE, PublishCard, SeoCard } from './editorial'
import { FilterSelect, SearchBox, Toolbar } from './list'
import { useAuth } from '../auth-context'
import { formatDate, isEqual, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'
import { useListParams } from './list-utils'

type Insight = {
  id: string; title: string; slug: string; excerpt: string | null; content: string; featuredImage: string | null; category: string; authorName: string | null
  tags: string[]; seoTitle: string | null; metaDescription: string | null; ogImage: string | null; status: ContentStatus; publishedAt: string | null; updatedAt: string
}

export function Insights() {
  const { values, page, set } = useListParams({ q: '', status: '', category: '' })
  const { data, meta, error, loading, reload } = useApi<Insight[]>(`/insights${qs({ ...values, page })}`)
  const navigate = useNavigate()
  const filtered = values.q || values.status || values.category
  return <>
    <PageHeader title="Insights" description="Articles for the website’s Insights section. Published articles appear on the homepage and at /insights."
      actions={<Link className="btn primary" to="/insights/new"><Plus size={16} aria-hidden="true"/>New article</Link>}/>
    <Toolbar>
      <SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search titles, excerpts, tags…"/>
      <FilterSelect label="Status" value={values.status} onChange={v => set('status', v)} options={[{ value: '', label: 'All statuses' }, ...CONTENT_STATUSES.map(s => ({ value: s, label: CONTENT_STATUS_LABELS[s] }))]}/>
      <FilterSelect label="Category" value={values.category} onChange={v => set('category', v)} options={[{ value: '', label: 'All categories' }, ...INSIGHT_CATEGORIES.map(c => ({ value: c, label: c }))]}/>
    </Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !data?.length
      ? <EmptyState title={filtered ? 'No articles match' : 'No articles yet'} message={filtered ? 'Try a different search or filter.' : 'Until an article is published, the website shows its “in preparation” topics.'} action={!filtered && <Link className="btn" to="/insights/new">Write the first article</Link>}/>
      : <div className={`table-wrap ${loading ? 'is-loading' : ''}`}><table className="table">
        <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th><th>Updated</th></tr></thead>
        <tbody>{data.map(i => <tr key={i.id} className="clickable" onClick={() => navigate(`/insights/${i.id}`)}>
          <td data-label="Title"><div className="with-thumb">{i.featuredImage ? <img src={mediaUrl(i.featuredImage)} alt=""/> : <span className="thumb-empty"/>}<span><Link to={`/insights/${i.id}`} onClick={e => e.stopPropagation()}><strong>{i.title}</strong></Link><small>{i.authorName ?? '—'}</small></span></div></td>
          <td data-label="Category">{i.category}</td>
          <td data-label="Status"><Badge value={i.status} label={i.status === 'PUBLISHED' && i.publishedAt && new Date(i.publishedAt) > new Date() ? 'Scheduled' : CONTENT_STATUS_LABELS[i.status]}/></td>
          <td data-label="Published">{i.status === 'PUBLISHED' ? formatDate(i.publishedAt) : '—'}</td>
          <td data-label="Updated">{formatDate(i.updatedAt)}</td>
        </tr>)}</tbody>
      </table></div>}
    <Pagination meta={meta} onPage={p => set('page', p)}/>
  </>
}

type FormValues = { title: string; slug: string; excerpt: string; content: string; featuredImage: string; category: string; authorName: string; tags: string[]; seoTitle: string; metaDescription: string; ogImage: string; publishedAt: string }
const localDate = (iso: string | null | undefined) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
const toForm = (i?: Insight, author = ''): FormValues => ({
  title: i?.title ?? '', slug: i?.slug ?? '', excerpt: i?.excerpt ?? '', content: i?.content ?? '', featuredImage: i?.featuredImage ?? '', category: i?.category ?? '',
  authorName: i?.authorName ?? author, tags: i?.tags ?? [], seoTitle: i?.seoTitle ?? '', metaDescription: i?.metaDescription ?? '', ogImage: i?.ogImage ?? '', publishedAt: localDate(i?.publishedAt),
})

export function InsightEdit() {
  const { id = 'new' } = useParams()
  return <InsightEditor key={id} id={id}/>
}

function InsightEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const { user } = useAuth()
  const { data: item, error, reload, setData } = useApi<Insight>(isNew ? null : `/insights/${id}`)
  const [form, setForm] = useState(toForm(undefined, user?.name))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  useEffect(() => { if (item) setForm(toForm(item)) }, [item])
  const dirty = !isEqual(form, toForm(item, isNew ? user?.name : undefined))
  useUnsavedChanges(dirty && !busy)
  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setForm(f => ({ ...f, [key]: value, ...(key === 'title' && !slugTouched ? { slug: slugify(String(value)) } : {}) }))

  async function save(status?: ContentStatus) {
    if (status === 'PUBLISHED' && !form.content.trim()) { setErrors({ content: 'Write the article before publishing' }); toast.error('Add some content before publishing.'); return }
    if (status === 'ARCHIVED' && !(await confirm({ title: 'Archive this article?', message: 'It will be removed from the website. You can publish it again later.', confirmLabel: 'Archive' }))) return
    setBusy(true); setErrors({})
    try {
      // Always send the status so an empty publish date on a published article means "now", not "unpublished".
      const body = { ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null, status: status ?? item?.status ?? 'DRAFT' }
      const saved = isNew ? await api.post<Insight>('/insights', body) : await api.patch<Insight>(`/insights/${id}`, body)
      toast.success(status === 'PUBLISHED' ? (saved.publishedAt && new Date(saved.publishedAt) > new Date() ? `Scheduled for ${formatDate(saved.publishedAt, true)}` : 'Published to the website') : status === 'DRAFT' && item?.status === 'PUBLISHED' ? 'Unpublished — now a draft' : status === 'ARCHIVED' ? 'Article archived' : 'Saved')
      if (isNew) navigate(`/insights/${saved.id}`, { replace: true }); else setData(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!item || !(await confirm({ title: 'Delete this article?', message: 'This permanently deletes it. Consider archiving instead.', confirmLabel: 'Delete', danger: true }))) return
    try { await api.delete(`/insights/${item.id}`); toast.success('Article deleted'); navigate('/insights') } catch (err) { toast.error(errorMessage(err)) }
  }

  const back = <Link to="/insights" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Insights</Link>
  if (error) return <><PageHeader title="Article" back={back}/><ErrorState message={error.message} onRetry={reload}/></>
  if (!isNew && !item) return <><PageHeader title="Article" back={back}/><LoadingRows/></>
  const words = markdownToText(form.content).split(/\s+/).filter(Boolean).length

  return <>
    <PageHeader title={isNew ? 'New article' : item!.title} back={back} actions={<>
      <ModeSwitch mode={mode} onChange={setMode}/>
      {!isNew && <button className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>}
    </>}/>
    <div className="editor-grid">
      {mode === 'preview' ? <Card className="preview-card"><article className="preview prose">
        <p className="eyebrow-text">{form.category || 'Category'}{form.publishedAt ? ` · ${formatDate(form.publishedAt)}` : ''}</p>
        <h1>{form.title || 'Untitled article'}</h1>
        {form.excerpt && <p className="lead">{form.excerpt}</p>}
        {form.authorName && <p className="byline">By {form.authorName}</p>}
        {form.featuredImage && <img src={mediaUrl(form.featuredImage)} alt=""/>}
        {form.content.trim() ? <Markdown source={form.content} resolveUrl={mediaUrl}/> : <p className="muted">No content yet.</p>}
        {form.tags.length > 0 && <p className="tags">{form.tags.map(t => <span key={t}>#{t}</span>)}</p>}
      </article></Card> : <div className="stack">
        <Card>
          <div className="form-grid">
            <TextInput label="Title" className="full" required value={form.title} onChange={set('title')} error={errors.title} maxLength={200}/>
            <TextInput label="Slug" className="full" value={form.slug} onChange={v => { setSlugTouched(true); set('slug')(v) }} error={errors.slug} hint={`Public URL: /insights/${form.slug || '…'}`}/>
            <TextArea label="Excerpt" className="full" value={form.excerpt} onChange={set('excerpt')} error={errors.excerpt} rows={2} counter={{ max: 500, ideal: 200 }} hint="One or two sentences shown in listings."/>
          </div>
        </Card>
        <Card><MarkdownEditor label={`Content · ${words} words`} value={form.content} onChange={set('content')} error={errors.content}/></Card>
        <SeoCard values={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} errors={errors} fallbackTitle={form.title} fallbackDescription={form.excerpt}/>
      </div>}
      <div className="stack sticky-side">
        <PublishCard status={item?.status ?? 'DRAFT'} publishedAt={item?.publishedAt ?? null} isNew={isNew} busy={busy} dirty={dirty} onSave={save} publicUrl={item && PUBLIC_SITE ? `${PUBLIC_SITE}/insights/${item.slug}` : undefined}>
          <TextInput label="Publish date" type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} error={errors.publishedAt} hint="Leave empty to use the moment you publish. A future date schedules the article."/>
        </PublishCard>
        <Card title="Details">
          <div className="stack">
            <Select label="Category" required value={form.category} onChange={set('category')} error={errors.category} placeholder="Choose a category" options={INSIGHT_CATEGORIES}/>
            <TextInput label="Author" value={form.authorName} onChange={set('authorName')} error={errors.authorName} maxLength={120}/>
            <ListInput label="Tags" values={form.tags} onChange={set('tags')} placeholder="Add a tag" max={15}/>
            <ImageField label="Featured image" value={form.featuredImage} onChange={set('featuredImage')} error={errors.featuredImage}/>
          </div>
        </Card>
      </div>
    </div>
  </>
}
