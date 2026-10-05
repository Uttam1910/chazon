import { createApp } from './app'
import { isDatabaseUnavailable, prisma } from './db'
import { ensureEnvAdmin } from './lib/auth'
import { emailConfigured, env } from './env'

const server = createApp().listen(env.PORT, () => {
  console.log(`Chazon API → http://localhost:${env.PORT}  (website origin: ${env.PUBLIC_SITE_URL || 'not set'}, admin origin: ${env.ADMIN_URL || 'not set'})`)
  console.log(env.ADMIN_EMAIL ? `Admin login: ${env.ADMIN_EMAIL} (from ADMIN_EMAIL / ADMIN_PASSWORD in .env)` : 'No ADMIN_EMAIL / ADMIN_PASSWORD set — only database users can sign in.')
  if (!emailConfigured) console.log('Email notifications disabled: set RESEND_API_KEY and RESEND_FROM_EMAIL to enable them.')
})

// Check the database without blocking startup: sign-in with the .env Admin works either way.
prisma.$queryRaw`SELECT 1`.then(() => ensureEnvAdmin()).then(
  () => console.log('Database connected.'),
  error => console.warn(isDatabaseUnavailable(error)
    ? `Database not connected${env.DATABASE_URL ? ' (check DATABASE_URL and run npm run db:migrate)' : ' (DATABASE_URL is not set)'}: Admin sign-in works; leads, content and settings need the database.`
    : `Database check failed: ${(error as Error).message}`),
)

// Expired sessions are removed hourly.
const cleanup = setInterval(() => { prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {}) }, 3600_000)
cleanup.unref()

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)) })
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
