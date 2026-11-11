// Vercel Serverless Function entry point: serves all /api/* and /uploads/* routes from the Express app.
import { createApp } from '../apps/api/dist/app.js'

let cachedApp

function getApp() {
  if (!cachedApp) {
    cachedApp = createApp()
  }
  return cachedApp
}

function normalizeRequest(req) {
  const rawUrl = req.url || '/'
  const url = new URL(rawUrl, 'http://localhost')

  if (url.searchParams.has('__path')) {
    const subPath = url.searchParams.get('__path') ?? ''
    url.searchParams.delete('__path')
    const cleaned = subPath.replace(/^\/+/, '')
    req.url = (cleaned ? `/api/${cleaned}` : '/api') + url.search
  } else if (url.searchParams.has('__upload')) {
    const subPath = url.searchParams.get('__upload') ?? ''
    url.searchParams.delete('__upload')
    const cleaned = subPath.replace(/^\/+/, '')
    req.url = (cleaned ? `/uploads/${cleaned}` : '/uploads') + url.search
  } else if (url.pathname === '/api/index') {
    req.url = '/api' + url.search
  }

  // Clear any pre-attached query cache from the serverless runtime so Express parses the cleaned URL.
  try {
    delete req.query
  } catch {
    // Ignore non-configurable properties
  }
}

export default function handler(req, res) {
  normalizeRequest(req)
  return getApp()(req, res)
}
