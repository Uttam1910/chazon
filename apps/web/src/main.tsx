import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import { App } from './App'
import { sourceDetail } from './config'
import './styles.css'

// Remember how the visitor arrived (campaign or referring site) before any in-site navigation changes the URL.
sourceDetail()

// Fixed pages are prerendered at build time (scripts/prerender.mjs) and hydrated here. Articles, case studies and
// the dev server serve an empty shell, which is rendered from scratch.
const root = document.getElementById('root')!
if (root.hasChildNodes()) {
  // Hydrate with the URL the page was rendered for (no query or hash); the router applies the real one after mount.
  hydrateRoot(root, <StrictMode><App url={window.location.pathname}/></StrictMode>)
} else {
  createRoot(root).render(<StrictMode><App url={window.location.href}/></StrictMode>)
}
