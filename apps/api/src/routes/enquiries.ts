import { Router, json } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@chazon/shared'
import { isDatabaseUnavailable, prisma, type Prisma } from '../db'
import { env, isAllowedOrigin } from '../env'
import { generateReference } from '../lib/audit-engine'
import { dispatchBackground } from '../lib/background'
import { notifySubmission, type Submission } from '../lib/email'
import { ApiError, listQuery, notFound, ok, optionalText, paged, parse, requiredText } from '../lib/http'
import { runtimeStore, type RuntimeLead } from '../lib/runtime-store'

// Public router for enquiry submission
export const publicEnquiriesRouter = Router()
// Protected router for admin enquiry management
export const adminEnquiriesRouter = Router()

const formCors = cors({
  origin: (origin, cb) => cb(null, origin ? isAllowedOrigin(origin, env.PUBLIC_SITE_URL) : false),
  methods: ['POST', 'OPTIONS'],
  maxAge: 600,
})

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
  }).default({
    businessName: 'Not specified',
    industry: 'General',
    website: null,
    location: null,
    businessStage: null,
    targetAudience: null,
    description: null,
  }),
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

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function buildWhatsAppHref(businessName: string, reference: string, topic: string) {
  const whatsAppDigits = (process.env.VITE_WHATSAPP_NUMBER || '919820000000').replace(/\D/g, '')
  const waText = encodeURIComponent(
    `Hi Chazon team, I submitted an enquiry for ${businessName} (Ref: ${reference}). Topic: ${topic}. Looking forward to discussing our project.`
  )
  return `https://wa.me/${whatsAppDigits}?text=${waText}`
}

async function linkAuditReference(auditRef: string | null | undefined, leadId: string, reference: string) {
  if (!auditRef) return
  await prisma.auditScan.updateMany({ where: { reference: auditRef }, data: { leadId } }).catch(() => {})
  runtimeStore.linkLeadToAuditScan(auditRef, leadId, reference)
}

