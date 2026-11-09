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

export const demoInsights: { slug: string; title: string; excerpt: string; category: string; status: ContentStatus; days: number; readingTime?: string; content: string }[] = [
  {
    slug: 'how-to-build-a-digital-revenue-engine',
    title: 'How to Build a Digital Revenue Engine for Your Business',
    category: 'Strategy',
    readingTime: '6 min read',
    status: 'PUBLISHED',
    days: 1,
    excerpt: 'Move from a disconnected digital presence to an integrated revenue engine that converts traffic into sustainable business revenue.',
    content: `## Beyond the Passive Website

Most businesses invest in websites that look attractive but perform like digital business cards. They generate occasional inquiries but lack a systematic architecture for consistent conversion.

### The Five Pillars of a Revenue Engine

1. **Strategic Intent**: Align every page with a high-value customer decision point.
2. **Authority & Discoverability**: Capture high-intent organic and search demand before competitors.
3. **Frictionless Conversion**: Clear value propositions, fast loading speeds, and simplified inquiries.
4. **Automated Follow-Through**: Instant WhatsApp triage and CRM capture so no lead goes cold.
5. **Continuous Optimization**: Ongoing measurement of commercial outcomes rather than vanity clicks.

> "A website is not an expense—when engineered correctly, it is the highest ROI salesperson in your company."

### Practical Next Steps

Review your customer journey today. Identify the single biggest drop-off point between first discovery and conversation, and streamline that step first.`,
  },
  {
    slug: 'top-seo-strategies-to-improve-visibility-2026',
    title: 'Top SEO Strategies to Improve Your Visibility in 2026',
    category: 'SEO',
    readingTime: '5 min read',
    status: 'PUBLISHED',
    days: 4,
    excerpt: 'High-intent search architecture, structured schema foundations, and local authority strategies for growing businesses.',
    content: `## Search Is Shifting Toward Buyer Intent

Generic keyword stuffing is obsolete. In 2026, search algorithms prioritize authoritative, helpful content that directly satisfies specific customer commercial questions.

### 3 High-Impact Priorities

- **Commercial Intent Pages**: Build dedicated landing pages tailored to specific service problems.
- **Local & Entity SEO**: Optimize your Google Business Profile and local citations with consistent NAP data.
- **Speed & Core Web Vitals**: Sub-second server response times (TTFB) directly improve rankings and bounce rates.

Organize your content into clear thematic clusters to establish topical authority across your primary industry.`,
  },
  {
    slug: 'whatsapp-marketing-for-better-customer-engagement',
    title: 'WhatsApp Marketing for Better Customer Engagement',
    category: 'Marketing',
    readingTime: '4 min read',
    status: 'PUBLISHED',
    days: 7,
    excerpt: 'How immediate WhatsApp response times and conversational automation transform lead conversion rates.',
    content: `## Speed Is the Ultimate Conversion Lever

Studies consistently reveal that inquiries responded to within 5 minutes are 21 times more likely to qualify than those answered after 30 minutes.

### The WhatsApp Growth Advantage

- **Direct Personal Reach**: 98% open rates compared to 20% for standard email.
- **Instant Inquiry Triage**: Automatic greeting and requirement qualification while interest is hot.
- **Seamless CRM Handover**: Routing hot prospects directly to founder or sales specialists.

Combine click-to-chat CTAs on high-intent service pages with structured automated routing for maximum conversion impact.`,
  },
  {
    slug: 'why-traffic-doesnt-always-mean-revenue',
    category: 'Digital Revenue',
    readingTime: '4 min read',
    status: 'PUBLISHED',
    days: 12,
    title: 'Why traffic doesn’t always mean revenue',
    excerpt: 'The gap between attracting visitors and helping them become customers — and where most businesses lose them.',
    content: '## Visitors are not customers yet\n\nMany businesses measure success by how many people visit their website or see their posts. But attention is only the first step. Revenue depends on what happens after someone arrives.\n\n## Where the journey usually breaks\n\n- The page doesn’t answer the visitor’s real question\n- There is no clear next step — call, WhatsApp or enquiry\n- Enquiries arrive but nobody follows up quickly\n\n> A smaller audience with a clear path to enquire often outperforms a large audience with no direction.',
  },
  {
    slug: 'campaigns-measured-on-leads',
    category: 'Marketing',
    readingTime: '5 min read',
    status: 'PUBLISHED',
    days: 18,
    title: 'Campaigns measured on leads, not clicks',
    excerpt: 'Connecting Google and Meta advertising to real enquiries, so every rupee is judged by what it brings in.',
    content: '## Clicks are easy to buy\n\nA low cost per click can hide a campaign that produces no business. The better question is: how many qualified enquiries did this spend create?\n\n## Three things to set up first\n\n1. Conversion tracking on enquiry forms and WhatsApp clicks\n2. Separate campaigns for different services\n3. A weekly review of cost per lead, not cost per click',
  },
]

