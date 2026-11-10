import { Router, json } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@chazon/shared'
import { prisma, type Prisma } from '../db'
import { env } from '../env'
import { generateReference } from '../lib/audit-engine'
import { notifySubmission, type Submission } from '../lib/email'
import { ApiError, listQuery, notFound, ok, optionalText, paged, parse, requiredText } from '../lib/http'

// Public router for enquiry submission
export const publicEnquiriesRouter = Router()
// Protected router for admin enquiry management
export const adminEnquiriesRouter = Router()

const formCors = cors({ origin: env.PUBLIC_SITE_URL || false, methods: ['POST', 'OPTIONS'], maxAge: 600 })

const enquiryLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many enquiries submitted. Please wait a few minutes and try again.' },
    }),
})

const field = (max: number) => z.string().trim().max(max).optional().transform(v => v || null)

// Schema for smart multi-step dynamic enquiry
const smartEnquirySchema = z.object({
  category: field(100),
  goals: z.array(z.string()).default([]),
  dynamicAnswers: z.record(z.string(), z.unknown()).optional(),
  business: z.object({
    businessName: z.string().trim().max(150).optional().transform(v => v || 'Not specified'),
    industry: z.string().trim().max(100).optional().default('General'),
    website: field(250),
    location: field(120),
    businessStage: field(60),
    targetAudience: field(150),
    description: field(2000),
  }).default({ businessName: 'Not specified', industry: 'General' }),
  budget: field(80),
  timeline: field(80),
  contact: z.object({
    name: z.string().trim().min(2, 'Full name is required').max(100),
    email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
    phone: z.string().trim().max(35).optional().transform(v => v || 'Not provided'),
    preferredContact: z.enum(['WhatsApp', 'Phone', 'Email']).default('WhatsApp'),
    message: field(3000),
    consentToContact: z.boolean().default(true),
    marketingConsent: z.boolean().optional().default(false),
  }),
  auditRef: field(60),
  auditSummary: z.object({
    overallScore: z.number().optional(),
    scores: z.record(z.string(), z.number()).optional(),
    topBottlenecks: z.array(z.string()).optional(),
  }).optional(),
  company_url: z.string().optional(), // Honeypot
  form_started: z.coerce.number().optional(),
  source_detail: field(120),
})