// Unified intake endpoint for POST /api/enquiries (and POST /api/public/enquiries)
publicEnquiriesRouter.options('/', formCors)
publicEnquiriesRouter.post('/', formCors, json({ limit: '64kb' }), enquiryLimiter, async (req, res) => {
  const origin = req.get('origin')
  if (origin && env.PUBLIC_SITE_URL && !isAllowedOrigin(origin, env.PUBLIC_SITE_URL)) {
    throw new ApiError(403, 'FORBIDDEN', 'Origin not allowed.')
  }

  const rawBody = req.body as Record<string, unknown>

  // Detect nested smart enquiry payloads without misclassifying flat forms that send `business` as a string
  const isSmart =
    isObjectRecord(rawBody) &&
    (Array.isArray(rawBody.goals) || isObjectRecord(rawBody.business) || isObjectRecord(rawBody.contact))

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

    const leadData = {
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
      dynamicAnswers: (body.dynamicAnswers ?? null) as unknown as Prisma.InputJsonValue,
      budget: body.budget,
      message: body.contact.message,
      consentToContact: body.contact.consentToContact,
      marketingConsent: body.contact.marketingConsent,
      auditRef: body.auditRef,
      auditData: (body.auditSummary ?? null) as unknown as Prisma.InputJsonValue,
      source: 'Website',
      sourceDetail: body.source_detail,
      status: 'NEW' as const,
    }
    const activityMsg = `Central dynamic enquiry submitted (Ref: ${reference}). Category: ${body.category || 'General'}. Selected goals: ${body.goals.join(', ') || 'None'}.`
    let createdLeadId: string
    try {
      const createdLead = await prisma.lead.create({
        data: {
          ...leadData,
          activities: { create: { type: 'CREATED', message: activityMsg } },
        },
      })
      createdLeadId = createdLead.id
      if (body.auditRef) {
        await linkAuditReference(body.auditRef, createdLead.id, reference)
      }
      runtimeStore.invalidateDashboard()
    } catch (err) {
      if (!isDatabaseUnavailable(err)) throw err
      const memLead = runtimeStore.createLead({
        ...leadData,
        dynamicAnswers: body.dynamicAnswers ?? null,
        auditData: (body.auditSummary ?? null) as Record<string, unknown> | null,
      }, activityMsg)
      createdLeadId = memLead.id
      if (body.auditRef) runtimeStore.linkLeadToAuditScan(body.auditRef, createdLeadId, reference)
    }

    const whatsAppHref = buildWhatsAppHref(body.business.businessName, reference, body.category || 'Growth Partnership')

    const submission: Submission = {
      id: createdLeadId,
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

    await dispatchBackground(notifySubmission(submission))

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
    phone: z.string().trim().max(35).optional().transform(v => v || 'Not provided'),
    website: field(200),
    category: field(100),
    service: field(100),
    budget: field(60),
    message: field(3000),
    auditRef: field(60),
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
    auditRef: body.auditRef,
    source: 'Website',
    sourceDetail: body.source_detail,
  }

  if (body.enquiry_type === 'audit') {
    const auditMsg = `Audit requested through website form (Ref: ${reference}).`
    let auditId: string
    try {
      const audit = await prisma.growthAudit.create({
        data: {
          ...common,
          requirements: body.message,
          activities: {
            create: { type: 'CREATED', message: auditMsg },
          },
        },
      })
      auditId = audit.id
      runtimeStore.invalidateDashboard()
    } catch (err) {
      if (!isDatabaseUnavailable(err)) throw err
      auditId = runtimeStore.createGrowthAudit({ ...common, requirements: body.message }, auditMsg).id
    }
    await dispatchBackground(notifySubmission({ kind: 'audit', id: auditId, ...common, service: body.service, message: body.message }))
    return ok(res, { received: true, reference, whatsAppHref: buildWhatsAppHref(body.business, reference, body.service || 'Digital Growth Audit') }, 201)
  }

  const leadMsg = `Enquiry received through website form (Ref: ${reference}).`
  let leadId: string
  try {
    const lead = await prisma.lead.create({
      data: {
        ...common,
        service: body.service,
        services: body.service ? [body.service] : [],
        message: body.message,
        activities: {
          create: { type: 'CREATED', message: leadMsg },
        },
      },
    })
    leadId = lead.id
    await linkAuditReference(body.auditRef, lead.id, reference)
    runtimeStore.invalidateDashboard()
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    leadId = runtimeStore.createLead(
      { ...common, service: body.service, services: body.service ? [body.service] : [], message: body.message },
      leadMsg
    ).id
    if (body.auditRef) runtimeStore.linkLeadToAuditScan(body.auditRef, leadId, reference)
  }
  await dispatchBackground(notifySubmission({ kind: 'lead', id: leadId, ...common, service: body.service, message: body.message }))
  return ok(res, { received: true, reference, whatsAppHref: buildWhatsAppHref(body.business, reference, body.service || 'Growth Partnership') }, 201)
})

// ---------- PROTECTED ADMIN ENQUIRIES API (/api/admin/enquiries) ----------

const adminCreateSchema = z.object({
  name: requiredText(100, 'Name'),
  businessName: requiredText(150, 'Business name'),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().regex(/^[+0-9() .-]{7,25}$/, 'Enter a valid phone number'),
  preferredContact: z.enum(['WhatsApp', 'Phone', 'Email', 'whatsapp', 'phone', 'email']).default('WhatsApp').transform(v => {
    const low = v.toLowerCase()
    return low === 'phone' ? 'Phone' : low === 'email' ? 'Email' : 'WhatsApp'
  }),
  website: optionalText(250),
  category: optionalText(100),
  service: optionalText(150),
  budget: optionalText(80),
  timeline: optionalText(80),
  message: optionalText(4000),
  sourceDetail: optionalText(120),
  status: z.enum(LEAD_STATUSES).default('NEW'),
})

const adminUpdateSchema = z
  .object({
    name: requiredText(100, 'Name'),
    businessName: requiredText(150, 'Business name'),
    email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
    phone: z.string().trim().regex(/^[+0-9() .-]{7,25}$/, 'Enter a valid phone number'),
    preferredContact: z.enum(['WhatsApp', 'Phone', 'Email', 'whatsapp', 'phone', 'email']).transform(v => {
      const low = v.toLowerCase()
      return low === 'phone' ? 'Phone' : low === 'email' ? 'Email' : 'WhatsApp'
    }),
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
  hasAudit: z.enum(['true', 'false']).optional().catch(undefined),
})

