import { Check } from 'lucide-react'
import { breadcrumbSchema, faqSchema, serviceSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'
import { WebsiteAuditAnalyzer } from '../components/WebsiteAuditAnalyzer'
import { Cta, Eyebrow, Faq, PageHero, SectionHead } from '../components/ui'

interface SearchPageConfig {
  slug: string
  breadcrumb: string
  title: string
  seoTitle: string
  seoDesc: string
  h1: string
  intro: string
  problemTitle: string
  problemText: string
  signs: string[]
  included: { title: string; text: string }[]
  deliverables: string[]
  faqs: [string, string][]
  ctaLabel: string
  ctaPillar: string
}

export function DedicatedServicePage({ config }: { config: SearchPageConfig }) {
  const path = `/services/${config.slug}`
  usePageMeta({
    title: config.seoTitle,
    description: config.seoDesc,
    path,
    schema: [
      ...serviceSchema({
        name: config.title,
        description: config.seoDesc,
        path,
        offers: config.included.map(i => i.title),
      }),
      ...breadcrumbSchema([['Services', '/services'], [config.breadcrumb, path]]),
      ...faqSchema(config.faqs),
    ],
  })

  const contactLink = `/contact?service=${encodeURIComponent(config.ctaPillar)}`

  return (
    <PageShell>
      <PageHero
        trail={[['Services', '/services'], [config.breadcrumb, path]]}
        eyebrow={`Specialized Capability · ${config.breadcrumb}`}
        title={<>{config.h1}</>}
        intro={config.intro}
      >
        <div className="button-row">
          <Cta to={contactLink} location={`service_${config.slug}_hero`}>
            {config.ctaLabel}
          </Cta>
          <Cta to="/website-audit" variant="secondary" location={`service_${config.slug}_audit`}>
            Audit My Current Website
          </Cta>
        </div>
      </PageHero>

      {/* The Problem & Solution */}
      <section className="section" aria-labelledby="problem-heading">
        <div className="container split-section">
          <div>
            <Eyebrow>The Challenge</Eyebrow>
            <h2 id="problem-heading">{config.problemTitle}</h2>
          </div>
          <div>
            <p className="split-intro">{config.problemText}</p>
            <ul className="signs">
              {config.signs.map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section surface-paper-2" id="included" aria-labelledby="included-heading">
        <div className="container">
          <SectionHead
            eyebrow="Capabilities & Scope"
            id="included-heading"
            title={
              <>
                Engineered for <em>measurable business outcomes.</em>
              </>
            }
            intro="We don't sell generic templates. Every deliverable connects strategy, execution, and tracking into a reliable revenue pipeline."
          />
          <ul className="service-list">
            {config.included.map((item, idx) => (
              <li key={item.title}>
                <span className="mono">{String(idx + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Typical Deliverables */}
      <section className="section" aria-labelledby="deliv-heading">
        <div className="container split-section">
          <div>
            <Eyebrow>What You Receive</Eyebrow>
            <h2 id="deliv-heading">Standard Deliverables</h2>
            <p className="split-intro">
              Clear specifications, milestone-based signoffs, and full ownership of all assets and code upon project completion.
            </p>
          </div>
          <div>
            <ul className="deliverables">
              {config.deliverables.map(d => (
                <li key={d}>
                  <Check size={18} aria-hidden="true" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Embedded Audit Widget */}
      <section className="section surface-paper-2" aria-labelledby="audit-promo">
        <div className="container">
          <SectionHead
            eyebrow="Diagnostic Step"
            id="audit-promo"
            title={
              <>
                Curious how your current presence is performing? <em>Test it free.</em>
              </>
            }
            intro="Uncover hidden server latency, SEO issues, missing mobile viewport tags, and conversion roadblocks."
          />
          <WebsiteAuditAnalyzer showTitle={false} />
        </div>
      </section>

      {/* FAQs */}
      <Faq items={config.faqs} title={`${config.breadcrumb}: Frequently Asked Questions`} />

      {/* Bottom CTA */}
      <section className="section surface-ink" aria-labelledby="bottom-cta-heading">
        <div className="container" style={{ textAlign: 'center', maxWidth: '720px' }}>
          <Eyebrow>Get Started</Eyebrow>
          <h2 id="bottom-cta-heading" style={{ fontSize: 'clamp(2rem, 1.5rem + 2vw, 3rem)' }}>
            Let’s discuss your <em>{config.breadcrumb.toLowerCase()} requirements.</em>
          </h2>
          <p className="lead" style={{ marginTop: '16px' }}>
            Tell us where your business is today and what you need to achieve. We will respond with practical recommendations and transparent milestone pricing.
          </p>
          <div className="button-row" style={{ justifyContent: 'center', marginTop: '28px' }}>
            <Cta to={contactLink} location={`service_${config.slug}_bottom`}>
              {config.ctaLabel}
            </Cta>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

// ============================================================================
// DEDICATED SEARCH-OPTIMISED LANDING PAGE DEFINITIONS
// ============================================================================

export const LANDING_PAGE_DEV: SearchPageConfig = {
  slug: 'landing-page-development',
  breadcrumb: 'Landing Page Development',
  title: 'Landing Page Development',
  seoTitle: 'High-Converting Landing Page Development | Chazon Digital Ventures',
  seoDesc:
    'Custom high-converting landing page development for ad campaigns, lead generation and product launches. Fast load speed, mobile-first UX, and conversion-optimized forms.',
  h1: 'High-Converting Landing Pages Built to Turn Traffic into Revenue.',
  intro:
    'Driving paid or organic traffic to an unoptimized page burns advertising budget. We engineer dedicated, high-speed landing pages structured around customer decision-making, trust architecture, and frictionless enquiry flows.',
  problemTitle: 'Why do most landing pages fail to convert paid visitors?',
  problemText:
    'Visitors click with specific purchase intent, but get confronted with cluttered navigation, generic messaging, slow load speeds, or lengthy forms that scare them away.',
  signs: [
    'High bounce rate on Meta Ads and Google Ads traffic',
    'Visitors scroll through the page but leave without filling the form or calling',
    'Mobile loading takes more than 2.5 seconds, causing immediate abandonment',
    'No direct WhatsApp or instant inquiry option for mobile users',
    'Inability to accurately attribute which ad creative generated which enquiry',
  ],
  included: [
    {
      title: 'Customer Psychology & Message Hierarchy',
      text: 'We structure the headline, proof points, problem agitation, and value proposition around what customers need to verify before reaching out.',
    },
    {
      title: 'High-Speed Responsive Engineering',
      text: 'Lightweight clean code optimized for sub-800ms load times and Core Web Vitals compliance on cellular mobile networks.',
    },
    {
      title: 'Frictionless Enquiry & Lead Capture',
      text: 'Intelligent multi-step or single-focus forms with pre-filled WhatsApp triggers and telephone tap-to-call integration.',
    },
    {
      title: 'End-to-End Analytics & Pixel Attribution',
      text: 'Google Tag Manager setup with Meta Pixel, GA4 custom events, and Google Ads offline conversion tracking.',
    },
  ],
  deliverables: [
    'Custom designed and coded responsive landing page',
    'Dedicated Mobile-Optimized Layout',
    'A/B Split Test Ready Architecture',
    'Custom Branded Thank-You Page with Next Steps',
    'GTM, Meta Pixel & GA4 Conversion Event Tracking',
    'Direct WhatsApp Chat Integration with UTM Campaign Prefill',
  ],
  faqs: [
    [
      'How quickly can a custom landing page be developed?',
      'Standard turnaround for a custom-designed, fully tested landing page with analytics integration is 5 to 10 business days.',
    ],
    [
      'Do you write the copy or do we need to provide it?',
      'We provide strategic copywriting and headline formulation as part of the service, reviewing your audience and competition to craft high-converting arguments.',
    ],
    [
      'Can the landing page connect to our existing CRM or WhatsApp?',
      'Yes. Every form submission can automatically route to your CRM (Zoho, HubSpot, Salesforce) and dispatch instant WhatsApp alerts.',
    ],
  ],
  ctaLabel: 'Discuss Your Landing Page Project',
  ctaPillar: 'Landing Page Development',
}

export const ECOMMERCE_DEV: SearchPageConfig = {
  slug: 'ecommerce-development',
  breadcrumb: 'E-Commerce Development',
  title: 'E-Commerce Development',
  seoTitle: 'E-Commerce Website Development & Revenue Enhancement | Chazon',
  seoDesc:
    'Custom e-commerce platforms engineered on Shopify, WooCommerce, or headless stacks. Fast checkouts, payment integrations, and automated cart recovery.',
  h1: 'E-Commerce Websites Engineered for Transaction Speed and Revenue Scale.',
  intro:
    'An online store should not just display products — it must facilitate frictionless buying decisions, instantaneous mobile checkouts, reliable payment gateway handling, and automated post-purchase customer retention.',
  problemTitle: 'The hidden leaks holding digital commerce brands back.',
  problemText:
    'High cart abandonment, clunky mobile checkout steps, failed payment integrations, and slow image loading kill e-commerce conversion rates.',
  signs: [
    'Visitors add products to cart but drop off before completing payment',
    'Slow catalog browsing and sluggish filtering on mobile devices',
    'Fragmented payment gateways causing customer drop-off at checkout',
    'No automated WhatsApp order confirmations or abandoned cart follow-ups',
    'Inventory and shipping management requiring manual administrative work',
  ],
  included: [
    {
      title: 'Conversion-Focused Store Architecture',
      text: 'Product pages designed with clear visual hierarchy, trust badges, customer reviews, inventory urgency, and instant checkout triggers.',
    },
    {
      title: 'Payment & Logistics Integration',
      text: 'Seamless setup with Indian and global gateways (Razorpay, Cashfree, Stripe, UPI) and automated shipping sync with Shiprocket or Delhivery.',
    },
    {
      title: 'Automated Recovery & Retention Workflows',
      text: 'Automated WhatsApp and email abandoned cart sequences that recover between 15% and 30% of lost customer checkouts.',
    },
    {
      title: 'Speed & Mobile-First Optimization',
      text: 'Image optimization via WebP/AVIF, headless caching, and lightweight bundle architectures ensuring rapid page flips.',
    },
  ],
  deliverables: [
    'Custom Shopify, WooCommerce, or Headless E-Commerce Store',
    'Integrated Payment Gateways (Cards, Netbanking, UPI, Wallets)',
    'Automated Shipping API & Real-Time Tracking Integration',
    'Automated WhatsApp Abandoned Cart & Order Updates',
    'Mobile-Optimized Single-Step Checkout Experience',
    'Comprehensive GA4 E-Commerce Analytics & Facebook CAPI',
  ],
  faqs: [
    [
      'Which platform do you recommend: Shopify or WooCommerce?',
      'For most D2C brands, Shopify offers unbeatable checkout reliability and hosting stability. For brands with complex custom product configurators or specialized catalog rules, WooCommerce or headless Next.js is preferred. We help you choose based on your unit economics.',
    ],
    [
      'Can you migrate our existing store from WooCommerce to Shopify or vice versa?',
      'Yes. We handle complete catalog, customer history, order records, and 301 URL redirect migration so you preserve your existing SEO rankings.',
    ],
    [
      'Do you support UPI and Cash on Delivery (COD) verification?',
      'Yes, including automated WhatsApp OTP verification for COD orders to drastically reduce return-to-origin (RTO) rates.',
    ],
  ],
  ctaLabel: 'Discuss Your E-Commerce Store',
  ctaPillar: 'E-Commerce Development',
}

export const SEO_SERVICES: SearchPageConfig = {
  slug: 'seo-services',
  breadcrumb: 'SEO Services',
  title: 'SEO Services',
  seoTitle: 'SEO Services for Businesses: Technical SEO & Revenue Growth | Chazon',
  seoDesc:
    'Commercial-intent SEO for growing businesses. Technical audits, high-intent keyword roadmaps, and content architecture designed to drive qualified leads.',
  h1: 'SEO That Drives Qualified Business Enquiries, Not Just Vanity Traffic.',
  intro:
    'Ranking for random keywords that never convert is meaningless. Chazon focuses on high-intent commercial search queries — positioning your business in front of customers actively searching to hire, buy, or enquire.',
  problemTitle: 'Why do most traditional SEO campaigns fail to deliver ROI?',
  problemText:
    'Many agencies promise thousands of monthly visitors by targeting low-value informational terms, while your core high-ticket commercial keywords remain completely invisible.',
  signs: [
    'Your website has traffic, but none of the organic visitors become paying clients',
    'Competitors dominate Google top 3 results for commercial search phrases',
    'Technical issues (slow speed, duplicate URLs, missing canonicals) preventing ranking',
    'No clear attribution showing which Google search clicks lead to actual revenue',
    'Stagnant organic growth despite publishing continuous generic blog posts',
  ],
  included: [
    {
      title: 'Commercial Intent Keyword Research',
      text: 'We identify the specific search queries entered by decision-makers with high purchase intent, rather than high-volume informational terms.',
    },
    {
      title: 'Technical SEO & Core Web Vitals',
      text: 'Rigorous remediation of crawl budget, indexation bottlenecks, schema markup, canonicalization, mobile usability, and server TTFB.',
    },
    {
      title: 'Revenue-Led Content Architecture',
      text: 'Developing authoritative service landing pages, industry comparison hubs, and decision-stage content that answers buyer objections.',
    },
    {
      title: 'Conversion Journey Optimization',
      text: 'Ensuring that organic landing pages feature prominent WhatsApp triggers, phone call-outs, and lead capture forms.',
    },
  ],
  deliverables: [
    'Complete Technical SEO & Indexation Audit',
    'Commercial Intent Keyword Matrix & Roadmap',
    'On-Page Optimization & Schema.org Structured Data',
    'Core Web Vitals & PageSpeed Remediation',
    'Monthly Search Console & Revenue Attribution Reporting',
  ],
  faqs: [
    [
      'How long does it take to see tangible ranking improvements?',
      'Technical fixes and on-page optimization typically reflect within 4 to 8 weeks. Competitive commercial keyword movement generally develops over 3 to 6 months of steady authority growth.',
    ],
    [
      'Do you guarantee #1 ranking on Google?',
      'No ethical agency guarantees #1 rankings because Google algorithm weights evolve constantly. What we guarantee is rigorous technical execution, high-intent commercial targeting, and transparent performance tracking tied to real business enquiries.',
    ],
  ],
  ctaLabel: 'Request an SEO Growth Strategy',
  ctaPillar: 'SEO Services',
}

export const LOCAL_SEO: SearchPageConfig = {
  slug: 'local-seo',
  breadcrumb: 'Local SEO & Google Maps',
  title: 'Local SEO',
  seoTitle: 'Local SEO & Google Business Profile Optimization | Chazon',
  seoDesc:
    'Dominate local Google search results and Google Maps. Google Business Profile setup, local citations, review workflows, and localized landing pages.',
  h1: 'Dominate Local Search & Google Maps When Nearby Customers Are Ready to Buy.',
  intro:
    'When a potential customer searches for services "near me" or within your city, your business needs to appear in the Google Local 3-Pack with authoritative reviews, accurate contact information, and immediate WhatsApp/call triggers.',
  problemTitle: 'Missing out on high-intent local customer calls.',
  problemText:
    'Local businesses lose up to 60% of potential enquiries simply because their Google Business Profile is incomplete, unoptimized, or lacking consistent local citation signals.',
  signs: [
    'Your business is buried below competitors in the Google Maps 3-Pack',
    'Google Business Profile receives impressions but few clicks or direct calls',
    'Inconsistent business name, address, or phone number (NAP) across directories',
    'No systematic workflow for collecting positive client reviews',
    'Lack of localized landing pages targeting specific city areas and districts',
  ],
  included: [
    {
      title: 'Google Business Profile Mastery',
      text: 'Complete optimization of categories, service listings, high-resolution imagery, business description, and automated weekly updates.',
    },
    {
      title: 'Local Citation & Directory Authority',
      text: 'Building and synchronizing consistent NAP data across verified business directories and industry-specific portals.',
    },
    {
      title: 'Local Schema & Geo-Tagging',
      text: 'Implementation of LocalBusiness JSON-LD markup, service area definitions, geo-coordinates, and operating hours.',
    },
    {
      title: 'Review Generation Systems',
      text: 'Automated post-service WhatsApp workflows prompting satisfied customers to leave verified 5-star Google reviews.',
    },
  ],
  deliverables: [
    'Full Google Business Profile Audit & Optimization',
    'Local Citation Cleanup & Authority Building',
    'LocalBusiness Schema.org Structured Data Implementation',
    'WhatsApp Review Generation Templates & Workflow',
    'Monthly Local Search Ranking & Phone Call Tracking Report',
  ],
  faqs: [
    [
      'Who is Local SEO most valuable for?',
      'Local SEO is essential for clinics, professional practices, retail showrooms, luxury service providers, hospitality, and B2B suppliers operating in specific metropolitan regions like Mumbai, Delhi NCR, or regional hubs.',
    ],
    [
      'How do you track enquiries from Google Maps?',
      'We configure custom UTM campaign tracking for your Google Business Profile links and dedicated call tracking parameters so you know exactly which phone calls and website enquiries originated from Google Maps.',
    ],
  ],
  ctaLabel: 'Accelerate Your Local Search Ranking',
  ctaPillar: 'Local SEO',
}

export const AI_INTEGRATION: SearchPageConfig = {
  slug: 'ai-integration',
  breadcrumb: 'AI Integration',
  title: 'AI Integration & Automation',
  seoTitle: 'AI Integration & Business Workflow Automation | Chazon',
  seoDesc:
    'Integrate custom AI assistants, inquiry qualification, and smart workflows into business operations. Connect AI to WhatsApp, CRM, and customer systems.',
  h1: 'Integrate Practical AI Workflows That Save Hours and Convert Leads 24/7.',
  intro:
    'AI should not be an expensive corporate experiment. Chazon builds practical, cost-effective AI workflows that automate customer inquiry triage, provide instant WhatsApp responses, extract document data, and eliminate tedious manual tasks.',
  problemTitle: 'Manual workflows draining your team’s productive hours.',
  problemText:
    'Business owners and sales teams spend hours answering repetitive basic questions, copying data between spreadsheets, and drafting routine follow-ups instead of closing deals.',
  signs: [
    'Leads arriving outside business hours wait 12+ hours for an initial response',
    'Team spends hours daily answering identical product/pricing questions',
    'Manual copy-pasting of leads from WhatsApp or email into CRM tools',
    'Slow turnaround times for processing documents, invoices, or specifications',
    'Desire to leverage AI but uncertain how to integrate it safely into existing software',
  ],
  included: [
    {
      title: '24/7 AI Customer Assistants',
      text: 'Trained on your business documentation, pricing guides, and FAQs to answer customer queries accurately on your website or WhatsApp.',
    },
    {
      title: 'Smart Lead Qualification & Triage',
      text: 'AI gathers requirements from prospects, evaluates budget and timeline, and schedules qualified discovery calls automatically.',
    },
    {
      title: 'Automated Document & Data Processing',
      text: 'Extract structured information from customer uploads, PDF invoices, and resumes directly into your CRM or Google Sheets.',
    },
    {
      title: 'Custom API & Workflow Integration',
      text: 'Connecting OpenAI, Anthropic, or Gemini APIs directly to your website, CRM, email provider, and internal databases.',
    },
  ],
  deliverables: [
    'Custom AI Knowledge Base Configuration',
    'WhatsApp Business or Web Chatbot AI Integration',
    'Automated CRM Lead Enrichment & Tagging Pipeline',
    'Custom Prompt Engineering & Safety Fallback Rules',
    'Team Training & Performance Monitoring Dashboard',
  ],
  faqs: [
    [
      'Will the AI give incorrect answers or make up false promises?',
      'No. We configure strict retrieval-augmented generation (RAG) guardrails. The AI only answers from your approved business knowledge base, and gracefully transfers complex inquiries to human team members.',
    ],
    [
      'Can AI be integrated into our existing WhatsApp Business number?',
      'Yes. Through official WhatsApp Business Cloud APIs, AI assistants can converse naturally with customers, capture contact info, and forward hot leads to your sales reps.',
    ],
  ],
  ctaLabel: 'Discuss AI Integration for Your Business',
  ctaPillar: 'AI Integration',
}

// ============================================================================
// DEDICATED WEBSITE AUDIT PAGE (/website-audit & /growth-audit)
// ============================================================================

export function WebsiteAuditPage({ mode = 'audit' }: { mode?: 'audit' | 'growth' }) {
  const isGrowth = mode === 'growth'
  const path = isGrowth ? '/growth-audit' : '/website-audit'
  const title = isGrowth
    ? 'Digital Growth Audit: Website, SEO & Conversion Review | Chazon'
    : 'Free Website Audit & Digital Growth Analyzer | Chazon'
  const description = isGrowth
    ? 'Request a comprehensive Digital Growth Audit. We inspect your website performance, search visibility, conversion journey, and automated follow-ups.'
    : 'Run a free instant website audit. Uncover hidden speed bottlenecks, search visibility gaps, missing mobile tags, and enquiry leaks before they cost leads.'

  const auditFaqs: [string, string][] = [
    [
      'Is there any fee or commitment for running the website audit?',
      'No. The Website Audit & Digital Growth Analyzer is completely free and requires zero credit card or commercial commitment.',
    ],
    [
      'What areas does the diagnostic inspect?',
      'The engine inspects server response latency (TTFB), page size, SSL encryption, Google search title/description tags, heading hierarchy, mobile responsive viewports, contact links, WhatsApp availability, and conversion tracking.',
    ],
    [
      'How does Normal Mode differ from Technical Mode?',
      'Normal Mode (Executive Summary) translates technical findings into plain-English business impacts and clear recommendations for founders. Technical Mode breaks down raw DOM parameters, character counts, and HTTP header values.',
    ],
    [
      'Can Chazon help fix the issues found in the audit?',
      'Yes. Simply click "Fix These Leaks with Chazon" on your audit results. Your audit reference and findings will be automatically attached to your enquiry so our advisory team can review them before our discovery call.',
    ],
  ]

  usePageMeta({
    title,
    description,
    path,
    schema: [
      ...breadcrumbSchema([[isGrowth ? 'Digital Growth Audit' : 'Website Audit', path]]),
      ...faqSchema(auditFaqs),
    ],
  })

  return (
    <PageShell>
      <PageHero
        trail={[[isGrowth ? 'Digital Growth Audit' : 'Website Audit', path]]}
        eyebrow="Diagnostic Engine"
        title={
          <>
            How hard is your digital presence <em>really working?</em>
          </>
        }
        intro="Enter any business website URL to run a live diagnostic across performance, search discoverability, mobile usability, and customer enquiry pathways."
      />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <WebsiteAuditAnalyzer showTitle={false} />
        </div>
      </section>

      <Faq items={auditFaqs} title="Website Audit: Frequently Asked Questions" />
    </PageShell>
  )
}
