import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { INSIGHT_CATEGORIES, type PageMeta, type PublicCaseStudy, type PublicInsight, type PublicInsightSummary } from '@chazon/shared'
import { Markdown } from '@chazon/shared/markdown'
import { Button, Footer, Label, Navbar } from '../components/Layout'
import { config } from '../config'
import { formatDate } from '../format'
import { applySeo, mergeSeo, useSite } from '../site-data'

// Pages for content published from the Chazon Admin: the Insights listing, single articles and case studies.
// They share the homepage's navigation and footer; links back to homepage sections point at /#section.

const BRAND = 'Chazon Digital Ventures'
const withBrand = (title: string) => (title.includes('Chazon') ? title : `${title} | ${BRAND}`)

function PageShell({ children }: { children: ReactNode }) {
  return <>
    <div id="top"/>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar/>
    <main id="main" className="content-page">{children}</main>
    <Footer/>
  </>
}

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T; meta?: PageMeta } | { status: 'missing' } | { status: 'error' }

function useContent<T>(path: string) {
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      void import('../demo-site').then(({ demoContent }) => {
        const result = demoContent(path)
        setState(result ? { status: 'ready', data: result.data as T, meta: result.meta } : { status: 'missing' })
      })
      return
    }
    if (!config.apiUrl) { setState({ status: 'missing' }); return }
    fetch(`${config.apiUrl}/api/public${path}`, { signal: controller.signal })
      .then(async r => {
        if (r.status === 404) return setState({ status: 'missing' })
        if (!r.ok) throw new Error(String(r.status))
        const body = await r.json()
        setState({ status: 'ready', data: body.data, meta: body.meta })
      })
      .catch(e => { if (e.name !== 'AbortError') setState({ status: 'error' }) })
    return () => controller.abort()
  }, [path])
  return state
}

function PageState({ state, what }: { state: Load<unknown>; what: string }) {
  useEffect(() => {
    if (state.status === 'missing') applySeo({ title: `${what} not found | ${BRAND}`, noindex: true })
  }, [state.status, what])
  if (state.status === 'loading') return <div className="container page-state" role="status"><p>Loading…</p></div>
  return <div className="container page-state">
    <Label>{state.status === 'missing' ? 'Not found' : 'Unavailable'}</Label>
    <h1>{state.status === 'missing' ? `This ${what.toLowerCase()} isn’t available.` : 'This page couldn’t be loaded.'}</h1>
    <p className="lead">{state.status === 'missing' ? 'It may have been moved or unpublished.' : 'Please check your connection and try again.'}</p>
    <div className="button-row"><Button href="/" secondary>Back to the homepage</Button></div>
  </div>
}

function ClosingCta() {
  const { settings } = useSite()
  return <aside className="page-cta">
    <div className="container">
      <h2>Let’s build your next <em>digital growth engine.</em></h2>
      <div className="button-row"><Button href="/?enquiry=talk#contact">{settings.ctaTalkLabel}</Button><Button href="/?enquiry=audit#contact" secondary>{settings.ctaAuditLabel}</Button></div>
    </div>
  </aside>
}

// ---------- /insights ----------
export function InsightsIndex() {
  const { seo } = useSite()
  const params = new URLSearchParams(window.location.search)
  const page = Math.max(1, Number(params.get('page')) || 1)
  const category = INSIGHT_CATEGORIES.find(c => c === params.get('category')) ?? ''
  const state = useContent<PublicInsightSummary[]>(`/insights?pageSize=12&page=${page}${category ? `&category=${encodeURIComponent(category)}` : ''}`)
  useEffect(() => {
    const merged = mergeSeo(seo, 'insights')
    applySeo({ ...merged, title: withBrand(seo.insights?.title || 'Insights') }, { canonical: config.siteUrl ? `${config.siteUrl}/insights` : undefined })
  }, [seo])
  const link = (p: number, c = category) => `/insights${p > 1 || c ? '?' : ''}${new URLSearchParams({ ...(p > 1 ? { page: String(p) } : {}), ...(c ? { category: c } : {}) })}`
  return <PageShell>
    <section className="section page-hero">
      <div className="container">
        <Label>Insights</Label>
        <h1>Clear thinking. <span className="muted">Practical digital insight.</span></h1>
        <p className="lead">Perspectives for business owners on digital revenue, marketing, commerce and automation.</p>
        <nav className="category-filter" aria-label="Filter by category">
          <a href={link(1, '')} aria-current={!category ? 'page' : undefined}>All</a>
          {INSIGHT_CATEGORIES.map(c => <a key={c} href={link(1, c)} aria-current={category === c ? 'page' : undefined}>{c}</a>)}
        </nav>
      </div>
    </section>
    {state.status !== 'ready' ? <PageState state={state} what="Page"/> : <section className="section insights-index">
      <div className="container">
        {!state.data.length ? <p className="lead">No articles {category ? `in ${category} ` : ''}yet — new insights will appear here as they’re published.</p>
          : <ul className="insight-cards">{state.data.map(a => <li key={a.slug}>
            <a href={`/insights/${a.slug}`}>
              {a.featuredImage && <img src={a.featuredImage} alt="" loading="lazy" decoding="async"/>}
              <span className="i-cat">{a.category}</span>
              <h2>{a.title}</h2>
              {a.excerpt && <p>{a.excerpt}</p>}
              <span className="card-meta">{formatDate(a.publishedAt)}{a.authorName ? ` · ${a.authorName}` : ''}</span>
            </a>
          </li>)}</ul>}
        {state.meta && state.meta.pages > 1 && <nav className="pager" aria-label="Pagination">
          {page > 1 ? <a className="text-link" href={link(page - 1)}><ArrowLeft size={18} aria-hidden="true"/>Newer</a> : <span/>}
          <span>Page {page} of {state.meta.pages}</span>
          {page < state.meta.pages ? <a className="text-link" href={link(page + 1)}>Older <ArrowUpRight size={18} aria-hidden="true"/></a> : <span/>}
        </nav>}
      </div>
    </section>}
    <ClosingCta/>
  </PageShell>
}

