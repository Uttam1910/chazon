import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/** List filters kept in the URL, so they survive reloads and can be linked to (e.g. from the dashboard). */
export function useListParams<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams()
  const values = Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d])) as Record<K, string>
  const page = Math.max(1, Number(params.get('page')) || 1)
  const set = useCallback((key: K | 'page', value: string | number) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === (defaults as Record<string, string>)[key] || (key === 'page' && value === 1)) next.delete(key)
      else next.set(key, String(value))
      if (key !== 'page') next.delete('page')
      return next
    }, { replace: true })
  }, [setParams]) // eslint-disable-line react-hooks/exhaustive-deps
  return { values, page, set }
}

/** Moves item `index` by `delta` within `list` and returns the reordered list. */
export const moved = <T extends { id: string }>(list: T[], index: number, delta: number) => {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item)
  return next
}
