import { Router, json, type Request, type Response } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../db'
import { env } from '../env'
import {
  AUDIT_SESSION_COOKIE,
  auditCookieOptions,
  findAuditUser,
  getAuthenticatedAuditUser,
  hashOtp,
  issueAuditToken,
  syncAuditUserToLead,
  verifyGoogleToken,
  verifyOtpHash,
} from '../lib/audit-auth'
import { sendAuditOtpEmail } from '../lib/email'
import { ApiError, ok, parse } from '../lib/http'

export const auditAuthRouter = Router()

// CORS handling for public audit auth
const auditAuthCors = cors({
  origin: (_origin, cb) => cb(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  maxAge: 86400,
})

auditAuthRouter.use(auditAuthCors)
auditAuthRouter.use(json({ limit: '64kb' }))

// Rate limit OTP send requests
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many verification requests. Please wait a few minutes before trying again.',
    },
  },
})

// Rate limit OTP verification attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many verification attempts. Please wait 15 minutes.',
    },
  },
})

const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address')),
  name: z.string().trim().min(1, 'Please enter your name').max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  domain: z.string().trim().max(200).optional(),
})

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address')),
  code: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
  name: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  domain: z.string().trim().max(200).optional(),
})

const googleAuthSchema = z.object({
  credential: z.string().min(10, 'Missing Google ID token credential'),
  companyName: z.string().trim().max(120).optional(),
  domain: z.string().trim().max(200).optional(),
})

/**
 * Request a 6-digit OTP sent to email.
 */
auditAuthRouter.post('/send-otp', otpSendLimiter, async (req: Request, res: Response) => {
  const { email, name, companyName, domain } = parse(sendOtpSchema, req.body)

  const existingUser = await findAuditUser({ email })
  const alreadyAudited = Boolean(existingUser?.hasAudited)

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = hashOtp(code)
  const expiresAt = new Date(Date.now() + 10 * 60_000) // 10 minutes

  // Upsert OTP record
  await prisma.auditOtp.upsert({
    where: { email },
    create: {
      email,
      codeHash,
      name: name ?? existingUser?.name ?? null,
      company: companyName ?? existingUser?.companyName ?? null,
      domain: domain ?? existingUser?.domain ?? null,
      expiresAt,
      attempts: 0,
    },
    update: {
      codeHash,
      ...(name ? { name } : {}),
      ...(companyName ? { company: companyName } : {}),
      ...(domain ? { domain } : {}),
      expiresAt,
      attempts: 0,
    },
  })

  // Send branded verification email
  const sendResult = await sendAuditOtpEmail({
    to: email,
    code,
    name: name || existingUser?.name,
  })

  if (!sendResult.ok) {
    console.error(`[audit-auth] Failed to deliver OTP to ${email}:`, sendResult.error)
    throw new ApiError(500, 'EMAIL_DELIVERY_FAILED', 'Failed to send verification email. Please try again.')
  }

  ok(res, {
    sent: true,
    email,
    alreadyAudited,
    message: alreadyAudited
      ? 'Welcome back! We sent a 6-digit verification code to load your saved audit report.'
      : 'Verification code sent to your email.',
  })
})

/**
 * Verify 6-digit OTP and sign in / register.
 */
