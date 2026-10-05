// DEVELOPMENT ONLY: sample data for seeing how the Admin and website look with content in them.
// Leads/audits have source "Demo" and example.com emails; content uses "demo-" slugs and is labelled as sample
// content, so none of it can be mistaken for real enquiries or real client work.
// Remove everything with `npm run db:demo:clear`. Refuses to run when NODE_ENV=production.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to touch demo data with NODE_ENV=production.')
  process.exit(1)
}
// Imported after the guard so nothing connects to a production database.
const { prisma } = await import('../src/db')
const { ensureEnvAdmin } = await import('../src/lib/auth')

const day = 86400_000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * day - hours * 3600_000)

async function clear() {
  const [leads, audits, cases, insights, testimonials] = await Promise.all([
    prisma.lead.deleteMany({ where: { source: 'Demo' } }),
    prisma.growthAudit.deleteMany({ where: { source: 'Demo' } }),
    prisma.caseStudy.deleteMany({ where: { slug: { startsWith: 'demo-' } } }),
    prisma.insight.deleteMany({ where: { slug: { startsWith: 'demo-' } } }),
    prisma.testimonial.deleteMany({ where: { company: { endsWith: '(demo)' } } }),
  ])
  console.log(`Removed demo data: ${leads.count} leads, ${audits.count} audits, ${cases.count} case studies, ${insights.count} insights, ${testimonials.count} testimonials.`)
}

const leads = [
  { name: 'Aarav Mehta', businessName: 'Mehta Home Décor', category: 'Retail', service: 'Website', budget: '₹25,000–₹50,000', status: 'NEW', sourceDetail: 'google', days: 0.2, message: 'We have two stores in Andheri and want customers to browse and enquire online before visiting.' },
  { name: 'Priya Nair', businessName: 'Coastal Kitchen Co.', category: 'Hospitality', service: 'Performance Marketing', budget: '₹50,000–₹1,00,000', status: 'NEW', sourceDetail: 'instagram', days: 1, message: 'Lots of Instagram followers but table bookings are flat. Want ads that bring actual reservations.' },
  { name: 'Rohan Kapoor', businessName: 'Kapoor Industrial Supplies', category: 'Manufacturing', service: 'Digital Growth', budget: 'Let’s discuss', status: 'CONTACTED', sourceDetail: 'linkedin', days: 3, message: 'B2B distributor looking to generate trade enquiries from outside Maharashtra.' },
  { name: 'Sneha Iyer', businessName: 'Bloom Skin Studio', category: 'Healthcare & Wellness', service: 'Social Media', budget: '₹25,000–₹50,000', status: 'QUALIFIED', sourceDetail: 'google', days: 5, message: 'Need consistent content and a way to convert DMs into appointments.' },
  { name: 'Kabir Shah', businessName: 'Wander Trails', category: 'Travel & Tourism', service: 'Business Automation', budget: '₹50,000–₹1,00,000', status: 'PROPOSAL_SENT', sourceDetail: null, days: 8, message: 'Our team replies to WhatsApp enquiries manually and we lose leads over the weekend.' },
  { name: 'Ananya Rao', businessName: 'Threadline Apparel', category: 'D2C & E-commerce', service: 'E-commerce', budget: '₹1,00,000+', status: 'WON', sourceDetail: 'google', days: 12, message: 'Moving from marketplace-only to our own online store with retention campaigns.' },
  { name: 'Vikram Desai', businessName: 'Desai & Associates', category: 'Professional Services', service: 'Website', budget: 'Under ₹25,000', status: 'LOST', sourceDetail: 'facebook', days: 15, message: 'Need a simple website for our CA practice.' },
  { name: 'Meera Joshi', businessName: 'Little Sprouts Preschool', category: 'Other', service: 'Digital Revenue Strategy', budget: '₹25,000–₹50,000', status: 'QUALIFIED', sourceDetail: 'instagram', days: 18, message: 'Admissions season is coming up; we want a plan across Google and Instagram.' },
  { name: 'Arjun Malhotra', businessName: 'Fresh Crate', category: 'Start-ups & Entrepreneurs', service: 'Revenue & Commerce', budget: 'Let’s discuss', status: 'CONTACTED', sourceDetail: 'linkedin', days: 22, message: 'Early-stage grocery subscription. Need help with the customer journey and repeat orders.' },
  { name: 'Isha Banerjee', businessName: 'Studio Ink Design', category: 'B2B', service: 'Performance Marketing', budget: '₹50,000–₹1,00,000', status: 'NEW', sourceDetail: 'google', days: 26, message: 'Want qualified B2B leads from Google Ads, not just clicks.' },
] as const

const statusLabels: Record<string, string> = { CONTACTED: 'Contacted', QUALIFIED: 'Qualified', PROPOSAL_SENT: 'Proposal sent', WON: 'Won', LOST: 'Lost' }
const noteBodies = ['Spoke on the phone — interested, wants a proposal by Friday.', 'Decision maker is the founder. Budget confirmed.', 'Sent proposal with two options; follow up on Monday.']

