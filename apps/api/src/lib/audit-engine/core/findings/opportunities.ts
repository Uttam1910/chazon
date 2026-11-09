import type { Confidence, Finding, JourneySummary, Opportunity, OpportunityBasis, ScoreResult, ServiceCategory, TechnologySummary } from '@chazon/shared';
import { isHttpUrl } from '../util/text';

export interface OpportunityInput {
  findings: Finding[];
  scores: ScoreResult[];
  journey: JourneySummary | null;
  technology: TechnologySummary | null;
  strategy: string;
}

type Draft = Omit<Opportunity, 'evidence' | 'affected' | 'relevance' | 'confidence' | 'basis' | 'informationNeeded'> &
  Partial<Pick<Opportunity, 'evidence' | 'affected' | 'confidence' | 'basis' | 'informationNeeded'>>;

/** Evidence lines and affected URLs taken from the supporting findings. */
export function supportFrom(findings: Finding[]): { evidence: string[]; affected: string[] } {
  const evidence = findings.slice(0, 6).map((f) => `${f.title}${f.observed ? ` - ${f.observed}` : f.evidence[0] ? ` - ${f.evidence[0]}` : ''}`);
  const affected = [...new Set(findings.flatMap((f) => f.affected).filter(isHttpUrl))].slice(0, 10);
  return { evidence, affected };
}

/** confirmed when at least one directly observed, non-trivial finding supports it; inferred otherwise. */
function basisFor(findings: Finding[]): OpportunityBasis {
  return findings.some((f) => f.status === 'confirmed' && f.severity !== 'info' && f.severity !== 'low') ? 'confirmed' : 'inferred';
}

function confidenceFor(findings: Finding[]): Confidence {
  if (findings.some((f) => f.confidence === 'high' && f.severity !== 'info')) return 'high';
  if (findings.some((f) => f.confidence !== 'low')) return 'medium';
  return 'low';
}

/**
 * Maps verified observations to Chazon service categories. Each opportunity cites
 * the findings or signals that triggered it, says how sure it is, and lists what
 * must be asked before recommending it. Absence of a feature alone never produces
 * a "confirmed" opportunity - those are marked as needing discovery.
 */
