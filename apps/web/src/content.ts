// Website copy, based on the Chazon Website Development Brief.
// Keep claims factual: add clients, results, testimonials and articles only once they are verified and approved.
// `pillars` and `industries` also seed the API database (apps/api/prisma/seed.ts) — keep their shape.
import { PILLAR_SLUGS, PILLARS, type Pillar as PillarKey } from '@chazon/shared'

export type PillarService = { title: string; text: string }
export type Faq = [question: string, answer: string]
export type Pillar = {
  key: PillarKey
  slug: string
  /** Pillar name used across the CMS ("Digital Foundation"). */
  title: string
  /** The one-word role in the system ("Build"). */
  verb: string
  /** What the pillar covers, in plain words. */
  scope: string
  line: string
  /** The business problem it addresses. */
  problem: string
  statement: string
  /** Service titles. Replaced by the services published in the Admin once the API responds. */
  items: string[]
  page: {
    title: string
    description: string
    h1: string
    intro: string
    signs: string[]
    services: PillarService[]
    deliverables: string[]
    audience: string
    cta: string
    faqs: Faq[]
  }
}

const pillarCopy: Omit<Pillar, 'key' | 'slug'>[] = [
  {
    title: 'Digital Foundation', verb: 'Build', scope: 'Websites, e-commerce, landing pages & UX',
    line: 'The platforms your business depends on.',
    problem: 'A website that exists, but doesn’t move visitors to enquire or buy.',
    statement: 'We build the digital platforms your business depends on — designed to convert, not just to exist.',
    items: ['Website Development', 'E-commerce Development', 'Landing Pages', 'Google Business Profile', 'Digital Platform Setup', 'UI/UX & Conversion Optimisation'],
    page: {
      title: 'Website & E-commerce Development | Chazon Digital Ventures',
      description: 'Websites, e-commerce stores and landing pages planned around how your customers decide — fast, accessible, measurable and built to turn visitors into enquiries.',
      h1: 'Websites, e-commerce and landing pages built to convert.',
      intro: 'Most of your marketing ends up on your website. We plan and build the platforms your business depends on — structured around how your customers decide, technically sound, and measurable from the day they launch.',
      signs: [
        'Visitors arrive, but few of them enquire or buy.',
        'The site is slow, hard to update or awkward on a phone.',
        'Campaigns send traffic to pages that weren’t built for it.',
        'Your website and Google Business Profile tell different stories.',
      ],
      services: [
        { title: 'Website Development', text: 'Business websites structured around your services, your customers’ questions and a clear next step.' },
        { title: 'E-commerce Development', text: 'Online stores with clear product pages, a straightforward checkout and the integrations you need to run them.' },
        { title: 'Landing Pages', text: 'Focused pages for campaigns and offers — each with one job and one measurable action.' },
        { title: 'Google Business Profile', text: 'A complete, accurate profile so local customers can find you, trust you and get in touch.' },
        { title: 'Digital Platform Setup', text: 'Domains, analytics, forms, tracking and the tools around your site, configured properly.' },
        { title: 'UI/UX & Conversion Optimisation', text: 'Layouts, content hierarchy and calls to action designed so the next step is always obvious.' },
      ],
      deliverables: [
        'A site structure and page plan based on how your customers decide',
        'Responsive design and development for phones, tablets and desktops',
        'On-page SEO foundations: titles, descriptions, headings and structured data',
        'Enquiry forms or checkout connected to where your team works',
        'Analytics and conversion tracking set up before launch',
      ],
      audience: 'Businesses launching or rebuilding a website, D2C brands moving to their own store, and service businesses whose site isn’t producing enquiries.',
      cta: 'Discuss your website project',
      faqs: [
        ['Can you improve our existing website instead of rebuilding it?', 'Often, yes. We start by reviewing what already works. If focused improvements to structure, speed, content and calls to action will do the job, we recommend those before a rebuild.'],
        ['Do you build e-commerce stores as well as websites?', 'Yes. E-commerce development is part of Build, and it connects directly to our e-commerce and marketplace strategy work under Convert.'],
        ['Will the site be ready for SEO and advertising?', 'Search foundations, analytics and conversion tracking are part of the build, so growth activity can start on a measurable base.'],
      ],
    },
  },
  {
    title: 'Digital Growth', verb: 'Grow', scope: 'SEO, paid acquisition, content & lead generation',
    line: 'Attention into qualified demand.',
    problem: 'Spend and effort across channels, with no clear line to enquiries.',
    statement: 'We turn digital attention into qualified demand — every channel working toward the same leads.',
    items: ['Performance Marketing', 'Google Ads', 'Meta Ads', 'Social Media Marketing', 'SEO', 'Lead Generation', 'Content Strategy', 'Digital Campaigns'],
    page: {
      title: 'SEO, Performance Marketing & Lead Generation | Chazon',
      description: 'SEO, Google Ads, Meta Ads, social media and content planned as one system — so every channel works toward qualified enquiries you can measure.',
      h1: 'SEO, paid acquisition and content that bring qualified demand.',
      intro: 'More traffic is easy to buy. Qualified demand is harder. We plan search, social, content and advertising together, so every channel works toward the same enquiries — and you can see which ones do.',
      signs: [
        'Ad spend is rising, but you can’t tell which campaigns produce enquiries.',
        'You don’t appear when customers search for what you sell.',
        'Social media gets engagement, but rarely leads.',
        'Content is published without a clear audience or purpose.',
      ],
      services: [
        { title: 'Performance Marketing', text: 'Paid campaigns planned and optimised against leads and sales, not clicks alone.' },
        { title: 'Google Ads', text: 'Search campaigns aimed at people who are already looking for what you offer.' },
        { title: 'Meta Ads', text: 'Facebook and Instagram campaigns that build demand and capture enquiries.' },
        { title: 'Social Media Marketing', text: 'A consistent presence, with content connected to a conversion journey.' },
        { title: 'SEO', text: 'Technical, on-page and content work that helps the right customers find you in search.' },
        { title: 'Lead Generation', text: 'Offers, landing pages and forms designed to turn interest into qualified enquiries.' },
        { title: 'Content Strategy', text: 'Topics and formats chosen around what your customers need to know before they buy.' },
        { title: 'Digital Campaigns', text: 'Launches and seasonal pushes coordinated across every channel you use.' },
      ],
      deliverables: [
        'A channel plan tied to your business objectives and KPIs',
        'Campaign setup with conversion tracking in place',
        'A search visibility review and prioritised SEO actions',
        'A content plan with briefs for each piece',
        'Reporting on leads, cost and conversion — not just reach and clicks',
      ],
      audience: 'Businesses ready to invest in growth that want spend tied to enquiries, brands relying on a single channel, and teams that need search, social and ads planned together.',
      cta: 'Discuss your growth plan',
      faqs: [
        ['Do you guarantee rankings or a number of leads?', 'No. Nobody can honestly guarantee search rankings or lead volumes. What we commit to is a clear plan, transparent reporting and steady optimisation based on what the data shows.'],
        ['Should we start with SEO or paid advertising?', 'It depends on your objective, timeline and budget. Paid campaigns can create demand sooner; SEO builds visibility that compounds over time. We recommend the mix once we understand your business.'],
        ['Can you work with our existing website?', 'Yes. If the site is likely to waste paid traffic, we’ll say so and recommend focused fixes first.'],
      ],
    },
  },
  {
    title: 'Revenue & Commerce', verb: 'Convert', scope: 'Customer journeys, CRO & e-commerce strategy',
    line: 'Visitors into repeat customers.',
    problem: 'Traffic that arrives, hesitates and leaves without acting.',
    statement: 'We don’t just drive traffic. We improve what happens after it arrives — from first visit to repeat purchase.',
    items: ['Digital Revenue Strategy', 'E-commerce Strategy', 'Marketplace Strategy', 'Conversion Optimisation', 'Customer Journey Mapping', 'Pricing & Merchandising', 'Digital Commerce Consulting'],
    page: {
      title: 'Conversion Optimisation & E-commerce Strategy | Chazon',
      description: 'Customer journey mapping, conversion optimisation and e-commerce strategy that turn more of your existing traffic into enquiries, orders and repeat customers.',
      h1: 'Turn more of the traffic you already have into customers.',
      intro: 'We don’t just drive traffic. We improve what happens after it arrives — the path from first visit to enquiry, purchase and repeat purchase — so the visitors you already pay for are more likely to act.',
      signs: [
        'Plenty of visitors, too few enquiries or orders.',
        'Customers drop off at product pages, forms or checkout.',
        'Marketplace and own-store sales aren’t planned together.',
        'Pricing and merchandising decisions are made without data.',
      ],
      services: [
        { title: 'Digital Revenue Strategy', text: 'A clear view of where your digital revenue comes from today and where the next growth should come from.' },
        { title: 'E-commerce Strategy', text: 'Range, journey and channel decisions for your online store.' },
        { title: 'Marketplace Strategy', text: 'How and where to sell on marketplaces alongside your own channels.' },
        { title: 'Conversion Optimisation', text: 'Finding where visitors drop off, then testing the changes that remove friction.' },
        { title: 'Customer Journey Mapping', text: 'Every step from discovery to repeat purchase, mapped and improved.' },
        { title: 'Pricing & Merchandising', text: 'How products, bundles and offers are presented and priced online.' },
        { title: 'Digital Commerce Consulting', text: 'Experienced advice on building and running a digital commerce business.' },
      ],
      deliverables: [
        'A customer journey map showing where people drop off',
        'A conversion review of your key pages, forms or checkout',
        'Improvements prioritised by expected impact and effort',
        'A test plan and a way to measure each change',
        'E-commerce, marketplace and merchandising recommendations',
      ],
      audience: 'D2C and e-commerce brands, retailers, manufacturers entering digital commerce, and any business with traffic that isn’t turning into customers.',
      cta: 'Discuss your conversion challenges',
      faqs: [
        ['How is this different from building a new website?', 'Conversion work focuses on the journey: where people hesitate, what they need to see and what stops them acting. Sometimes that means rebuilding pages; often it means changing content, structure, offers or forms.'],
        ['Do we need a lot of traffic for conversion optimisation?', 'Formal A/B testing needs reasonable traffic. With lower volumes we rely on journey analysis, customer insight and proven fixes, then measure the change.'],
      ],
    },
  },
  {
    title: 'Automation & Retention', verb: 'Automate', scope: 'Lead follow-up, CRM, WhatsApp & AI workflows',
    line: 'Follow-up that never slips.',
    problem: 'Leads that go cold because follow-up depends on someone remembering.',
    statement: 'We connect customer communication, follow-up and retention into one automated system.',
    items: ['WhatsApp Business Solutions', 'Lead Follow-up Automation', 'Customer Communication', 'Marketing Automation', 'CRM Workflows', 'AI-powered Customer Support', 'Repeat Purchase / Retention Systems'],
    page: {
      title: 'WhatsApp, CRM & Marketing Automation | Chazon',
      description: 'WhatsApp Business, CRM workflows, lead follow-up and AI-assisted support connected into one system — so every enquiry gets a timely response and customers come back.',
      h1: 'Follow-up that happens on time, every time.',
      intro: 'Leads go cold when follow-up depends on someone remembering. We connect WhatsApp, your CRM and customer communication into workflows that respond quickly, keep every lead visible and bring customers back.',
      signs: [
        'Enquiries arrive on WhatsApp, email and forms with no single record.',
        'Follow-ups are manual and depend on who is free.',
        'Customers aren’t contacted again after their first purchase.',
        'Your team answers the same questions all day.',
      ],
      services: [
        { title: 'WhatsApp Business Solutions', text: 'WhatsApp Business set up for enquiries, updates and conversations at scale.' },
        { title: 'Lead Follow-up Automation', text: 'Instant acknowledgements and timed follow-ups, so no enquiry is left waiting.' },
        { title: 'Customer Communication', text: 'Consistent messages across WhatsApp and email at each stage of the journey.' },
        { title: 'Marketing Automation', text: 'Sequences triggered by what customers actually do.' },
        { title: 'CRM Workflows', text: 'Every lead captured, assigned and tracked through to an outcome.' },
        { title: 'AI-powered Customer Support', text: 'Assistants that answer common questions and hand over to your team when a person is needed.' },
        { title: 'Repeat Purchase / Retention Systems', text: 'Reminders, offers and check-ins that encourage customers to come back.' },
      ],
      deliverables: [
        'A map of how leads and customers move through your business today',
        'Workflow design for capture, response, follow-up and handover',
        'WhatsApp Business and CRM configuration',
        'Message templates for each stage of the journey',
        'A clear view of every lead’s status',
      ],
      audience: 'Businesses losing leads to slow follow-up, teams handling enquiries on WhatsApp, and brands that want more repeat purchases.',
      cta: 'Discuss your automation needs',
      faqs: [
        ['Do we need a CRM already?', 'No. We can work with the tools you already use, or recommend a setup that fits your team and budget.'],
        ['Will automation make our communication feel impersonal?', 'It shouldn’t. Automation handles timing and routine messages; your team stays in the conversations that need a person.'],
      ],
    },
  },
]

