import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock, Share2, Sparkles } from 'lucide-react'
import {
  type PageMeta,
  type PublicCaseStudy,
  type PublicInsight,
} from '@chazon/shared'
import { Markdown } from '@chazon/shared/markdown'
import { apiConfigured, config, demoMode } from '../config'
import { formatDate } from '../format'
import { Link } from '../router'
import {
  absoluteUrl,
  BRAND,
  breadcrumbSchema,
  type Meta,
  usePageMeta,
  withAdminSeo,
  withBrand,
} from '../seo'
import { useSite } from '../site-data'
import { InsightsShowcase } from '../components/InsightsShowcase'
import { PageShell } from '../components/Layout'
import { FinalCta } from '../components/Sections'
import { Breadcrumbs, Cta } from '../components/ui'
import { WorkShowcase } from '../components/WorkShowcase'

type Load<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; meta?: PageMeta }
  | { status: 'missing' }
  | { status: 'error' }

function useContent<T>(path: string) {
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    if (demoMode || !apiConfigured) {
      void import('../demo-site').then(({ demoContent }) => {
        const result = demoContent(path)
        setState(
          result
            ? { status: 'ready', data: result.data as T, meta: result.meta }
            : { status: 'missing' }
        )
      })
      return
    }
    fetch(`${config.apiUrl}/api/public${path}`, { signal: controller.signal })
      .then(async (r) => {
        if (r.status === 404) return setState({ status: 'missing' })
        if (!r.ok) throw new Error(String(r.status))
        const body = await r.json()
        setState({ status: 'ready', data: body.data, meta: body.meta })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          void import('../demo-site').then(({ demoContent }) => {
            const result = demoContent(path)
            setState(
              result
                ? { status: 'ready', data: result.data as T, meta: result.meta }
                : { status: 'error' }
            )
          })
        }
      })
    return () => controller.abort()
  }, [path])
  return state
}

/** Loading, not-found and error states. */
function PageState({
  state,
  what,
  back,
}: {
  state: Load<unknown>
  what: string
  back: [string, string]
}) {
  if (state.status === 'loading') {
    return (
      <div className="container page-state" role="status">
        <p>Loading…</p>
      </div>
    )
  }
  return (
    <div className="container page-state">
      <h1>
        {state.status === 'missing'
          ? `This ${what.toLowerCase()} isn’t available.`
          : 'This page couldn’t be loaded.'}
      </h1>
      <p className="lead">
        {state.status === 'missing'
          ? 'It may have been moved or unpublished.'
          : 'Please check your connection and try again.'}
      </p>
      <div className="button-row">
        <Cta to={back[1]} variant="secondary" location="content_state">
          {back[0]}
        </Cta>
      </div>
    </div>
  )
}

const stateMeta = (state: Load<unknown>, what: string): Meta => ({
  title:
    state.status === 'missing'
      ? `${what} not found | ${BRAND}`
      : state.status === 'error'
      ? `Page unavailable | ${BRAND}`
      : `Loading… | ${BRAND}`,
  noindex: state.status !== 'loading',
})

// ============================================================================
// /insights (PAGE 6 — INSIGHTS)
// ============================================================================
export function InsightsIndex() {
  const { seo, live } = useSite()

  usePageMeta(
    withAdminSeo(
      {
        title: 'Insights & Digital Growth Playbooks | Chazon Digital Ventures',
        description:
          'Ideas, strategies and trends to help you grow your business online: digital revenue architecture, commercial SEO, and automated conversion workflows.',
        path: '/insights',
        schema: breadcrumbSchema([['Insights', '/insights']]),
      },
      live ? seo.insights : undefined
    )
  )

  return (
    <PageShell>
      {/* Hero matching Screen 6 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Insights</span>
            </nav>
            <h1 className="phb-title">Insights</h1>
            <p className="phb-lead">
              Ideas, strategies and trends to help you grow your business online.
            </p>
          </div>

          <div className="phb-visual">
            <div className="insight-badge-pill">
              <Sparkles size={16} />
              <span>Founder Perspectives & Strategic Playbooks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editorial Body */}
      <section className="section insights-main-body">
        <div className="container">
          <InsightsShowcase isPage={true} />
        </div>
      </section>

      <FinalCta />
    </PageShell>
  )
}

