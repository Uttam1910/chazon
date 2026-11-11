// Builds the API bundle, website, and Admin into ONE output layout for a single Vercel project:
//   /        → website  (apps/web/dist)
//   /admin/  → Admin    (apps/admin/dist, built with base "/admin/")
//   /api/*   → Express  (api/index.mjs -> apps/api/dist/app.js)
// VITE_DEMO_MODE applies to the Admin only; the public website is always built without demo data.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const run = (label, args, env) => {
  console.log(`\n▶ ${label}`)
  const result = spawnSync('npm', args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
const vercelSiteUrl = vercelHost ? (vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`).replace(/\/$/, '') : ''

run('Prisma client', ['run', 'db:generate'])
run('API', ['run', 'build:api'])
run('Website', ['run', 'build:web'], {
  VITE_DEMO_MODE: 'false',
  VITE_SAME_ORIGIN_API: 'true',
  ...(vercelSiteUrl && !process.env.VITE_SITE_URL ? { VITE_SITE_URL: vercelSiteUrl } : {}),
})
run('Admin (served at /admin)', ['run', 'build:admin'], { ADMIN_BASE: '/admin/' })

const target = join(root, 'apps/web/dist/admin')
if (existsSync(target)) rmSync(target, { recursive: true })
cpSync(join(root, 'apps/admin/dist'), target, { recursive: true })
console.log('\n✔ Website → apps/web/dist, Admin → apps/web/dist/admin')
