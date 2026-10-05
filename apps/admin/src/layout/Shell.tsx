import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Bell, Briefcase, Building2, ChevronDown, DatabaseZap, Globe, Image, KeyRound, Layers, LayoutDashboard, LogOut, Menu, Newspaper,
  Quote, Search, SearchCheck, Settings, ShieldCheck, UserRound, X,
} from 'lucide-react'
import { CONTENT_STATUS_LABELS, LEAD_STATUS_LABELS, AUDIT_STATUS_LABELS, type ContentStatus, type LeadStatus, type AuditStatus } from '@chazon/shared'
import { DEMO_MODE, qs, useApi } from '../api'
import { Badge } from '../ui/Common'
import { useCurrentTitle } from './title'
import { useAuth } from '../auth-context'
import { timeAgo, useDebounced } from '../ui/utils'

type Notifications = { newLeads: number; newAudits: number; items: { id: string; kind: 'lead' | 'audit'; name: string; businessName: string; createdAt: string }[] }

const sections: { label: string; items: { to: string; label: string; icon: typeof Bell; badge?: 'leads' | 'audits'; adminOnly?: boolean }[] }[] = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Pipeline', items: [{ to: '/leads', label: 'Leads', icon: UserRound, badge: 'leads' }, { to: '/audits', label: 'Growth Audits', icon: SearchCheck, badge: 'audits' }] },
  {
    label: 'Content', items: [
      { to: '/services', label: 'Services', icon: Layers }, { to: '/case-studies', label: 'Work / Case Studies', icon: Briefcase },
      { to: '/insights', label: 'Insights', icon: Newspaper }, { to: '/industries', label: 'Industries', icon: Building2 },
      { to: '/testimonials', label: 'Testimonials', icon: Quote }, { to: '/media', label: 'Media', icon: Image },
    ],
  },
  { label: 'Configuration', items: [{ to: '/settings', label: 'Website Settings', icon: Settings }, { to: '/seo', label: 'SEO', icon: Globe }, { to: '/users', label: 'Admin Users', icon: ShieldCheck, adminOnly: true }] },
]

