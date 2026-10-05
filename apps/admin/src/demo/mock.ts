/* eslint-disable @typescript-eslint/no-explicit-any -- an in-memory stand-in for the API's loosely shaped JSON */
// Demo mode (VITE_DEMO_MODE=true): answers every Admin API request from built-in sample data, in memory.
// No API or database is involved. Changes last until the page is reloaded.
import { AUDIT_STATUS_LABELS, LEAD_STATUS_LABELS, PILLARS, SEO_PAGES, slugify, type PageMeta } from '@chazon/shared'
import { DEMO_LOGIN, daysAgo, demoAudits, demoCaseStudies, demoHomeSeo, demoIndustries, demoInsights, demoLeads, demoServices, demoSettings, demoTestimonials } from '@chazon/shared/demo'

type Row = Record<string, any>
type Result = { data: any; meta?: PageMeta }
export class DemoError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, string> = {}) { super(message) }
}

let counter = 0
const uid = (prefix: string) => `${prefix}_demo_${(++counter).toString(36)}`
const now = () => new Date().toISOString()
const admin = { id: 'demo-admin', email: DEMO_LOGIN.email, name: DEMO_LOGIN.name, role: 'ADMIN', managed: true }
const actor = { id: admin.id, name: admin.name }

// ---------- Sample data ----------
const store = {
  leads: demoLeads.map((l, i) => {
    const createdAt = daysAgo(l.days)
    const id = uid('lead')
    const activities: Row[] = [{ id: uid('act'), type: 'CREATED', message: 'Enquiry received through the website form.', createdAt, actor: null }]
    if (l.status !== 'NEW') activities.unshift({ id: uid('act'), type: 'STATUS_CHANGED', message: `Status changed from New to ${LEAD_STATUS_LABELS[l.status]}.`, createdAt: daysAgo(l.days - 0.2), actor })
    return {
      id, name: l.name, businessName: l.businessName, email: `${l.name.split(' ')[0].toLowerCase()}@example.com`, phone: `+91 90000 ${String(10000 + i).slice(1)}`,
      website: `${l.businessName.toLowerCase().replace(/[^a-z]+/g, '')}.example.com`, category: l.category, service: l.service, budget: l.budget, message: l.message,
      source: 'Website', sourceDetail: l.sourceDetail, status: l.status, archivedAt: null, createdAt, updatedAt: createdAt,
      notes: l.note ? [{ id: uid('note'), body: l.note, createdAt: daysAgo(l.days - 0.3), author: actor }] : [],
      activities,
    } as Row
  }),
  audits: demoAudits.map(a => {
    const createdAt = daysAgo(a.days)
    return {
      id: uid('audit'), name: a.name, businessName: a.businessName, email: `${a.name.split(' ')[0].toLowerCase()}@example.com`, phone: '+91 90000 00000', website: a.website,
      category: a.category, requirements: a.requirements, budget: null, source: 'Website', sourceDetail: null, status: a.status, notes: a.notes, archivedAt: null, createdAt, updatedAt: createdAt,
      activities: [{ id: uid('act'), type: 'CREATED', message: 'Audit requested through the website form.', createdAt, actor: null }],
    } as Row
  }),
  services: PILLARS.flatMap(pillar => demoServices.filter(s => s.pillar === pillar).map((s, order) => ({
    id: uid('svc'), title: s.title, slug: slugify(s.title), pillar, shortDescription: s.shortDescription ?? null, description: null, icon: null, imageUrl: null,
    order, published: true, archivedAt: null, updatedAt: daysAgo(30),
  }) as Row)),
  caseStudies: demoCaseStudies.map((c, order) => ({
    id: uid('case'), ...c, coverImage: null, images: [], seoTitle: null, metaDescription: null, ogImage: null, order,
    publishedAt: c.status === 'PUBLISHED' ? daysAgo(c.days) : null, updatedAt: daysAgo(c.days), createdAt: daysAgo(c.days),
  }) as Row),
  insights: demoInsights.map(s => ({
    id: uid('insight'), ...s, featuredImage: null, authorName: 'Chazon Team', tags: ['demo'], seoTitle: null, metaDescription: null, ogImage: null,
    publishedAt: s.status === 'PUBLISHED' ? daysAgo(s.days) : null, updatedAt: daysAgo(s.days), createdAt: daysAgo(s.days),
  }) as Row),
  industries: demoIndustries.map(([name, description], order) => ({ id: uid('ind'), name, slug: slugify(name), description, order, published: true }) as Row),
  testimonials: demoTestimonials.map((t, order) => ({ id: uid('tst'), ...t, photoUrl: null, order, published: true }) as Row),
  media: [] as Row[],
  users: [
    { ...admin, active: true, lastLoginAt: now(), createdAt: daysAgo(60) },
    { id: uid('user'), email: 'editor@chazon.local', name: 'Demo Editor', role: 'EDITOR', managed: false, active: true, lastLoginAt: daysAgo(2), createdAt: daysAgo(40) },
  ] as Row[],
  settings: { ...demoSettings } as Row,
  seo: SEO_PAGES.map(page => ({
    page, title: page === 'home' ? demoHomeSeo.title : null, description: page === 'home' ? demoHomeSeo.description : null,
    canonicalUrl: null, ogTitle: null, ogDescription: null, ogImage: null, noindex: false, nofollow: false, updatedAt: page === 'home' ? daysAgo(30) : null,
  }) as Row),
}

