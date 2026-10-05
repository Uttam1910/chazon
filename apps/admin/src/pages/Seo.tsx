import { useEffect, useState, type FormEvent } from 'react'
import { SEO_PAGES, SEO_PAGE_LABELS, type SeoPage } from '@chazon/shared'
import { api, errorMessage, fieldErrors, useApi } from '../api'
import { Card, PageHeader } from '../ui/Common'
import { Switch, TextArea, TextInput } from '../ui/Form'
import { ImageField } from '../ui/Media'
import { ErrorState, LoadingRows } from '../ui/States'
import { formatDate, isEqual, useUnsavedChanges } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'

type SeoRow = { page: SeoPage; title: string | null; description: string | null; canonicalUrl: string | null; ogTitle: string | null; ogDescription: string | null; ogImage: string | null; noindex: boolean; nofollow: boolean; updatedAt: string | null }
type FormValues = Omit<Record<keyof SeoRow, string>, 'noindex' | 'nofollow' | 'page' | 'updatedAt'> & { noindex: boolean; nofollow: boolean }
const toForm = (r?: SeoRow): FormValues => ({ title: r?.title ?? '', description: r?.description ?? '', canonicalUrl: r?.canonicalUrl ?? '', ogTitle: r?.ogTitle ?? '', ogDescription: r?.ogDescription ?? '', ogImage: r?.ogImage ?? '', noindex: r?.noindex ?? false, nofollow: r?.nofollow ?? false })

const pageHelp: Record<SeoPage, string> = {
  global: 'Defaults used by any page that doesn’t set its own value (and by articles without SEO fields).',
  home: 'The homepage. Overrides the title and description built into the website.',
  insights: 'The /insights article listing. Individual articles have their own SEO fields in the editor.',
  work: 'Defaults for case study pages. Each case study can override these in its editor.',
}

export function Seo() {
  const { data, error, loading, reload, setData } = useApi<SeoRow[]>('/seo')
  const [page, setPage] = useState<SeoPage>('home')
  const [form, setForm] = useState(toForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const row = data?.find(r => r.page === page)
  useEffect(() => { setForm(toForm(row)); setErrors({}) }, [row])
  const dirty = !!data && !isEqual(form, toForm(row))
  useUnsavedChanges(dirty && !busy)
  const global = data?.find(r => r.page === 'global')
  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setForm(f => ({ ...f, [key]: value }))

  const switchPage = async (next: SeoPage) => {
    if (next === page) return
    if (dirty && !(await confirm({ title: 'Discard unsaved changes?', message: `Your changes to ${SEO_PAGE_LABELS[page]} haven’t been saved.`, confirmLabel: 'Discard', danger: true }))) return
    setPage(next)
  }
  async function save(e: FormEvent) {
    e.preventDefault()
    if (form.noindex && !row?.noindex && !(await confirm({ title: 'Hide this page from search engines?', message: '“noindex” tells Google and others not to list this page. Only use it for pages that shouldn’t appear in search.', confirmLabel: 'Yes, noindex', danger: true }))) return
    setBusy(true); setErrors({})
    try {
      const saved = await api.put<SeoRow>(`/seo/${page}`, form)
      setData(rows => (rows ?? []).map(r => (r.page === page ? saved : r)))
      toast.success(`SEO for ${SEO_PAGE_LABELS[page]} saved`)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const previewTitle = form.title || (page !== 'global' && global?.title) || 'Chazon Digital Ventures'
  const previewDesc = form.description || (page !== 'global' && global?.description) || 'No description set — search engines will choose text from the page.'

  return <>
    <PageHeader title="SEO" description="Search and social metadata for the website’s pages."/>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : <div className="seo-layout">
      <nav className="side-tabs" aria-label="Pages">
        {SEO_PAGES.map(p => <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => switchPage(p)}>
          <strong>{SEO_PAGE_LABELS[p]}</strong><small>{data?.find(r => r.page === p)?.updatedAt ? `Updated ${formatDate(data.find(r => r.page === p)!.updatedAt)}` : 'Not customised'}</small>
        </button>)}
      </nav>
      <form onSubmit={save} className="stack">
        <p className="field-hint">{pageHelp[page]}</p>
        <Card title="Search result">
          <div className="stack">
            <div className="serp" aria-label="Search result preview"><span className="serp-title">{previewTitle}</span><span className="serp-desc">{previewDesc}</span></div>
            <TextInput label="SEO title" value={form.title} onChange={set('title')} error={errors.title} counter={{ max: 120, ideal: 60 }}/>
            <TextArea label="Meta description" value={form.description} onChange={set('description')} error={errors.description} rows={3} counter={{ max: 320, ideal: 160 }}/>
            <TextInput label="Canonical URL" type="url" value={form.canonicalUrl} onChange={set('canonicalUrl')} error={errors.canonicalUrl} placeholder="https://…" hint="Leave empty to use the website’s configured address (VITE_SITE_URL)."/>
          </div>
        </Card>
        <Card title="Social sharing (Open Graph)">
          <div className="stack">
            <TextInput label="OG title" value={form.ogTitle} onChange={set('ogTitle')} error={errors.ogTitle} counter={{ max: 120, ideal: 70 }} hint="Leave empty to use the SEO title."/>
            <TextArea label="OG description" value={form.ogDescription} onChange={set('ogDescription')} error={errors.ogDescription} rows={2} counter={{ max: 320, ideal: 200 }}/>
            <ImageField label="OG image" value={form.ogImage} onChange={set('ogImage')} error={errors.ogImage} hint="1200 × 630 px recommended."/>
          </div>
        </Card>
        <Card title="Indexing">
          <div className="stack">
            <Switch checked={form.noindex} onChange={set('noindex')} label="Hide from search engines (noindex)"/>
            <Switch checked={form.nofollow} onChange={set('nofollow')} label="Don’t follow links on this page (nofollow)"/>
          </div>
        </Card>
        <div className="form-actions"><button type="button" className="btn" disabled={!dirty || busy} onClick={() => setForm(toForm(row))}>Discard</button><button className="btn primary" disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save SEO'}</button></div>
      </form>
    </div>}
  </>
}
