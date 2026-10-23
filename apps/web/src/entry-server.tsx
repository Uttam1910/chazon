import { renderToString } from 'react-dom/server'
import { App } from './App'
import { matchRoute } from './routes'
import { normalizePath } from './location'
import { HeadContext, renderHead, type Meta } from './seo'

/** Build-time render of one page (used by scripts/prerender.mjs): body markup, <head> tags and HTTP status. */
export function render(path: string) {
  const collector: { meta?: Meta } = {}
  const html = renderToString(<HeadContext.Provider value={collector}><App url={path}/></HeadContext.Provider>)
  return { html, head: collector.meta ? renderHead(collector.meta) : '', status: matchRoute(normalizePath(path)).status }
}

export { PUBLIC_PAGES } from '@chazon/shared'
