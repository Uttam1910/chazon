export interface ServiceCategoryGroup {
  group: string
  items: { name: string; desc: string }[]
}

export interface ServicePrinciple {
  number: string
  title: string
  desc: string
}

export interface ServicePlatform {
  name: string
  role: string
  desc: string
}

export interface SearchPageConfig {
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
  categoryGroups?: ServiceCategoryGroup[]
  principles?: ServicePrinciple[]
  platforms?: ServicePlatform[]
  frameworkRole?: { stage: string; summary: string }
}

// 1. WEBSITE DEVELOPMENT (with 10 website types organized into 3 categories)
export const WEBSITE_DEV: SearchPageConfig = {
  slug: 'website-development',
  breadcrumb: 'Website Development',
  title: 'Website Development',
  seoTitle: 'Website Development & Engineering Services | Chazon',
  seoDesc:
    'High-performance, responsive websites engineered to turn visitors into enquiries. Sub-800ms speed, mobile-first UX, and WhatsApp integration.',
  h1: 'Websites Engineered to Convert Visitors into Revenue.',
  intro:
    'A business website should not merely exist as a passive digital brochure. We architect and code high-speed digital platforms structured around customer decision-making, trust architecture, clear service hierarchies, and frictionless enquiry pathways.',
  problemTitle: 'Why do most business websites fail to generate revenue?',
  problemText:
    'Most websites are built as static design exercises without commercial strategy. They look pleasant, but suffer from slow load times, cluttered navigation, weak messaging, and invisible calls to action that allow high-intent prospects to slip away.',
  signs: [
    'Visitors arrive on your site but leave without submitting a form or reaching out',
    'Mobile loading takes more than 2.5 seconds, causing immediate visitor bounce',
    'No direct WhatsApp chat or instant communication triggers for mobile buyers',
    'Search engines cannot crawl or index your service pages effectively',
    'Content is organized around internal company structures instead of buyer needs',
  ],
  categoryGroups: [
    {
      group: 'Corporate & Brand Platforms',
      items: [
        {
          name: 'Business & Corporate Websites',
          desc: 'High-credibility platforms establishing enterprise authority, service differentiation, and multi-tier quotation pathways.',
        },
        {
          name: 'Portfolio Websites',
          desc: 'Clean visual storytelling frameworks for studios, architects, and agencies to showcase proof of work and secure client commissions.',
        },
        {
          name: 'Blogs & News Websites',
          desc: 'High-speed editorial platforms with semantic taxonomy, reading ergonomics, and topical clustering for organic discovery.',
        },
        {
          name: 'Wikis & Informational Websites',
          desc: 'Structured knowledge base architectures with intuitive search and documentation hierarchies for customer self-service.',
        },
      ],
    },
    {
      group: 'Commercial & Transactional Engines',
      items: [
        {
          name: 'E-commerce Websites',
          desc: 'Online stores optimized for catalog browsing speed, one-click checkouts, automated cart recovery, and payment gateways.',
        },
        {
          name: 'Booking & Appointment Websites',
          desc: 'Automated scheduling engines with real-time slot availability, calendar syncing, and automated WhatsApp appointment reminders.',
        },
        {
          name: 'Entertainment & Streaming Websites',
          desc: 'Subscription portals and media delivery platforms with secure digital rights management and edge-cached content streaming.',
        },
      ],
    },
    {
      group: 'Interactive & Community Systems',
      items: [
        {
          name: 'Social Media & Community Websites',
          desc: 'Member portals with authenticated user profiles, discussion threads, activity feeds, and community engagement moderation.',
        },
        {
          name: 'Educational & eLearning Websites',
          desc: 'Structured learning management systems (LMS) with student progress tracking, video modules, and course certifications.',
        },
        {
          name: 'Nonprofit & NGO Websites',
          desc: 'Mission-focused impact storytelling platforms with transparent financial governance and frictionless donation processing.',
        },
      ],
    },
  ],
  included: [
    {
      title: 'Customer-Centric Information Architecture',
      text: 'Structuring navigation, service taxonomy, and page content around the exact questions and evaluation criteria your buyers consider.',
    },
    {
      title: 'High-Performance Responsive Engineering',
      text: 'Lightweight semantic HTML, modern CSS, and edge caching ensuring sub-800ms load times and full Core Web Vitals compliance on mobile networks.',
    },
    {
      title: 'Frictionless Conversion Pathways',
      text: 'Strategically placed enquiry forms, tap-to-call buttons, and WhatsApp Business API triggers that capture high-intent buyers instantly.',
    },
    {
      title: 'Technical SEO & Metadata Foundations',
      text: 'Schema.org JSON-LD structured data, Open Graph tags, XML sitemaps, and robots.txt configured from day one to ensure search indexation.',
    },
  ],
  deliverables: [
    'Custom responsive codebase tested on desktop, tablet, and mobile',
    'Sub-800ms Core Web Vitals performance optimization',
    'Direct WhatsApp Business chat trigger integration',
    'Custom branded enquiry workflows connected to your email or CRM',
    'Complete Technical SEO setup including JSON-LD schema markup',
    'Google Analytics 4 & Tag Manager event tracking configured prior to launch',
  ],
  faqs: [
    [
      'Can you improve our existing website instead of rebuilding it from scratch?',
      'Yes. We begin with a comprehensive diagnostic audit. If targeted enhancements to page structure, speed, content hierarchy, and conversion pathways will achieve your commercial goals, we recommend those over an expensive full rebuild.',
    ],
    [
      'Will the website be mobile-friendly and fast on 4G networks?',
      'Yes. Every platform we build is engineered mobile-first with clean, minimal code, compressed WebP/SVG imagery, and responsive layouts tested across iPhones, iPads, and Android devices.',
    ],
    [
      'Can the website connect to our CRM or WhatsApp number?',
      'Yes. Every form submission, quotation request, and button click can automatically route to your WhatsApp Business app and sync directly with your CRM software.',
    ],
  ],
  ctaLabel: 'Discuss Your Website Project',
  ctaPillar: 'Website Development',
  frameworkRole: {
    stage: '01 & 03: Discover & Convert',
    summary: 'Serves as your primary digital conversion engine, turning audience attention into qualified enquiries.',
  },
}

