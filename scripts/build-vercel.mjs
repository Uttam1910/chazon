// Builds the website and the Admin into ONE output folder for a single Vercel project:
//   /        → website  (apps/web/dist)
//   /admin/  → Admin    (apps/admin/dist, built with base "/admin/")
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

run('Website', ['run', 'build:web'], { VITE_DEMO_MODE: 'false' })
run('Admin (served at /admin)', ['run', 'build:admin'], { ADMIN_BASE: '/admin/' })

const target = join(root, 'apps/web/dist/admin')
if (existsSync(target)) rmSync(target, { recursive: true })
cpSync(join(root, 'apps/admin/dist'), target, { recursive: true })
console.log('\n✔ Website → apps/web/dist, Admin → apps/web/dist/admin')
