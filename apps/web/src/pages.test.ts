import { afterEach, describe, expect, it, vi } from 'vitest'
import { PUBLIC_PAGES } from '@chazon/shared'
import { render } from './entry-server'
import { matchRoute } from './routes'

// Renders every fixed page the way the build-time prerender does and checks what crawlers and visitors receive.
const pages = PUBLIC_PAGES.map(path => ({ path, ...render(path) }))
const attr = (head: string, pattern: RegExp) => pattern.exec(head)?.[1] ?? ''
const title = (head: string) => attr(head, /<title[^>]*>([^<]*)<\/title>/)
const description = (head: string) => attr(head, /<meta name="description" content="([^"]*)"/)

describe('prerendered pages', () => {
  it.each(pages)('$path renders with status 200, one H1 and indexable metadata', ({ html, head, status }) => {
    expect(status).toBe(200)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(title(head).length).toBeGreaterThan(20)
    expect(title(head).length).toBeLessThanOrEqual(72)
    expect(description(head).length).toBeGreaterThanOrEqual(110)
    expect(description(head).length).toBeLessThanOrEqual(170)
    expect(head).toContain('content="index, follow"')
  })

  it('gives every page a unique title and description', () => {
    expect(new Set(pages.map(p => title(p.head))).size).toBe(pages.length)
    expect(new Set(pages.map(p => description(p.head))).size).toBe(pages.length)
  })

  it('links only to pages that exist', () => {
    const internal = new Set(pages.flatMap(p => [...p.html.matchAll(/href="(\/[^"#?]*)/g)].map(m => m[1])))
    const broken = [...internal].filter(href => matchRoute(href.replace(/(.)\/$/, '$1')).status !== 200)
    expect(broken).toEqual([])
  })

  it('in-page anchors point at elements on the same page', () => {
    for (const { path, html } of pages) {
      const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]))
      const missing = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]).filter(id => !ids.has(id))
      expect(missing, path).toEqual([])
    }
  })

  it('contains no placeholder copy', () => {
    // Visible text only (form inputs legitimately carry placeholder attributes).
    const found = pages.flatMap(({ path, html }) => (html.replace(/<[^>]+>/g, ' ').match(/lorem ipsum|placeholder|in preparation|coming soon|TODO|example\.com/gi) ?? []).map(m => `${path}: ${m}`))
    expect(found).toEqual([])
  })

  it('serves a noindex 404 for unknown paths', () => {
    const missing = render('/no-such-page')
    expect(missing.status).toBe(404)
    expect(missing.head).toContain('content="noindex, follow"')
  })
})

describe('structured data with a production URL', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

  it('emits valid JSON-LD with absolute URLs that match the visible page', async () => {
    vi.stubEnv('VITE_SITE_URL', 'https://chazon.test')
    vi.resetModules()
    const { render: renderWithUrl } = await import('./entry-server')
    const scripts = (path: string) => [...renderWithUrl(path).head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]))
    const types = (data: { '@type'?: string; '@graph'?: { '@type': string }[] }[]) => data.flatMap(d => d['@graph'] ? d['@graph'].map(n => n['@type']) : [d['@type']])

    const home = scripts('/')
    expect(types(home)).toEqual(['Organization', 'WebSite', 'FAQPage'])
    const org = home[0]['@graph'][0]
    expect(org.url).toBe('https://chazon.test/')
    expect(org).not.toHaveProperty('aggregateRating')
    expect(org).not.toHaveProperty('review')

    const service = scripts('/services/website-development')
    expect(types(service)).toEqual(['Service', 'BreadcrumbList', 'FAQPage'])
    const crumbs = service[0]['@graph'][1].itemListElement.map((i: { item: string }) => i.item)
    expect(crumbs).toEqual(['https://chazon.test/', 'https://chazon.test/services', 'https://chazon.test/services/website-development'])
    expect(renderWithUrl('/about').head).toContain('<link rel="canonical" href="https://chazon.test/about"')
  })
})
