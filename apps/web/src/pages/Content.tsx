import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { INSIGHT_CATEGORIES, type PageMeta, type PublicCaseStudy, type PublicCaseStudySummary, type PublicInsight, type PublicInsightSummary } from '@chazon/shared'
import { Markdown } from '@chazon/shared/markdown'
import { config, demoMode } from '../config'
import { formatDate } from '../format'
import { useRouter } from '../location'
import { Link } from '../router'
import { absoluteUrl, BRAND, breadcrumbSchema, type Meta, usePageMeta, withAdminSeo, withBrand } from '../seo'
import { useSite } from '../site-data'
import { PageShell } from '../components/Layout'
import { FinalCta } from '../components/Sections'
import { Breadcrumbs, Cta, Eyebrow, PageHero } from '../components/ui'

// Pages for content published from the Chazon Admin: Insights (listing and articles) and Work (listing and case
// studies). Nothing here is shown until it has been written and published in the Admin.

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T; meta?: PageMeta } | { status: 'missing' } | { status: 'error' }

function useContent<T>(path: string) {
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    if (demoMode) {
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

/** Loading, not-found and error states. A missing item is never indexed. */
function PageState({ state, what, back }: { state: Load<unknown>; what: string; back: [string, string] }) {
  if (state.status === 'loading') return <div className="container page-state" role="status"><p>Loading…</p></div>
  return <div className="container page-state">
    <h1>{state.status === 'missing' ? `This ${what.toLowerCase()} isn’t available.` : 'This page couldn’t be loaded.'}</h1>
    <p className="lead">{state.status === 'missing' ? 'It may have been moved or unpublished.' : 'Please check your connection and try again.'}</p>
    <div className="button-row"><Cta to={back[1]} variant="secondary" location="content_state">{back[0]}</Cta></div>
  </div>
}
const stateMeta = (state: Load<unknown>, what: string): Meta => ({
  title: state.status === 'missing' ? `${what} not found | ${BRAND}` : state.status === 'error' ? `Page unavailable | ${BRAND}` : `Loading… | ${BRAND}`,
  noindex: state.status !== 'loading',
})

// ---------- /insights ----------
export function InsightsIndex() {
  const { seo, live } = useSite()
  const { search } = useRouter()
  const params = new URLSearchParams(search)
  const page = Math.max(1, Number(params.get('page')) || 1)
  const category = INSIGHT_CATEGORIES.find(c => c === params.get('category')) ?? ''
  const state = useContent<PublicInsightSummary[]>(`/insights?pageSize=12&page=${page}${category ? `&category=${encodeURIComponent(category)}` : ''}`)
  const empty = state.status === 'ready' && !state.data.length
  // Filtered and paginated views point their canonical at the main listing; an empty listing is not indexed.
  usePageMeta(withAdminSeo({
    title: 'Insights: Digital Revenue, Marketing & Automation | Chazon',
    description: 'Practical perspectives for business owners on digital revenue, performance marketing, digital commerce and automation from Chazon Digital Ventures.',
    path: '/insights', noindex: empty || state.status === 'missing',
    schema: breadcrumbSchema([['Insights', '/insights']]),
  }, live ? seo.insights : undefined))
  const link = (p: number, c = category) => {
    const q = new URLSearchParams({ ...(p > 1 ? { page: String(p) } : {}), ...(c ? { category: c } : {}) }).toString()
    return `/insights${q ? `?${q}` : ''}`
  }
  return <PageShell>
    <PageHero trail={[['Insights', '/insights']]} eyebrow="Insights" title={<>Clear thinking. <em>Practical digital insight.</em></>}
      intro="Perspectives for business owners on digital revenue, marketing, commerce and automation.">
      <nav className="category-filter" aria-label="Filter by category">
        <Link to={link(1, '')} aria-current={!category ? 'page' : undefined}>All</Link>
        {INSIGHT_CATEGORIES.map(c => <Link key={c} to={link(1, c)} aria-current={category === c ? 'page' : undefined}>{c}</Link>)}
      </nav>
    </PageHero>
    {state.status !== 'ready' ? <PageState state={state} what="Page" back={['Back to the homepage', '/']}/> : <section className="section">
      <div className="container">
        {!state.data.length ? <p className="lead">No articles {category ? `in ${category} ` : ''}have been published yet.</p>
          : <ul className="card-grid">{state.data.map(a => <li key={a.slug}><Link to={`/insights/${a.slug}`} className="content-card">
            {a.featuredImage && <img src={a.featuredImage} alt="" loading="lazy" decoding="async"/>}
            <span className="mono">{a.category}</span>
            <h2>{a.title}</h2>
            {a.excerpt && <p>{a.excerpt}</p>}
            <span className="content-card-more">{formatDate(a.publishedAt)}{a.authorName ? ` · ${a.authorName}` : ''}</span>
          </Link></li>)}</ul>}
        {state.meta && state.meta.pages > 1 && <nav className="pager" aria-label="Pagination">
          {page > 1 ? <Link className="text-link" to={link(page - 1)}><ArrowLeft size={17} aria-hidden="true"/>Newer</Link> : <span/>}
          <span className="mono">Page {page} of {state.meta.pages}</span>
          {page < state.meta.pages ? <Link className="text-link" to={link(page + 1)}>Older<ArrowRight size={17} aria-hidden="true"/></Link> : <span/>}
        </nav>}
      </div>
    </section>}
    <FinalCta/>
  </PageShell>
}

// ---------- /insights/:slug ----------
export function InsightPage({ slug }: { slug: string }) {
  const { seo, live } = useSite()
  const state = useContent<PublicInsight>(`/insights/${encodeURIComponent(slug)}`)
  const path = `/insights/${slug}`
  const a = state.status === 'ready' ? state.data : null
  usePageMeta(a ? withAdminSeo({
    title: withBrand(a.title), description: a.excerpt, path, ogType: 'article',
    schema: config.siteUrl ? [{
      '@context': 'https://schema.org', '@type': 'Article', headline: a.title, ...(a.excerpt ? { description: a.excerpt } : {}),
      ...(a.publishedAt ? { datePublished: a.publishedAt } : {}), ...(a.featuredImage ? { image: a.featuredImage } : {}),
      author: a.authorName ? { '@type': 'Person', name: a.authorName } : { '@type': 'Organization', name: BRAND },
      publisher: { '@type': 'Organization', name: BRAND, '@id': absoluteUrl('/#organization') }, mainEntityOfPage: absoluteUrl(path),
    }, ...breadcrumbSchema([['Insights', '/insights'], [a.title, path]])] : [],
  }, live ? { noindex: seo.global?.noindex, nofollow: seo.global?.nofollow } : undefined, a.seo) : stateMeta(state, 'Article'))
  return <PageShell>
    {!a ? <PageState state={state} what="Article" back={['All insights', '/insights']}/> : <article className="article">
      <header className="article-head surface-ink">
        <div className="container">
          <Breadcrumbs trail={[['Insights', '/insights'], [a.title, path]]}/>
          <Eyebrow>{a.category}{a.publishedAt ? ` · ${formatDate(a.publishedAt)}` : ''}</Eyebrow>
          <h1>{a.title}</h1>
          {a.excerpt && <p className="lead">{a.excerpt}</p>}
          {a.authorName && <p className="byline mono">By {a.authorName}</p>}
        </div>
      </header>
      {a.featuredImage && <div className="container article-figure"><img src={a.featuredImage} alt="" decoding="async"/></div>}
      <div className="container article-body">
        <Markdown className="prose" source={a.content}/>
        {a.tags.length > 0 && <p className="article-tags">{a.tags.map(t => <span key={t}>#{t}</span>)}</p>}
        <Link className="text-link" to="/insights"><ArrowLeft size={17} aria-hidden="true"/>All insights</Link>
      </div>
    </article>}
    <FinalCta/>
  </PageShell>
}

// ---------- /work ----------
export function WorkIndex() {
  const { seo, live } = useSite()
  const state = useContent<PublicCaseStudySummary[]>('/case-studies')
  const empty = state.status === 'ready' && !state.data.length
  usePageMeta(withAdminSeo({
    title: 'Work: Client Case Studies | Chazon Digital Ventures',
    description: 'Case studies from Chazon Digital Ventures: the business challenge, the strategy, what was implemented and what changed.',
    path: '/work', noindex: empty || state.status === 'missing',
    schema: breadcrumbSchema([['Work', '/work']]),
  }, live ? seo.work : undefined))
  return <PageShell>
    <PageHero trail={[['Work', '/work']]} eyebrow="Selected work" title={<>Business challenges. <em>Connected solutions.</em></>}
      intro="Every case study answers four questions: what was the business problem, what did we recommend, what was implemented, and what changed."/>
    {state.status !== 'ready' ? <PageState state={state} what="Page" back={['Back to the homepage', '/']}/> : <section className="section">
      <div className="container">
        {!state.data.length ? <p className="lead">Case studies will appear here once client work is approved for publication.</p>
          : <ul className="card-grid">{state.data.map(c => <li key={c.slug}><Link to={`/work/${c.slug}`} className="content-card">
            {c.coverImage && <img src={c.coverImage} alt="" loading="lazy" decoding="async"/>}
            <span className="mono">{c.industry || 'Case study'}</span>
            <h2>{c.title}</h2>
            {c.summary && <p>{c.summary}</p>}
            <span className="content-card-more">Read the case study <ArrowRight size={16} aria-hidden="true"/></span>
          </Link></li>)}</ul>}
      </div>
    </section>}
    <FinalCta/>
  </PageShell>
}

// ---------- /work/:slug ----------
export function CaseStudyPage({ slug }: { slug: string }) {
  const { seo, live } = useSite()
  const state = useContent<PublicCaseStudy>(`/case-studies/${encodeURIComponent(slug)}`)
  const path = `/work/${slug}`
  const c = state.status === 'ready' ? state.data : null
  usePageMeta(c ? withAdminSeo({
    title: withBrand(c.title), description: c.summary, path, ogType: 'article',
    schema: breadcrumbSchema([['Work', '/work'], [c.title, path]]),
  }, live ? seo.work : undefined, c.seo) : stateMeta(state, 'Case study'))
  if (!c) return <PageShell><PageState state={state} what="Case study" back={['Back to the homepage', '/']}/><FinalCta/></PageShell>
  const story = [['The challenge', c.challenge], ['The strategy', c.strategy], ['The execution', c.execution]] as const
  return <PageShell>
    <article className="article case-study">
      <header className="article-head surface-ink">
        <div className="container">
          <Breadcrumbs trail={[['Work', '/work'], [c.title, path]]}/>
          <Eyebrow>{c.industry ? `${c.industry} · ` : ''}Case study</Eyebrow>
          <h1>{c.title}</h1>
          {c.summary && <p className="lead">{c.summary}</p>}
        </div>
      </header>
      {c.coverImage && <div className="container article-figure"><img src={c.coverImage} alt="" decoding="async"/></div>}
      <div className="container article-body cs-body">
        {story.map(([title, body]) => body && <section key={title}><h2>{title}</h2><Markdown className="prose" source={body}/></section>)}
        {c.deliverables.length > 0 && <section><h2>Deliverables</h2><ul className="deliverables">{c.deliverables.map(d => <li key={d}>{d}</li>)}</ul></section>}
        <section className="cs-result"><h2>The result</h2>
          {c.result ? <Markdown className="prose" source={c.result}/> : <p>This project is ongoing. Results will be shared here once they are measured and verified.</p>}
          {c.metrics.length > 0 && <dl className="cs-metrics">{c.metrics.map(m => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>}
        </section>
        {c.images.length > 0 && <section><h2 className="visually-hidden">Gallery</h2><div className="cs-gallery">{c.images.map(src => <img key={src} src={src} alt="" loading="lazy" decoding="async"/>)}</div></section>}
      </div>
    </article>
    <FinalCta/>
  </PageShell>
}
