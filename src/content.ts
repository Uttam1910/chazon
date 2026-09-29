// Website copy, taken from the Chazon Website Development Brief.
// Keep claims factual: add clients, results, testimonials and articles only once they are verified and approved.

// Primary navigation is deliberately short. Other homepage sections are reached through contextual links and the footer.
export const nav = [['Home', 'home'], ['About', 'about'], ['Services', 'services'], ['Work', 'work'], ['Contact', 'contact']] as const
export const footerCompany = [['About', 'about'], ['Our Approach', 'approach'], ['Work', 'work'], ['Industries', 'industries'], ['Insights', 'insights'], ['Contact', 'contact']] as const

export const heroStages = [
  ['Strategy', 'Set the direction'],
  ['Build', 'Platforms that convert'],
  ['Market', 'Reach the right people'],
  ['Convert', 'Turn interest into enquiries'],
  ['Automate', 'Follow up, every time'],
  ['Grow', 'Growth you can measure'],
] as const

export const ecosystem = {
  strategy: { label: 'Strategy', text: 'Understand the business, customer, competition and revenue opportunity.' },
  technology: { label: 'Technology', text: 'Websites, commerce and digital platforms built to convert.' },
  marketing: { label: 'Marketing', text: 'Search, social, content and advertising that bring qualified demand.' },
  automation: { label: 'Automation', text: 'WhatsApp, CRM and follow-up that turn leads into customers — and customers into repeat buyers.' },
  revenue: { label: 'Revenue', text: 'Every piece is chosen, connected and measured against one business objective.' },
} as const
export type EcosystemKey = keyof typeof ecosystem

export const problems = [
  { channel: 'Website', symptom: 'Few enquiries', fix: 'Conversion-led pages and a clear path to enquire' },
  { channel: 'Social media', symptom: 'Engagement, no conversion', fix: 'Content connected to a conversion journey' },
  { channel: 'Advertising', symptom: 'Unclear ROI', fix: 'Campaigns tracked to leads and revenue' },
  { channel: 'Leads', symptom: 'Poor follow-up', fix: 'Automated, timely WhatsApp and CRM follow-up' },
  { channel: 'Tools', symptom: 'Disconnected systems', fix: 'Platforms that share data and work together' },
  { channel: 'Processes', symptom: 'Too much manual work', fix: 'Workflows that run without chasing' },
] as const

export type Pillar = { title: string; line: string; summary: string; items: string[]; enquiry: string }
export const pillars: Pillar[] = [
  { title: 'Digital Foundation', line: 'Build the infrastructure your business needs to grow.', summary: 'The platforms every other activity depends on — built to convert, not just to exist.', enquiry: 'Website', items: ['Website Development', 'E-commerce Development', 'Landing Pages', 'Google Business Profile', 'Digital Platform Setup', 'UI/UX & Conversion Optimisation'] },
  { title: 'Digital Growth', line: 'Turn attention into qualified demand.', summary: 'Search, social, content and advertising working toward one outcome: the right leads.', enquiry: 'Performance Marketing', items: ['Performance Marketing', 'Google Ads', 'Meta Ads', 'Social Media Marketing', 'SEO', 'Lead Generation', 'Content Strategy', 'Digital Campaigns'] },
  { title: 'Revenue & Commerce', line: 'Turn digital activity into commercial outcomes.', summary: 'The strategy and customer journey that move a visitor from interest to purchase — and back again.', enquiry: 'Digital Revenue Strategy', items: ['Digital Revenue Strategy', 'E-commerce Strategy', 'Marketplace Strategy', 'Conversion Optimisation', 'Customer Journey Mapping', 'Pricing & Merchandising', 'Digital Commerce Consulting'] },
  { title: 'Automation & Retention', line: 'Connect customers, communication and follow-up.', summary: 'Systems that respond, follow up and bring customers back — without manual chasing.', enquiry: 'Business Automation', items: ['WhatsApp Business Solutions', 'Lead Follow-up Automation', 'Customer Communication', 'Marketing Automation', 'CRM Workflows', 'AI-powered Customer Support', 'Repeat Purchase / Retention Systems'] },
]