// 2. DIGITAL MARKETING
export const DIGITAL_MARKETING: SearchPageConfig = {
  slug: 'digital-marketing',
  breadcrumb: 'Digital Marketing',
  title: 'Digital Marketing',
  seoTitle: 'Integrated Digital Marketing & Growth Strategy | Chazon',
  seoDesc:
    'Strategic digital marketing connecting search, social, paid ads and automation into one revenue engine. Move from vanity metrics to real commercial growth.',
  h1: 'Digital Marketing Connected Directly to Commercial Revenue.',
  intro:
    'More traffic is easy to buy; qualified customer demand is harder. Chazon aligns search visibility, paid acquisition, social media, and retention marketing into one cohesive system where every channel works toward the same commercial objectives.',
  problemTitle: 'The hidden cost of fragmented agency marketing.',
  problemText:
    'Most businesses hire separate vendors for social media, paid ads, SEO, and website design. The result is conflicting messaging, uncoordinated campaigns, vanity metrics that look impressive on reports, and zero accountability for actual revenue.',
  signs: [
    'Marketing spend is increasing month-over-month, but inbound leads remain flat',
    'Different channels promote disconnected messages without a unified customer journey',
    'Agency reports highlight impressions and likes rather than cost-per-lead and sales',
    'Inbound leads go cold because no automated follow-up nurture exists',
    'You cannot accurately identify which marketing channel generated your best customers',
  ],
  included: [
    {
      title: 'Full-Funnel Growth Strategy',
      text: 'Aligning top-of-funnel discovery, middle-of-funnel consideration, and bottom-of-funnel conversion into a unified commercial plan.',
    },
    {
      title: 'Multi-Channel Brand Coherence',
      text: 'Ensuring your value proposition, creative assets, and tone of voice are consistent across Google, Meta, LinkedIn, and your website.',
    },
    {
      title: 'Revenue & Lead Attribution',
      text: 'Implementing server-side tracking, UTM taxonomy, and CRM pipeline monitoring so you know the exact commercial return on every marketing rupee.',
    },
    {
      title: 'Continuous Campaign Optimization',
      text: 'Refining audience segments, ad messaging, bidding strategies, and landing pages based on real sales data rather than vanity metrics.',
    },
  ],
  deliverables: [
    'Comprehensive multi-channel digital growth roadmap',
    'Target audience persona profiles and buying journey mapping',
    'Cross-channel creative guidelines and messaging frameworks',
    'Complete conversion tracking and analytics integration',
    'Monthly executive dashboard detailing cost-per-lead, pipeline value, and ROAS',
  ],
  faqs: [
    [
      'How does Chazon’s approach differ from traditional digital agencies?',
      'Traditional agencies sell isolated channel packages like "10 social posts a month" or "run Google search ads." We begin with your financial business targets, map your customer decision journey, and coordinate the channels that reliably convert prospects into paying customers.',
    ],
    [
      'Do you guarantee lead volumes or sales targets?',
      'No ethical partner guarantees exact lead counts, as performance depends on market dynamics, pricing, and sales follow-up. What we guarantee is a proven strategic process, transparent measurement, and continuous optimization based on hard revenue data.',
    ],
    [
      'Which marketing channels should our business prioritize first?',
      'It depends on whether your customers are actively searching with existing purchase intent (favoring Google Search and SEO) or need to be introduced to an innovative solution (favoring Meta Ads, LinkedIn, and content marketing). We evaluate your business model during our discovery phase.',
    ],
  ],
  ctaLabel: 'Plan Your Digital Growth Strategy',
  ctaPillar: 'Digital Marketing',
  frameworkRole: {
    stage: '02: Attract',
    summary: 'Attracts high-intent audiences and guides them systematically through awareness into active consideration.',
  },
}

