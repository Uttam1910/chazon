import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PageMeta } from '@chazon/shared'
import { usePageTitle } from '../layout/title'

const tones: Record<string, string> = {
  NEW: 'orange', CONTACTED: 'blue', QUALIFIED: 'violet', PROPOSAL_SENT: 'amber', WON: 'green', LOST: 'grey',
  REVIEWING: 'blue', AUDIT_READY: 'violet', SENT: 'green', CLOSED: 'grey',
  DRAFT: 'amber', PUBLISHED: 'green', ARCHIVED: 'grey', ADMIN: 'orange', EDITOR: 'blue',
}
export function Badge({ value, label, tone }: { value?: string; label: ReactNode; tone?: string }) {
  return <span className={`badge tone-${tone ?? tones[value ?? ''] ?? 'grey'}`}>{label}</span>
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  usePageTitle(title)
  return <div className="page-header">
    <div>{back}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
}

export function Pagination({ meta, onPage }: { meta?: PageMeta; onPage: (page: number) => void }) {
  if (!meta || meta.total <= meta.pageSize) return meta ? <p className="pagination-summary">{meta.total} {meta.total === 1 ? 'result' : 'results'}</p> : null
  const from = (meta.page - 1) * meta.pageSize + 1
  const to = Math.min(meta.total, meta.page * meta.pageSize)
  return <nav className="pagination" aria-label="Pagination">
    <span>{from}–{to} of {meta.total}</span>
    <div>
      <button className="btn" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={16} aria-hidden="true"/>Previous</button>
      <span className="page-num">Page {meta.page} of {meta.pages}</span>
      <button className="btn" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next<ChevronRight size={16} aria-hidden="true"/></button>
    </div>
  </nav>
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>
    {(title || actions) && <header className="card-head">{title && <h2>{title}</h2>}{actions}</header>}
    {children}
  </section>
}
