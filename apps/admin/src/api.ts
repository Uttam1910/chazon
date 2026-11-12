import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageMeta } from '@chazon/shared'

// The API origin. In development it defaults to the local API; in production set VITE_API_URL
// (same site as the Admin, e.g. https://api.example.com for https://admin.example.com) or serve /api from the Admin's origin.
const rawApiUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '')
const runtimeHost = typeof window !== 'undefined' && window.location ? window.location.hostname.toLowerCase() : ''
const isLoopback = (v: string) => {
  try {
    const host = new URL(v).hostname.toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  } catch {
    return false
  }
}
const onLoopbackHost = runtimeHost === 'localhost' || runtimeHost === '127.0.0.1' || runtimeHost === '::1' || runtimeHost === '[::1]'
export const API_BASE = !import.meta.env.DEV && isLoopback(rawApiUrl) && !onLoopbackHost ? '' : rawApiUrl

/** Demo mode (VITE_DEMO_MODE=true): every request is answered from built-in sample data — no API or database. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

/** Uploaded media is stored as /uploads/… paths on the API. */
export const mediaUrl = (url: string | null | undefined) => (url && url.startsWith('/uploads/') ? API_BASE + url : url ?? '')

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, string> = {}) { super(message) }
}

type CacheEntry = { data: unknown; meta?: PageMeta; ts: number }
const getCache = new Map<string, CacheEntry>()
const MAX_CACHE_ENTRIES = 60

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    getCache.clear()
    return
  }
  for (const k of getCache.keys()) {
    if (k.startsWith(prefix)) getCache.delete(k)
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; signal?: AbortSignal; bypassCache?: boolean }

export async function request<T>(path: string, { method = 'GET', body, signal, bypassCache }: Options = {}): Promise<{ data: T; meta?: PageMeta }> {
  if (DEMO_MODE) {
    const { DemoError, demoRequest } = await import('./demo/mock')
    try {
      return structuredClone(await demoRequest(path, method, body)) // copies, so React sees every change as new data
    } catch (error) {
      if (!(error instanceof DemoError)) throw error
      if (error.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('chazon:unauthorized'))
      throw new ApiError(error.status, error.code, error.message, error.details)
    }
  }
  const isMutation = method !== 'GET'
  if (isMutation) clearApiCache()

  const requestPath = bypassCache && method === 'GET' ? `${path}${path.includes('?') ? '&' : '?'}refresh=1` : path
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api${requestPath}`, {
      method, signal, credentials: 'include',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the Chazon API. Check that it is running and try again.')
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload?.error ?? {}
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('chazon:unauthorized'))
    throw new ApiError(response.status, error.code ?? 'ERROR', error.message ?? `Request failed (${response.status}).`, error.details)
  }

  if (method === 'GET' && !path.startsWith('/auth/')) {
    if (getCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = getCache.keys().next().value
      if (oldestKey) getCache.delete(oldestKey)
    }
    getCache.set(path, { data: payload.data, meta: payload.meta, ts: Date.now() })
  }
  return payload
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }).then(r => r.data),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ?? {} }).then(r => r.data),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }).then(r => r.data),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }).then(r => r.data),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }).then(r => r.data),
}

export const qs = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  const s = search.toString()
  return s ? `?${s}` : ''
}

/**
 * Loads `path` (null = don't load). Hydrates immediately from SWR cache on repeat navigation
 * while revalidating silently in the background so transitions never flash.
 */
export function useApi<T>(path: string | null) {
  const cached = path && !DEMO_MODE ? (getCache.get(path) as { data: T; meta?: PageMeta; ts: number } | undefined) : undefined
  const [state, setState] = useState<{ data?: T; meta?: PageMeta; error?: ApiError; loading: boolean }>(() =>
    cached ? { data: cached.data, meta: cached.meta, loading: false } : { loading: !!path }
  )
  const [version, setVersion] = useState(0)
  const bypassRef = useRef(false)

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    const hit = !DEMO_MODE && !bypassRef.current ? (getCache.get(path) as { data: T; meta?: PageMeta; ts: number } | undefined) : undefined
    const bypass = bypassRef.current
    bypassRef.current = false

    setState(s => ({
      data: hit ? hit.data : s.data,
      meta: hit ? hit.meta : s.meta,
      loading: !hit,
      error: undefined,
    }))

    request<T>(path, { signal: controller.signal, bypassCache: bypass })
      .then(r => setState({ data: r.data, meta: r.meta, loading: false }))
      .catch(error => {
        if (error.name !== 'AbortError') {
          setState(s => ({
            data: s.data,
            meta: s.meta,
            error: error instanceof ApiError ? error : new ApiError(0, 'ERROR', String(error)),
            loading: false,
          }))
        }
      })
    return () => controller.abort()
  }, [path, version])

  const reload = useCallback((force?: unknown) => {
    if (force === true) {
      bypassRef.current = true
      if (path) getCache.delete(path)
    }
    setVersion(v => v + 1)
  }, [path])

  const setData = useCallback((update: T | ((current: T | undefined) => T)) => {
    setState(s => {
      const next = typeof update === 'function' ? (update as (c: T | undefined) => T)(s.data) : update
      if (path && !DEMO_MODE) getCache.set(path, { data: next, meta: s.meta, ts: Date.now() })
      return { ...s, data: next }
    })
  }, [path])

  return { ...state, reload, setData }
}

export const fieldErrors = (error: unknown) => (error instanceof ApiError ? error.details : {})
export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
