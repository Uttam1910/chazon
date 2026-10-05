import { useEffect, useSyncExternalStore } from 'react'

// The current page title, shown in the top bar and the browser tab.
let title = ''
const listeners = new Set<() => void>()
export function usePageTitle(next: string) {
  useEffect(() => {
    title = next
    document.title = `${next} · Chazon Admin`
    listeners.forEach(l => l())
  }, [next])
}
export const useCurrentTitle = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l) }, () => title)
