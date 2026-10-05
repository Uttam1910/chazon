import { useCallback, useEffect, useState } from 'react'
import type { PageMeta } from '@chazon/shared'

// The API origin. In development it defaults to the local API; in production set VITE_API_URL
// (same site as the Admin, e.g. https://api.example.com for https://admin.example.com) or serve /api from the Admin's origin.
export const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '')

/** Demo mode (VITE_DEMO_MODE=true): every request is answered from built-in sample data — no API or database. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

/** Uploaded media is stored as /uploads/… paths on the API. */
export const mediaUrl = (url: string | null | undefined) => (url && url.startsWith('/uploads/') ? API_BASE + url : url ?? '')

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, string> = {}) { super(message) }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; signal?: AbortSignal }

export async function request<T>(path: string, { method = 'GET', body, signal }: Options = {}): Promise<{ data: T; meta?: PageMeta }> {
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
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
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

/** Loads `path` (null = don't load). Keeps previous data while reloading, so lists don't flash. */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data?: T; meta?: PageMeta; error?: ApiError; loading: boolean }>({ loading: !!path })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    setState(s => ({ ...s, loading: true, error: undefined }))
    request<T>(path, { signal: controller.signal })
      .then(r => setState({ data: r.data, meta: r.meta, loading: false }))
      .catch(error => { if (error.name !== 'AbortError') setState(s => ({ ...s, error: error instanceof ApiError ? error : new ApiError(0, 'ERROR', String(error)), loading: false })) })
    return () => controller.abort()
  }, [path, version])
  const reload = useCallback(() => setVersion(v => v + 1), [])
  const setData = useCallback((update: T | ((current: T | undefined) => T)) => {
    setState(s => ({ ...s, data: typeof update === 'function' ? (update as (c: T | undefined) => T)(s.data) : update }))
  }, [])
  return { ...state, reload, setData }
}

export const fieldErrors = (error: unknown) => (error instanceof ApiError ? error.details : {})
export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