// Unified intake endpoint for POST /api/enquiries (and POST /api/public/enquiries)
publicEnquiriesRouter.options('/', formCors)
publicEnquiriesRouter.post('/', formCors, json({ limit: '64kb' }), enquiryLimiter, async (req, res) => {
  const origin = req.get('origin')
  if (origin && env.PUBLIC_SITE_URL && origin !== env.PUBLIC_SITE_URL) {
    throw new ApiError(403, 'FORBIDDEN', 'Origin not allowed.')
  }

  const rawBody = req.body as Record<string, unknown>

  // Detect whether it's the new smart enquiry or legacy simple form
  const isSmart = rawBody && typeof rawBody === 'object' && ('goals' in rawBody || 'business' in rawBody || 'contact' in rawBody)

  if (isSmart) {
    const body = parse(smartEnquirySchema, rawBody)

    // Honeypot, time-check, and spam-link defense
    const tooFast = body.form_started && Date.now() - body.form_started < 2000
    const msg = (body.contact.message ?? '') + ' ' + (body.business.description ?? '')
    const linkSpam = (msg.match(/https?:\/\//g)?.length ?? 0) > 4

    const reference = generateReference('CHZ')

    if (body.company_url || tooFast || linkSpam) {
      return ok(
        res,
        {
          received: true,
          reference,
          message: 'Enquiry received. Our advisory team will review your requirements.',
          nextSteps: [
            'Our founder and growth specialists review your digital challenges.',
            'We prepare an initial discovery diagnosis and verify strategic alignment.',
            'We reach out within 4–24 hours via your preferred contact channel.',
          ],
        },
        201
      )
    }

    const createdLead = await prisma.lead.create({
      data: {
        reference,
        name: body.contact.name,
        businessName: body.business.businessName,
        email: body.contact.email,
        phone: body.contact.phone,
        preferredContact: body.contact.preferredContact,
        website: body.business.website,
        category: body.category || body.business.industry || 'General',
        service: body.category ? (body.goals.length ? `${body.category} (${body.goals.join(', ')})` : body.category) : (body.goals.join(', ') || 'Growth Partnership'),
        services: body.goals.length ? body.goals : (body.category ? [body.category] : []),
        businessStage: body.business.businessStage,
        targetAudience: body.business.targetAudience,
        businessDescription: body.business.description,
        timeline: body.timeline,
        dynamicAnswers: body.dynamicAnswers as unknown as object,
        budget: body.budget,
        message: body.contact.message,
        consentToContact: body.contact.consentToContact,
        marketingConsent: body.contact.marketingConsent,
        auditRef: body.auditRef,
        auditData: body.auditSummary as unknown as object,
        source: 'Website',
        sourceDetail: body.source_detail,
        status: 'NEW',
        activities: {
          create: {
            type: 'CREATED',
            message: `Central dynamic enquiry submitted (Ref: ${reference}). Category: ${body.category || 'General'}. Selected goals: ${body.goals.join(', ') || 'None'}.`,
          },
        },
      },
    })

    const whatsAppDigits = process.env.VITE_WHATSAPP_NUMBER || '919820000000'
    const waText = encodeURIComponent(
      `Hi Chazon team, I submitted an enquiry for ${body.business.businessName} (Ref: ${reference}). Category: ${body.category || 'Growth Partnership'}. Looking forward to discussing our project.`
    )
    const whatsAppHref = `https://wa.me/${whatsAppDigits.replace(/\D/g, '')}?text=${waText}`

    const submission: Submission = {
      id: createdLead.id,
      reference,
      kind: 'lead',
      name: body.contact.name,
      businessName: body.business.businessName,
      email: body.contact.email,
      phone: body.contact.phone,
      preferredContact: body.contact.preferredContact,
      website: body.business.website,
      category: body.category || body.business.industry,
      service: body.category ? (body.goals.length ? `${body.category} (${body.goals.join(', ')})` : body.category) : (body.goals.join(', ') || 'Multi-Service Growth System'),
      services: body.goals,
      budget: body.budget,
      timeline: body.timeline,
      auditRef: body.auditRef,
      message: body.contact.message || body.business.description,
    }

    void notifySubmission(submission)

    return ok(
      res,
      {
        received: true,
        reference,
        message: 'Your enquiry has been received and scheduled for founder review.',
        nextSteps: [
          'Review of your digital foundation and current bottlenecks.',
          'Formulation of strategic recommendations and scope assessment.',
          'Direct contact via ' + body.contact.preferredContact + ' within 4 to 24 business hours.',
        ],
        whatsAppHref,
      },
      201
    )
  }

  // Handle standard/legacy single-step form submission
  const legacySchema = z.object({
    enquiry_type: z.enum(['talk', 'audit']).default('talk'),
    name: z.string().trim().min(2, 'Please enter your name').max(100),
    business: z.string().trim().max(150).optional().transform(v => v || 'Not specified'),
    email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
    phone: z.string().trim().max(35).optional().transform(v => v || null),
    website: field(200),
    category: field(100),
    service: field(100),
    budget: field(60),
    message: z.string().trim().min(1, 'Please enter your message or project requirements').max(3000),
    company_url: z.string().optional(),
    form_started: z.coerce.number().optional(),
    source_detail: field(120),
  })

  const body = parse(legacySchema, rawBody)
  const tooFast = body.form_started && Date.now() - body.form_started < 2000
  const linkSpam = (body.message?.match(/https?:\/\//g)?.length ?? 0) > 4
  const reference = generateReference(body.enquiry_type === 'audit' ? 'AUD' : 'CHZ')

  if (body.company_url || tooFast || linkSpam) {
    return ok(res, { received: true, reference }, 201)
  }

  const common = {
    reference,
    name: body.name,
    businessName: body.business,
    email: body.email,
    phone: body.phone,
    website: body.website,
    category: body.category,
    budget: body.budget,
    source: 'Website',
    sourceDetail: body.source_detail,
  }

  if (body.enquiry_type === 'audit') {
    const audit = await prisma.growthAudit.create({
      data: {
        ...common,
        requirements: body.message,
        activities: {
          create: { type: 'CREATED', message: `Audit requested through website form (Ref: ${reference}).` },
        },
      },
    })
    void notifySubmission({ kind: 'audit', id: audit.id, ...common, service: body.service, message: body.message })
    return ok(res, { received: true, reference }, 201)
  }

  const lead = await prisma.lead.create({
    data: {
      ...common,
      service: body.service,
      services: body.service ? [body.service] : [],
      message: body.message,
      activities: {
        create: { type: 'CREATED', message: `Enquiry received through website form (Ref: ${reference}).` },
      },
    },
  })
  void notifySubmission({ kind: 'lead', id: lead.id, ...common, service: body.service, message: body.message })
  return ok(res, { received: true, reference }, 201)
})

// ---------- PROTECTED ADMIN ENQUIRIES API (/api/admin/enquiries) ----------

const adminUpdateSchema = z
  .object({
    name: requiredText(100, 'Name'),
    businessName: requiredText(150, 'Business name'),
    email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
    phone: z.string().trim().regex(/^[+0-9() .-]{7,25}$/, 'Enter a valid phone number'),
    preferredContact: z.enum(['WhatsApp', 'Phone', 'Email']),
    website: optionalText(250),
    category: optionalText(100),
    service: optionalText(150),
    budget: optionalText(80),
    timeline: optionalText(80),
    message: optionalText(4000),
    status: z.enum(LEAD_STATUSES),
    assignedToId: z.string().nullable(),
    archived: z.boolean(),
  })
  .partial()

const adminFilters = listQuery.extend({
  status: z.enum(LEAD_STATUSES).optional().catch(undefined),
  view: z.enum(['active', 'archived', 'all']).default('active').catch('active'),
  sort: z.enum(['newest', 'oldest', 'name', 'business', 'status']).default('newest').catch('newest'),
  category: z.string().trim().max(100).optional(),
  service: z.string().trim().max(100).optional(),
})

const orderings: Record<string, Prisma.LeadOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  name: [{ name: 'asc' }],
  business: [{ businessName: 'asc' }],
  status: [{ status: 'asc' }, { createdAt: 'desc' }],
}

adminEnquiriesRouter.get('/', async (req, res) => {
  const { page, pageSize, q, status, view, sort, category, service } = parse(adminFilters, req.query)
  const where: Prisma.LeadWhereInput = {
    ...(view === 'active' ? { archivedAt: null } : view === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(service ? { service } : {}),
    ...(q
      ? {
          OR: [
            'name',
            'businessName',
            'email',
            'phone',
            'website',
            'reference',
            'service',
            'message',
            'category',
          ].map(f => ({ [f]: { contains: q, mode: 'insensitive' } })),
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: orderings[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
      },
    }),
    prisma.lead.count({ where }),
  ])

  paged(res, items, total, page, pageSize)
})

const enquiryDetail = (idOrRef: string) =>
  prisma.lead.findFirst({
    where: {
      OR: [{ id: idOrRef }, { reference: idOrRef }],
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true } } },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  })

adminEnquiriesRouter.get('/:id', async (req, res) => {
  const enquiry = await enquiryDetail(req.params.id)
  if (!enquiry) throw notFound('Enquiry')
  ok(res, enquiry)
})

adminEnquiriesRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(adminUpdateSchema, req.body)
  const existing = await prisma.lead.findFirst({
    where: {
      OR: [{ id: req.params.id }, { reference: req.params.id }],
    },
  })
  if (!existing) throw notFound('Enquiry')

  const actorId = req.admin!.id
  const activities: Prisma.ActivityCreateWithoutLeadInput[] = []
  const actor = { actor: { connect: { id: actorId } } }

  if (data.status && data.status !== existing.status) {
    activities.push({
      type: 'STATUS_CHANGED',
      message: `Status updated from ${LEAD_STATUS_LABELS[existing.status]} to ${LEAD_STATUS_LABELS[data.status]}.`,
      ...actor,
    })
  }

  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    activities.push({
      type: 'ASSIGNED',
      message: data.assignedToId ? 'Assigned to team member.' : 'Assignment removed.',
      ...actor,
    })
  }

  if (archived !== undefined && archived !== !!existing.archivedAt) {
    activities.push({
      type: archived ? 'ARCHIVED' : 'RESTORED',
      message: archived ? 'Enquiry archived.' : 'Enquiry restored from archive.',
      ...actor,
    })
  }

  const { assignedToId, ...restData } = data

  await prisma.lead.update({
    where: { id: existing.id },
    data: {
      ...restData,
      ...(assignedToId !== undefined
        ? assignedToId
          ? { assignedTo: { connect: { id: assignedToId } } }
          : { assignedTo: { disconnect: true } }
        : {}),
      ...(archived !== undefined
        ? { archivedAt: archived ? existing.archivedAt ?? new Date() : null }
        : {}),
      activities: { create: activities },
    },
  })

  ok(res, await enquiryDetail(existing.id))
})