/** Closes a popover when clicking outside it or pressing Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open, close])
  return ref
}

export function Shell() {
  const { user } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const notifications = useApi<Notifications>('/dashboard/notifications')
  const { reload } = notifications
  // Refresh counts on navigation and every minute.
  useEffect(() => { reload() }, [location.pathname, reload])
  useEffect(() => { const t = setInterval(reload, 60_000); return () => clearInterval(t) }, [reload])
  useEffect(() => { setDrawer(false) }, [location.pathname])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])
  const counts = { leads: notifications.data?.newLeads ?? 0, audits: notifications.data?.newAudits ?? 0 }

  return <div className={`shell ${drawer ? 'drawer-open' : ''}`}>
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="sidebar" aria-label="Admin navigation">
      <div className="sidebar-brand">
        <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">c<span>↗</span></span><span>CHAZON<small>ADMIN</small></span></Link>
        <button className="icon-btn drawer-close" aria-label="Close navigation" onClick={() => setDrawer(false)}><X size={20}/></button>
      </div>
      <nav>
        {sections.map(section => <div key={section.label} className="nav-section">
          <p>{section.label}</p>
          <ul>{section.items.filter(i => !i.adminOnly || user?.role === 'ADMIN').map(item => <li key={item.to}>
            <NavLink to={item.to} end={item.to === '/'}><item.icon size={18} aria-hidden="true"/><span>{item.label}</span>
              {item.badge && counts[item.badge] > 0 && <span className="nav-count" aria-label={`${counts[item.badge]} new`}>{counts[item.badge]}</span>}
            </NavLink>
          </li>)}</ul>
        </div>)}
      </nav>
    </aside>
    <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true"/>
    <div className="main-col">
      <TopBar onMenu={() => setDrawer(true)} notifications={notifications.data}/>
      <main id="main" className="content" tabIndex={-1}>
        {notifications.error?.code === 'DATABASE_UNAVAILABLE' && <div className="db-banner" role="status">
          <DatabaseZap size={18} aria-hidden="true"/>
          <p><strong>Database not connected.</strong> You’re signed in, but leads, content and settings can’t load until <code>DATABASE_URL</code> is set in <code>.env</code> and <code>npm run db:migrate</code> has been run.</p>
        </div>}
        <Outlet/>
      </main>
    </div>
  </div>
}

function TopBar({ onMenu, notifications }: { onMenu: () => void; notifications?: Notifications }) {
  const title = useCurrentTitle()
  const [bell, setBell] = useState(false)
  const bellRef = useDismiss(bell, () => setBell(false))
  const total = (notifications?.newLeads ?? 0) + (notifications?.newAudits ?? 0)
  return <header className="topbar">
    <button className="icon-btn menu-btn" aria-label="Open navigation" onClick={onMenu}><Menu size={20}/></button>
    <p className="topbar-title">{title}</p>
    {DEMO_MODE && <span className="demo-badge" title="Sample data built into the app. Changes reset when you reload. Remove VITE_DEMO_MODE from .env to use the real API.">Demo data</span>}
    <GlobalSearch/>
    <div className="popover-wrap" ref={bellRef}>
      <button className="icon-btn bell" aria-label={`Notifications${total ? `: ${total} new` : ''}`} aria-expanded={bell} onClick={() => setBell(!bell)}>
        <Bell size={19}/>{total > 0 && <span className="dot" aria-hidden="true"/>}
      </button>
      {bell && <div className="popover notif-pop">
        <p className="popover-title">New enquiries</p>
        {!notifications?.items.length ? <p className="popover-empty">You’re all caught up. New leads and audit requests appear here.</p>
          : <ul>{notifications.items.map(n => <li key={n.id}><Link to={`/${n.kind === 'lead' ? 'leads' : 'audits'}/${n.id}`} onClick={() => setBell(false)}>
            <Badge label={n.kind === 'lead' ? 'Lead' : 'Audit'} tone={n.kind === 'lead' ? 'orange' : 'violet'}/>
            <span><strong>{n.name}</strong><small>{n.businessName} · {timeAgo(n.createdAt)}</small></span>
          </Link></li>)}</ul>}
        <div className="popover-foot"><Link to="/leads?status=NEW" onClick={() => setBell(false)}>New leads ({notifications?.newLeads ?? 0})</Link><Link to="/audits?status=NEW" onClick={() => setBell(false)}>New audits ({notifications?.newAudits ?? 0})</Link></div>
      </div>}
    </div>
    <ProfileMenu/>
  </header>
}

type SearchResults = {
  leads: { id: string; name: string; businessName: string; status: LeadStatus }[]
  audits: { id: string; name: string; businessName: string; status: AuditStatus }[]
  insights: { id: string; title: string; status: ContentStatus }[]
  caseStudies: { id: string; title: string; status: ContentStatus }[]
}

function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const term = useDebounced(q.trim(), 250)
  const ref = useDismiss(open || expanded, () => { setOpen(false); setExpanded(false) })
  const { data, loading } = useApi<SearchResults>(term.length >= 2 ? `/dashboard/search${qs({ q: term })}` : null)
  const navigate = useNavigate()
  const go = (to: string) => { setOpen(false); setExpanded(false); setQ(''); navigate(to) }
  const groups: [string, { id: string; label: string; sub?: string; badge: ReactNode; to: string }[]][] = data ? [
    ['Leads', data.leads.map(l => ({ id: l.id, label: l.name, sub: l.businessName, badge: <Badge value={l.status} label={LEAD_STATUS_LABELS[l.status]}/>, to: `/leads/${l.id}` }))],
    ['Growth audits', data.audits.map(a => ({ id: a.id, label: a.name, sub: a.businessName, badge: <Badge value={a.status} label={AUDIT_STATUS_LABELS[a.status]}/>, to: `/audits/${a.id}` }))],
    ['Insights', data.insights.map(i => ({ id: i.id, label: i.title, badge: <Badge value={i.status} label={CONTENT_STATUS_LABELS[i.status]}/>, to: `/insights/${i.id}` }))],
    ['Case studies', data.caseStudies.map(c => ({ id: c.id, label: c.title, badge: <Badge value={c.status} label={CONTENT_STATUS_LABELS[c.status]}/>, to: `/case-studies/${c.id}` }))],
  ] : []
  const hasResults = groups.some(([, items]) => items.length)
  return <div className={`global-search popover-wrap ${expanded ? 'expanded' : ''}`} ref={ref}>
    <button className="icon-btn search-toggle" aria-label="Search" onClick={() => setExpanded(true)}><Search size={19}/></button>
    <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) go(`/leads${qs({ q: q.trim() })}`) }}>
      <Search size={16} aria-hidden="true"/>
      <input type="search" placeholder="Search leads, audits, content…" aria-label="Search the Admin" value={q} onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true) }}/>
    </form>
    {open && term.length >= 2 && <div className="popover search-pop">
      {loading && !data ? <p className="popover-empty">Searching…</p> : !hasResults ? <p className="popover-empty">No results for “{term}”.</p>
        : groups.filter(([, items]) => items.length).map(([label, items]) => <div key={label}>
          <p className="popover-title">{label}</p>
          <ul>{items.map(item => <li key={item.id}><button type="button" onClick={() => go(item.to)}><span><strong>{item.label}</strong>{item.sub && <small>{item.sub}</small>}</span>{item.badge}</button></li>)}</ul>
        </div>)}
    </div>}
  </div>
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const navigate = useNavigate()
  if (!user) return null
  const initials = user.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return <div className="popover-wrap" ref={ref}>
    <button className="profile-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
      <span className="avatar" aria-hidden="true">{initials}</span><span className="profile-name">{user.name}</span><ChevronDown size={15} aria-hidden="true"/>
    </button>
    {open && <div className="popover profile-pop" role="menu">
      <div className="profile-head"><strong>{user.name}</strong><small>{user.email}</small><Badge value={user.role} label={user.role === 'ADMIN' ? 'Admin' : 'Editor'}/></div>
      <button role="menuitem" onClick={() => { setOpen(false); navigate('/account') }}><KeyRound size={16} aria-hidden="true"/>Change password</button>
      <button role="menuitem" onClick={async () => { setOpen(false); await logout(); navigate('/login') }}><LogOut size={16} aria-hidden="true"/>Sign out</button>
    </div>}
  </div>
}
