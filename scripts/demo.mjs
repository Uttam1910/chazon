// npm run demo — the whole stack with sample data and a demo login, no database setup needed.
// Starts a private PostgreSQL in .demo/ (git-ignored), applies migrations, loads the baseline content plus demo
// data, then runs the website, Admin and API. Your .env and any real database are never touched.
//   npm run demo          start (data is kept between runs)
//   npm run demo:reset    stop the demo database and delete it
// Requires the PostgreSQL command-line tools (initdb, pg_ctl, psql), e.g. `brew install postgresql@16`.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, '.demo')
const dataDir = join(dir, 'pgdata')
const PG_PORT = 54320
const DATABASE_URL = `postgresql://chazon@127.0.0.1:${PG_PORT}/chazon_demo`
const DEMO = { email: 'demo@chazon.local', password: 'chazon-demo-2026', name: 'Demo Admin' }
const win = process.platform === 'win32'

const run = (cmd, args, options = {}) => spawnSync(cmd, args, { encoding: 'utf8', shell: win, ...options })
const fail = message => { console.error(`\n✖ ${message}\n`); process.exit(1) }
const pgCtl = args => run('pg_ctl', ['-D', dataDir, ...args])
const stopDb = () => { if (existsSync(dataDir) && pgCtl(['status']).status === 0) pgCtl(['stop', '-m', 'fast']) }

if (process.argv.includes('--reset')) {
  stopDb()
  rmSync(dir, { recursive: true, force: true })
  console.log('Demo database stopped and deleted. Run `npm run demo` to start fresh.')
  process.exit(0)
}

if (run('pg_ctl', ['--version']).status !== 0) fail('PostgreSQL command-line tools were not found (initdb, pg_ctl, psql). Install them, e.g. `brew install postgresql@16`, then run `npm run demo` again.')

const portFree = port => new Promise(resolve => {
  const server = createServer().once('error', () => resolve(false)).once('listening', () => server.close(() => resolve(true)))
  server.listen(port, '0.0.0.0')
})
const busy = []
for (const port of [5000, 5173, 5174]) if (!(await portFree(port))) busy.push(port)
if (busy.length) fail(`Port${busy.length > 1 ? 's' : ''} ${busy.join(', ')} ${busy.length > 1 ? 'are' : 'is'} in use. Stop \`npm run dev\` (or whatever is using ${busy.length > 1 ? 'them' : 'it'}) and run \`npm run demo\` again.`)

// 1. Private PostgreSQL in .demo/pgdata
mkdirSync(dir, { recursive: true })
if (!existsSync(dataDir)) {
  console.log('• Creating the demo database (first run only)…')
  const init = run('initdb', ['-D', dataDir, '-U', 'chazon', '--auth=trust', '-E', 'UTF8'])
  if (init.status !== 0) fail(`initdb failed:\n${init.stderr}`)
}
if (pgCtl(['status']).status !== 0) {
  const start = pgCtl(['-o', `-p ${PG_PORT} -c listen_addresses=127.0.0.1 -k ""`, '-l', join(dir, 'postgres.log'), '-w', 'start'])
  if (start.status !== 0) fail(`Could not start the demo database (see .demo/postgres.log):\n${start.stderr || start.stdout}`)
}
const exists = run('psql', ['-h', '127.0.0.1', '-p', String(PG_PORT), '-U', 'chazon', '-d', 'postgres', '-tAc', "SELECT 1 FROM pg_database WHERE datname = 'chazon_demo'"])
if (exists.stdout.trim() !== '1') {
  const created = run('createdb', ['-h', '127.0.0.1', '-p', String(PG_PORT), '-U', 'chazon', 'chazon_demo'])
  if (created.status !== 0) fail(`createdb failed:\n${created.stderr}`)
}

// 2. Demo environment: overrides .env for this run only (an empty value disables Resend so no emails are sent).
const env = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_URL, DIRECT_URL: '',
  AUTH_SECRET: 'demo-only-secret-not-for-production-use-0123456789',
  ADMIN_EMAIL: DEMO.email, ADMIN_PASSWORD: DEMO.password, ADMIN_NAME: DEMO.name,
  PORT: '5000', PUBLIC_SITE_URL: 'http://localhost:5173', ADMIN_URL: 'http://localhost:5174', API_URL: 'http://localhost:5000',
  VITE_API_URL: 'http://localhost:5000', VITE_SITE_URL: '',
  RESEND_API_KEY: '', RESEND_FROM_EMAIL: '', CHAZON_NOTIFICATION_EMAIL: '',
}
const npm = (args, label) => {
  console.log(`• ${label}…`)
  const result = run('npm', args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
  if (result.status !== 0) { stopDb(); fail(`${label} failed:\n${result.stdout}\n${result.stderr}`) }
}
npm(['run', 'db:deploy'], 'Applying database migrations')
npm(['run', 'db:seed'], 'Loading services, industries and settings')
npm(['run', 'db:seed:demo'], 'Loading demo leads, audits, articles, case studies and testimonials')

console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │  Chazon demo                                             │
  │                                                          │
  │  Website   http://localhost:5173                         │
  │  Admin     http://localhost:5174                         │
  │  API       http://localhost:5000                         │
  │                                                          │
  │  Admin login                                             │
  │    Email     ${DEMO.email.padEnd(44)}│
  │    Password  ${DEMO.password.padEnd(44)}│
  │                                                          │
  │  Ctrl+C stops everything. npm run demo:reset wipes data. │
  └──────────────────────────────────────────────────────────┘
`)

// 3. Run the three apps; stop the demo database when they exit.
const dev = spawn('npm', ['run', 'dev'], { cwd: root, env, stdio: 'inherit', shell: win })
let stopping = false
const shutdown = () => { if (stopping) return; stopping = true; dev.kill('SIGINT') }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
dev.on('exit', code => { stopDb(); console.log('\nDemo stopped.'); process.exit(code ?? 0) })