// Four parts of one growth system: Build → Grow → Convert → Automate.
export const pillars: Pillar[] = pillarCopy.map((p, i) => ({ ...p, key: PILLARS[i], slug: PILLAR_SLUGS[PILLARS[i]] }))
export const pillarPath = (p: Pick<Pillar, 'slug'>) => `/services/${p.slug}`

/** "We have a website, but…" — the situations the brief describes, each tied to the pillar that addresses it. */
export const problems: { quote: string; fix: string; pillar: number }[] = [
  { quote: 'We have a website, but it isn’t generating enough enquiries.', fix: 'Pages planned around how customers decide, with a clear path to enquire.', pillar: 0 },
  { quote: 'Our social media isn’t converting.', fix: 'Content connected to a journey that ends in an enquiry or a sale.', pillar: 1 },
  { quote: 'Our advertising isn’t delivering consistent results.', fix: 'Campaigns tracked to leads and revenue, then optimised on what works.', pillar: 1 },
  { quote: 'Visitors come, look around and leave.', fix: 'Journeys mapped and friction removed from the moments that matter.', pillar: 2 },
  { quote: 'We’re losing leads because follow-ups are manual.', fix: 'Timely, automated WhatsApp and CRM follow-up for every enquiry.', pillar: 3 },
  { quote: 'We don’t know which activities actually generate revenue.', fix: 'Measurement set up around commercial outcomes, not vanity metrics.', pillar: 2 },
]