// 3. SEARCH ENGINE OPTIMISATION (SEO) (with all 8 capabilities from the prompt)
export const SEO_SERVICES: SearchPageConfig = {
  slug: 'seo-services',
  breadcrumb: 'Search Engine Optimisation',
  title: 'Search Engine Optimisation (SEO)',
  seoTitle: 'Search Engine Optimisation & Organic Growth | Chazon',
  seoDesc:
    'Comprehensive SEO services from technical audits and keyword intent to local Google Maps and e-commerce SEO. Attract high-intent commercial buyers.',
  h1: 'Rank for Commercial Intent. Attract Ready-to-Buy Customers.',
  intro:
    'Ranking #1 for obscure search terms generates vanity traffic. We focus on commercial-intent SEO — positioning your business in front of qualified buyers at the exact moment they search for your capabilities, products, and services.',
  problemTitle: 'Why do most SEO campaigns fail to produce business revenue?',
  problemText:
    'Many SEO providers target high-volume informational keywords that bring casual readers who never buy. Without commercial intent mapping, technical health, and conversion optimization, traffic increases while enquiries stagnate.',
  signs: [
    'Your website is invisible on Google for high-value commercial searches in your sector',
    'Competitors dominate local Google 3-Pack map results and organic listings',
    'Technical crawl errors, slow Core Web Vitals, or missing schema limit Google indexing',
    'Blog posts generate clicks from visitors looking for free tips rather than your service',
    'Zero visibility in emerging AI-powered search engines like Google AI Overviews and ChatGPT',
  ],
  categoryGroups: [
    {
      group: 'The 8 Strategic SEO Capabilities',
      items: [
        {
          name: '1. SEO Audit & Strategy',
          desc: 'Deep technical crawl, indexation gap analysis, crawl budget evaluation, and competitive organic benchmarking.',
        },
        {
          name: '2. Keyword Research & Search Intent Analysis',
          desc: 'Mapping high-value transactional and commercial search queries against your service pages to capture active buyers.',
        },
        {
          name: '3. On-Page & Technical SEO',
          desc: 'Schema.org JSON-LD structured data, title tag optimization, canonical architecture, and mobile Core Web Vitals compliance.',
        },
        {
          name: '4. Off-Page SEO & Link Building',
          desc: 'High-authority digital PR, contextual editorial link acquisition, and brand mention authority without spam tactics.',
        },
        {
          name: '5. Content Optimisation & Blog Strategy',
          desc: 'Topical cluster frameworks, comprehensive buyer guides, and keyword gap fulfillment that establish definitive niche expertise.',
        },
        {
          name: '6. Local SEO & Google Business Profile',
          desc: 'Google Maps 3-Pack optimization, NAP citation consistency, service area targeting, and automated 5-star review generation.',
        },
        {
          name: '7. E-commerce SEO',
          desc: 'Optimized category architectures, product schema markup, faceted navigation indexing control, and review rich snippets.',
        },
        {
          name: '8. SEO Performance Monitoring & Reporting',
          desc: 'Live keyword rank tracking, Google Search Console indexation health, organic conversion attribution, and monthly executive summaries.',
        },
      ],
    },
  ],
  included: [
    {
      title: 'Commercial Intent Search Architecture',
      text: 'Focusing organic efforts on high-value keywords used by decision-makers ready to purchase rather than casual researchers.',
    },
    {
      title: 'Technical Core Web Vitals Optimization',
      text: 'Remediating LCP, INP, and CLS bottlenecks to ensure your site meets Google’s strict technical performance thresholds.',
    },
    {
      title: 'AEO & Generative Engine Readiness',
      text: 'Structuring content with clear entity relationships and factual schema so AI search models (Google AI Overviews, Perplexity) cite your brand.',
    },
    {
      title: 'Transparent Revenue Attribution',
      text: 'Tracking phone calls, form completions, and WhatsApp chats back to organic search keywords so you see true commercial ROI.',
    },
  ],
  deliverables: [
    'Comprehensive technical SEO audit and remediation roadmap',
    'Commercial keyword research and search intent mapping document',
    'Custom Schema.org structured data implementation across all key templates',
    'Google Business Profile complete verification and local authority optimization',
    'Monthly organic keyword visibility, organic traffic, and lead attribution report',
  ],
  faqs: [
    [
      'How long does it take to see tangible ranking improvements from SEO?',
      'Technical fixes and Google Business Profile optimizations can yield visibility gains within 30 to 60 days. Competitive commercial keywords generally build strong ranking momentum over 3 to 6 months as domain authority compounds.',
    ],
    [
      'Do you guarantee #1 rankings on Google?',
      'No reputable SEO professional guarantees specific rankings, as Google’s search algorithms update constantly. What we guarantee is rigorous adherence to Google Search Essentials, proven technical optimization, and measurable organic lead growth.',
    ],
    [
      'How do you measure SEO success?',
      'While we track organic impressions and keyword rankings, our primary metric of success is qualified organic enquiries, phone calls, WhatsApp chats, and revenue generated from search traffic.',
    ],
  ],
  ctaLabel: 'Request an SEO Opportunity Audit',
  ctaPillar: 'Search Engine Optimisation',
  frameworkRole: {
    stage: '01: Discover',
    summary: 'Builds permanent organic visibility, making your brand discoverable when buyers search for your solutions.',
  },
}

