import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

// Secrets come from the environment. Locally they are read from the repository-root .env (see .env.example);
// values already set in the process environment take precedence.
// (Both src/env.ts and the bundled dist/index.js sit two levels below the repository root.)
const rootEnv = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const auditEnv = fileURLToPath(new URL('../../../audit/website-audit-tool/.env', import.meta.url))
if (existsSync(auditEnv)) process.loadEnvFile(auditEnv)

const isProduction = process.env.NODE_ENV === 'production'
const isVercel = Boolean(process.env.VERCEL)
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
const isLoopbackUrl = (value?: string) => {
  if (!value) return false
  try {
    return LOOPBACK_HOSTS.has(new URL(value).hostname.toLowerCase())
  } catch {
    return false
  }
}
const toOrigin = (host?: string) => (host ? (host.startsWith('http') ? host : `https://${host}`).replace(/\/$/, '') : '')
const vercelOrigins = new Set(
  [
    toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    toOrigin(process.env.VERCEL_BRANCH_URL),
    toOrigin(process.env.VERCEL_URL),
  ].filter(Boolean),
)
const vercelDefaultOrigin =
  toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  toOrigin(process.env.VERCEL_BRANCH_URL) ||
  toOrigin(process.env.VERCEL_URL)

const optional = z.string().trim().optional().transform(v => v || undefined)
const origin = (fallback: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform(v => {
      const cleaned = v && !(isVercel && isProduction && isLoopbackUrl(v)) ? v : ''
      return (cleaned || vercelDefaultOrigin || (isProduction ? '' : fallback)).replace(/\/$/, '')
    })

const rawAuthSecret = process.env.AUTH_SECRET?.trim()
if (isVercel && (!rawAuthSecret || rawAuthSecret.length < 32)) {
  console.warn('AUTH_SECRET is missing or under 32 chars; using an ephemeral runtime secret on Vercel.')
}
const authSecretSchema = isVercel
  ? z.string().optional().transform(v => (v && v.trim().length >= 32 ? v.trim() : randomBytes(32).toString('hex')))
  : z.string({ error: 'AUTH_SECRET is required (generate one with `openssl rand -base64 48`)' }).min(32, 'AUTH_SECRET must be at least 32 characters (generate one with `openssl rand -base64 48`)')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  // Optional until a database is set up: without it only the .env Admin sign-in works.
  DATABASE_URL: optional,
  AUTH_SECRET: authSecretSchema,
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  PUBLIC_SITE_URL: origin('http://localhost:5173'),
  ADMIN_URL: origin('http://localhost:5174'),
  API_URL: origin('http://localhost:5000'),
  RESEND_API_KEY: optional,
  RESEND_FROM_EMAIL: optional,
  CHAZON_NOTIFICATION_EMAIL: optional,
  UPLOAD_DIR: optional,
  // The main Admin login. Credentials live only here — they are checked against the environment, never stored in the database.
  ADMIN_EMAIL: z.string().trim().toLowerCase().optional().transform(v => v || undefined).pipe(z.email('ADMIN_EMAIL must be a valid email address').optional()),
  ADMIN_PASSWORD: z.string().optional().transform(v => v || undefined).pipe(z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').max(200).optional()),
  ADMIN_NAME: z.string().trim().max(100).optional().transform(v => v || 'Chazon Admin'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(isVercel ? 1 : 0).transform(v => (isVercel && v < 1 ? 1 : v)),
  // Website Audit Engine settings
  PAGESPEED_API_KEY: optional,
  MAX_CONCURRENT_AUDITS: z.coerce.number().int().positive().default(2),
  DEFAULT_CRAWL_PAGES: z.coerce.number().int().min(1).default(10),
  MAX_CRAWL_PAGES: z.coerce.number().int().min(1).default(25),
  RATE_LIMIT_AUDITS_PER_WINDOW: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  AUDIT_USER_AGENT_TOKEN: z.string().trim().optional().transform(v => v || 'WebsiteAuditAnalyzer'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid API configuration:')
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  console.error('Copy .env.example to .env at the repository root and fill in the values.')
  process.exit(1)
}
export const env = parsed.data
if (!!env.ADMIN_EMAIL !== !!env.ADMIN_PASSWORD) {
  console.error('Set both ADMIN_EMAIL and ADMIN_PASSWORD (or neither).')
  process.exit(1)
}
if (isProduction && !isVercel) {
  for (const key of ['PUBLIC_SITE_URL', 'ADMIN_URL', 'API_URL'] as const) {
    if (!env[key]) { console.error(`${key} is required in production.`); process.exit(1) }
  }
}
export const emailConfigured = !!(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)

function originEquivalent(a: string, b: string): boolean {
  if (a === b) return true
  try {
    const ua = new URL(a)
    const ub = new URL(b)
    if (ua.protocol !== ub.protocol || ua.port !== ub.port) return false
    const ha = ua.hostname.replace(/^www\./i, '').toLowerCase()
    const hb = ub.hostname.replace(/^www\./i, '').toLowerCase()
    return ha === hb
  } catch {
    return false
  }
}

export function getRequestOrigin(req: { header?: (name: string) => string | undefined; headers?: Record<string, string | string[] | undefined> }): string | undefined {
  const pick = (name: string) => {
    const raw = req.header ? req.header(name) : req.headers?.[name]
    const first = Array.isArray(raw) ? raw[0] : raw
    return first?.split(',')[0]?.trim() || undefined
  }
  const host = pick('x-forwarded-host') || pick('host')
  if (!host) return undefined
  const proto = pick('x-forwarded-proto') || (isVercel || isProduction ? 'https' : 'http')
  return `${proto}://${host}`.replace(/\/$/, '')
}

/** Checks a browser Origin against configured origins (allowing apex/www pairs) and active Vercel deployment origins. */
export function isAllowedOrigin(reqOrigin: string | undefined, ...explicit: Array<string | undefined>) {
  if (!reqOrigin) return true
  if (explicit.some(candidate => Boolean(candidate) && originEquivalent(reqOrigin, candidate!))) return true
  if (isVercel) {
    for (const candidate of vercelOrigins) {
      if (originEquivalent(reqOrigin, candidate)) return true
    }
  }
  return false
}
