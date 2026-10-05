import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 0 → 1 as the element travels from `start` to `end` (fractions of viewport height, measured at the element's top/bottom). */
export function useScrollProgress<T extends HTMLElement>(start = 0.75, end = 0.55) {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) { setProgress(1); return }
    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const from = vh * start - rect.top
      // Starts when the top reaches `start`; completes when the bottom reaches `end`.
      const distance = rect.height + vh * (start - end)
      setProgress(Math.min(1, Math.max(0, from / Math.max(distance, 1))))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [start, end])
  return [ref, progress] as const
}

/** Live result of a media query (e.g. switching the Services explorer between tabs and a stacked layout). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    notify => { const mq = window.matchMedia(query); mq.addEventListener('change', notify); return () => mq.removeEventListener('change', notify) },
    () => window.matchMedia(query).matches,
  )
}