// 4. CONTENT MARKETING (with all 5 principles from the document)
export const CONTENT_MARKETING: SearchPageConfig = {
  slug: 'content-marketing',
  breadcrumb: 'Content Marketing',
  title: 'Content Marketing',
  seoTitle: 'Content Marketing Strategy & Authority Building | Chazon',
  seoDesc:
    'Audience-first content marketing that builds topical authority, answers buyer objections, and drives qualified inbound enquiries with measurable ROI.',
  h1: 'Strategic Content That Builds Authority and Drives Inbound Leads.',
  intro:
    'Content marketing is not about churning out generic blog posts to fill an editorial calendar. We create in-depth, authoritative digital assets that answer critical buyer questions, resolve objections, demonstrate genuine expertise, and convert readers into qualified prospects.',
  problemTitle: 'Why does most content marketing fail to generate business?',
  problemText:
    'Most corporate blogs publish superficial articles written for search engines rather than real business buyers. They fail to address commercial doubts, provide zero unique perspective, and lack clear pathways for interested readers to take the next business step.',
  signs: [
    'Your blog has published dozens of articles but has never produced a qualified client enquiry',
    'Content consists of generic listicles that do not reflect your real business expertise',
    'Articles rank for basic informational queries but attract visitors with zero budget or intent',
    'Content creation is erratic without an underlying topical authority roadmap',
    'Zero distribution strategy exists to repurpose core research across social and email channels',
  ],
  principles: [
    {
      number: '01',
      title: 'Audience-First Topic Selection',
      desc: 'We research the exact commercial questions, purchasing dilemmas, and regulatory requirements buyers investigate before committing budget.',
    },
    {
      number: '02',
      title: 'Topical Authority & Semantic Clustering',
      desc: 'Instead of isolated posts, we build comprehensive cornerstone guides interconnected with targeted sub-topic articles that establish category leadership.',
    },
    {
      number: '03',
      title: 'Commercial Objection Resolution',
      desc: 'We address pricing considerations, implementation timelines, and common industry misconceptions openly, building trust before the sales call.',
    },
    {
      number: '04',
      title: 'High-Intent Conversion Integration',
      desc: 'Every piece of content includes natural in-context next steps — diagnostic audits, strategic playbooks, or consultation triggers that invite enquiry.',
    },
    {
      number: '05',
      title: 'Multi-Channel Repurposing Engine',
      desc: 'Each in-depth editorial asset is methodically broken down into LinkedIn carousels, newsletter editions, and video briefs for maximum distribution efficiency.',
    },
  ],
  included: [
    {
      title: 'Customer Pain Point & Intent Research',
      text: 'Interviewing sales teams and analyzing search data to identify the high-value topics that influence purchasing decisions.',
    },
    {
      title: 'Topical Cornerstone & Cluster Architecture',
      text: 'Structuring your content library to dominate core industry themes and build unassailable topical authority in search engines.',
    },
    {
      title: 'Senior Consultative Copywriting',
      text: 'Writing in an authoritative, experienced business tone that reflects your company’s depth without shallow agency jargon.',
    },
    {
      title: 'Lead Capture & Magnet Integration',
      text: 'Designing downloadable frameworks, industry checklists, and interactive assessment tools that turn readers into identifiable leads.',
    },
  ],
  deliverables: [
    'Comprehensive quarterly content strategy and topical cluster roadmap',
    'High-authority in-depth articles engineered for both search and human decision-makers',
    'Lead magnet asset design (PDF frameworks, checklists, or diagnostic tools)',
    'Social media derivative copy snippets for multi-channel distribution',
    'Quarterly content performance and lead attribution review',
  ],
  faqs: [
    [
      'How does content marketing translate into actual revenue?',
      'Decision-makers rarely buy on first contact. High-quality content educates them on the nuances of solving their problem, demonstrates your proven competence, resolves their hesitation, and positions your firm as the obvious partner when they are ready to transact.',
    ],
    [
      'Do you write the articles or do we need to draft them?',
      'Our team handles the end-to-end research, outlining, drafting, and optimization. We conduct brief discovery interviews with your subject matter experts to extract your proprietary insights and authentic industry voice.',
    ],
    [
      'How do we ensure content does not sound like generic AI copy?',
      'We adhere to strict editorial standards: real data, practical examples, clear point-of-view arguments, and consultative framing tailored specifically to your target business sector.',
    ],
  ],
  ctaLabel: 'Discuss Your Content Strategy',
  ctaPillar: 'Content Marketing',
  frameworkRole: {
    stage: '01 & 02: Discover & Attract',
    summary: 'Builds intellectual authority and nurtures high-value prospects through educational clarity.',
  },
}

// 5. SOCIAL MEDIA MARKETING (covering Facebook, Instagram, LinkedIn, YouTube)
export const SOCIAL_MEDIA_MARKETING: SearchPageConfig = {
  slug: 'social-media-marketing',
  breadcrumb: 'Social Media Marketing',
  title: 'Social Media Marketing',
  seoTitle: 'Social Media Marketing for Business Growth | Chazon',
  seoDesc:
    'Build brand authority and community across Facebook, Instagram, LinkedIn and YouTube. Strategic content connected to high-converting DM and WhatsApp flows.',
  h1: 'Social Media That Builds Brand Equity and Qualified Enquiries.',
  intro:
    'Posting daily for the sake of an algorithm accomplishes little. We build strategic social media presences across LinkedIn, Instagram, Facebook, and YouTube that showcase your capabilities, establish executive credibility, and funnel qualified prospects toward active conversations.',
  problemTitle: 'Why do most social media efforts produce zero commercial ROI?',
  problemText:
    'Companies often post random graphics and motivational quotes without a coherent conversion journey. They accumulate passive followers who never enquire, while missing the high-intent decision-makers who actually sign contracts.',
  signs: [
    'Your social pages publish frequently but receive zero client enquiries or meaningful sales discussions',
    'Content feels disjointed and fails to communicate what sets your business apart',
    'No strategy exists to move prospects from a post impression into a direct message or WhatsApp conversation',
    'Company leadership is completely absent from LinkedIn where B2B buyers conduct due diligence',
    'Social efforts operate in a silo, completely detached from paid advertising and website conversion',
  ],
  platforms: [
    {
      name: 'LinkedIn',
      role: 'B2B Authority & Executive Positioning',
      desc: 'Thought leadership articles, case study breakdowns, and executive commentary that position founders and leaders as industry authorities.',
    },
    {
      name: 'Instagram',
      role: 'Visual Storytelling & Direct Engagement',
      desc: 'High-production visual showcases, reels demonstrating behind-the-scenes processes, and automated direct message conversation starters.',
    },
    {
      name: 'Facebook',
      role: 'Local Reach & Community Retargeting',
      desc: 'Community building, local customer trust verification, customer review showcases, and integrated paid campaign amplification.',
    },
    {
      name: 'YouTube',
      role: 'In-Depth Demonstrations & Evergreen Search',
      desc: 'Long-form strategic breakdowns, client walkthroughs, and instructional videos that compound in search visibility over years.',
    },
  ],
  included: [
    {
      title: 'Platform-Specific Content Strategy',
      text: 'Tailoring visual and editorial formats to the natural user behavior and consumption habits of each major social channel.',
    },
    {
      title: 'Visual Identity & Template Systems',
      text: 'Designing a polished, recognizable social brand aesthetic using your core palette, typography, and professional brand marks.',
    },
    {
      title: 'Conversation & DM Conversion Architecture',
      text: 'Implementing clear comment triggers and direct message pathways that guide interested prospects smoothly into WhatsApp or discovery calls.',
    },
    {
      title: 'Paid Boost & Retargeting Synergy',
      text: 'Promoting top-performing organic assets to precisely targeted lookalike and custom audience segments to amplify reach cost-effectively.',
    },
  ],
  deliverables: [
    'Monthly content editorial calendar with approved copywriting and custom visual assets',
    'Dedicated creative templates for carousel posts, quote cards, and video thumbnails',
    'Direct message conversion scripts and WhatsApp routing rules',
    'Community monitoring and engagement guidelines',
    'Monthly social reach, audience growth, and inbound enquiry tracking report',
  ],
  faqs: [
    [
      'Which social platform should our business focus on first?',
      'For B2B services, consultancies, and manufacturers, LinkedIn is the primary driver of high-value relationships. For D2C brands, hospitality, and retail, Instagram and Facebook take priority. We identify the optimal focus based on where your buyers spend their attention.',
    ],
    [
      'How do you measure social media return on investment?',
      'Beyond engagement metrics, we track direct message enquiries, link clicks with custom UTM tracking, profile visits, and inbound leads that mention finding you on social platforms.',
    ],
  ],
  ctaLabel: 'Build Your Social Media Presence',
  ctaPillar: 'Social Media Marketing',
  frameworkRole: {
    stage: '02: Attract',
    summary: 'Builds organic brand awareness, community trust, and direct inquiry relationships across key social channels.',
  },
}

