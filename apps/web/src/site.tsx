import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicSite } from '@chazon/shared'
import { config } from './config'
import { SiteContext, compose, fetchPublic } from './site-data'

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<PublicSite>()
  useEffect(() => {
    // Demo mode: sample data is loaded only when the flag is on, so normal builds don't contain it at all.
    if (import.meta.env.VITE_DEMO_MODE === 'true') { void import('./demo-site').then(m => setSite(m.demoSite)); return }
    if (!config.apiUrl) return
    const controller = new AbortController()
    fetchPublic<PublicSite>('/site', controller.signal).then(setSite).catch(() => { /* keep built-in content */ })
    return () => controller.abort()
  }, [])
  const value = useMemo(() => compose(site), [site])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