// ---------- Helpers ----------
const signedInKey = 'chazon-demo-signed-in'
const signedIn = () => { try { return sessionStorage.getItem(signedInKey) === '1' } catch { return true } }
const setSignedIn = (value: boolean) => { try { if (value) sessionStorage.setItem(signedInKey, '1'); else sessionStorage.removeItem(signedInKey) } catch { /* ignore */ } }
const notFound = (what: string) => new DemoError(404, 'NOT_FOUND', `${what} not found`)
function required(body: Row, fields: [string, string][]) {
  const details: Record<string, string> = {}
  for (const [key, label] of fields) if (!String(body[key] ?? '').trim()) details[key] = `${label} is required`
  if (Object.keys(details).length) throw new DemoError(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', details)
}
const blankToNull = (body: Row) => Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]))
const matches = (row: Row, q: string | null, fields: string[]) => !q || fields.some(f => String(row[f] ?? '').toLowerCase().includes(q.toLowerCase()))
function paginate(list: Row[], query: URLSearchParams, size = 20): Result {
  const pageSize = Number(query.get('pageSize')) || size
  const total = list.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Number(query.get('page')) || 1), pages)
  return { data: list.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total, pages } }
}
const sorters: Record<string, (a: Row, b: Row) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt), oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.name.localeCompare(b.name), business: (a, b) => a.businessName.localeCompare(b.businessName), status: (a, b) => a.status.localeCompare(b.status),
}
const byView = (row: Row, view: string | null) => (view === 'archived' ? !!row.archivedAt : view === 'all' ? true : !row.archivedAt)
function uniqueSlug(list: Row[], value: string, exceptId?: string) {
  const base = slugify(value) || 'item'
  let slug = base
  for (let n = 2; list.some(r => r.slug === slug && r.id !== exceptId); n++) slug = `${base}-${n}`
  return slug
}
function assertSlugFree(list: Row[], slug: string | undefined, exceptId?: string) {
  if (slug && list.some(r => r.slug === slug && r.id !== exceptId)) throw new DemoError(409, 'CONFLICT', 'That slug is already in use.', { slug: 'This slug is already in use' })
}
function publishedAt(status: string | undefined, requested: string | null | undefined, current: string | null) {
  if (requested !== undefined) return requested ?? (status === 'PUBLISHED' ? current ?? now() : null)
  if (status === 'PUBLISHED' && !current) return now()
  return current
}
const find = (list: Row[], id: string, what: string) => { const row = list.find(r => r.id === id); if (!row) throw notFound(what); return row }
const remove = (list: Row[], id: string) => { const i = list.findIndex(r => r.id === id); if (i >= 0) list.splice(i, 1); return { deleted: true } }
function reorder(list: Row[], ids: string[]) { ids.forEach((id, order) => { const row = list.find(r => r.id === id); if (row) row.order = order }); list.sort((a, b) => a.order - b.order); return { reordered: ids.length } }
const count = (list: Row[], key: string) => list.reduce<Record<string, number>>((acc, r) => { acc[r[key]] = (acc[r[key]] ?? 0) + 1; return acc }, {})

