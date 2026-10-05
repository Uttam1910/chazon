import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../db'
import { createEnvSession, createSession, currentUser, destroySession, destroyUserSessions, hashPassword, isEnvAdmin, isStrongPassword, passwordRule, requireAuth, timingDummy, verifyEnvPassword, verifyPassword } from '../lib/auth'
import { ApiError, ok, parse } from '../lib/http'

export const authRouter = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' } }),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password').max(200),
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body)
  // The .env Admin: checked against ADMIN_PASSWORD, never against the database (which may not exist yet).
  if (isEnvAdmin(email)) {
    if (!verifyEnvPassword(password)) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
    return ok(res, await createEnvSession(res))
  }
  const user = await prisma.adminUser.findUnique({ where: { email } })
  const valid = user ? await verifyPassword(password, user.passwordHash) : (await verifyPassword(password, await timingDummy()), false)
  if (!user || !valid || !user.active) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
  await prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } })
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession(res, req, user.id)
  ok(res, { id: user.id, email: user.email, name: user.name, role: user.role, managed: false })
})

authRouter.post('/logout', async (req, res) => {
  await destroySession(req, res)
  ok(res, { signedOut: true })
})

// Session probe used by the Admin on load: `data` is the signed-in user, or null (not an error) when signed out.
authRouter.get('/me', async (req, res) => ok(res, await currentUser(req, res)))

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(200),
  newPassword: z.string().max(200).refine(isStrongPassword, passwordRule),
})
authRouter.post('/change-password', requireAuth, async (req, res) => {
  if (req.admin!.managed) throw new ApiError(409, 'ENV_MANAGED', 'This account’s password is set by ADMIN_PASSWORD in the .env file.')
  const { currentPassword, newPassword } = parse(passwordSchema, req.body)
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: req.admin!.id } })
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new ApiError(422, 'VALIDATION_ERROR', 'Your current password is incorrect.', { currentPassword: 'Incorrect password' })
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } })
  await destroyUserSessions(user.id, req) // sign out every other device
  ok(res, { changed: true })
})
