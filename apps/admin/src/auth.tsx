import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { AdminRole } from '@chazon/shared'
import { ApiError, api } from './api'
import { FullPageState } from './ui/States'
import { AuthContext, useAuth, type AdminUser, type AuthState } from './auth-context'


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [status, setStatus] = useState<AuthState['status']>('loading')
  const check = useCallback(() => {
    setStatus('loading')
    api.get<AdminUser | null>('/auth/me')
      .then(u => { setUser(u); setStatus('ready') })
      .catch(e => { setUser(null); setStatus(e instanceof ApiError && e.status === 0 ? 'offline' : 'ready') })
  }, [])
  useEffect(check, [check])
  // Any 401 from the API (expired or revoked session) signs the user out of the UI.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('chazon:unauthorized', onUnauthorized)
    return () => window.removeEventListener('chazon:unauthorized', onUnauthorized)
  }, [])
  const login = useCallback(async (email: string, password: string) => { setUser(await api.post<AdminUser>('/auth/login', { email, password })) }, [])
  const logout = useCallback(async () => { await api.post('/auth/logout').catch(() => {}); setUser(null) }, [])
  return <AuthContext.Provider value={{ user, status, login, logout, retry: check }}>{children}</AuthContext.Provider>
}

/** Renders children only for a signed-in user; otherwise redirects to /login, remembering where they were going. */
export function RequireAuth({ children, role }: { children: ReactNode; role?: AdminRole }) {
  const { user, status, retry } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageState title="Loading Chazon Admin…" loading/>
  if (status === 'offline') return <FullPageState title="Cannot reach the Chazon API" message="Check that the API is running, then try again." action={{ label: 'Try again', onClick: retry }}/>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }}/>
  if (role && user.role !== role) return <FullPageState title="Not authorised" message="You do not have permission to view this page."/>
  return children
}