export const channelFirst = ['“You need Instagram.”', '“You need Google Ads.”', '“You need a website.”'] as const
export const businessFirst = [
  ['Objective', 'What are you trying to achieve?'],
  ['Customer', 'Where are your customers?'],
  ['Journey', 'What will move them toward conversion?'],
  ['Channels', 'Which platforms and channels should we use?'],
  ['Measurement', 'How do we measure the commercial outcome?'],
] as const

/** The six-stage approach, with what each stage produces. */
export const steps = [
  ['Discover', 'Understand the business, objectives, audience, existing digital assets and challenges.', 'A shared view of where you are and what matters most'],
  ['Strategise', 'Develop the growth roadmap, channel strategy, customer journey and KPIs.', 'A roadmap with priorities and agreed KPIs'],
  ['Build', 'Create or optimise the digital platforms and assets the strategy needs.', 'Platforms and assets ready to perform'],
  ['Execute', 'Launch campaigns, content, advertising, automation and conversion initiatives.', 'Live campaigns, content and workflows'],
  ['Measure', 'Track traffic, leads, conversions, customer behaviour and revenue indicators.', 'Reporting against the KPIs we agreed'],
  ['Optimise', 'Use performance data to continuously improve the digital ecosystem.', 'The next round of improvements, prioritised'],
] as const