const audits = [
  { name: 'Neha Kulkarni', businessName: 'Spice Route Foods', website: 'https://example.com/spice-route', category: 'D2C & E-commerce', status: 'NEW', days: 0.5, requirements: 'Please look at our website conversion and Meta ads.', notes: null },
  { name: 'Siddharth Rao', businessName: 'Harbour View Resort', website: 'https://example.com/harbour-view', category: 'Hospitality', status: 'REVIEWING', days: 4, requirements: 'Direct bookings vs OTA dependency — where are we losing guests?', notes: 'Booking engine not linked from Google Business Profile. GA4 missing conversion events.' },
  { name: 'Tanvi Gupta', businessName: 'Gupta Electricals', website: 'https://example.com/gupta-electricals', category: 'Retail', status: 'AUDIT_READY', days: 9, requirements: 'Local visibility and WhatsApp enquiries.', notes: 'Audit deck ready: GBP reviews, local SEO, WhatsApp catalogue. Schedule a walkthrough call.' },
  { name: 'Rahul Verma', businessName: 'Verma Logistics', website: 'https://example.com/verma-logistics', category: 'B2B', status: 'SENT', days: 16, requirements: 'Review our LinkedIn and website for B2B lead generation.', notes: 'Sent on Friday. Follow up next week.' },
  { name: 'Kavya Menon', businessName: 'Menon Dental Care', website: 'https://example.com/menon-dental', category: 'Healthcare & Wellness', status: 'CLOSED', days: 28, requirements: 'Appointment enquiries from Google.', notes: 'Converted to a website + Google Ads engagement.' },
] as const

const insights = [
  {
    slug: 'demo-why-traffic-doesnt-always-mean-revenue', category: 'Digital Revenue', days: 3, status: 'PUBLISHED', title: 'Why traffic doesn’t always mean revenue',
    excerpt: 'The gap between attracting visitors and helping them become customers — and where most businesses lose them.',
    content: '## Visitors are not customers yet\n\nMany businesses measure success by how many people visit their website or see their posts. But **attention is only the first step**. Revenue depends on what happens after someone arrives.\n\n## Where the journey usually breaks\n\n- The page doesn’t answer the visitor’s real question\n- There is no clear next step — call, WhatsApp or enquiry\n- Enquiries arrive but nobody follows up quickly\n\n> A smaller audience with a clear path to enquire often outperforms a large audience with no direction.\n\n## What to do next\n\nMap the journey from first visit to purchase, then fix the step where most people drop off.\n\n*Sample article for the demo.*',
  },
  {
    slug: 'demo-campaigns-measured-on-leads', category: 'Performance Marketing', days: 10, status: 'PUBLISHED', title: 'Campaigns measured on leads, not clicks',
    excerpt: 'Connecting Google and Meta advertising to real enquiries, so every rupee is judged by what it brings in.',
    content: '## Clicks are easy to buy\n\nA low cost per click can hide a campaign that produces no business. The better question is: **how many qualified enquiries did this spend create?**\n\n## Three things to set up first\n\n1. Conversion tracking on enquiry forms and WhatsApp clicks\n2. Separate campaigns for different services\n3. A weekly review of cost per lead, not cost per click\n\n*Sample article for the demo.*',
  },
  {
    slug: 'demo-better-follow-up', category: 'Automation', days: 20, status: 'PUBLISHED', title: 'Better follow-up. Fewer missed opportunities.',
    excerpt: 'How WhatsApp and simple lead management connect the first enquiry to the next conversation.',
    content: '## Speed matters\n\nAn enquiry answered in minutes is far more likely to convert than one answered the next day.\n\n## A simple follow-up system\n\n- Instant WhatsApp acknowledgement\n- A shared list of open enquiries, each with an owner\n- Reminders when an enquiry has no reply\n\n*Sample article for the demo.*',
  },
  {
    slug: 'demo-playbook-digital-foundations', category: 'Entrepreneur’s Digital Playbook', days: 0, status: 'DRAFT', title: 'The first five digital foundations for a new business',
    excerpt: 'A practical checklist for founders before spending on advertising.',
    content: '## Draft\n\nWork in progress — drafts are not visible on the website.',
  },
] as const