export const channelFirst = ['“I need Instagram.”', 'Instagram', 'Posts', '???'] as const
export const businessFirst = [
  ['Business objective', 'What are you trying to achieve?'],
  ['Customer', 'Where are your customers?'],
  ['Journey', 'What will move them toward conversion?'],
  ['Right channels', 'Which platforms should we use?'],
  ['Measurement', 'How do we measure the commercial outcome?'],
  ['Optimisation', 'What should improve next?'],
  ['Revenue', 'The outcome the whole system is built for.'],
] as const

export const steps = [
  ['Discover', 'Understand the business, objectives, audience, existing digital assets and challenges.'],
  ['Strategise', 'Develop the growth roadmap, channel strategy, customer journey and KPIs.'],
  ['Build', 'Create or optimise the digital platforms and assets the strategy needs.'],
  ['Execute', 'Launch campaigns, content, advertising, automation and conversion initiatives.'],
  ['Measure', 'Track traffic, leads, conversions, customer behaviour and revenue indicators.'],
  ['Optimise', 'Use performance data to continuously improve the digital ecosystem.'],
] as const

export const auditScope = ['Website', 'SEO', 'Google visibility', 'Google Business Profile', 'Social media', 'Paid advertising', 'Conversion journey', 'WhatsApp & lead handling', 'Digital customer journey']

export const caseFormat = [
  ['The challenge', 'What was the business problem?'],
  ['The strategy', 'What did Chazon recommend?'],
  ['The execution', 'What was implemented?'],
  ['The result', 'What changed?'],
] as const
export const caseMetrics = ['Leads generated', 'Cost per lead', 'Conversion rate', 'Website traffic', 'ROAS', 'Revenue generated', 'Customer acquisition cost']

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

export const principles = [
  ['Business-first', 'We start with what the business needs to achieve.', 'The objective comes first. The channel is chosen to serve it — never the other way around.'],
  ['Strategy-led', 'Every activity earns its place.', 'Each piece of execution connects to a defined objective and a KPI.'],
  ['Integrated digital thinking', 'Channels that work as one system.', 'Website, social media, advertising, search, WhatsApp and automation are planned together.'],
  ['Practical execution', 'Advice you can act on — and help acting on it.', 'Consulting is combined with hands-on implementation.'],
  ['Data-led optimisation', 'Performance decides the next move.', 'Campaigns and platforms keep evolving based on what the data shows.'],
  ['Flexible engagement', 'Work together the way that fits.', 'A specific project, ongoing execution, or an extended digital growth partnership.'],
] as const

export const founder = {
  name: 'Binny Rogin',
  role: 'Founder, Chazon Digital Ventures',
  // Add an approved, compressed portrait to /public (e.g. /binny-rogin.webp) and set its path here.
  photo: '',
  experience: ['Marketing', 'Media planning', 'Digital platforms', 'Website development', 'Performance marketing', 'Social media', 'Digital commerce', 'Revenue enhancement'],
}

// Published only when real, approved client quotes exist. The section is hidden while this list is empty.
export const testimonials: { quote: string; name: string; role: string; company: string }[] = []

export const insights = [
  ['Digital Revenue', 'Why traffic doesn’t always mean revenue', 'The gap between attracting visitors and helping them become customers.'],
  ['Performance Marketing', 'Campaigns that are measured on leads, not clicks', 'Connecting Google and Meta advertising to real enquiries.'],
  ['Digital Commerce', 'Your customer journey is your growth opportunity', 'The moments between discovery, purchase and a customer coming back.'],
  ['Automation', 'Better follow-up. Fewer missed opportunities.', 'How WhatsApp and lead management connect the first enquiry to the next conversation.'],
] as const

export const enquiryServices = ['Digital Growth Audit', 'Website', 'Digital Marketing', 'Performance Marketing', 'Social Media', 'E-commerce', 'Business Automation', 'Digital Revenue Strategy', 'Other']
export const budgets = ['Under ₹25,000', '₹25,000–₹50,000', '₹50,000–₹1,00,000', '₹1,00,000+', 'Let’s discuss']

export const footerServices: [string, number][] = [['Digital Strategy', 2], ['Website Development', 0], ['E-commerce', 0], ['Performance Marketing', 1], ['Social Media Marketing', 1], ['SEO', 1], ['Digital Commerce', 2], ['Business Automation', 3]]