export const engagements = [
  ['A specific project', 'A new website, a store, a campaign or an automation workflow — clearly scoped, delivered and handed over.'],
  ['Ongoing execution', 'Continuous management of the channels and platforms you rely on, with regular reporting.'],
  ['Growth partnership', 'An extended digital growth partner across strategy, execution and optimisation.'],
] as const

export const principles = [
  ['Business-first', 'We begin with the business objective rather than automatically recommending a channel.'],
  ['Strategy-led execution', 'Every activity connects to a defined objective and a KPI.'],
  ['Integrated thinking', 'Website, social media, advertising, search, WhatsApp and automation are planned together.'],
  ['Practical execution', 'Consulting combined with hands-on implementation — advice you can act on, and help acting on it.'],
  ['Data-led optimisation', 'Campaigns and platforms keep evolving based on what the data shows.'],
  ['Flexible engagement', 'A specific project, ongoing execution or an extended digital growth partnership.'],
] as const

export const auditScope: [string, string][] = [
  ['Website', 'Structure, speed, mobile experience and how clearly it leads to an enquiry.'],
  ['SEO', 'Technical health, on-page basics and whether you are found for what you sell.'],
  ['Google visibility', 'How your business appears across Google search results.'],
  ['Google Business Profile', 'Completeness, accuracy and how well it supports local enquiries.'],
  ['Social media', 'Whether your content connects to a conversion journey.'],
  ['Paid advertising', 'Campaign structure, targeting and how results are tracked.'],
  ['Conversion journey', 'Where visitors hesitate between first visit and enquiry or purchase.'],
  ['WhatsApp & lead handling', 'How quickly and consistently enquiries are answered and followed up.'],
  ['Digital customer journey', 'How the pieces work together, from discovery to repeat purchase.'],
]