// Soft delete (archive) or permanent delete
adminEnquiriesRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.lead.findFirst({
    where: {
      OR: [{ id: req.params.id }, { reference: req.params.id }],
    },
  })
  if (!existing) throw notFound('Enquiry')

  const permanent = req.query.permanent === 'true'

  if (permanent) {
    if (req.admin?.role !== 'ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'Only administrators can permanently delete enquiries.')
    }
    await prisma.lead.delete({ where: { id: existing.id } })
    return ok(res, { deleted: true, permanent: true })
  }

  // Soft delete (preferred)
  await prisma.lead.update({
    where: { id: existing.id },
    data: {
      archivedAt: new Date(),
      status: 'ARCHIVED',
      activities: {
        create: {
          type: 'ARCHIVED',
          message: 'Enquiry archived (soft delete).',
          actorId: req.admin?.id,
        },
      },
    },
  })

  ok(res, { deleted: true, archived: true })
})

// Add internal notes to an enquiry
const noteSchema = z.object({ body: requiredText(5000, 'Note') })
adminEnquiriesRouter.post('/:id/notes', async (req, res) => {
  const { body } = parse(noteSchema, req.body)
  const existing = await prisma.lead.findFirst({
    where: {
      OR: [{ id: req.params.id }, { reference: req.params.id }],
    },
    select: { id: true },
  })
  if (!existing) throw notFound('Enquiry')

  const note = await prisma.leadNote.create({
    data: { leadId: existing.id, body, authorId: req.admin!.id },
    include: { author: { select: { id: true, name: true } } },
  })

  await prisma.activity.create({
    data: { leadId: existing.id, type: 'NOTE_ADDED', message: 'Internal note added.', actorId: req.admin!.id },
  })

  ok(res, note, 201)
})