function record(row: Row, type: string, message: string) { row.activities.unshift({ id: uid('act'), type, message, createdAt: now(), actor }) }
function applyEdits(row: Row, body: Row, labels: Record<string, string>, extraSkip: string[] = []) {
  const { archived, ...data } = blankToNull(body)
  if (data.status && data.status !== row.status) record(row, 'STATUS_CHANGED', `Status changed from ${labels[row.status]} to ${labels[data.status]}.`)
  if ('notes' in data && data.notes !== row.notes && extraSkip.includes('notes')) record(row, 'NOTE_ADDED', 'Internal notes updated.')
  const edited = Object.keys(data).filter(k => !['status', ...extraSkip].includes(k) && data[k] !== row[k])
  if (edited.length) record(row, 'UPDATED', `Details updated (${edited.join(', ')}).`)
  if (archived !== undefined && archived !== !!row.archivedAt) record(row, archived ? 'ARCHIVED' : 'RESTORED', archived ? 'Archived.' : 'Restored from archive.')
  Object.assign(row, data, archived !== undefined ? { archivedAt: archived ? row.archivedAt ?? now() : null } : {}, { updatedAt: now() })
  return row
}

// ---------- Router ----------
export async function demoRequest(path: string, method: string, body: unknown): Promise<Result> {
  await new Promise(r => setTimeout(r, 120)) // feel like a network call, so loading states show
  const url = new URL(path, 'http://demo')
  const q = url.searchParams
  const [resource, id, sub, subId] = url.pathname.split('/').filter(Boolean)
  const b = (body instanceof FormData ? {} : body ?? {}) as Row
  const ok = (data: any): Result => ({ data })

  if (resource === 'auth') {
    if (id === 'login') {
      if (String(b.email).trim().toLowerCase() !== DEMO_LOGIN.email || b.password !== DEMO_LOGIN.password) throw new DemoError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
      setSignedIn(true)
      return ok(admin)
    }
    if (id === 'logout') { setSignedIn(false); return ok({ signedOut: true }) }
    if (id === 'me') return ok(signedIn() ? admin : null)
    if (id === 'change-password') throw new DemoError(409, 'ENV_MANAGED', 'Demo mode: the demo account’s password can’t be changed.')
  }
  if (!signedIn()) throw new DemoError(401, 'UNAUTHENTICATED', 'Please sign in.')

  switch (resource) {
    case 'dashboard': {
      const leads = store.leads.filter(l => !l.archivedAt)
      const audits = store.audits.filter(a => !a.archivedAt)
      if (id === 'notifications') {
        const newLeads = leads.filter(l => l.status === 'NEW')
        const newAudits = audits.filter(a => a.status === 'NEW')
        const items = [...newLeads.map(l => ({ ...l, kind: 'lead' })), ...newAudits.map(a => ({ ...a, kind: 'audit' }))].sort(sorters.newest).slice(0, 6)
        return ok({ newLeads: newLeads.length, newAudits: newAudits.length, items })
      }
      if (id === 'search') {
        const term = q.get('q') ?? ''
        if (term.length < 2) return ok({ leads: [], audits: [], insights: [], caseStudies: [] })
        return ok({
          leads: store.leads.filter(l => matches(l, term, ['name', 'businessName', 'email', 'phone'])).slice(0, 5),
          audits: store.audits.filter(a => matches(a, term, ['name', 'businessName', 'email', 'website'])).slice(0, 5),
          insights: store.insights.filter(i => matches(i, term, ['title'])).slice(0, 5),
          caseStudies: store.caseStudies.filter(c => matches(c, term, ['title', 'industry'])).slice(0, 5),
        })
      }
      const byStatus = count(leads, 'status')
      const since = Date.now() - 30 * 86400_000
      const services = Object.entries(count(leads.filter(l => l.service), 'service')).map(([label, n]) => ({ label, count: n })).sort((a, b) => b.count - a.count).slice(0, 6)
      const sources = Object.entries(count(leads.map(l => ({ s: l.sourceDetail || (l.source === 'Website' ? 'Website (direct / unknown)' : l.source) })), 's')).map(([label, n]) => ({ label, count: n })).sort((a, b) => b.count - a.count).slice(0, 6)
      return ok({
        leads: { total: leads.length, new: byStatus.NEW ?? 0, qualified: byStatus.QUALIFIED ?? 0, converted: byStatus.WON ?? 0, last30Days: leads.filter(l => Date.parse(l.createdAt) >= since).length, byStatus },
        audits: { total: audits.length, new: audits.filter(a => a.status === 'NEW').length, last30Days: audits.filter(a => Date.parse(a.createdAt) >= since).length, byStatus: count(audits, 'status') },
        content: { publishedCaseStudies: store.caseStudies.filter(c => c.status === 'PUBLISHED').length, publishedInsights: store.insights.filter(i => i.status === 'PUBLISHED').length },
        recentLeads: [...leads].sort(sorters.newest).slice(0, 6),
        recentAudits: [...audits].sort(sorters.newest).slice(0, 6),
        topServices: services,
        sources,
      })
    }

    case 'leads':
    case 'audits': {
      const list = resource === 'leads' ? store.leads : store.audits
      const labels: Record<string, string> = resource === 'leads' ? LEAD_STATUS_LABELS : AUDIT_STATUS_LABELS
      const what = resource === 'leads' ? 'Lead' : 'Audit request'
      if (!id) {
        if (method === 'POST') {
          required(b, [['name', 'Name'], ['businessName', 'Business name'], ['email', 'Email'], ['phone', 'Phone']])
          const row: Row = { id: uid(resource), ...blankToNull(b), status: b.status || 'NEW', source: 'Manual', sourceDetail: null, archivedAt: null, createdAt: now(), updatedAt: now(), notes: [], activities: [] }
          record(row, 'CREATED', `${what} added manually.`)
          list.unshift(row)
          return ok(row)
        }
        const fields = resource === 'leads' ? ['name', 'businessName', 'email', 'phone', 'website', 'service', 'message', 'category'] : ['name', 'businessName', 'email', 'phone', 'website', 'requirements', 'category']
        const rows = list.filter(r => byView(r, q.get('view')) && (!q.get('status') || r.status === q.get('status')) && (!q.get('service') || r.service === q.get('service')) && matches(r, q.get('q'), fields))
          .sort(sorters[q.get('sort') ?? 'newest'] ?? sorters.newest)
          .map(r => ({ ...r, _count: { notes: r.notes?.length ?? 0 } }))
        return paginate(rows, q)
      }
      const row = find(list, id, what)
      if (sub === 'notes') {
        if (method === 'POST') {
          required(b, [['body', 'Note']])
          const note = { id: uid('note'), body: String(b.body).trim(), createdAt: now(), author: actor }
          row.notes.unshift(note)
          record(row, 'NOTE_ADDED', 'Internal note added.')
          return ok(note)
        }
        if (method === 'DELETE') { row.notes = row.notes.filter((n: Row) => n.id !== subId); return ok({ deleted: true }) }
      }
      if (method === 'PATCH') return ok(applyEdits(row, b, labels, resource === 'audits' ? ['notes'] : []))
      if (method === 'DELETE') return ok(remove(list, id))
      return ok(row)
    }

    case 'services': {
      const list = store.services
      if (id === 'reorder') return ok(reorder(list, b.ids ?? []))
      if (!id) {
        if (method === 'POST') {
          required(b, [['title', 'Title'], ['pillar', 'Pillar']])
          assertSlugFree(list, b.slug)
          const { archived, ...data } = blankToNull(b)
          const row = { id: uid('svc'), description: null, shortDescription: null, imageUrl: null, icon: null, ...data, slug: b.slug || uniqueSlug(list, b.title), published: b.published ?? true, archivedAt: archived ? now() : null, order: list.filter(s => s.pillar === b.pillar).length, updatedAt: now() }
          list.push(row)
          return ok(row)
        }
        const view = q.get('view')
        return ok(list.filter(s => byView(s, view)).sort((a, z) => PILLARS.indexOf(a.pillar) - PILLARS.indexOf(z.pillar) || a.order - z.order))
      }
      const row = find(list, id, 'Service')
      if (method === 'PATCH') {
        assertSlugFree(list, b.slug, id)
        const { archived, ...data } = blankToNull(b)
        return ok(Object.assign(row, data, archived !== undefined ? { archivedAt: archived ? now() : null } : {}, { updatedAt: now() }))
      }
      if (method === 'DELETE') return ok(remove(list, id))
      return ok(row)
    }

    case 'case-studies':
    case 'insights': {
      const list = resource === 'insights' ? store.insights : store.caseStudies
      const what = resource === 'insights' ? 'Insight' : 'Case study'
      if (!id) {
        if (method === 'POST') {
          required(b, resource === 'insights' ? [['title', 'Title'], ['category', 'Category']] : [['title', 'Client / project name']])
          assertSlugFree(list, b.slug)
          const data = blankToNull(b)
          const status = data.status ?? 'DRAFT'
          const row = {
            id: uid(resource), deliverables: [], metrics: [], images: [], tags: [], content: '', ...data, status,
            authorName: resource === 'insights' ? data.authorName ?? admin.name : undefined,
            slug: b.slug || uniqueSlug(list, b.title), publishedAt: publishedAt(status, data.publishedAt, null), createdAt: now(), updatedAt: now(), order: list.length,
          }
          list.unshift(row)
          return ok(row)
        }
        const rows = list.filter(r => (!q.get('status') || r.status === q.get('status')) && (!q.get('category') || r.category === q.get('category')) && matches(r, q.get('q'), ['title', 'excerpt', 'industry', 'summary']))
          .sort((a, z) => z.updatedAt.localeCompare(a.updatedAt))
        return paginate(rows, q)
      }
      const row = find(list, id, what)
      if (method === 'PATCH') {
        assertSlugFree(list, b.slug, id)
        const { publishedAt: requested, ...data } = blankToNull(b)
        return ok(Object.assign(row, data, { publishedAt: publishedAt(data.status ?? row.status, requested, row.publishedAt), updatedAt: now() }))
      }
      if (method === 'DELETE') return ok(remove(list, id))
      return ok(row)
    }

    case 'industries':
    case 'testimonials': {
      const list = resource === 'industries' ? store.industries : store.testimonials
      if (id === 'reorder') return ok(reorder(list, b.ids ?? []))
      if (!id) {
        if (method === 'POST') {
          required(b, resource === 'industries' ? [['name', 'Name']] : [['name', 'Name'], ['quote', 'Testimonial']])
          const row = { id: uid(resource), ...blankToNull(b), ...(resource === 'industries' ? { slug: b.slug || uniqueSlug(list, b.name) } : {}), published: b.published ?? resource === 'industries', order: list.length }
          list.push(row)
          return ok(row)
        }
        return ok([...list].sort((a, z) => a.order - z.order))
      }
      const row = find(list, id, resource === 'industries' ? 'Industry' : 'Testimonial')
      if (method === 'PATCH') return ok(Object.assign(row, blankToNull(b)))
      if (method === 'DELETE') return ok(remove(list, id))
      return ok(row)
    }

    case 'media': {
      if (!id) {
        if (method === 'POST' && body instanceof FormData) {
          const file = body.get('file') as File | null
          if (!file) throw new DemoError(422, 'VALIDATION_ERROR', 'Choose an image to upload.', { file: 'Choose an image' })
          const bitmap = await createImageBitmap(file).catch(() => null)
          if (!bitmap) throw new DemoError(422, 'VALIDATION_ERROR', 'That file is not a supported image.', { file: 'Unsupported image' })
          const row = { id: uid('media'), filename: file.name, originalName: file.name, mimeType: file.type, size: file.size, width: bitmap.width, height: bitmap.height, alt: String(body.get('alt') ?? ''), url: URL.createObjectURL(file), createdAt: now(), uploadedBy: { name: admin.name } }
          store.media.unshift(row)
          return ok(row)
        }
        return paginate(store.media.filter(m => matches(m, q.get('q'), ['originalName', 'alt'])), q, 30)
      }
      const row = find(store.media, id, 'Image')
      if (method === 'PATCH') return ok(Object.assign(row, { alt: String(b.alt ?? '') }))
      if (method === 'DELETE') return ok(remove(store.media, id))
      return ok(row)
    }

    case 'settings':
      if (method === 'PUT') Object.assign(store.settings, b)
      return ok(store.settings)

    case 'seo': {
      if (!id) return ok(store.seo)
      const row = store.seo.find(r => r.page === id)
      if (!row) throw notFound('Page')
      return ok(Object.assign(row, blankToNull(b), { updatedAt: now() }))
    }

    case 'users': {
      if (!id) {
        if (method === 'POST') {
          required(b, [['name', 'Name'], ['email', 'Email']])
          if (String(b.password ?? '').length < 12) throw new DemoError(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', { password: 'Use at least 12 characters' })
          if (store.users.some(u => u.email === String(b.email).toLowerCase())) throw new DemoError(409, 'CONFLICT', 'That email is already in use.', { email: 'This email is already in use' })
          const row = { id: uid('user'), email: String(b.email).toLowerCase(), name: b.name, role: b.role ?? 'EDITOR', active: true, managed: false, lastLoginAt: null, createdAt: now() }
          store.users.push(row)
          return ok(row)
        }
        return ok(store.users)
      }
      const row = find(store.users, id, 'User')
      if (row.managed) throw new DemoError(409, 'ENV_MANAGED', 'This account is configured in the .env file.')
      if (method === 'PATCH') { const { password: _password, ...data } = b; void _password; return ok(Object.assign(row, data)) }
      if (method === 'DELETE') return ok(remove(store.users, id))
      return ok(row)
    }
  }
  throw notFound('Endpoint')
}
