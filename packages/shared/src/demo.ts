// Built-in sample data for demo mode (VITE_DEMO_MODE=true): lets the Admin and website be explored fully loaded
// without an API or database. Everything here is fictional and labelled as sample content.
import type { AuditStatus, ContentStatus, LeadStatus, Pillar } from './constants'

export const DEMO_LOGIN = { email: 'demo@chazon.local', password: 'chazon-demo-2026', name: 'Demo Admin' }

const DAY = 86400_000
export const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString()

export const demoServices: { title: string; pillar: Pillar; shortDescription?: string }[] = [
  ...['Website Development', 'E-commerce Development', 'Landing Pages', 'Google Business Profile', 'Digital Platform Setup', 'UI/UX & Conversion Optimisation'].map(title => ({ title, pillar: 'BUILD' as const })),
  ...['Performance Marketing', 'Google Ads', 'Meta Ads', 'Social Media Marketing', 'SEO', 'Lead Generation', 'Content Strategy', 'Digital Campaigns'].map(title => ({ title, pillar: 'GROW' as const })),
  ...['Digital Revenue Strategy', 'E-commerce Strategy', 'Marketplace Strategy', 'Conversion Optimisation', 'Customer Journey Mapping', 'Pricing & Merchandising', 'Digital Commerce Consulting'].map(title => ({ title, pillar: 'CONVERT' as const })),
  ...['WhatsApp Business Solutions', 'Lead Follow-up Automation', 'Customer Communication', 'Marketing Automation', 'CRM Workflows', 'AI-powered Customer Support', 'Repeat Purchase / Retention Systems'].map(title => ({ title, pillar: 'AUTOMATE' as const })),
]

export const demoIndustries: [string, string][] = [
  ['D2C & E-commerce', 'Connect discovery, shopping and retention to build a stronger digital commerce journey.'],
  ['Retail', 'Connect local visibility and online presence to create a clearer path to purchase.'],
  ['Hospitality', 'Help guests discover your business, explore the experience and make an enquiry or booking.'],
  ['Travel & Tourism', 'Bring inspiration, enquiry and follow-up together in one considered customer journey.'],
  ['Professional Services', 'Make your expertise easy to understand and help the right prospects take the next step.'],
  ['Healthcare & Wellness', 'Build clear, accessible digital experiences that help people find your services and enquire.'],
  ['Manufacturing', 'Translate your capabilities into a digital presence that supports trade enquiries and commerce.'],
  ['B2B', 'Support longer buying journeys with relevant content, qualified enquiries and consistent follow-up.'],
  ['Start-ups & Entrepreneurs', 'Prioritise the right digital foundations and channels for your next stage of business.'],
]

export const demoLeads: { name: string; businessName: string; category: string; service: string; budget: string; status: LeadStatus; sourceDetail: string | null; days: number; message: string; note?: string }[] = [
  { name: 'Aarav Mehta', businessName: 'Mehta Home Décor', category: 'Retail', service: 'Website', budget: '₹25,000–₹50,000', status: 'NEW', sourceDetail: 'google', days: 0.2, message: 'We have two stores in Andheri and want customers to browse and enquire online before visiting.' },
  { name: 'Priya Nair', businessName: 'Coastal Kitchen Co.', category: 'Hospitality', service: 'Performance Marketing', budget: '₹50,000–₹1,00,000', status: 'NEW', sourceDetail: 'instagram', days: 1, message: 'Lots of Instagram followers but table bookings are flat. Want ads that bring actual reservations.' },
  { name: 'Rohan Kapoor', businessName: 'Kapoor Industrial Supplies', category: 'Manufacturing', service: 'Digital Growth', budget: 'Let’s discuss', status: 'CONTACTED', sourceDetail: 'linkedin', days: 3, message: 'B2B distributor looking to generate trade enquiries from outside Maharashtra.', note: 'Spoke on the phone — interested, wants a proposal by Friday.' },
  { name: 'Sneha Iyer', businessName: 'Bloom Skin Studio', category: 'Healthcare & Wellness', service: 'Social Media', budget: '₹25,000–₹50,000', status: 'QUALIFIED', sourceDetail: 'google', days: 5, message: 'Need consistent content and a way to convert DMs into appointments.', note: 'Decision maker is the founder. Budget confirmed.' },
  { name: 'Kabir Shah', businessName: 'Wander Trails', category: 'Travel & Tourism', service: 'Business Automation', budget: '₹50,000–₹1,00,000', status: 'PROPOSAL_SENT', sourceDetail: null, days: 8, message: 'Our team replies to WhatsApp enquiries manually and we lose leads over the weekend.', note: 'Sent proposal with two options; follow up on Monday.' },
  { name: 'Ananya Rao', businessName: 'Threadline Apparel', category: 'D2C & E-commerce', service: 'E-commerce', budget: '₹1,00,000+', status: 'WON', sourceDetail: 'google', days: 12, message: 'Moving from marketplace-only to our own online store with retention campaigns.', note: 'Signed. Kick-off call scheduled.' },
  { name: 'Vikram Desai', businessName: 'Desai & Associates', category: 'Professional Services', service: 'Website', budget: 'Under ₹25,000', status: 'LOST', sourceDetail: 'facebook', days: 15, message: 'Need a simple website for our CA practice.', note: 'Chose a template builder for now.' },
  { name: 'Meera Joshi', businessName: 'Little Sprouts Preschool', category: 'Start-ups & Entrepreneurs', service: 'Digital Revenue Strategy', budget: '₹25,000–₹50,000', status: 'QUALIFIED', sourceDetail: 'instagram', days: 18, message: 'Admissions season is coming up; we want a plan across Google and Instagram.', note: 'Wants to start before the admissions window.' },
  { name: 'Arjun Malhotra', businessName: 'Fresh Crate', category: 'Start-ups & Entrepreneurs', service: 'Revenue & Commerce', budget: 'Let’s discuss', status: 'CONTACTED', sourceDetail: 'linkedin', days: 22, message: 'Early-stage grocery subscription. Need help with the customer journey and repeat orders.', note: 'Left a voicemail; emailed the audit overview.' },
  { name: 'Isha Banerjee', businessName: 'Studio Ink Design', category: 'B2B', service: 'Performance Marketing', budget: '₹50,000–₹1,00,000', status: 'NEW', sourceDetail: 'google', days: 26, message: 'Want qualified B2B leads from Google Ads, not just clicks.' },
]

