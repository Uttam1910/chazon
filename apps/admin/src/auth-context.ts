import { createContext, useContext } from 'react'
import type { AdminRole } from '@chazon/shared'

/** `managed`: the .env Admin (ADMIN_EMAIL / ADMIN_PASSWORD) — its password can't be changed in the app. */
export type AdminUser = { id: string; email: string; name: string; role: AdminRole; managed?: boolean }
export type AuthState = {
  user: AdminUser | null
  status: 'loading' | 'ready' | 'offline'
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  retry: () => void
}
export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
