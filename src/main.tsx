import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { config } from './config'
import './styles.css'

if (config.siteUrl) {
  const canonical = document.createElement('link')
  canonical.rel = 'canonical'
  canonical.href = config.siteUrl + '/'
  document.head.append(canonical)
  const meta = document.createElement('meta')
  meta.setAttribute('property', 'og:url')
  meta.content = canonical.href
  document.head.append(meta)
  const schema = document.createElement('script')
  schema.type = 'application/ld+json'
  schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Chazon Digital Ventures', url: config.siteUrl, description: 'Revenue-Led Digital Transformation', ...(config.email ? { email: config.email } : {}), address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' } })
  document.head.append(schema)
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
