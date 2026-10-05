import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router'
import { useConfirm } from './confirm'

export const formatDate = (value: string | null | undefined, withTime = false) => value
  ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(new Date(value))
  : '—'
export function timeAgo(value: string) {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000
  if (seconds < 60) return 'just now'
  const [size, unit] = seconds < 3600 ? [60, 'minute'] : seconds < 86400 ? [3600, 'hour'] : seconds < 604800 ? [86400, 'day'] : [0, '']
  if (!size) return formatDate(value)
  const n = Math.floor(seconds / size)
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

/** Warns before leaving a page (in-app navigation or closing the tab) with unsaved changes. */
export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({ title: 'Discard unsaved changes?', message: 'You have changes that haven’t been saved. If you leave now, they will be lost.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true })
      .then(ok => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}

export const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