// ---------- /insights/:slug ----------
export function InsightPage({ slug }: { slug: string }) {
  const { seo } = useSite()
  const state = useContent<PublicInsight>(`/insights/${encodeURIComponent(slug)}`)
  useEffect(() => {
    if (state.status !== 'ready') return
    const merged = mergeSeo(seo, 'global', state.data.seo)
    applySeo({ ...merged, title: withBrand(merged.title ?? state.data.title) })
  }, [state, seo])
  return <PageShell>
    {state.status !== 'ready' ? <PageState state={state} what="Article"/> : <article className="article">
      <header className="container article-head">
        <a className="back" href="/insights"><ArrowLeft size={16} aria-hidden="true"/>All insights</a>
        <p className="eyebrow-text">{state.data.category}{state.data.publishedAt ? ` · ${formatDate(state.data.publishedAt)}` : ''}</p>
        <h1>{state.data.title}</h1>
        {state.data.excerpt && <p className="lead">{state.data.excerpt}</p>}
        {state.data.authorName && <p className="byline">By {state.data.authorName}</p>}
      </header>
      {state.data.featuredImage && <div className="container article-figure"><img src={state.data.featuredImage} alt="" decoding="async"/></div>}
      <div className="container"><Markdown className="prose" source={state.data.content}/>
        {state.data.tags.length > 0 && <p className="article-tags">{state.data.tags.map(t => <span key={t}>#{t}</span>)}</p>}
      </div>
    </article>}
    <ClosingCta/>
  </PageShell>
}

// ---------- /work/:slug ----------
export function CaseStudyPage({ slug }: { slug: string }) {
  const { seo } = useSite()
  const state = useContent<PublicCaseStudy>(`/case-studies/${encodeURIComponent(slug)}`)
  useEffect(() => {
    if (state.status !== 'ready') return
    const merged = mergeSeo(seo, 'work', state.data.seo)
    applySeo({ ...merged, title: withBrand(state.data.seo.title ?? state.data.title) })
  }, [state, seo])
  if (state.status !== 'ready') return <PageShell><PageState state={state} what="Case study"/><ClosingCta/></PageShell>
  const c = state.data
  const story = [['The challenge', c.challenge], ['The strategy', c.strategy], ['The execution', c.execution]] as const
  return <PageShell>
    <article className="article case-study">
      <header className="container article-head">
        <a className="back" href="/#work"><ArrowLeft size={16} aria-hidden="true"/>Selected work</a>
        <p className="eyebrow-text">{c.industry ? `${c.industry} · ` : ''}Case study</p>
        <h1>{c.title}</h1>
        {c.summary && <p className="lead">{c.summary}</p>}
      </header>
      {c.coverImage && <div className="container article-figure"><img src={c.coverImage} alt="" decoding="async"/></div>}
      <div className="container cs-body">
        {story.map(([title, body]) => body && <section key={title}><h2>{title}</h2><Markdown className="prose" source={body}/></section>)}
        {c.deliverables.length > 0 && <section><h2>Deliverables</h2><ul className="cs-deliverables">{c.deliverables.map(d => <li key={d}>{d}</li>)}</ul></section>}
        <section className="cs-result"><h2>The result</h2>
          {c.result ? <Markdown className="prose" source={c.result}/> : <p>This project is ongoing. Results will be shared here once they are measured and verified.</p>}
          {c.metrics.length > 0 && <dl className="cs-metrics">{c.metrics.map(m => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>}
        </section>
        {c.images.length > 0 && <section><h2 className="visually-hidden">Gallery</h2><div className="cs-gallery">{c.images.map(src => <img key={src} src={src} alt="" loading="lazy" decoding="async"/>)}</div></section>}
      </div>
    </article>
    <ClosingCta/>
  </PageShell>
}