const caseStudies = [
  {
    slug: 'demo-retail-brand-online-enquiries', title: 'Sample project: Retail brand — from footfall to online enquiries', industry: 'Retail', status: 'PUBLISHED', days: 14,
    summary: 'Demo case study showing how a project story looks. Replace with a real, client-approved project.',
    challenge: 'Strong in-store footfall, but almost no enquiries from the website or Google.',
    strategy: 'Connect **Google Business Profile**, a conversion-led website and WhatsApp into one enquiry journey.',
    execution: 'Rebuilt key landing pages, added WhatsApp click-to-chat, set up enquiry tracking and weekly reporting.',
    deliverables: ['Website redesign', 'Google Business Profile', 'WhatsApp click-to-chat', 'Conversion tracking'],
    result: 'Sample result text for the demo. Publish real results only once they are measured and approved by the client.',
    metrics: [{ label: 'Enquiries per month (sample)', value: '3×' }, { label: 'First response time (sample)', value: '< 10 min' }],
  },
  {
    slug: 'demo-d2c-repeat-purchase', title: 'Sample project: D2C brand — repeat purchase journey', industry: 'D2C & E-commerce', status: 'PUBLISHED', days: 25,
    summary: 'Demo case study for an ongoing project — shows how it looks before results are available.',
    challenge: 'Most customers bought once and never returned.',
    strategy: 'Map the post-purchase journey and add retention touchpoints on WhatsApp and email.',
    execution: 'Customer segmentation, post-purchase message sequences and a simple loyalty offer.',
    deliverables: ['Customer journey map', 'WhatsApp automation', 'Retention campaigns'],
    result: null, metrics: [],
  },
  {
    slug: 'demo-hospitality-direct-bookings', title: 'Sample project: Hospitality — direct bookings', industry: 'Hospitality', status: 'DRAFT', days: 2,
    summary: 'Draft demo case study (not visible on the website).', challenge: null, strategy: null, execution: null, deliverables: [], result: null, metrics: [],
  },
] as const

const testimonials = [
  { name: 'Sample Client', designation: 'Founder', company: 'Retail Brand (demo)', quote: 'This is a demo testimonial showing how client quotes appear on the website. Replace it with a real, approved quote.' },
  { name: 'Sample Client', designation: 'Marketing Head', company: 'D2C Brand (demo)', quote: 'A second demo testimonial, so you can see the previous and next controls. Publish only genuine quotes.' },
]

async function seed() {
  await clear()
  // Notes and status changes are attributed to the .env Admin when ADMIN_EMAIL is set.
  const actorId = (await ensureEnvAdmin().catch(() => null))?.id ?? null

  for (const [i, l] of leads.entries()) {
    const createdAt = ago(l.days, i)
    const later = (hours: number) => new Date(createdAt.getTime() + hours * 3600_000)
    await prisma.lead.create({
      data: {
        name: l.name, businessName: l.businessName, email: `${l.name.split(' ')[0].toLowerCase()}@example.com`, phone: `+91 90000 ${String(10000 + i).slice(1)}`,
        website: `${l.businessName.toLowerCase().replace(/[^a-z]+/g, '')}.example.com`, category: l.category, service: l.service, budget: l.budget, message: l.message,
        status: l.status, source: 'Demo', sourceDetail: l.sourceDetail, createdAt,
        activities: {
          create: [
            { type: 'CREATED', message: 'Enquiry received through the website form.', createdAt },
            ...(l.status === 'NEW' ? [] : [{ type: 'STATUS_CHANGED', message: `Status changed from New to ${statusLabels[l.status]}.`, actorId, createdAt: later(6) }]),
          ],
        },
        ...(l.status === 'NEW' ? {} : { notes: { create: [{ body: noteBodies[i % noteBodies.length], authorId: actorId, createdAt: later(8) }] } }),
      },
    })
  }
  for (const a of audits) {
    const createdAt = ago(a.days)
    await prisma.growthAudit.create({
      data: {
        name: a.name, businessName: a.businessName, email: `${a.name.split(' ')[0].toLowerCase()}@example.com`, phone: '+91 90000 00000', website: a.website,
        category: a.category, requirements: a.requirements, notes: a.notes, status: a.status, source: 'Demo', createdAt,
        activities: { create: [{ type: 'CREATED', message: 'Audit requested through the website form.', createdAt }] },
      },
    })
  }
  for (const s of insights) {
    await prisma.insight.create({
      data: { slug: s.slug, title: s.title, excerpt: s.excerpt, content: s.content, category: s.category, authorName: 'Chazon Team', tags: ['demo'], status: s.status, publishedAt: s.status === 'PUBLISHED' ? ago(s.days) : null },
    })
  }
  for (const [order, c] of caseStudies.entries()) {
    const { days, deliverables, metrics, ...data } = c
    await prisma.caseStudy.create({ data: { ...data, deliverables: [...deliverables], metrics: metrics.map(m => ({ ...m })), order, publishedAt: c.status === 'PUBLISHED' ? ago(days) : null } })
  }
  for (const [order, t] of testimonials.entries()) await prisma.testimonial.create({ data: { ...t, order, published: true } })
  console.log(`Added demo data: ${leads.length} leads, ${audits.length} audits, ${insights.length} insights, ${caseStudies.length} case studies, ${testimonials.length} testimonials.`)
}

await (process.argv.includes('--clear') ? clear() : seed()).catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())

export {}