export const demoAudits: { name: string; businessName: string; website: string; category: string; status: AuditStatus; days: number; requirements: string; notes: string | null }[] = [
  { name: 'Neha Kulkarni', businessName: 'Spice Route Foods', website: 'https://example.com/spice-route', category: 'D2C & E-commerce', status: 'NEW', days: 0.5, requirements: 'Please look at our website conversion and Meta ads.', notes: null },
  { name: 'Siddharth Rao', businessName: 'Harbour View Resort', website: 'https://example.com/harbour-view', category: 'Hospitality', status: 'REVIEWING', days: 4, requirements: 'Direct bookings vs OTA dependency — where are we losing guests?', notes: 'Booking engine not linked from Google Business Profile. GA4 missing conversion events.' },
  { name: 'Tanvi Gupta', businessName: 'Gupta Electricals', website: 'https://example.com/gupta-electricals', category: 'Retail', status: 'AUDIT_READY', days: 9, requirements: 'Local visibility and WhatsApp enquiries.', notes: 'Audit deck ready: GBP reviews, local SEO, WhatsApp catalogue. Schedule a walkthrough call.' },
  { name: 'Rahul Verma', businessName: 'Verma Logistics', website: 'https://example.com/verma-logistics', category: 'B2B', status: 'SENT', days: 16, requirements: 'Review our LinkedIn and website for B2B lead generation.', notes: 'Sent on Friday. Follow up next week.' },
  { name: 'Kavya Menon', businessName: 'Menon Dental Care', website: 'https://example.com/menon-dental', category: 'Healthcare & Wellness', status: 'CLOSED', days: 28, requirements: 'Appointment enquiries from Google.', notes: 'Converted to a website + Google Ads engagement.' },
]

export const demoInsights: { slug: string; title: string; excerpt: string; category: string; status: ContentStatus; days: number; content: string }[] = [
  {
    slug: 'why-traffic-doesnt-always-mean-revenue', category: 'Digital Revenue', status: 'PUBLISHED', days: 3, title: 'Why traffic doesn’t always mean revenue',
    excerpt: 'The gap between attracting visitors and helping them become customers — and where most businesses lose them.',
    content: '## Visitors are not customers yet\n\nMany businesses measure success by how many people visit their website or see their posts. But **attention is only the first step**. Revenue depends on what happens after someone arrives.\n\n## Where the journey usually breaks\n\n- The page doesn’t answer the visitor’s real question\n- There is no clear next step — call, WhatsApp or enquiry\n- Enquiries arrive but nobody follows up quickly\n\n> A smaller audience with a clear path to enquire often outperforms a large audience with no direction.\n\n## What to do next\n\nMap the journey from first visit to purchase, then fix the step where most people drop off.\n\n*Sample article for the demo.*',
  },
  {
    slug: 'campaigns-measured-on-leads', category: 'Performance Marketing', status: 'PUBLISHED', days: 10, title: 'Campaigns measured on leads, not clicks',
    excerpt: 'Connecting Google and Meta advertising to real enquiries, so every rupee is judged by what it brings in.',
    content: '## Clicks are easy to buy\n\nA low cost per click can hide a campaign that produces no business. The better question is: **how many qualified enquiries did this spend create?**\n\n## Three things to set up first\n\n1. Conversion tracking on enquiry forms and WhatsApp clicks\n2. Separate campaigns for different services\n3. A weekly review of cost per lead, not cost per click\n\n*Sample article for the demo.*',
  },
  {
    slug: 'your-customer-journey-is-your-growth-opportunity', category: 'Digital Commerce', status: 'PUBLISHED', days: 15, title: 'Your customer journey is your growth opportunity',
    excerpt: 'The moments between discovery, purchase and a customer coming back.',
    content: '## Look beyond the first sale\n\nThe journey doesn’t end at checkout. Delivery updates, a thank-you message and a timely reminder all shape whether a customer returns.\n\n## Quick wins\n\n- A post-purchase WhatsApp message\n- A simple reorder link\n- A review request a week later\n\n*Sample article for the demo.*',
  },
  {
    slug: 'better-follow-up', category: 'Automation', status: 'PUBLISHED', days: 20, title: 'Better follow-up. Fewer missed opportunities.',
    excerpt: 'How WhatsApp and simple lead management connect the first enquiry to the next conversation.',
    content: '## Speed matters\n\nAn enquiry answered in minutes is far more likely to convert than one answered the next day.\n\n## A simple follow-up system\n\n- Instant WhatsApp acknowledgement\n- A shared list of open enquiries, each with an owner\n- Reminders when an enquiry has no reply\n\n*Sample article for the demo.*',
  },
  {
    slug: 'first-five-digital-foundations', category: 'Entrepreneur’s Digital Playbook', status: 'DRAFT', days: 0, title: 'The first five digital foundations for a new business',
    excerpt: 'A practical checklist for founders before spending on advertising.',
    content: '## Draft\n\nWork in progress — drafts are not visible on the website.',
  },
]

