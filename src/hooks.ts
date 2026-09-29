import { useEffect, useRef, useState } from 'react'

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
