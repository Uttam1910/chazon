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
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Chazon Digital Ventures', url: config.siteUrl,
    slogan: 'Revenue-Led Digital Transformation',
    description: 'Chazon Digital Ventures helps businesses build, optimise and grow their digital revenue channels through strategy, technology, marketing and automation.',
    founder: { '@type': 'Person', name: 'Binny Rogin' },
    knowsAbout: ['Digital revenue strategy', 'Website development', 'E-commerce', 'Performance marketing', 'Social media marketing', 'SEO', 'Digital commerce', 'Business automation', 'WhatsApp Business solutions'],
    ...(config.email ? { email: config.email } : {}), ...(config.phone ? { telephone: config.phone } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' },
  })
  document.head.append(schema)
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