const orderings: Record<string, Prisma.LeadOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  name: [{ name: 'asc' }],
  business: [{ businessName: 'asc' }],
  status: [{ status: 'asc' }, { createdAt: 'desc' }],
}

function filterRuntimeLeads(list: RuntimeLead[], { view, status, category, service, hasAudit, q, sort }: z.infer<typeof adminFilters>) {
  const ql = q?.toLowerCase()
  const sorters: Record<string, (a: RuntimeLead, b: RuntimeLead) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
    business: (a, b) => a.businessName.localeCompare(b.businessName),
    status: (a, b) => a.status.localeCompare(b.status),
  }
  return list
    .filter(l => (view === 'active' ? !l.archivedAt : view === 'archived' ? !!l.archivedAt : true))
    .filter(l => (!status ? true : l.status === status))
    .filter(l => (!category ? true : (l.category ?? '').toLowerCase() === category.toLowerCase()))
    .filter(l => (!service ? true : l.service === service || l.services.includes(service)))
    .filter(l => (!hasAudit ? true : hasAudit === 'true' ? !!(l.auditRef || l.auditData) : !(l.auditRef || l.auditData)))
    .filter(l =>
      !ql
        ? true
        : [l.name, l.businessName, l.email, l.phone, l.website, l.reference, l.service, l.message, l.category, ...l.services]
            .some(v => (v ?? '').toLowerCase().includes(ql))
    )
    .sort(sorters[sort] ?? sorters.newest)
    .map(l => ({ ...l, _count: { notes: l.notes.length } }))
}

adminEnquiriesRouter.get('/', async (req, res) => {
  const filters = parse(adminFilters, req.query)
  const { page, pageSize, q, status, view, sort, category, service, hasAudit } = filters
  const andConditions: Prisma.LeadWhereInput[] = []
  if (view === 'active') andConditions.push({ archivedAt: null })
  else if (view === 'archived') andConditions.push({ archivedAt: { not: null } })
  if (status) andConditions.push({ status })
  if (category) andConditions.push({ category: { equals: category, mode: 'insensitive' } })
  if (service) andConditions.push({ OR: [{ service }, { services: { has: service } }] })
  if (hasAudit === 'true') andConditions.push({ OR: [{ auditRef: { not: null } }, { auditData: { not: { equals: null } } }] })
  else if (hasAudit === 'false') andConditions.push({ auditRef: null })
  if (q) {
    andConditions.push({
      OR: [
        ...['name', 'businessName', 'email', 'phone', 'website', 'reference', 'service', 'message', 'category'].map(f => ({
          [f]: { contains: q, mode: 'insensitive' as const },
        })),
        { services: { has: q } },
      ],
    })
  }
  const where: Prisma.LeadWhereInput = andConditions.length ? { AND: andConditions } : {}

  try {
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
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const filtered = filterRuntimeLeads(runtimeStore.leads, filters)
    paged(res, filtered.slice((page - 1) * pageSize, page * pageSize), filtered.length, page, pageSize)
  }
})

