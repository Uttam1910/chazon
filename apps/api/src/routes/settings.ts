import { Router } from 'express'
import { z } from 'zod'
import { SEO_PAGES } from '@chazon/shared'
import { prisma } from '../db'
import { requireRole } from '../lib/auth'
import { getSettings } from '../lib/content'
import { httpsUrl, ok, optionalText, parse, text, urlOrPath } from '../lib/http'

// ---------- Website settings (public, non-secret values only) ----------
export const settingsRouter = Router()

const settingsSchema = z.object({
  companyName: text(120).min(1, 'Company name is required'),
  tagline: text(160),
  description: text(1000),
  email: z.string().trim().max(200).refine(v => !v || z.email().safeParse(v).success, 'Enter a valid email address'),
  phone: z.string().trim().max(30).refine(v => !v || /^[+0-9() .-]{7,20}$/.test(v), 'Enter a valid phone number'),
  whatsapp: z.string().trim().max(20).refine(v => !v || /^\d{7,15}$/.test(v), 'International digits only, without + or spaces (e.g. 919876543210)'),
  location: text(160),
  linkedinUrl: httpsUrl('linkedin.com'),
  instagramUrl: httpsUrl('instagram.com'),
  facebookUrl: httpsUrl('facebook.com'),
  ctaTalkLabel: text(40).min(1, 'Label is required'),
  ctaAuditLabel: text(60).min(1, 'Label is required'),
}).partial()

settingsRouter.get('/', async (_req, res) => ok(res, await getSettings()))
settingsRouter.put('/', requireRole('ADMIN'), async (req, res) => {
  const data = parse(settingsSchema, req.body)
  await getSettings()
  ok(res, await prisma.websiteSettings.update({ where: { id: 'default' }, data }))
})

// ---------- SEO ----------
export const seoRouter = Router()

const seoSchema = z.object({
  title: optionalText(120),
  description: optionalText(320),
  canonicalUrl: z.preprocess(v => (v === '' ? null : v), z.string().trim().max(500).refine(v => /^https?:\/\/[^\s]+$/.test(v), 'Enter an absolute http(s) URL').nullable().optional()),
  ogTitle: optionalText(120),
  ogDescription: optionalText(320),
  ogImage: urlOrPath,
  noindex: z.boolean(),
  nofollow: z.boolean(),
}).partial()

seoRouter.get('/', async (_req, res) => {
  const rows = await prisma.seoSetting.findMany()
  ok(res, SEO_PAGES.map(page => rows.find(r => r.page === page) ?? { page, title: null, description: null, canonicalUrl: null, ogTitle: null, ogDescription: null, ogImage: null, noindex: false, nofollow: false, updatedAt: null }))
})
seoRouter.put('/:page', async (req, res) => {
  const page = z.enum(SEO_PAGES).parse(req.params.page)
  const data = parse(seoSchema, req.body)
  ok(res, await prisma.seoSetting.upsert({ where: { page }, update: data, create: { page, ...data } }))
})