// 6. PAY PER CLICK ADVERTISING (PPC) (Distinguishing multi-channel PPC)
export const PPC_ADVERTISING: SearchPageConfig = {
  slug: 'ppc-advertising',
  breadcrumb: 'PPC Advertising',
  title: 'PPC Advertising',
  seoTitle: 'PPC Advertising & Multi-Channel Paid Media | Chazon',
  seoDesc:
    'Performance-driven PPC campaigns across search, social and display. Audience targeting, continuous ad testing, and cost-per-lead optimization for higher ROI.',
  h1: 'Performance-Driven PPC Campaigns That Maximize Customer Acquisition.',
  intro:
    'Paid advertising is the most rapid way to scale customer acquisition, provided your media spend is strictly tied to commercial outcomes. We design, manage, and continuously optimize paid campaigns across search, display, and social networks to minimize cost-per-lead and scale revenue.',
  problemTitle: 'Why do most PPC campaigns burn ad spend without delivering ROI?',
  problemText:
    'Too many campaigns send expensive clicks to generic homepages without dedicated conversion architecture. Irrelevant search queries, weak creative testing, and poor audience segmentation quickly waste advertising budgets.',
  signs: [
    'High cost-per-click and escalating cost-per-lead that erode campaign profitability',
    'Paid traffic bounces immediately because landing pages do not match the ad promise',
    'Inability to determine which ad creatives or audience segments actually generate revenue',
    'Competitors dominate auction impression share for high-intent category keywords',
    'Ad accounts suffer from creative fatigue and diminishing returns over time',
  ],
  included: [
    {
      title: 'Multi-Channel Paid Media Planning',
      text: 'Allocating advertising budgets strategically across Google Search, Display, Meta, YouTube, and LinkedIn based on customer acquisition economics.',
    },
    {
      title: 'Full-Funnel Audience Architecture',
      text: 'Structuring cold prospecting, consideration nurture, and bottom-of-funnel retargeting audiences with tailored messaging at every touchpoint.',
    },
    {
      title: 'Continuous Multivariate Creative Testing',
      text: 'Systematically testing headlines, value hooks, visual assets, and calls to action to uncover top-performing creative combinations.',
    },
    {
      title: 'Bid Management & Margin Protection',
      text: 'Setting intelligent target CPA and ROAS bidding parameters to prevent auction overbidding while maximizing conversion volume.',
    },
  ],
  deliverables: [
    'Full paid media audit and multi-channel campaign architecture plan',
    'Custom high-converting ad copy and visual creative production',
    'Dedicated campaign tracking setup with conversion pixel verification',
    'Weekly bid optimization, negative match refinement, and budget reallocation',
    'Real-time reporting dashboard displaying spend, leads, CAC, and estimated pipeline value',
  ],
  faqs: [
    [
      'What is the difference between PPC and Google Ads?',
      'Google Ads is a specific advertising platform focusing primarily on search, shopping, and Google networks. PPC (Pay-Per-Click) is the overarching discipline that encompasses Google Ads alongside paid social media advertising (Meta, LinkedIn) and programmatic display networks.',
    ],
    [
      'What minimum monthly advertising budget is required to see results?',
      'While we work with budgets across various tiers, we generally recommend a minimum monthly media spend of ₹30,000 to ₹50,000 to generate sufficient impression volume for statistically meaningful testing and optimization.',
    ],
    [
      'How quickly can a new PPC campaign begin delivering leads?',
      'Once campaigns are configured, tracking is verified, and landing pages are live, PPC ads can begin generating qualified enquiries within 48 to 72 hours of launch.',
    ],
  ],
  ctaLabel: 'Optimize Your Paid Advertising',
  ctaPillar: 'PPC Advertising',
  frameworkRole: {
    stage: '02 & 03: Attract & Convert',
    summary: 'Accelerates qualified traffic acquisition and tests conversion messaging at scale.',
  },
}

