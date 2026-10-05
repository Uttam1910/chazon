import { Router } from 'express'
import { z } from 'zod'
import { ADMIN_ROLES } from '@chazon/shared'
import { prisma } from '../db'
import { destroyUserSessions, hashPassword, isEnvAdmin, isStrongPassword, passwordRule } from '../lib/auth'
import { ApiError, notFound, ok, parse, requiredText } from '../lib/http'

// Admin user management (ADMIN role only — enforced where the router is mounted).
export const usersRouter = Router()

const select = { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true } as const
const password = z.string().max(200).refine(isStrongPassword, passwordRule)
const createSchema = z.object({
  name: requiredText(100, 'Name'),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  role: z.enum(ADMIN_ROLES).default('EDITOR'),
  password,
})
const updateSchema = z.object({ name: requiredText(100, 'Name'), role: z.enum(ADMIN_ROLES), active: z.boolean(), password }).partial()

// `managed` marks the .env Admin, whose details come from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME and can't be edited here.
usersRouter.get('/', async (_req, res) => ok(res, (await prisma.adminUser.findMany({ select, orderBy: { createdAt: 'asc' } })).map(u => ({ ...u, managed: isEnvAdmin(u.email) }))))
const assertNotManaged = (email: string) => { if (isEnvAdmin(email)) throw new ApiError(409, 'ENV_MANAGED', 'This account is configured in the .env file (ADMIN_EMAIL / ADMIN_PASSWORD).') }

usersRouter.post('/', async (req, res) => {
  const { password: plain, ...data } = parse(createSchema, req.body)
  assertNotManaged(data.email)
  ok(res, await prisma.adminUser.create({ data: { ...data, passwordHash: await hashPassword(plain) }, select }), 201)
})

/** Refuses changes that would leave nobody able to manage admin users. */
async function assertAnotherActiveAdmin(userId: string) {
  const others = await prisma.adminUser.count({ where: { role: 'ADMIN', active: true, NOT: { id: userId } } })
  if (!others) throw new ApiError(409, 'LAST_ADMIN', 'At least one active Admin must remain.')
}

usersRouter.patch('/:id', async (req, res) => {
  const { password: plain, ...data } = parse(updateSchema, req.body)
  const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } })
  if (!user) throw notFound('User')
  assertNotManaged(user.email)
  if (user.role === 'ADMIN' && user.active && (data.role === 'EDITOR' || data.active === false)) await assertAnotherActiveAdmin(user.id)
  const updated = await prisma.adminUser.update({ where: { id: user.id }, data: { ...data, ...(plain ? { passwordHash: await hashPassword(plain) } : {}) }, select })
  if (data.active === false || plain) await destroyUserSessions(user.id, user.id === req.admin!.id ? req : undefined)
  ok(res, updated)
})

usersRouter.delete('/:id', async (req, res) => {
  if (req.params.id === req.admin!.id) throw new ApiError(409, 'SELF_DELETE', 'You cannot delete your own account.')
  const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } })
  if (!user) throw notFound('User')
  assertNotManaged(user.email)
  if (user.role === 'ADMIN' && user.active) await assertAnotherActiveAdmin(user.id)
  await prisma.adminUser.delete({ where: { id: user.id } })
  ok(res, { deleted: true })
})
