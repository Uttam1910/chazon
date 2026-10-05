import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'

export function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  return <span className="spinner" role={label ? 'status' : undefined}><Loader2 size={size} aria-hidden="true"/>{label && <span>{label}</span>}</span>
}

export function FullPageState({ title, message, loading, action }: { title: string; message?: string; loading?: boolean; action?: { label: string; onClick: () => void } }) {
  return <div className="full-state">
    <div className="brand-lockup" aria-hidden="true"><span className="brand-mark">c<span>↗</span></span></div>
    {loading ? <Spinner size={22} label={title}/> : <h1>{title}</h1>}
    {message && <p>{message}</p>}
    {action && <button className="btn primary" onClick={action.onClick}>{action.label}</button>}
  </div>
}

export function EmptyState({ title, message, action, icon }: { title: string; message?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state">
    <span className="empty-icon" aria-hidden="true">{icon ?? <Inbox size={22}/>}</span>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action}
  </div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state" role="alert">
    <AlertTriangle size={20} aria-hidden="true"/>
    <div><strong>Couldn’t load this</strong><p>{message}</p></div>
    {onRetry && <button className="btn" onClick={onRetry}><RefreshCw size={15} aria-hidden="true"/>Retry</button>}
  </div>
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return <div className="skeleton-list" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton-row"><span/><span/><span/></div>)}
  </div>
}