// ============================================================================
// /insights/:slug (ARTICLE DETAIL)
// ============================================================================
export function InsightPage({ slug }: { slug: string }) {
  const { seo, live } = useSite()
  const state = useContent<PublicInsight>(`/insights/${encodeURIComponent(slug)}`)
  const path = `/insights/${slug}`
  const a = state.status === 'ready' ? state.data : null

  usePageMeta(
    a
      ? withAdminSeo(
          {
            title: withBrand(a.title),
            description: a.excerpt,
            path,
            ogType: 'article',
            schema: config.siteUrl
              ? [
                  {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: a.title,
                    ...(a.excerpt ? { description: a.excerpt } : {}),
                    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
                    ...(a.featuredImage ? { image: a.featuredImage } : {}),
                    author: a.authorName
                      ? { '@type': 'Person', name: a.authorName }
                      : { '@type': 'Organization', name: BRAND },
                    publisher: {
                      '@type': 'Organization',
                      name: BRAND,
                      '@id': absoluteUrl('/#organization'),
                    },
                    mainEntityOfPage: absoluteUrl(path),
                  },
                  ...breadcrumbSchema([
                    ['Insights', '/insights'],
                    [a.title, path],
                  ]),
                ]
              : [],
          },
          live ? { noindex: seo.global?.noindex, nofollow: seo.global?.nofollow } : undefined,
          a.seo
        )
      : stateMeta(state, 'Article')
  )

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href)
      alert('Article link copied to clipboard!')
    }
  }

  return (
    <PageShell>
      {!a ? (
        <PageState state={state} what="Article" back={['All insights', '/insights']} />
      ) : (
        <article className="article-editorial-page">
          <header className="article-header surface-cream">
            <div className="container">
              <Breadcrumbs
                trail={[
                  ['Insights', '/insights'],
                  [a.title, path],
                ]}
              />
              <div className="article-meta-row">
                <span className="pill-tag-peach">{a.category}</span>
                <span className="article-date-read">
                  <Clock size={14} /> {formatDate(a.publishedAt)} · 5 min read
                </span>
              </div>
              <h1 className="article-title">{a.title}</h1>
              {a.excerpt && <p className="article-lead-excerpt">{a.excerpt}</p>}
              <div className="article-author-bar">
                <div className="author-avatar">BR</div>
                <div className="author-info">
                  <strong>{a.authorName || 'Binny Rogin'}</strong>
                  <small>Founder & Strategic Advisor · Chazon Digital Ventures</small>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="article-share-btn"
                  title="Share article"
                >
                  <Share2 size={16} /> Share Article
                </button>
              </div>
            </div>
          </header>

          <div className="container article-content-container">
            <div className="article-body-wrapper">
              <Markdown className="prose article-prose" source={a.content} />

              {a.tags.length > 0 && (
                <div className="article-tags-cloud">
                  {a.tags.map((t) => (
                    <span key={t} className="article-tag-item">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="article-bottom-nav">
                <Link to="/insights" className="button button-secondary">
                  <ArrowLeft size={16} /> Back to All Insights
                </Link>
                <Link to="/contact" className="button button-primary">
                  Discuss This With Chazon <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </article>
      )}
      <FinalCta />
    </PageShell>
  )
}

// ============================================================================
// /work (PAGE 5 — OUR WORK)
// ============================================================================
export function WorkIndex() {
  const { seo, live } = useSite()

  usePageMeta(
    withAdminSeo(
      {
        title: 'Our Work: Client Case Studies & Results | Chazon Digital Ventures',
        description:
          'Real projects. Measurable results. Case studies from Chazon Digital Ventures: business challenges, strategy, execution, and verified commercial revenue outcomes.',
        path: '/work',
        schema: breadcrumbSchema([['Work', '/work']]),
      },
      live ? seo.work : undefined
    )
  )

  return (
    <PageShell>
      {/* Hero matching Screen 5 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Work</span>
            </nav>
            <h1 className="phb-title">Our Work</h1>
            <p className="phb-lead">Real projects. Measurable results.</p>
          </div>

          <div className="phb-visual">
            <div className="work-hero-stats-badge">
              <span className="whsb-num">3.2×</span>
              <span className="whsb-label">Avg. Revenue Scale Achieved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Work Showcase matching Screen 5 */}
      <section className="section work-portfolio-body">
        <div className="container">
          <WorkShowcase isPage={true} />
        </div>
      </section>

      <FinalCta />
    </PageShell>
  )
}

// ============================================================================
// /work/:slug (CASE STUDY DETAIL)
// ============================================================================
export function CaseStudyPage({ slug }: { slug: string }) {
  const { seo, live } = useSite()
  const state = useContent<PublicCaseStudy>(`/case-studies/${encodeURIComponent(slug)}`)
  const path = `/work/${slug}`
  const c = state.status === 'ready' ? state.data : null

  usePageMeta(
    c
      ? withAdminSeo(
          {
            title: withBrand(c.title),
            description: c.summary,
            path,
            ogType: 'article',
            schema: breadcrumbSchema([
              ['Work', '/work'],
              [c.title, path],
            ]),
          },
          live ? seo.work : undefined,
          c.seo
        )
      : stateMeta(state, 'Case study')
  )

  if (!c) {
    return (
      <PageShell>
        <PageState state={state} what="Case study" back={['Back to the homepage', '/']} />
        <FinalCta />
      </PageShell>
    )
  }

  const sections = [
    { title: 'The Business Challenge', body: c.challenge },
    { title: 'The Growth Strategy', body: c.strategy },
    { title: 'Technical & Marketing Execution', body: c.execution },
  ]

  return (
    <PageShell>
      <article className="case-study-detail-page">
        <header className="case-study-hero surface-cream">
          <div className="container">
            <Breadcrumbs
              trail={[
                ['Work', '/work'],
                [c.title, path],
              ]}
            />
            <div className="cs-meta-row">
              <span className="pill-tag-peach">{c.industry || 'Case Study'}</span>
              <span className="cs-tagline">Client Partnership Case Study</span>
            </div>
            <h1 className="cs-hero-title">{c.title}</h1>
            {c.summary && <p className="cs-hero-summary">{c.summary}</p>}

            {/* Metrics Callout */}
            {c.metrics.length > 0 && (
              <div className="cs-hero-metrics-grid">
                {c.metrics.map((m) => (
                  <div key={m.label} className="cs-stat-card">
                    <div className="cs-stat-value">{m.value}</div>
                    <div className="cs-stat-label">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="container cs-content-body">
          <div className="cs-story-layout">
            <div className="cs-narrative-col">
              {sections.map(
                (sec) =>
                  sec.body && (
                    <section key={sec.title} className="cs-story-section">
                      <h2 className="cs-section-heading">{sec.title}</h2>
                      <Markdown className="prose cs-prose" source={sec.body} />
                    </section>
                  )
              )}

              {c.deliverables.length > 0 && (
                <section className="cs-story-section">
                  <h2 className="cs-section-heading">Key Deliverables</h2>
                  <ul className="cs-deliverables-checklist">
                    {c.deliverables.map((d) => (
                      <li key={d}>
                        <span className="cs-check-dot" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="cs-story-section cs-outcome-box">
                <h2 className="cs-section-heading">The Commercial Result</h2>
                {c.result ? (
                  <Markdown className="prose cs-prose" source={c.result} />
                ) : (
                  <p>
                    This engagement produced measurable increases in digital qualified leads, customer conversion, and repeat retention.
                  </p>
                )}
              </section>

              <div className="cs-nav-buttons">
                <Link to="/work" className="button button-secondary">
                  <ArrowLeft size={16} /> All Case Studies
                </Link>
                <Link to="/contact" className="button button-primary">
                  Discuss Your Project Goals <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
      <FinalCta />
    </PageShell>
  )
}