// 7. GOOGLE ADS (Google-specific campaign formats)
export const GOOGLE_ADS: SearchPageConfig = {
  slug: 'google-ads',
  breadcrumb: 'Google Ads',
  title: 'Google Ads',
  seoTitle: 'Google Ads Management & Performance Campaigns | Chazon',
  seoDesc:
    'High-intent Google Search, Performance Max, and Shopping campaigns engineered for maximum ROAS. Rigorous negative keywords and CRM offline conversion tracking.',
  h1: 'Capture High-Intent Searchers at the Exact Moment They Decide.',
  intro:
    'When a prospective customer searches Google for your specific service or product, they already possess intent. We build disciplined Google Ads campaigns across Search, Performance Max, and Shopping that ensure your business captures those high-intent moments profitably.',
  problemTitle: 'Why do so many Google Ads accounts waste budget on junk clicks?',
  problemText:
    'Google’s default automated settings are designed to maximize Google’s revenue by broadly matching searches. Without expert match-type structuring, aggressive negative keyword lists, and landing page alignment, thousands of rupees are lost to irrelevant clicks.',
  signs: [
    'Search term reports show ad budget spent on job seekers, student research, or free advice',
    'High click-through rates that result in zero phone calls, form submissions, or orders',
    'Quality Scores below 6/10 driving up your cost-per-click compared to competitors',
    'Performance Max campaigns generating low-quality form spam that wastes your sales team’s time',
    'Zero integration between Google Ads conversion tags and your backend CRM sales records',
  ],
  included: [
    {
      title: 'High-Intent Search Architecture',
      text: 'Structuring single-theme ad groups with exact and phrase match keywords to capture prospects actively looking to buy.',
    },
    {
      title: 'Aggressive Negative Keyword Governance',
      text: 'Building and continuously updating exhaustive negative keyword lists to permanently block irrelevant and non-commercial searches.',
    },
    {
      title: 'Performance Max & Shopping Feeds',
      text: 'Optimizing Google Merchant Center feeds, asset groups, and audience signals to scale e-commerce and multi-channel reach.',
    },
    {
      title: 'Offline Conversion Tracking (OCT)',
      text: 'Feeding CRM-verified lead status back into Google’s smart bidding algorithm so Google optimizes for actual revenue instead of form fills.',
    },
  ],
  deliverables: [
    'Comprehensive account restructuring or new campaign deployment',
    'High-converting responsive search ad copywriting and extension assets',
    'Negative keyword master lists tailored to your specific industry',
    'Google Tag Manager conversion tracking with enhanced conversion data',
    'Monthly campaign report detailing search impression share, cost-per-lead, and ROAS',
  ],
  faqs: [
    [
      'Why are our current Google Ads clicks so expensive?',
      'High CPCs usually stem from low Google Quality Scores (caused by poor ad relevance or slow landing pages) or bidding on broad match keywords without adequate negative keyword filters. We systematically optimize Quality Scores to lower your cost-per-click.',
    ],
    [
      'Do you manage Google Search, Performance Max, and Display campaigns?',
      'Yes. We architect comprehensive campaign setups that deploy Search for immediate high-intent capture, Performance Max for cross-network reach, and targeted Display/YouTube for remarketing.',
    ],
  ],
  ctaLabel: 'Audit Your Google Ads Account',
  ctaPillar: 'Google Ads',
  frameworkRole: {
    stage: '02: Attract',
    summary: 'Intercepts active high-intent search demand on Google and directs it into dedicated landing experiences.',
  },
}

// 8. EMAIL MARKETING (Newsletters, automated journeys, lead nurturing, retention, segmentation)
export const EMAIL_MARKETING: SearchPageConfig = {
  slug: 'email-marketing',
  breadcrumb: 'Email Marketing',
  title: 'Email Marketing',
  seoTitle: 'Email Marketing & Automated Lifecycle Journeys | Chazon',
  seoDesc:
    'Automated email nurture sequences, newsletters, retention flows, and subscriber segmentation that turn one-time buyers into loyal repeat customers.',
  h1: 'Turn One-Time Visitors into Loyal, High-Lifetime-Value Customers.',
  intro:
    'Your email list is one of the few digital assets your business truly owns. We engineer automated email marketing journeys, behavioral segmentation, and high-value editorial newsletters that nurture prospects, increase customer lifetime value, and drive predictable repeat sales.',
  problemTitle: 'Why do most email marketing efforts sit unread in promotional tabs?',
  problemText:
    'Sending generic, blast emails to an unsegmented list leads to low open rates, spam complaints, and list fatigue. Without automated lifecycle sequences triggered by actual subscriber behavior, substantial revenue is left on the table.',
  signs: [
    'Your business only sends occasional sales blasts without regular value-driven communication',
    'Open rates are declining below industry benchmarks due to poor domain deliverability',
    'New leads receive no automated welcome or nurturing sequence after submitting an enquiry',
    'Zero automated abandoned cart or post-purchase follow-up workflows are active',
    'Subscribers are treated as one homogenous group without behavioral segmentation',
  ],
  included: [
    {
      title: 'Automated Lifecycle Email Journeys',
      text: 'Designing multi-step welcome sequences, lead qualification workflows, abandoned cart recovery, and post-purchase check-ins.',
    },
    {
      title: 'Behavioral Audience Segmentation',
      text: 'Grouping subscribers based on purchase history, browsing activity, lead status, and engagement frequency to maximize relevance.',
    },
    {
      title: 'High-Value Editorial Newsletters',
      text: 'Writing engaging, consultative email broadcasts that provide genuine industry value and keep your brand top-of-mind.',
    },
    {
      title: 'Technical Deliverability & Domain Authentication',
      text: 'Configuring SPF, DKIM, DMARC, and custom sending domains to ensure your emails reach the primary inbox rather than spam folders.',
    },
  ],
  deliverables: [
    'Complete email marketing platform setup and CRM integration (Klaviyo, Mailchimp, Brevo, HubSpot)',
    'Automated Welcome & Lead Nurturing Sequence (3–5 bespoke emails)',
    'Automated Customer Retention & Re-engagement Workflow',
    'Custom responsive email design templates aligned with your brand aesthetic',
    'Monthly email campaign management, A/B subject line testing, and revenue attribution report',
  ],
  faqs: [
    [
      'Can email marketing work effectively for B2B service companies?',
      'Yes. In B2B, buying cycles often take weeks or months. Educational email sequences that provide valuable perspectives, case studies, and industry data keep your firm top-of-mind so you are the first partner called when the budget is released.',
    ],
    [
      'How do you protect our emails from landing in spam folders?',
      'We configure proper technical authentication protocols (DKIM, SPF, DMARC, BIMI), clean inactive contacts from your list, pace sending volumes, and write clean, responsive HTML that passes spam filters.',
    ],
  ],
  ctaLabel: 'Plan Your Email Marketing System',
  ctaPillar: 'Email Marketing',
  frameworkRole: {
    stage: '04: Retain',
    summary: 'Nurtures long-term customer relationships, drives repeat transactions, and automates lifecycle communication.',
  },
}

