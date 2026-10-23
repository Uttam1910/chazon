import { createContext, useContext } from 'react'

// Location state shared by the router (router.tsx) and every component that reads the current URL.

export type Location = { path: string; search: string; hash: string }
export type Router = Location & { navigate: (to: string, options?: { replace?: boolean }) => void }

export const normalizePath = (path: string) => path.replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1') || '/'

export function parse(url: string): Location {
  const u = new URL(url, 'http://local')
  return { path: normalizePath(u.pathname), search: u.search, hash: u.hash }
}

export const RouterContext = createContext<Router>({ ...parse('/'), navigate: () => {} })
export const useRouter = () => useContext(RouterContext)
