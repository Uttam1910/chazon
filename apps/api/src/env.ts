import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

// Secrets come from the environment. Locally they are read from the repository-root .env (see .env.example);
// values already set in the process environment take precedence.
// (Both src/env.ts and the bundled dist/index.js sit two levels below the repository root.)
const rootEnv = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const isProduction = process.env.NODE_ENV === 'production'
const optional = z.string().trim().optional().transform(v => v || undefined)
const origin = (fallback: string) => z.string().trim().optional().transform(v => (v || (isProduction ? '' : fallback)).replace(/\/$/, ''))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  // Optional until a database is set up: without it only the .env Admin sign-in works.
  DATABASE_URL: optional,
  AUTH_SECRET: z.string({ error: 'AUTH_SECRET is required (generate one with `openssl rand -base64 48`)' }).min(32, 'AUTH_SECRET must be at least 32 characters (generate one with `openssl rand -base64 48`)'),
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
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
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
if (isProduction) {
  for (const key of ['PUBLIC_SITE_URL', 'ADMIN_URL', 'API_URL'] as const) {
    if (!env[key]) { console.error(`${key} is required in production.`); process.exit(1) }
  }
}
export const emailConfigured = !!(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)
