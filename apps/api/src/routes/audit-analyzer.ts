import { Router, json } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../db'
import { analyzeWebsite } from '../lib/audit-engine'
import { ApiError, notFound, ok, parse } from '../lib/http'

export const auditAnalyzerRouter = Router()

const auditCors = cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], maxAge: 600 })

const auditLimiter = rateLimit({
  windowMs: 5 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many audit requests from this network. Please wait a few minutes and try again.',
      },
    }),
})

const auditRequestSchema = z.object({
  url: z.string().trim().min(3, 'Please enter a valid website URL').max(300),
})

auditAnalyzerRouter.options('/analyze', auditCors)

auditAnalyzerRouter.post('/analyze', auditCors, json({ limit: '16kb' }), auditLimiter, async (req, res) => {
  const { url } = parse(auditRequestSchema, req.body)

  try {
    const result = await analyzeWebsite(url)

    // Save scan result asynchronously if DB is available
    try {
      await prisma.auditScan.create({
        data: {
          reference: result.id,
          url: result.url,
          normalizedUrl: result.normalizedUrl,
          overallScore: result.overallScore,
          performanceScore: result.scores.performance,
          seoScore: result.scores.seo,
          mobileScore: result.scores.mobile,
          conversionScore: result.scores.conversion,
          metrics: result.metrics,
          issues: result.issues as unknown as object,
        },
      })
    } catch {
      // If DB is disconnected or unavailable, the audit result is still returned to the user
    }

    ok(res, result, 200)
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Failed to analyze website.'
    throw new ApiError(400, 'AUDIT_FAILED', message)
  }
})

auditAnalyzerRouter.get('/:id', auditCors, async (req, res) => {
  const reference = req.params.id
  try {
    const scan = await prisma.auditScan.findFirst({
      where: {
        OR: [{ id: reference }, { reference }],
      },
    })
    if (!scan) throw notFound('Audit report')
    ok(res, scan)
  } catch {
    throw notFound('Audit report')
  }
})