export const demoCaseStudies: { slug: string; title: string; industry: string; status: ContentStatus; days: number; summary: string; challenge: string | null; strategy: string | null; execution: string | null; deliverables: string[]; result: string | null; metrics: { label: string; value: string }[] }[] = [
  {
    slug: 'handmade-jewellery-ecommerce',
    title: 'Handmade Jewellery Brand',
    industry: 'E-commerce',
    status: 'PUBLISHED',
    days: 10,
    summary: 'Direct-to-consumer store re-architecture and retention system resulting in 3.2× revenue growth in 6 months.',
    challenge: 'Relied heavily on offline exhibitions and Instagram DMs, experiencing lost inquiries and low repeat purchases.',
    strategy: 'Built a bespoke conversion-optimized Shopify storefront connected with WhatsApp checkout assistance and Meta Ads.',
    execution: 'Engineered responsive mobile product templates, high-speed image loading, Meta Pixel event tracking, and automated abandoned checkout flows.',
    deliverables: ['Custom E-commerce Store', 'Meta Ads Conversion Funnel', 'WhatsApp Retention Workflows', 'GA4 Attribution'],
    result: '3.2× growth in monthly online revenue with repeat customer retention scaling to 42% over two quarters.',
    metrics: [{ label: 'Revenue in 6 Months', value: '↑ 3.2×' }, { label: 'Repeat Customer Rate', value: '42%' }],
  },
  {
    slug: 'hospitality-booking-platform',
    title: 'Hospitality Platform',
    industry: 'Booking Platform',
    status: 'PUBLISHED',
    days: 18,
    summary: 'Direct reservation engine and local search visibility overhaul generating 55% more direct bookings.',
    challenge: 'High reliance on third-party OTA booking platforms with 18–25% commission fees eating into hotel profit margins.',
    strategy: 'Deployed an intuitive direct booking engine, localized Google Business Profile authority, and high-intent Google Search campaigns.',
    execution: 'Built sub-second mobile booking flow, integrated direct WhatsApp room inquiry triage, and set up dynamic seasonal search ads.',
    deliverables: ['Direct Reservation UI/UX', 'Google Local SEO & GBP', 'Google Ads Search Engine', 'WhatsApp Concierge Automation'],
    result: 'Direct room reservations climbed 55%, reducing external OTA commission expenditures by over 38%.',
    metrics: [{ label: 'More Bookings', value: '↑ 55%' }, { label: 'OTA Commission Saved', value: '38%' }],
  },
  {
    slug: 'manufacturing-b2b-corporate',
    title: 'Manufacturing Business',
    industry: 'Corporate Website',
    status: 'PUBLISHED',
    days: 24,
    summary: 'Enterprise B2B digital catalog and structured RFQ inquiry funnel driving 78% increase in qualified trade leads.',
    challenge: 'Legacy brochure website had zero search visibility outside Maharashtra and failed to produce verified commercial quotes.',
    strategy: 'Architected structured product specification pages, technical SEO for high-value industrial keywords, and a multi-tier quotation form.',
    execution: 'Implemented accessible technical specs, SEO metadata for 120+ industrial components, automated CRM lead routing, and instant RFQ receipts.',
    deliverables: ['Corporate Catalog Architecture', 'Industrial SEO Strategy', 'B2B RFQ Smart Form', 'HubSpot CRM Sync'],
    result: '78% surge in qualified commercial trade inquiries across India and Middle Eastern export markets within 90 days.',
    metrics: [{ label: 'Lead Generation', value: '↑ 78%' }, { label: 'RFQ Response Time', value: '< 2 hrs' }],
  },
  {
    slug: 'health-wellness-clinic-growth',
    title: 'Health & Wellness Brand',
    industry: 'Digital Marketing',
    status: 'PUBLISHED',
    days: 30,
    summary: 'Integrated local search authority, appointment booking optimization, and paid acquisition driving 2.8× website traffic.',
    challenge: 'Fragmented social posts failed to generate booked clinic consultations, while local competitors dominated regional Google search rankings.',
    strategy: 'Created high-intent local clinic landing pages, structured medical schema markup, and streamlined WhatsApp appointment booking.',
    execution: 'Developed localized clinical service hubs, targeted Google Performance Max campaigns, and instant appointment confirmation sequences.',
    deliverables: ['Local Search & Maps Authority', 'Appointment Booking CRO', 'Meta & Google Ads Engine', 'Automated Clinic Reminders'],
    result: '2.8× increase in organic and paid website traffic, yielding over 410 confirmed monthly clinic appointments.',
    metrics: [{ label: 'Website Traffic', value: '↑ 2.8×' }, { label: 'Conversion Rate', value: '+62%' }],
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
