import { Router, json } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../db'
import { analyzeWebsite } from '../lib/audit-engine'
import { runtimeStore } from '../lib/runtime-store'
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

    runtimeStore.upsertAuditScan({
      id: result.id,
      reference: result.id,
      url: result.url,
      normalizedUrl: result.normalizedUrl,
      strategy: 'mobile',
      state: 'completed',
      overallScore: result.overallScore,
      performanceScore: result.scores.performance,
      seoScore: result.scores.seo,
      mobileScore: result.scores.mobile,
      conversionScore: result.scores.conversion,
      accessibilityScore: null,
      bestPracticesScore: null,
      pagesInspected: 1,
      durationMs: null,
      headline: null,
      topIssues: (result.issues ?? []).slice(0, 6).map(i => ({ title: i.title, severity: i.severity, category: i.category })),
      leadId: null,
      leadReference: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

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
          metrics: JSON.parse(JSON.stringify(result.metrics)),
          issues: JSON.parse(JSON.stringify(result.issues ?? [])),
        },
      })
      console.log(`[audit-analyzer] Saved auditScan to DB for ${result.normalizedUrl}`)
    } catch (scanErr) {
      console.error('[audit-analyzer] Failed to save auditScan to DB:', scanErr)
    }

    try {
      await prisma.growthAudit.create({
        data: {
          name: `Website Scan: ${result.normalizedUrl}`,
          businessName: result.normalizedUrl,
          email: `scan@${result.normalizedUrl}`,
          phone: 'Not provided',
          website: result.url,
          category: 'Website Health Scanner',
          requirements: `Instant Website Health Score: ${result.overallScore}/100. Speed: ${result.scores.performance}%, SEO: ${result.scores.seo}%, Mobile: ${result.scores.mobile}%.`,
          source: 'Website Scanner',
          sourceDetail: 'audit_analyzer',
          status: 'NEW',
          activities: {
            create: {
              type: 'CREATED',
              message: `Legacy analyzer scan executed for ${result.url} with score ${result.overallScore}/100.`,
            },
          },
        },
      })
    } catch (gaErr) {
      console.error('[audit-analyzer] Failed to create GrowthAudit entry:', gaErr)
    }

    runtimeStore.invalidateDashboard()

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