auditAuthRouter.post('/verify-otp', otpVerifyLimiter, async (req: Request, res: Response) => {
  const { email, code, name, companyName, domain } = parse(verifyOtpSchema, req.body)

  const otp = await prisma.auditOtp.findUnique({ where: { email } })
  if (!otp) {
    throw new ApiError(400, 'INVALID_OTP', 'No pending verification found for this email. Please request a new code.')
  }

  if (otp.expiresAt.getTime() <= Date.now()) {
    await prisma.auditOtp.delete({ where: { email } }).catch(() => {})
    throw new ApiError(400, 'EXPIRED_OTP', 'Verification code has expired. Please request a new code.')
  }

  if (otp.attempts >= 5) {
    await prisma.auditOtp.delete({ where: { email } }).catch(() => {})
    throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new code.')
  }

  const isValid = verifyOtpHash(code, otp.codeHash)
  if (!isValid) {
    await prisma.auditOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    })
    throw new ApiError(400, 'INVALID_CODE', 'Incorrect 6-digit verification code. Please check and try again.')
  }

  // Code verified: delete OTP record
  await prisma.auditOtp.delete({ where: { email } }).catch(() => {})

  const finalName = name || otp.name || email.split('@')[0]
  const finalCompany = companyName || otp.company || null
  const finalDomain = domain || otp.domain || null

  const existingUser = await findAuditUser({ email })
  const alreadyAudited = Boolean(existingUser?.hasAudited)

  // Keep the domain that was actually audited; do not overwrite with new target URL
  let auditedDomain = existingUser?.domain || domain || null
  if (existingUser?.hasAudited && existingUser.auditJobId) {
    const job = await prisma.auditJob.findUnique({ where: { id: existingUser.auditJobId } })
    const jobReport = job?.report as { finalUrl?: string; inputUrl?: string } | null
    if (jobReport?.finalUrl || jobReport?.inputUrl) {
      auditedDomain = jobReport.finalUrl || jobReport.inputUrl || auditedDomain
    }
  }

  // Upsert AuditUser
  const user = await prisma.auditUser.upsert({
    where: { email },
    create: {
      email,
      name: finalName,
      companyName: finalCompany,
      domain: finalDomain,
      authProvider: 'EMAIL_OTP',
    },
    update: {
      ...(name ? { name } : {}),
      ...(finalCompany ? { companyName: finalCompany } : {}),
      ...(alreadyAudited ? { domain: auditedDomain } : finalDomain ? { domain: finalDomain } : {}),
    },
  })

  // Issue session token and cookie
  const token = issueAuditToken(user.id, user.email)
  res.cookie(AUDIT_SESSION_COOKIE, token, auditCookieOptions)

  // Sync to Leads CRM
  void syncAuditUserToLead({
    userId: user.id,
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    domain: user.domain,
  })

  ok(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      domain: user.domain,
      hasAudited: user.hasAudited,
      auditJobId: user.auditJobId,
    },
  })
})

/**
 * Sign in / register via Google ID token.
 */
auditAuthRouter.post('/google', async (req: Request, res: Response) => {
  const { credential, companyName, domain } = parse(googleAuthSchema, req.body)

  let googleData: { email: string; name: string; sub: string }
  try {
    googleData = await verifyGoogleToken(credential)
  } catch (err) {
    throw new ApiError(401, 'GOOGLE_AUTH_FAILED', (err as Error).message || 'Google authentication failed.')
  }

  const existingUser = await findAuditUser({ email: googleData.email })
  const alreadyAudited = Boolean(existingUser?.hasAudited)

  // Keep the domain that was actually audited; do not overwrite with new target URL
  let auditedDomain = existingUser?.domain || domain || null
  if (existingUser?.hasAudited && existingUser.auditJobId) {
    const job = await prisma.auditJob.findUnique({ where: { id: existingUser.auditJobId } })
    const jobReport = job?.report as { finalUrl?: string; inputUrl?: string } | null
    if (jobReport?.finalUrl || jobReport?.inputUrl) {
      auditedDomain = jobReport.finalUrl || jobReport.inputUrl || auditedDomain
    }
  }

  const user = await prisma.auditUser.upsert({
    where: { email: googleData.email },
    create: {
      email: googleData.email,
      name: googleData.name,
      companyName: companyName || null,
      domain: domain || null,
      authProvider: 'GOOGLE',
      googleSub: googleData.sub,
    },
    update: {
      googleSub: googleData.sub,
      ...(companyName ? { companyName } : {}),
      ...(alreadyAudited ? { domain: auditedDomain } : domain ? { domain } : {}),
    },
  })

  const token = issueAuditToken(user.id, user.email)
  res.cookie(AUDIT_SESSION_COOKIE, token, auditCookieOptions)

  void syncAuditUserToLead({
    userId: user.id,
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    domain: user.domain,
  })

  ok(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      domain: user.domain,
      hasAudited: user.hasAudited,
      auditJobId: user.auditJobId,
    },
  })
})

/**
 * Check current authenticated audit user state.
 */
auditAuthRouter.get('/me', async (req: Request, res: Response) => {
  const user = await getAuthenticatedAuditUser(req)
  if (!user) {
    return ok(res, {
      authenticated: false,
      user: null,
    })
  }

  let finalDomain = user.domain
  if (user.hasAudited && user.auditJobId) {
    const job = await prisma.auditJob.findUnique({ where: { id: user.auditJobId } })
    const jobReport = job?.report as { finalUrl?: string; inputUrl?: string } | null
    if (jobReport?.finalUrl || jobReport?.inputUrl) {
      finalDomain = jobReport.finalUrl || jobReport.inputUrl || finalDomain
    }
  }

  ok(res, {
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      domain: finalDomain,
      hasAudited: user.hasAudited,
      auditJobId: user.auditJobId,
    },
  })
})

/**
 * Sign out from audit session.
 */
auditAuthRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(AUDIT_SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  })
  ok(res, { signedOut: true })
})