adminEnquiriesRouter.post('/', async (req, res) => {
  const data = parse(adminCreateSchema, req.body)
  const reference = generateReference('CHZ')
  const services = data.service ? [data.service] : data.category ? [data.category] : []
  try {
    const lead = await prisma.lead.create({
      data: {
        ...data,
        reference,
        services,
        source: 'Manual',
        activities: {
          create: { type: 'CREATED', message: `Lead added manually (Ref: ${reference}).`, actorId: req.admin!.id },
        },
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    })
    runtimeStore.invalidateDashboard()
    ok(res, lead, 201)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const lead = runtimeStore.createLead(
      { ...data, reference, services, source: 'Manual' },
      `Lead added manually (Ref: ${reference}).`,
      req.admin ? { id: req.admin.id, name: req.admin.name } : null
    )
    ok(res, lead, 201)
  }
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
  try {
    const enquiry = await enquiryDetail(req.params.id)
    if (!enquiry) throw notFound('Enquiry')
    ok(res, enquiry)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const mem = runtimeStore.leads.find(l => l.id === req.params.id || l.reference === req.params.id)
    if (!mem) throw notFound('Enquiry')
    ok(res, mem)
  }
})

adminEnquiriesRouter.patch('/:id', async (req, res) => {
  const { archived, ...data } = parse(adminUpdateSchema, req.body)
  try {
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
    runtimeStore.invalidateDashboard()
    ok(res, await enquiryDetail(existing.id))
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const mem = runtimeStore.leads.find(l => l.id === req.params.id || l.reference === req.params.id)
    if (!mem) throw notFound('Enquiry')
    const now = new Date().toISOString()
    const actorInfo = req.admin ? { id: req.admin.id, name: req.admin.name } : null
    if (data.status && data.status !== mem.status) {
      mem.activities.unshift({
        id: generateReference('ACT'),
        type: 'STATUS_CHANGED',
        message: `Status updated from ${LEAD_STATUS_LABELS[mem.status]} to ${LEAD_STATUS_LABELS[data.status]}.`,
        createdAt: now,
        actor: actorInfo,
      })
    }
    if (archived !== undefined && archived !== !!mem.archivedAt) {
      mem.archivedAt = archived ? mem.archivedAt ?? now : null
      mem.activities.unshift({
        id: generateReference('ACT'),
        type: archived ? 'ARCHIVED' : 'RESTORED',
        message: archived ? 'Enquiry archived.' : 'Enquiry restored from archive.',
        createdAt: now,
        actor: actorInfo,
      })
    }
    const { assignedToId: _ignore, ...restData } = data
    void _ignore
    Object.assign(mem, restData, { updatedAt: now })
    runtimeStore.invalidateDashboard()
    ok(res, mem)
  }
})

// Soft delete (archive) or permanent delete
adminEnquiriesRouter.delete('/:id', async (req, res) => {
  const permanent = req.query.permanent === 'true'
  try {
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [{ id: req.params.id }, { reference: req.params.id }],
      },
    })
    if (!existing) throw notFound('Enquiry')

    if (permanent) {
      if (req.admin?.role !== 'ADMIN') {
        throw new ApiError(403, 'FORBIDDEN', 'Only administrators can permanently delete enquiries.')
      }
      await prisma.lead.delete({ where: { id: existing.id } })
      runtimeStore.invalidateDashboard()
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
    runtimeStore.invalidateDashboard()
    ok(res, { deleted: true, archived: true })
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const idx = runtimeStore.leads.findIndex(l => l.id === req.params.id || l.reference === req.params.id)
    if (idx < 0) throw notFound('Enquiry')
    if (permanent) {
      if (req.admin?.role !== 'ADMIN') throw new ApiError(403, 'FORBIDDEN', 'Only administrators can permanently delete enquiries.')
      runtimeStore.leads.splice(idx, 1)
      runtimeStore.invalidateDashboard()
      return ok(res, { deleted: true, permanent: true })
    }
    runtimeStore.leads[idx].archivedAt = new Date().toISOString()
    runtimeStore.leads[idx].status = 'ARCHIVED'
    runtimeStore.invalidateDashboard()
    ok(res, { deleted: true, archived: true })
  }
})

// Add internal notes to an enquiry
const noteSchema = z.object({ body: requiredText(5000, 'Note') })
adminEnquiriesRouter.post('/:id/notes', async (req, res) => {
  const { body } = parse(noteSchema, req.body)
  try {
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
    runtimeStore.invalidateDashboard()
    ok(res, note, 201)
  } catch (err) {
    if (!isDatabaseUnavailable(err)) throw err
    const mem = runtimeStore.leads.find(l => l.id === req.params.id || l.reference === req.params.id)
    if (!mem) throw notFound('Enquiry')
    const now = new Date().toISOString()
    const author = req.admin ? { id: req.admin.id, name: req.admin.name } : null
    const note = { id: generateReference('NOTE'), body, createdAt: now, author }
    mem.notes.unshift(note)
    mem.activities.unshift({ id: generateReference('ACT'), type: 'NOTE_ADDED', message: 'Internal note added.', createdAt: now, actor: author })
    runtimeStore.invalidateDashboard()
    ok(res, note, 201)
  }
})
