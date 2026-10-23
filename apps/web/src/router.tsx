import { useCallback, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { parse, RouterContext, useRouter } from './location'

// A minimal History API router. The same tree renders at build time (prerender, given a URL) and in the browser, so
// every page ships as real HTML and then behaves like a single-page app. Links to other origins, downloads, new tabs
// and modified clicks are left to the browser.

/** Scrolls to the element named by the hash, or to the top for a new page. */
function settle(hash: string) {
  const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
  if (target) {
    target.scrollIntoView()
    // Move focus with the view so keyboard and screen-reader users continue from the new section.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  } else {
    window.scrollTo(0, 0)
    // A new page: start keyboard and screen-reader users at its main content, as a full page load would.
    document.getElementById('main')?.focus({ preventScroll: true })
  }
}

export function RouterProvider({ url, children }: { url: string; children: ReactNode }) {
  const [location, setLocation] = useState(() => parse(url))
  useEffect(() => {
    const onPop = () => setLocation(parse(window.location.href))
    // A hydrated page starts from the URL it was prerendered for; pick up the real query and hash once mounted.
    const actual = parse(window.location.href)
    setLocation(current => (current.path === actual.path && current.search === actual.search && current.hash === actual.hash ? current : actual))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const navigate = useCallback((to: string, { replace = false } = {}) => {
    const before = parse(window.location.href)
    const next = parse(new URL(to, window.location.href).href)
    const href = `${next.path}${next.search}${next.hash}`
    if (replace) window.history.replaceState(null, '', href)
    else window.history.pushState(null, '', href)
    setLocation(next)
    // After React commits the new page, move to the requested section (or the top of a new page).
    const samePage = before.path === next.path && before.search === next.search
    if (!samePage || next.hash) requestAnimationFrame(() => settle(next.hash))
  }, [])
  const value = useMemo(() => ({ ...location, navigate }), [location, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

/** An internal link: a normal <a href> (so it works without JavaScript and for crawlers), routed client-side on click. */
export function Link({ to, onClick, children, ...rest }: LinkProps & { children?: ReactNode }) {
  const { navigate } = useRouter()
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target || rest.download !== undefined) return
    const url = new URL(to, window.location.href)
    if (url.origin !== window.location.origin || url.pathname.startsWith('/admin')) return
    e.preventDefault()
    navigate(url.href)
  }
  return <a href={to} onClick={handle} {...rest}>{children}</a>
}
