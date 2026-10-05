import express, { Router, json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { prisma } from './db'
import { env } from './env'
import { requireAdminOrigin, requireAuth, requireRole } from './lib/auth'
import { errorHandler, ok } from './lib/http'
import { auditsRouter } from './routes/audits'
import { authRouter } from './routes/auth'
import { industriesRouter, servicesRouter, testimonialsRouter } from './routes/catalog'
import { dashboardRouter } from './routes/dashboard'
import { caseStudiesRouter, insightsRouter } from './routes/editorial'
import { leadsRouter } from './routes/leads'
import { mediaRouter } from './routes/media'
import { publicRouter } from './routes/public'
import { seoRouter, settingsRouter } from './routes/settings'
import { usersRouter } from './routes/users'
import { uploadDir } from './uploads'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  // Set TRUST_PROXY to the number of proxies in front of the API so rate limits see real client IPs.
  app.set('trust proxy', env.TRUST_PROXY)
  app.use(helmet())

  app.get('/api/health', async (_req, res) => {
    const database = await prisma.$queryRaw`SELECT 1`.then(() => 'connected', () => 'unavailable')
    ok(res, { status: 'ok', database })
  })

  // Uploaded images, readable by the website and Admin on other origins.
  app.use('/uploads', express.static(uploadDir, {
    fallthrough: false, index: false, dotfiles: 'deny', maxAge: '365d', immutable: true,
    setHeaders: res => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'") },
  }))

  // Public website endpoints (their own CORS rules).
  app.use('/api/public', publicRouter)

  // Everything below is the Admin API: credentialed CORS from the Admin origin only, JSON bodies, origin check.
  const admin = Router()
  admin.use(cors({ origin: env.ADMIN_URL || false, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], maxAge: 600 }))
  admin.use(json({ limit: '1mb' }))
  admin.use(requireAdminOrigin)
  admin.use('/auth', authRouter)
  admin.use(requireAuth)
  admin.use('/dashboard', dashboardRouter)
  admin.use('/leads', leadsRouter)
  admin.use('/audits', auditsRouter)
  admin.use('/services', servicesRouter)
  admin.use('/case-studies', caseStudiesRouter)
  admin.use('/insights', insightsRouter)
  admin.use('/industries', industriesRouter)
  admin.use('/testimonials', testimonialsRouter)
  admin.use('/media', mediaRouter)
  admin.use('/seo', seoRouter)
  admin.use('/settings', settingsRouter)
  admin.use('/users', requireRole('ADMIN'), usersRouter)
  app.use('/api', admin)

  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } }))
  app.use(errorHandler)
  return app
}