export function buildOpportunities(input: OpportunityInput): Opportunity[] {
  const { findings, scores, journey, technology } = input;
  const out: Opportunity[] = [];
  const add = (o: Draft, support: Finding[] = []) => {
    const s = supportFrom(support);
    out.push({
      ...o,
      evidence: o.evidence ?? s.evidence,
      affected: o.affected ?? s.affected,
      confidence: o.confidence ?? confidenceFor(support),
      basis: o.basis ?? basisFor(support),
      informationNeeded: o.informationNeeded ?? [],
      relevance: 'normal',
    });
  };
  const has = (prefix: string) => findings.filter((f) => f.id.startsWith(prefix));
  const ids = (list: Finding[]) => list.map((f) => f.id);
  const score = (k: ScoreResult['key']) => scores.find((s) => s.key === k)?.value ?? null;

  // BUILD -------------------------------------------------------------------------
  const perf = score('performance');
  if (perf !== null && perf < 90) {
    const perfFindings = findings.filter((f) => f.category === 'performance' && f.severity !== 'info');
    add(
      {
        id: 'build.performance',
        service: 'BUILD',
        title: perf < 50 ? 'Performance-focused rebuild or optimisation' : 'Targeted performance improvements',
        observation: `Lighthouse performance score ${perf}/100 (${input.strategy}, lab) with ${perfFindings.length} performance finding(s).`,
        whyItMatters: 'Slow pages, especially on mobile, tend to lose visitors before they engage; speed also feeds into Google’s page-experience signals.',
        nextStep: 'Work through the highest-priority performance findings (images, render-blocking resources, unused code), then re-test several times.',
        uncertainty: 'A single lab run varies between tests. Real-user (field) data and analytics are needed to know how much speed affects this business.',
        relatedFindingIds: ids(perfFindings.slice(0, 6)),
        confidence: perf < 50 ? 'high' : 'medium',
        basis: 'confirmed',
        evidence: [`Lighthouse performance score: ${perf}/100 (${input.strategy}, single lab run)`, ...supportFrom(perfFindings).evidence.slice(0, 4)],
        informationNeeded: ['Share of mobile visitors and bounce rate (analytics)', 'Hosting plan and who maintains the theme/plugins', 'Pages that matter most for enquiries or sales'],
      },
      perfFindings,
    );
  }
  const mobile = [...has('mobile.'), ...has('a11y.zoom-disabled')];
  if (mobile.length) {
    add(
      {
        id: 'build.mobile',
        service: 'BUILD',
        title: 'Mobile-responsive improvements',
        observation: mobile.map((f) => f.title).join('; '),
        whyItMatters: 'Many visitors browse on phones; pages that do not adapt are harder to read and use.',
        nextStep: 'Fix the viewport configuration and test key templates on real phones.',
        uncertainty: 'The share of mobile visitors is unknown without the business’s analytics.',
        relatedFindingIds: ids(mobile),
        informationNeeded: ['Share of mobile visitors (analytics)', 'Which templates/pages are most visited on mobile'],
      },
      mobile,
    );
  }
  const a11y = findings.filter((f) => f.category === 'accessibility' && (f.severity === 'high' || f.severity === 'medium'));
  const a11yScore = score('accessibility');
  if (a11y.length >= 2 || (a11yScore !== null && a11yScore < 90)) {
    add(
      {
        id: 'build.accessibility',
        service: 'BUILD',
        title: 'UI/UX accessibility remediation',
        observation: `${a11y.length} medium/high accessibility finding(s)${a11yScore !== null ? `; Lighthouse accessibility score ${a11yScore}/100` : ''}.`,
        whyItMatters: 'Accessible interfaces are usable by more people and reduce friction for everyone (labels, contrast, focus order).',
        nextStep: 'Fix the automated findings, then run a manual keyboard and screen-reader review of key journeys.',
        uncertainty: 'Automated checks cover only part of WCAG; this does not establish legal compliance either way.',
        relatedFindingIds: ids(a11y.slice(0, 6)),
        informationNeeded: ['Whether the business has accessibility obligations or a target standard (e.g. WCAG 2.2 AA)', 'Who can make template and design changes'],
      },
      a11y,
    );
  }
  const security = has('security.').filter((f) => f.severity !== 'info');
  const bp = score('bestPractices');
  if (security.length || (bp !== null && bp < 80)) {
    const support = [...security, ...findings.filter((f) => f.category === 'best-practices')].slice(0, 6);
    add(
      {
        id: 'build.security',
        service: 'BUILD',
        title: 'Technical hygiene and security basics',
        observation: [security.map((f) => f.title).join('; '), bp !== null && bp < 80 ? `Lighthouse best-practices score ${bp}/100` : ''].filter(Boolean).join('; '),
        whyItMatters: 'HTTPS and clean best-practice results protect visitors and avoid browser warnings.',
        nextStep: 'Resolve HTTPS/redirect and mixed-content issues first, then the remaining best-practice audits.',
        uncertainty: 'Some best-practice failures come from third-party scripts that the business may not control.',
        relatedFindingIds: ids(support),
        informationNeeded: ['Hosting/DNS access and who manages the certificate', 'Which third-party scripts are still needed'],
      },
      support,
    );
  }
  if (findings.some((f) => f.id === 'crawl.client-rendered')) {
    const support = findings.filter((f) => f.id === 'crawl.client-rendered');
    add(
      {
        id: 'build.rendering',
        service: 'BUILD',
        title: 'Rendering approach review (server-side or pre-rendering)',
        observation: 'The start page delivers very little HTML content and relies on JavaScript to build the page.',
        whyItMatters: 'Server-rendered content is available to every crawler and preview tool immediately and usually appears faster.',
        nextStep: 'Test key pages with Google Search Console’s URL Inspection to see what Google renders before deciding on changes.',
        uncertainty: 'Google can render JavaScript; whether this affects visibility needs Search Console data.',
        relatedFindingIds: ids(support),
        basis: 'inferred',
        informationNeeded: ['Framework/platform used and who maintains it', 'Search Console access to compare indexed vs. published pages'],
      },
      support,
    );
  }

  // GROW --------------------------------------------------------------------------
  const meta = findings.filter((f) => /^seo\.(missing-title|missing-description|duplicate-|missing-h1|title-length|description-length)/.test(f.id));
  if (meta.length) {
    add(
      {
        id: 'grow.metadata',
        service: 'GROW',
        title: 'Metadata and on-page content structure',
        observation: meta.map((f) => f.title).join('; '),
        whyItMatters: 'Titles, descriptions and headings shape how pages appear in search results and how clearly their topic is understood.',
        nextStep: 'Write unique titles, descriptions and H1s for key pages, starting with those listed.',
        uncertainty: 'No ranking change can be guaranteed; search performance depends on many factors outside this audit.',
        relatedFindingIds: ids(meta),
        informationNeeded: ['Priority services/products and the search terms customers use', 'Search Console data (queries, impressions, click-through rate)'],
      },
      meta,
    );
  }
  const crawl = findings.filter((f) => /^seo\.(robots-|sitemap-|noindex-start|canonical-|broken-internal|redirect-chain)/.test(f.id));
  if (crawl.length) {
    add(
      {
        id: 'grow.technical-seo',
        service: 'GROW',
        title: 'Technical SEO foundations (crawling and indexing)',
        observation: crawl.map((f) => f.title).join('; '),
        whyItMatters: 'Search engines need to crawl and index pages reliably before content can compete in results.',
        nextStep: 'Verify the site in Google Search Console, then fix the crawl/indexing items listed.',
        uncertainty: 'Search Console data (not available to this tool) is needed to see what Google has actually indexed.',
        relatedFindingIds: ids(crawl),
        informationNeeded: ['Google Search Console access (Pages/Indexing report)', 'Recent site migrations or domain changes'],
      },
      crawl,
    );
  }
  const sd = findings.filter((f) => /^seo\.(no-structured-data|invalid-jsonld|missing-open-graph)/.test(f.id));
  if (sd.length) {
    add(
      {
        id: 'grow.structured-data',
        service: 'GROW',
        title: 'Structured data and share previews',
        observation: sd.map((f) => f.title).join('; '),
        whyItMatters: 'Structured data helps search engines understand the business and products; Open Graph improves link previews in social and messaging apps.',
        nextStep: 'Add Organization/LocalBusiness (and Product where relevant) JSON-LD and complete Open Graph tags.',
        uncertainty: 'Rich-result eligibility is decided by Google and is not guaranteed.',
        relatedFindingIds: ids(sd),
        informationNeeded: ['Official business name, address, opening hours and logo', 'Whether pages are often shared on social media or WhatsApp'],
      },
      sd,
    );
  }
  const thin = findings.filter((f) => f.id === 'seo.thin-content');
  if (thin.length) {
    add(
      {
        id: 'grow.content',
        service: 'GROW',
        title: 'Content depth for key pages',
        observation: thin[0]!.title,
        whyItMatters: 'Pages that explain services clearly give search engines and visitors more to understand and trust.',
        nextStep: 'Agree which pages should attract search traffic, then expand them with specific, useful content.',
        uncertainty: 'Word count alone does not determine quality or rankings; some pages are meant to be short.',
        relatedFindingIds: ids(thin),
        basis: 'inferred',
        confidence: 'low',
        informationNeeded: ['Which pages are meant to rank and for which topics', 'Who can write or approve content'],
      },
      thin,
    );
  }
  if (technology && !technology.detections.some((d) => d.category === 'Analytics' || /tag manager/i.test(d.name))) {
    add({
      id: 'grow.measurement',
      service: 'GROW',
      title: 'Measurement set-up (analytics and Search Console)',
      observation: 'No analytics or tag-manager script was detected in the server HTML of the inspected pages.',
      evidence: ['Technology detection found no Google Analytics, Tag Manager, Matomo, Plausible, Clarity or similar signature.'],
      affected: [],
      whyItMatters: 'Without measurement it is not possible to know where visitors come from, which pages lead to enquiries, or whether changes work.',
      nextStep: 'Ask whether analytics exists (it may be loaded in a way this tool cannot see); if not, set up privacy-compliant analytics and Search Console.',
      uncertainty: 'Analytics can be injected by consent tools or JavaScript that this HTML-based check does not see.',
      relatedFindingIds: [],
      confidence: 'low',
      basis: 'discovery',
      informationNeeded: ['Does the business have analytics or Search Console access?', 'Consent/cookie requirements in its market'],
    });
  }

  // CONVERT -----------------------------------------------------------------------
  const conv = findings.filter((f) => f.category === 'journey' && f.service === 'CONVERT' && f.severity !== 'info' && f.id !== 'journey.form-no-privacy-link');
  if (conv.length) {
    add(
      {
        id: 'convert.next-steps',
        service: 'CONVERT',
        title: 'Clearer next steps for visitors',
        observation: conv.map((f) => f.title).join('; '),
        whyItMatters: 'When the next step (call, enquire, book, buy) is obvious, interested visitors are more likely to take it.',
        nextStep: 'Agree the primary action for the business and make it visible on the home page, service pages and in the header.',
        uncertainty: 'Detection is text-based on the inspected pages only; the business’s goals and current enquiry volumes are unknown.',
        relatedFindingIds: ids(conv),
        informationNeeded: ['The single most valuable action for the business (call, form, booking, purchase)', 'Current monthly enquiries and how they arrive'],
      },
      conv,
    );
  }
  const reassurance = findings.filter((f) => f.id === 'journey.form-no-privacy-link' || f.id === 'journey.no-trust-signals' || f.id === 'journey.long-enquiry-form');
  if (reassurance.length) {
    add(
      {
        id: 'convert.reassurance',
        service: 'CONVERT',
        title: 'Reassurance around enquiries (privacy, reviews, form length)',
        observation: reassurance.map((f) => f.title).join('; '),
        whyItMatters: 'Visitors weigh effort and trust before sharing their details; clear privacy information, genuine feedback and short forms reduce hesitation.',
        nextStep: 'Review the enquiry pages with the business: link the privacy policy, keep only essential fields and show genuine reviews if available.',
        uncertainty: 'These are observations from the inspected pages only; the business may show reviews elsewhere or need detailed forms.',
        relatedFindingIds: ids(reassurance),
        basis: 'inferred',
        informationNeeded: ['Does the business collect genuine reviews or testimonials (and have permission to show them)?', 'Which form fields are essential for the first response'],
      },
      reassurance,
    );
  }
  const formLabels = findings.filter((f) => f.id === 'a11y.unlabeled-fields');
  if (formLabels.length && journey && journey.forms.some((f) => f.kind === 'enquiry' && f.unlabeledFields > 0)) {
    add(
      {
        id: 'convert.form-usability',
        service: 'CONVERT',
        title: 'Enquiry form usability',
        observation: 'Enquiry form fields without accessible labels were detected.',
        whyItMatters: 'Clear, labelled forms are easier to complete on any device and with assistive technology.',
        nextStep: 'Add visible labels, sensible input types (email, tel) and clear error messages to the enquiry form.',
        uncertainty: 'Form completion rates are not visible to this tool.',
        relatedFindingIds: ids(formLabels),
        informationNeeded: ['Form completion/abandonment data if available'],
      },
      formLabels,
    );
  }
  if (journey && journey.ecommerce.signals.length && journey.ecommerce.productPages.length) {
    const support = findings.filter((f) => f.id === 'journey.shop-no-cart');
    add(
      {
        id: 'convert.product-discovery',
        service: 'CONVERT',
        title: 'Product discovery and purchase path review',
        observation: `E-commerce signals detected (${journey.ecommerce.signals.join(', ')}) on ${journey.ecommerce.productPages.length} inspected product page(s).`,
        evidence: journey.ecommerce.signals.map((s) => `Signal: ${s}`),
        affected: journey.ecommerce.productPages.slice(0, 10),
        whyItMatters: 'Product pages and the path to checkout are where small usability issues have the most direct effect.',
        nextStep: 'Review product page speed, imagery, price clarity and the add-to-cart/checkout flow on mobile.',
        uncertainty: 'This tool does not add items to a cart or test checkout; sales data is needed to prioritise.',
        relatedFindingIds: ids(support),
        confidence: 'medium',
        basis: 'inferred',
        informationNeeded: ['Online sales volume and conversion rate', 'Cart abandonment data', 'Best-selling products'],
      },
      support,
    );
  }

  // AUTOMATE ----------------------------------------------------------------------
  if (journey) {
    const enquiryForms = journey.forms.filter((f) => f.kind === 'enquiry').length + journey.embeddedForms.length;
    if (enquiryForms > 0) {
      add({
        id: 'automate.enquiry-follow-up',
        service: 'AUTOMATE',
        title: 'Enquiry capture, routing and follow-up',
        observation: `${enquiryForms} enquiry form(s) detected${journey.embeddedForms.length ? ` (embedded: ${[...new Set(journey.embeddedForms.map((e) => e.provider))].join(', ')})` : ''}.`,
        evidence: [...journey.forms.filter((f) => f.kind === 'enquiry').map((f) => `Enquiry form with ${f.fieldCount} fields on ${f.pageUrl}`), ...journey.embeddedForms.map((e) => `${e.provider} form on ${e.pageUrl}`)].slice(0, 6),
        affected: [...new Set([...journey.forms.filter((f) => f.kind === 'enquiry').map((f) => f.pageUrl), ...journey.embeddedForms.map((e) => e.pageUrl)])].slice(0, 10),
        whyItMatters: 'Automatically acknowledging, routing and logging enquiries in a CRM can shorten response times and reduce missed follow-ups.',
        nextStep: 'Ask how form submissions are handled today (inbox, CRM, response time) before proposing an automation.',
        uncertainty: 'The site’s back-end handling of submissions cannot be seen from the outside; it may already be automated.',
        relatedFindingIds: [],
        confidence: 'medium',
        basis: 'discovery',
        informationNeeded: ['Where form submissions go today (inbox, CRM)', 'Typical response time and who responds', 'Monthly enquiry volume'],
      });
    } else if (journey.emails.length && !journey.forms.length) {
      add({
        id: 'automate.structured-enquiry',
        service: 'AUTOMATE',
        title: 'Structured enquiry capture',
        observation: `Contact is via email link(s) (${journey.emails.length}) and no enquiry form was detected on the inspected pages.`,
        evidence: [`${journey.emails.length} email link(s) found`, 'No native or embedded enquiry form found on the inspected pages'],
        affected: [],
        whyItMatters: 'A structured form can capture the details needed to qualify and route enquiries automatically.',
        nextStep: 'Discuss whether a form with automatic acknowledgement and CRM logging would suit the business.',
        uncertainty: 'The business may prefer email deliberately; a form may exist on pages that were not crawled.',
        relatedFindingIds: [],
        confidence: 'low',
        basis: 'discovery',
        informationNeeded: ['Whether the business wants more structured enquiries', 'What information is needed to respond to an enquiry'],
      });
    }
    if (journey.bookingLinks.length) {
      const providers = [...new Set(journey.bookingLinks.map((b) => b.provider).filter(Boolean))];
      add({
        id: 'automate.booking',
        service: 'AUTOMATE',
        title: 'Booking workflow integration',
        observation: `Booking link(s) detected${providers.length ? ` (${providers.join(', ')})` : ''}.`,
        evidence: journey.bookingLinks.slice(0, 5).map((b) => `Booking link "${b.text || b.href}"${b.provider ? ` (${b.provider})` : ''}`),
        affected: journey.bookingLinks.map((b) => b.href).filter(isHttpUrl).slice(0, 10),
        whyItMatters: 'Connecting bookings to reminders, calendars and a CRM can reduce no-shows and manual admin.',
        nextStep: 'Confirm which booking system is used and whether reminders and follow-ups are already automated.',
        uncertainty: 'Existing integrations behind the booking tool are not visible from the website.',
        relatedFindingIds: [],
        confidence: 'medium',
        basis: 'discovery',
        informationNeeded: ['Booking volume and no-show rate', 'Whether reminders/confirmations are already sent automatically'],
      });
    }
    if (journey.whatsapp.length) {
      add({
        id: 'automate.whatsapp',
        service: 'AUTOMATE',
        title: 'WhatsApp customer messaging workflow',
        observation: `${journey.whatsapp.length} WhatsApp click-to-chat link(s) detected.`,
        evidence: journey.whatsapp.map((w) => `WhatsApp link: ${w}`),
        affected: [],
        whyItMatters: 'Structured WhatsApp Business workflows (quick replies, routing, logging to CRM) can help manage chat volume.',
        nextStep: 'Ask about current WhatsApp message volume and how chats are tracked.',
        uncertainty: 'Message volumes and existing tooling are unknown.',
        relatedFindingIds: [],
        confidence: 'medium',
        basis: 'discovery',
        informationNeeded: ['Weekly WhatsApp message volume', 'Whether WhatsApp Business (app or API) is used', 'How chats are logged and followed up'],
      });
    }
  }
  if (technology) {
    const chat = technology.detections.filter((d) => d.category === 'Chat widget');
    const email = technology.detections.filter((d) => d.category === 'Email marketing' || d.name.startsWith('HubSpot'));
    if (chat.length) {
      add({
        id: 'automate.chat-crm',
        service: 'AUTOMATE',
        title: 'Chat-to-CRM follow-up',
        observation: `Chat widget detected: ${chat.map((d) => d.name).join(', ')}.`,
        evidence: chat.flatMap((d) => d.evidence.slice(0, 2).map((e) => `${d.name}: ${e}`)),
        affected: [],
        whyItMatters: 'Chats captured in a CRM with automatic follow-up are less likely to be lost.',
        nextStep: 'Check whether chat transcripts already flow into a CRM and trigger follow-up.',
        uncertainty: 'Integrations behind the widget are not publicly visible.',
        relatedFindingIds: [],
        confidence: 'medium',
        basis: 'discovery',
        informationNeeded: ['Chat volume and who answers', 'Whether chats are logged in a CRM'],
      });
    }
    if (email.length) {
      add({
        id: 'automate.email-marketing',
        service: 'AUTOMATE',
        title: 'Email marketing automation',
        observation: `Marketing tool detected: ${email.map((d) => d.name).join(', ')}.`,
        evidence: email.flatMap((d) => d.evidence.slice(0, 2).map((e) => `${d.name}: ${e}`)),
        affected: [],
        whyItMatters: 'Automated welcome and follow-up sequences can nurture leads who are not ready to buy yet.',
        nextStep: 'Review which automated sequences are already active in the tool.',
        uncertainty: 'Account configuration and plan level cannot be seen from a URL.',
        relatedFindingIds: [],
        confidence: 'medium',
        basis: 'discovery',
        informationNeeded: ['Which automated sequences are active', 'List size and engagement'],
      });
    }
  }
  return out;
}

export const SERVICE_ORDER: ServiceCategory[] = ['BUILD', 'GROW', 'CONVERT', 'AUTOMATE'];
