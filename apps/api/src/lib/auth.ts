import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { NextFunction, Request, Response } from 'express'
import { isDatabaseUnavailable, prisma, type AdminRole } from '../db'
import { env } from '../env'
import { ApiError } from './http'

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }) => Promise<Buffer>
const SCRYPT = { N: 16384, r: 8, p: 1 }

// ---------- Passwords (scrypt, built into Node) ----------
export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64, SCRYPT)
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`
}
export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(N), r: Number(r), p: Number(p) })
  return timingSafeEqual(actual, expected)
}
/** A fixed hash used to spend the same time on unknown emails as on real ones. */
let dummyHash: Promise<string> | undefined
export const timingDummy = () => (dummyHash ??= hashPassword(randomBytes(16).toString('hex')))

// ---------- The .env Admin (ADMIN_EMAIL / ADMIN_PASSWORD) ----------
// The main login. Its password is compared with the environment value on every sign-in and is never written to the
// database, and its session is a signed cookie — so signing in works even before a database is connected.
// When a database is available, a matching AdminUser row is kept so notes and activity can show who did what;
// its passwordHash is a marker that can never verify.
export const ENV_MANAGED = 'env-managed'
const ENV_ADMIN_FALLBACK_ID = 'env-admin'
export const isEnvAdmin = (email: string) => !!env.ADMIN_EMAIL && email.toLowerCase() === env.ADMIN_EMAIL
export function verifyEnvPassword(password: string) {
  const digest = (v: string) => createHmac('sha256', env.AUTH_SECRET).update(v).digest()
  return !!env.ADMIN_PASSWORD && timingSafeEqual(digest(password), digest(env.ADMIN_PASSWORD))
}
/** Makes sure the .env Admin has an active ADMIN row; a previous .env Admin (email changed) is deactivated. Needs the database. */
export async function ensureEnvAdmin() {
  if (!env.ADMIN_EMAIL) return null
  await prisma.adminUser.updateMany({ where: { passwordHash: ENV_MANAGED, NOT: { email: env.ADMIN_EMAIL } }, data: { active: false } })
  return prisma.adminUser.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { name: env.ADMIN_NAME, role: 'ADMIN', active: true, passwordHash: ENV_MANAGED },
    create: { email: env.ADMIN_EMAIL, name: env.ADMIN_NAME, role: 'ADMIN', active: true, passwordHash: ENV_MANAGED },
  })
}
/** The .env Admin's database id when a database is reachable (cached), otherwise a placeholder id. */
let envAdminRow: Promise<string> | null = null
async function envAdminId() {
  envAdminRow ??= ensureEnvAdmin().then(u => u!.id)
  try { return await envAdminRow } catch { envAdminRow = null; return ENV_ADMIN_FALLBACK_ID }
}
const envAdmin = async (): Promise<SessionUser> => ({ id: await envAdminId(), email: env.ADMIN_EMAIL!, name: env.ADMIN_NAME, role: 'ADMIN', managed: true })

// ---------- Sessions ----------
// Database users: an opaque random cookie token whose HMAC is the Session row id.
// The .env Admin: a signed cookie "env.<payload>.<signature>" verified without the database.
const secure = env.NODE_ENV === 'production'
export const SESSION_COOKIE = secure ? '__Host-chazon_admin' : 'chazon_admin'
const cookieOptions = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' }
const ttlMs = env.SESSION_TTL_HOURS * 3600_000
// ADMIN_PASSWORD is part of the key, so changing it in .env (or rotating AUTH_SECRET) signs every session out.
const sessionKey = `${env.AUTH_SECRET}\u0000${env.ADMIN_PASSWORD ?? ''}`
const sign = (value: string) => createHmac('sha256', sessionKey).update(value).digest('base64url')
const sessionId = (token: string) => createHmac('sha256', sessionKey).update(token).digest('hex')

function setEnvSessionCookie(res: Response) {
  const payload = Buffer.from(JSON.stringify({ e: env.ADMIN_EMAIL, x: Date.now() + ttlMs })).toString('base64url')
  res.cookie(SESSION_COOKIE, `env.${payload}.${sign(`env.${payload}`)}`, { ...cookieOptions, maxAge: ttlMs })
}
/** Reads a signed .env-Admin cookie; returns its expiry, or null if it is invalid, expired or for a different ADMIN_EMAIL. */
function readEnvSession(token: string) {
  const [prefix, payload, signature] = token.split('.')
  if (prefix !== 'env' || !payload || !signature) return null
  const expected = Buffer.from(sign(`env.${payload}`))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { e: string; x: number }
    return env.ADMIN_EMAIL && e === env.ADMIN_EMAIL && x > Date.now() ? x : null
  } catch { return null }
}

/** Signs in the .env Admin. No database needed; the last-login time is recorded only if one is available. */
export async function createEnvSession(res: Response) {
  setEnvSessionCookie(res)
  void ensureEnvAdmin().then(u => u && prisma.adminUser.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } })).catch(() => {})
  return envAdmin()
}
export async function createSession(res: Response, req: Request, userId: string) {
  const token = randomBytes(32).toString('base64url')
  await prisma.session.create({
    data: { id: sessionId(token), userId, expiresAt: new Date(Date.now() + ttlMs), userAgent: req.get('user-agent')?.slice(0, 300), ip: req.ip },
  })
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: ttlMs })
}
export async function destroySession(req: Request, res: Response) {
  const token = readCookie(req, SESSION_COOKIE)
  if (token && !token.startsWith('env.')) await prisma.session.deleteMany({ where: { id: sessionId(token) } }).catch(() => {})
  res.clearCookie(SESSION_COOKIE, cookieOptions)
}
export const destroyUserSessions = (userId: string, exceptReq?: Request) => {
  const token = exceptReq && readCookie(exceptReq, SESSION_COOKIE)
  return prisma.session.deleteMany({ where: { userId, ...(token ? { NOT: { id: sessionId(token) } } : {}) } })
}

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) { try { return decodeURIComponent(rest.join('=')) } catch { return undefined } }
  }
}

export type SessionUser = { id: string; email: string; name: string; role: AdminRole; managed: boolean }
declare module 'express-serve-static-core' {
  interface Request { admin?: SessionUser }
}

/** The signed-in admin for this request, or null. Valid sessions slide forward while in use. */
export async function currentUser(req: Request, res: Response): Promise<SessionUser | null> {
  const token = readCookie(req, SESSION_COOKIE)
  if (!token) return null
  if (token.startsWith('env.')) {
    const expires = readEnvSession(token)
    if (!expires) return null
    if (expires - Date.now() < ttlMs / 2) setEnvSessionCookie(res)
    return envAdmin()
  }
  let session
  try {
    session = await prisma.session.findUnique({ where: { id: sessionId(token) }, include: { user: true } })
  } catch (error) {
    if (isDatabaseUnavailable(error)) return null // database users can't be verified without the database
    throw error
  }
  if (!session || session.expiresAt < new Date() || !session.user.active || session.user.passwordHash === ENV_MANAGED) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  if (session.expiresAt.getTime() - Date.now() < ttlMs / 2) {
    await prisma.session.update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + ttlMs) } })
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: ttlMs })
  }
  const { id, email, name, role } = session.user
  return { id, email, name, role, managed: false }
}

/** Requires a valid session for an active admin user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await currentUser(req, res)
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', req.headers.cookie?.includes(SESSION_COOKIE) ? 'Your session has expired. Please sign in again.' : 'Please sign in.')
  req.admin = user
  next()
}

export const requireRole = (...roles: AdminRole[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.admin || !roles.includes(req.admin.role)) throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to do that.')
  next()
}

/** CSRF defence in depth (on top of SameSite cookies): state-changing admin requests must come from the Admin origin. */
export function requireAdminOrigin(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (origin && origin !== env.ADMIN_URL) throw new ApiError(403, 'FORBIDDEN', 'Request origin not allowed.')
  if (!origin && req.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'FORBIDDEN', 'Request origin not allowed.')
  next()
}

export const passwordRule = 'Use at least 12 characters'
export const isStrongPassword = (password: string) => password.length >= 12 && password.length <= 200
