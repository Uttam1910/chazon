import type { NextFunction, Request, Response } from 'express'
import { z, ZodError, type ZodType } from 'zod'
import { isDatabaseUnavailable, Prisma } from '../db'
import { env } from '../env'

/** An error that is safe to show the client. Anything else becomes a generic 500. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string>) { super(message) }
}
export const notFound = (what = 'Resource') => new ApiError(404, 'NOT_FOUND', `${what} not found`)

export function parse<T extends ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw validationError(result.error)
}
function validationError(error: ZodError) {
  const details: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    details[key] ??= issue.message
  }
  return new ApiError(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', details)
}

export const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ data })

// ---------- Pagination & list queries ----------
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().transform(v => v || undefined),
})
export function paged(res: Response, items: unknown[], total: number, page: number, pageSize: number) {
  return res.json({ data: items, meta: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } })
}

// ---------- Reusable field schemas ----------
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
export const text = (max: number) => z.string().trim().max(max)
export const optionalText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional())
export const requiredText = (max: number, label = 'This field') => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`)
export const slug = z.string().trim().toLowerCase().min(1, 'Slug is required').max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
/** A site-relative path (/uploads/…) or an absolute http(s) URL. */
export const urlOrPath = z.preprocess(blankToNull, z.string().trim().max(2000).refine(v => /^\/(?!\/)/.test(v) || /^https?:\/\/[^\s]+$/i.test(v), 'Enter a valid URL').nullable().optional())
export const httpsUrl = (domain?: string) => z.string().trim().max(500).refine(v => {
  if (!v) return true
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && (!domain || u.hostname === domain || u.hostname.endsWith(`.${domain}`))
  } catch { return false }
}, domain ? `Enter an https:// URL on ${domain}` : 'Enter an https:// URL')

// ---------- Error handling ----------
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  void _next
  if (err instanceof ApiError) return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } })
  if (err instanceof ZodError) return errorHandler(validationError(err), _req, res, _next)
  if (isDatabaseUnavailable(err)) {
    return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'The database isn’t connected yet. Set DATABASE_URL in .env and run npm run db:migrate.' } })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // The constraint's fields appear in different places in `meta` depending on the driver adapter.
      const target = JSON.stringify(err.meta ?? {})
      const field = /slug/.test(target) ? 'slug' : /email/.test(target) ? 'email' : null
      return res.status(409).json({ error: { code: 'CONFLICT', message: field ? `That ${field} is already in use.` : 'That value is already in use.', ...(field ? { details: { [field]: `This ${field} is already in use` } } : {}) } })
    }
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } })
  }
  // Client errors raised by Express middleware (body parser, static files): pass the status through with a safe message.
  const status = (err as { status?: number })?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    const [code, message] = status === 404 ? ['NOT_FOUND', 'Not found'] : status === 413 ? ['PAYLOAD_TOO_LARGE', 'The request is too large.'] : ['BAD_REQUEST', 'The request could not be processed.']
    return res.status(status).json({ error: { code, message } })
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : String((err as Error)?.message ?? err) } })
}