export const demoCaseStudies: { slug: string; title: string; industry: string; status: ContentStatus; days: number; summary: string; challenge: string | null; strategy: string | null; execution: string | null; deliverables: string[]; result: string | null; metrics: { label: string; value: string }[] }[] = [
  {
    slug: 'retail-brand-online-enquiries', title: 'Sample project: Retail brand — from footfall to online enquiries', industry: 'Retail', status: 'PUBLISHED', days: 14,
    summary: 'Demo case study showing how a project story looks. Replace with a real, client-approved project.',
    challenge: 'Strong in-store footfall, but almost no enquiries from the website or Google.',
    strategy: 'Connect **Google Business Profile**, a conversion-led website and WhatsApp into one enquiry journey.',
    execution: 'Rebuilt key landing pages, added WhatsApp click-to-chat, set up enquiry tracking and weekly reporting.',
    deliverables: ['Website redesign', 'Google Business Profile', 'WhatsApp click-to-chat', 'Conversion tracking'],
    result: 'Sample result text for the demo. Publish real results only once they are measured and approved by the client.',
    metrics: [{ label: 'Enquiries per month (sample)', value: '3×' }, { label: 'First response time (sample)', value: '< 10 min' }],
  },
  {
    slug: 'd2c-repeat-purchase', title: 'Sample project: D2C brand — repeat purchase journey', industry: 'D2C & E-commerce', status: 'PUBLISHED', days: 25,
    summary: 'Demo case study for an ongoing project — shows how it looks before results are available.',
    challenge: 'Most customers bought once and never returned.',
    strategy: 'Map the post-purchase journey and add retention touchpoints on WhatsApp and email.',
    execution: 'Customer segmentation, post-purchase message sequences and a simple loyalty offer.',
    deliverables: ['Customer journey map', 'WhatsApp automation', 'Retention campaigns'],
    result: null, metrics: [],
  },
  {
    slug: 'hospitality-direct-bookings', title: 'Sample project: Hospitality — direct bookings', industry: 'Hospitality', status: 'DRAFT', days: 2,
    summary: 'Draft demo case study (not visible on the website).', challenge: null, strategy: null, execution: null, deliverables: [], result: null, metrics: [],
  },
]

export const demoTestimonials = [
  { name: 'Sample Client', designation: 'Founder', company: 'Retail Brand (demo)', quote: 'This is a demo testimonial showing how client quotes appear on the website. Replace it with a real, approved quote.' },
  { name: 'Sample Client', designation: 'Marketing Head', company: 'D2C Brand (demo)', quote: 'A second demo testimonial, so you can see the previous and next controls. Publish only genuine quotes.' },
]

export const demoSettings = {
  companyName: 'Chazon Digital Ventures', tagline: 'Revenue-Led Digital Transformation',
  description: 'Chazon Digital Ventures helps businesses build, optimise and grow their digital revenue channels through strategy, technology, marketing and automation.',
  email: 'hello@example.com', phone: '+91 90000 00000', whatsapp: '', location: 'Mumbai, Maharashtra',
  linkedinUrl: '', instagramUrl: '', facebookUrl: '', ctaTalkLabel: 'Let’s Talk', ctaAuditLabel: 'Get a Digital Growth Audit',
}

export const demoHomeSeo = {
  title: 'Chazon Digital Ventures | Digital Revenue & Growth Partner',
  description: 'Build, optimise and grow your digital revenue channels with Chazon. Business-first strategy, websites, marketing, digital commerce and automation in Mumbai.',
}
