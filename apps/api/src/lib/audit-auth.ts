import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { prisma } from '../db'
import { env } from '../env'

export const AUDIT_SESSION_COOKIE = 'chazon_audit_session'
const AUDIT_TOKEN_TTL_MS = 30 * 24 * 3600_000 // 30 days

const secure = env.NODE_ENV === 'production'
export const auditCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: AUDIT_TOKEN_TTL_MS,
}

const sign = (value: string) =>
  createHmac('sha256', env.AUTH_SECRET).update(value).digest('base64url')

export interface AuditTokenPayload {
  userId: string
  email: string
  exp: number
}

/** Signs a tamper-proof session token for audit users */
export function issueAuditToken(userId: string, email: string): string {
  const payload: AuditTokenPayload = {
    userId,
    email: email.trim().toLowerCase(),
    exp: Date.now() + AUDIT_TOKEN_TTL_MS,
  }
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(`audit.${payloadEncoded}`)
  return `audit.${payloadEncoded}.${signature}`
}

/** Verifies and decodes an audit session token */
export function verifyAuditToken(token: string): AuditTokenPayload | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'audit') return null
  const [, payloadEncoded, signature] = parts
  const expectedSignature = sign(`audit.${payloadEncoded}`)

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8')) as AuditTokenPayload
    if (!decoded.userId || !decoded.email || !decoded.exp) return null
    if (decoded.exp <= Date.now()) return null
    return decoded
  } catch {
    return null
  }
}

/** Hashes a 6-digit OTP code using SHA-256 for secure storage */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex')
}

/** Compares user-provided code with stored hash in constant time */
export function verifyOtpHash(code: string, storedHash: string): boolean {
  const computed = Buffer.from(hashOtp(code), 'hex')
  const target = Buffer.from(storedHash, 'hex')
  if (computed.length !== target.length) return false
  return timingSafeEqual(computed, target)
}

/** Extracts the raw token from Bearer header or cookie */
export function getRawAuditToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    for (const c of cookies) {
      if (c.startsWith(`${AUDIT_SESSION_COOKIE}=`)) {
        return decodeURIComponent(c.slice(AUDIT_SESSION_COOKIE.length + 1))
      }
    }
  }

  return null
}

/** Resolves the current authenticated AuditUser from the request, or null */
export async function getAuthenticatedAuditUser(req: Request) {
  const token = getRawAuditToken(req)
  if (!token) return null

  const payload = verifyAuditToken(token)
  if (!payload) return null

  try {
    const user = await prisma.auditUser.findUnique({
      where: { id: payload.userId },
    })
    return user
  } catch {
    return null
  }
}

/** Verifies Google ID Token via Google's tokeninfo API */
export async function verifyGoogleToken(idToken: string): Promise<{
  email: string
  name: string
  sub: string
}> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Google token validation failed (${res.status}): ${errText}`)
  }

  const data = (await res.json()) as {
    email?: string
    name?: string
    sub?: string
    email_verified?: string | boolean
  }

  if (!data.email || !data.sub) {
    throw new Error('Google token did not contain required email or subject identification.')
  }

  const isVerified = data.email_verified === true || data.email_verified === 'true'
  if (!isVerified) {
    throw new Error('Google account email is not verified.')
  }

  return {
    email: data.email.toLowerCase().trim(),
    name: data.name?.trim() || data.email.split('@')[0],
    sub: data.sub,
  }
}

/** Automatically syncs an audit user into Chazon Admin Leads */
export async function syncAuditUserToLead(params: {
  userId: string
  name: string
  email: string
  companyName?: string | null
  domain?: string | null
  auditRef?: string | null
}) {
  try {
    const user = await prisma.auditUser.findUnique({ where: { id: params.userId } })
    if (!user) return null

    const business = params.companyName || params.domain || `${params.name}'s Business`
    const website = params.domain
      ? params.domain.startsWith('http')
        ? params.domain
        : `https://${params.domain}`
      : null

    if (user.leadId) {
      const updated = await prisma.lead.update({
        where: { id: user.leadId },
        data: {
          name: params.name,
          businessName: business,
          email: params.email,
          ...(website ? { website } : {}),
          ...(params.auditRef ? { auditRef: params.auditRef } : {}),
        },
      })
      return updated
    }

    const created = await prisma.lead.create({
      data: {
        name: params.name,
        businessName: business,
        email: params.email,
        phone: '',
        website,
        service: 'Website Audit (Instant Scan)',
        source: 'Website Audit Gate',
        status: 'NEW',
        ...(params.auditRef ? { auditRef: params.auditRef } : {}),
      },
    })

    await prisma.auditUser.update({
      where: { id: user.id },
      data: { leadId: created.id },
    })

    return created
  } catch (err) {
    console.error('[audit-auth] Failed to sync audit user to lead CRM:', err)
    return null
  }
}
