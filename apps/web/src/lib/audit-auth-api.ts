import { config, getRuntimeHostname, isLoopbackHostname } from '../config'

export interface AuditUser {
  id: string
  name: string
  email: string
  companyName?: string | null
  domain?: string | null
  hasAudited: boolean
  auditJobId?: string | null
}

const STORAGE_KEY_TOKEN = 'chazon_audit_token'
const STORAGE_KEY_USER = 'chazon_audit_user'

function getCandidateBases(): string[] {
  const list: string[] = ['/api/audit-auth']
  if (config.apiUrl) {
    list.push(`${config.apiUrl.replace(/\/$/, '')}/api/audit-auth`)
  }
  const isLocal = Boolean(import.meta.env.DEV) || isLoopbackHostname(getRuntimeHostname())
  if (isLocal) {
    list.push('http://localhost:5000/api/audit-auth')
  }
  return [...new Set(list)]
}

export function getAuditToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || sessionStorage.getItem(STORAGE_KEY_TOKEN)
  } catch {
    return null
  }
}

export function setAuditToken(token: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token)
      sessionStorage.setItem(STORAGE_KEY_TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      sessionStorage.removeItem(STORAGE_KEY_TOKEN)
      localStorage.removeItem(STORAGE_KEY_USER)
      sessionStorage.removeItem(STORAGE_KEY_USER)
    }
  } catch {
    // Local storage access error handling
  }
}

export function getCachedAuditUser(): AuditUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER) || sessionStorage.getItem(STORAGE_KEY_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedAuditUser(user: AuditUser | null) {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      const serialized = JSON.stringify(user)
      localStorage.setItem(STORAGE_KEY_USER, serialized)
      sessionStorage.setItem(STORAGE_KEY_USER, serialized)
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
      sessionStorage.removeItem(STORAGE_KEY_USER)
    }
  } catch {
    // Ignore storage errors
  }
}

async function requestAuditAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const candidates = getCandidateBases()
  const token = getAuditToken()
  let lastError: Error | null = null

  for (const base of candidates) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${base}${path}`, {
        ...init,
        credentials: 'include',
        headers,
      })

      const data = (await response.json().catch(() => ({}))) as {
        data?: T
        error?: { code?: string; message?: string }
      }

      if (!response.ok) {
        const message = data.error?.message || `Request failed with status ${response.status}`
        throw new Error(message)
      }

      return (data.data !== undefined ? data.data : data) as T
    } catch (err) {
      lastError = err as Error
    }
  }

  throw lastError || new Error('Unable to connect to authentication service.')
}

export const auditAuthApi = {
  getMe: async (): Promise<AuditUser | null> => {
    try {
      const res = await requestAuditAuth<{ authenticated: boolean; user: AuditUser | null }>('/me')
      if (res.authenticated && res.user) {
        setCachedAuditUser(res.user)
        return res.user
      }
      setCachedAuditUser(null)
      return null
    } catch {
      return getCachedAuditUser()
    }
  },

  sendOtp: async (params: {
    email: string
    name?: string
    companyName?: string
    domain?: string
  }): Promise<{ sent: boolean; email: string }> => {
    return await requestAuditAuth<{ sent: boolean; email: string }>('/send-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  verifyOtp: async (params: {
    email: string
    code: string
    name?: string
    companyName?: string
    domain?: string
  }): Promise<{ token: string; user: AuditUser }> => {
    const res = await requestAuditAuth<{ token: string; user: AuditUser }>('/verify-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    if (res.token) {
      setAuditToken(res.token)
    }
    if (res.user) {
      setCachedAuditUser(res.user)
    }
    return res
  },

  googleAuth: async (params: {
    credential: string
    companyName?: string
    domain?: string
  }): Promise<{ token: string; user: AuditUser }> => {
    const res = await requestAuditAuth<{ token: string; user: AuditUser }>('/google', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    if (res.token) {
      setAuditToken(res.token)
    }
    if (res.user) {
      setCachedAuditUser(res.user)
    }
    return res
  },

  logout: async (): Promise<void> => {
    try {
      await requestAuditAuth('/logout', { method: 'POST' })
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuditToken(null)
    }
  },
}