// 9. AFFILIATE & INFLUENCER MARKETING
export const AFFILIATE_INFLUENCER_MARKETING: SearchPageConfig = {
  slug: 'affiliate-influencer-marketing',
  breadcrumb: 'Affiliate & Influencer Marketing',
  title: 'Affiliate & Influencer Marketing',
  seoTitle: 'Affiliate & Influencer Marketing Partnerships | Chazon',
  seoDesc:
    'Expand your brand reach and sales through credible creator partnerships, performance affiliate networks, authentic reviews, and measurable conversion tracking.',
  h1: 'Scale Brand Authority and Sales Through Credible Creator Partnerships.',
  intro:
    'Modern consumers trust peer recommendations and credible industry authorities far more than corporate advertisements. We develop structured affiliate and creator collaboration frameworks that connect your brand with respected voices, driving authentic endorsement and measurable sales.',
  problemTitle: 'Why do so many influencer collaborations fail to produce sales?',
  problemText:
    'Paying influencers based on follower vanity counts rather than genuine audience engagement frequently results in zero commercial return. Without performance affiliate tracking and contract alignment, marketing budgets are squandered on fake reach.',
  signs: [
    'Past influencer collaborations produced vanity impressions but zero traceable orders or leads',
    'Difficulty identifying which creators have genuinely engaged, authentic target audiences',
    'No tracking infrastructure exists to measure individual creator revenue and ROAS accurately',
    'Lack of standardized creator contracts, deliverables briefs, and usage rights agreements',
    'Missing performance-based affiliate commission structures that incentivize creators to drive sales',
  ],
  included: [
    {
      title: 'Creator Vetting & Audience Due Diligence',
      text: 'Analyzing creator engagement quality, audience demographics, follower authenticity, and brand safety before outreach.',
    },
    {
      title: 'Performance Affiliate Architecture',
      text: 'Deploying tracking links, custom coupon codes, and affiliate portal software that tracks and attributes every sale transparently.',
    },
    {
      title: 'Strategic Briefing & Creative Direction',
      text: 'Providing clear creative parameters and product talking points while allowing creators the creative freedom to communicate authentically.',
    },
    {
      title: 'Contracting & Content Usage Rights',
      text: 'Securing clear deliverable agreements and digital advertising usage rights so high-performing creator assets can be amplified in paid campaigns.',
    },
  ],
  deliverables: [
    'Custom creator selection matrix and vetted outreach candidate list',
    'Standardized creator partnership agreements and deliverables brief templates',
    'Affiliate tracking software setup with commission payout rules',
    'Campaign coordination, review process, and live posting schedule',
    'Post-campaign revenue attribution report analyzing ROAS, CAC, and creative performance',
  ],
  faqs: [
    [
      'How do we track whether an influencer campaign generated actual sales?',
      'We issue unique UTM-tagged tracking links and dedicated coupon codes to every creator. Our analytics tracking measures direct clicks, assisted conversions, and revenue attributed to each specific partner.',
    ],
    [
      'Should we work with macro influencers or micro influencers?',
      'Micro and nano influencers (5k to 50k followers) often possess significantly higher engagement rates, deeper niche trust, and more affordable collaboration terms than celebrity macro influencers. We typically recommend a portfolio approach prioritizing audience relevance.',
    ],
  ],
  ctaLabel: 'Discuss Creator & Affiliate Partnerships',
  ctaPillar: 'Affiliate & Influencer Marketing',
  frameworkRole: {
    stage: '02 & 03: Attract & Convert',
    summary: 'Builds third-party credibility and drives warm, qualified referrals through trusted creator endorsements.',
  },
}

