/**
 * Dispatches async background work so serverless runtimes (Vercel waitUntil) keep
 * executing after the HTTP response is sent, while returning a promise only when
 * the caller must await completion before the invocation freezes.
 */
export function dispatchBackground(task: Promise<unknown>): Promise<unknown> | void {
  const safe = task.catch((err) => {
    console.error('Background task error:', err instanceof Error ? err.message : err)
  })
  const ctx = (
    globalThis as Record<
      symbol,
      { get?: () => { waitUntil?: (promise: Promise<unknown>) => void } } | undefined
    >
  )[Symbol.for('@vercel/request-context')]?.get?.()

  if (typeof ctx?.waitUntil === 'function') {
    ctx.waitUntil(safe)
    return
  }
  if (process.env.VERCEL) {
    return safe
  }
}