export const industries: [string, string][] = [
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

export const founder = {
  name: 'Binny Rogin',
  role: 'Founder, Chazon Digital Ventures',
  // Add an approved, compressed portrait to /public (e.g. /binny-rogin.webp) and set its path here.
  photo: '',
  experience: ['Marketing', 'Media planning', 'Digital platforms', 'Website development', 'Performance marketing', 'Social media', 'Digital commerce', 'Revenue enhancement'],
}

// Published only when real, approved client quotes exist. The section is hidden while this list is empty.
export const testimonials: { quote: string; name: string; role: string; company: string }[] = []

export const homeFaqs: Faq[] = [
  ['What does Chazon Digital Ventures do?', 'We are a digital revenue and growth partner. We plan, build and improve the websites, marketing, conversion journeys and automation a business relies on — and connect them so they work as one system.'],
  ['Do we have to use all four services?', 'No. You can work with us on a specific project, on ongoing execution or as an extended growth partner. We recommend only what your objective needs.'],
  ['Do you guarantee sales, rankings or leads?', 'No. Results depend on your market, offer and budget, and anyone who guarantees them is guessing. We commit to a clear plan, honest measurement and continuous improvement.'],
  ['Where are you based?', 'Chazon Digital Ventures is based in Mumbai, Maharashtra.'],
  ['What happens after we get in touch?', 'We review what you’ve shared, arrange a conversation to understand your objectives, then recommend a practical next step — a project, ongoing support or a Digital Growth Audit.'],
]

export const nextSteps = [
  'Share where your business is today and what you want to achieve.',
  'We arrange a conversation to understand your objectives.',
  'We recommend a practical next step — a project, ongoing support or an audit.',
] as const

export const enquiryServices = ['Digital Growth Audit', 'Website', 'E-commerce', 'SEO', 'Performance Marketing', 'Social Media', 'Conversion Optimisation', 'Business Automation', 'Digital Revenue Strategy', 'Not sure yet', 'Other']
export const budgets = ['Under ₹25,000', '₹25,000–₹50,000', '₹50,000–₹1,00,000', '₹1,00,000+', 'Let’s discuss']