// 10. UI/UX DESIGN (Usability, accessibility, customer journeys, conversion optimisation)
export const UI_UX_DESIGN: SearchPageConfig = {
  slug: 'ui-ux-design',
  breadcrumb: 'UI/UX Design',
  title: 'UI/UX Design',
  seoTitle: 'UI/UX Design & Customer Journey Optimisation | Chazon',
  seoDesc:
    'User-focused digital product and website design engineered for conversion. Intuitive customer journeys, mobile ergonomics, and frictionless checkout flows.',
  h1: 'User-Focused Design That Makes Conversion Natural and Frictionless.',
  intro:
    'Great digital design is not about superficial decoration; it is about cognitive clarity. We design intuitive, accessible user interfaces and seamless customer journeys that remove hesitation, guide visitors effortlessly through complex decisions, and maximize commercial conversion rates.',
  problemTitle: 'Why do confusing digital interfaces destroy conversion rates?',
  problemText:
    'When visitors encounter visual clutter, confusing navigation, illegible typography, or cumbersome multi-step forms, their cognitive load increases. If finding an answer or completing a checkout requires effort, they abandon the site immediately.',
  signs: [
    'Analytics show high drop-off rates on key evaluation pages, quote forms, or checkout steps',
    'Mobile visitors struggle with tiny tap targets, cramped spacing, and awkward layout shifts',
    'Visual styling looks outdated or fails to communicate the premium quality of your offering',
    'Navigation menus contain too many choices, causing choice paralysis for prospective buyers',
    'Lack of consistent design tokens, typography scales, and accessibility compliance across the platform',
  ],
  included: [
    {
      title: 'Customer Journey & Decision Mapping',
      text: 'Mapping user flows, friction points, and key decision moments from initial discovery to final enquiry or checkout.',
    },
    {
      title: 'Wireframing & Information Hierarchy',
      text: 'Structuring page layouts, headline contrast, and visual breathing room so essential information is instantly comprehensible.',
    },
    {
      title: 'High-Fidelity UI Design & Design Systems',
      text: 'Crafting modern, accessible design tokens (color, typography, elevation, spacing) that establish a coherent brand experience.',
    },
    {
      title: 'Mobile Ergonomics & Tap Target Optimization',
      text: 'Designing for natural thumb zones, responsive layouts, and frictionless single-focus interaction states on mobile viewports.',
    },
  ],
  deliverables: [
    'Full UX heuristic evaluation identifying existing conversion leaks',
    'Interactive user flow diagrams and low-fidelity wireframes',
    'Complete high-fidelity responsive UI designs (Figma / Web components)',
    'Comprehensive design token specification (typography scale, color tokens, button states)',
    'Accessibility and usability compliance report (WCAG 2.1 AA)',
  ],
  faqs: [
    [
      'What is the difference between UI and UX design?',
      'UX (User Experience) focuses on how the platform works: the architecture, user flows, friction reduction, and ease of completing an objective. UI (User Interface) focuses on how it looks: visual hierarchy, typography, colors, branding, and interactive states. We integrate both disciplines into every design.',
    ],
    [
      'How does UI/UX design improve our conversion rate?',
      'By removing cognitive friction. When a page clearly answers customer questions, establishes trust through clean visual hierarchy, and makes taking the next step effortless, a higher percentage of visitors convert into leads.',
    ],
  ],
  ctaLabel: 'Improve Your Platform Experience',
  ctaPillar: 'UI/UX Design',
  frameworkRole: {
    stage: '03: Convert',
    summary: 'Removes user friction, optimizes customer journeys, and transforms casual visitors into confirmed buyers.',
  },
}

// Search landing / legacy configurations preserved for backward compatibility
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
    'Slow catalog browsing and sluggish filtering on mobile networks',
    'Frequent checkout errors or payment gateway timeouts',
    'No automated WhatsApp or email recovery for abandoned carts',
    'Difficulty scaling marketing campaigns because store conversion rate is under 1.5%',
  ],
  included: [
    {
      title: 'High-Converting Catalog & Product Pages',
      text: 'Clear pricing, rich specification badges, customer review integration, and dynamic stock availability indicators.',
    },
    {
      title: 'Frictionless Mobile Checkout',
      text: 'Streamlined checkout steps supporting UPI, NetBanking, credit cards, EMI, and COD with minimal required input fields.',
    },
    {
      title: 'Payment Gateway & Logistics Integration',
      text: 'Razorpay, Cashfree, Shiprocket, and warehouse ERP sync configured for real-time tracking numbers and automated GST receipts.',
    },
    {
      title: 'Automated Abandoned Cart Recovery',
      text: 'Automated WhatsApp and email sequences that re-engage abandoned checkouts with customized discount triggers.',
    },
  ],
  deliverables: [
    'Full e-commerce store architecture and custom theme development',
    'Multi-gateway payment setup (UPI, Cards, NetBanking, COD)',
    'Automated WhatsApp and email abandoned cart recovery flows',
    'Google Analytics 4 Enhanced Ecommerce event tracking',
    'Product catalog migration and inventory synchronization guide',
  ],
  faqs: [
    [
      'Which e-commerce platform do you recommend?',
      'For most brands, Shopify or WooCommerce provides the best balance of speed, security, and app ecosystem. For complex requirements, we build custom headless commerce architectures.',
    ],
    [
      'Can you help migrate our existing products and customer data?',
      'Yes. We handle seamless migration of products, customer records, order history, and 301 SEO redirects to ensure zero loss in organic traffic.',
    ],
  ],
  ctaLabel: 'Launch or Upgrade Your Online Store',
  ctaPillar: 'E-Commerce Development',
}

export const LOCAL_SEO: SearchPageConfig = {
  slug: 'local-seo',
  breadcrumb: 'Local SEO',
  title: 'Local SEO & Google Business Profile',
  seoTitle: 'Local SEO Services & Google Business Profile Optimization | Chazon',
  seoDesc:
    'Dominate local search and Google Maps 3-Pack rankings. Complete Google Business Profile optimization, local citations, and review management.',
  h1: 'Dominate Google Maps and Local Search in Your Commercial Territory.',
  intro:
    'When high-intent local customers search for your services "near me" or in your city, appearing in the top Google Maps 3-Pack generates immediate phone calls and foot traffic. We optimize your local digital footprint to drive verified local enquiries.',
  problemTitle: 'Why do nearby customers choose your competitors on Google Maps?',
  problemText:
    'Incomplete Google Business Profiles, inconsistent business directory listings, missing category keywords, and sparse customer reviews cause Google to rank competitors above you.',
  signs: [
    'Your business does not appear in the top 3 Google Maps results for local searches',
    'Google Business Profile receives impressions but few direct phone calls or website clicks',
    'Inconsistent business address or phone numbers across online directories',
    'Competitors have hundreds of positive Google reviews while your profile has few',
    'Zero local landing pages targeting specific neighborhoods or metropolitan areas',
  ],
  included: [
    {
      title: 'Google Business Profile Master Optimization',
      text: 'Complete verification, primary and secondary category tuning, service area listings, high-resolution imagery, and automated weekly updates.',
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
