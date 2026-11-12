/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ActionItem,
  AuditReport,
  Confidence,
  DiscoveryAnswers,
  ExecutiveSummary,
  Finding,
  Opportunity,
  Relevance,
  ScoreKey,
  ServiceCategory,
  Severity,
  Unknown,
} from '@chazon/shared';
import { DISCOVERY_LABELS, describeDiscovery, hasAnswers } from '@chazon/shared';
import { plural } from '../util/text';
import { buildFixGuides, CATEGORY_DEPENDENCIES } from './fixit';
import { guideFor } from './guide';
import { buildOpportunities, SERVICE_ORDER, supportFrom } from './opportunities';
import { buildReadiness } from './readiness';

/**
 * Deterministic "insight" layer: turns findings, scores and opportunities into an
 * executive summary, an action plan and a list of things a URL cannot reveal, and
 * applies the optional owner questionnaire. It never adds measurements - every
 * sentence is derived from data already in the report (or labelled as supplied
 * by the business owner).
 */

/** The part of a report the insight layer reads. */
export type ReportCore = Omit<AuditReport, 'summary' | 'actionPlan' | 'unknowns' | 'discovery' | 'discoveryNotes' | 'readiness' | 'fixGuides'>;

// --- Discovery -------------------------------------------------------------------------------

const OBJECTIVE_SERVICES: Record<string, ServiceCategory[]> = {
  'more-enquiries': ['CONVERT', 'AUTOMATE'],
  'more-online-sales': ['CONVERT', 'BUILD'],
  'more-bookings': ['AUTOMATE', 'CONVERT'],
  'search-visibility': ['GROW'],
  'brand-awareness': ['GROW'],
  'reduce-admin': ['AUTOMATE'],
};
const CHALLENGE_SERVICES: Record<string, ServiceCategory[]> = {
  'not-enough-traffic': ['GROW'],
  'visitors-do-not-enquire': ['CONVERT'],
  'slow-or-outdated-site': ['BUILD'],
  'hard-to-update': ['BUILD'],
  'manual-follow-up': ['AUTOMATE'],
  'low-search-visibility': ['GROW'],
};

interface DiscoveryContext {
  report: ReportCore;
}

/**
 * Re-prioritises opportunities using the owner's answers and adds opportunities
 * that exist only because of those answers (always marked fromDiscovery and basis
 * "discovery"). Observed evidence is never altered.
 */
export function applyDiscovery(base: Opportunity[], d: DiscoveryAnswers | null, ctx: DiscoveryContext): { opportunities: Opportunity[]; notes: string[] } {
  if (!hasAnswers(d)) return { opportunities: base, notes: [] };
  const L = DISCOVERY_LABELS;
  const { journey, technology } = ctx.report;
  const notes: string[] = [];
  const boosts = new Map<ServiceCategory, string[]>();
  const boost = (svc: ServiceCategory, why: string) => boosts.set(svc, [...(boosts.get(svc) ?? []), why]);

  if (d.mainObjective && OBJECTIVE_SERVICES[d.mainObjective]) {
    for (const s of OBJECTIVE_SERVICES[d.mainObjective]!) boost(s, `objective "${L.mainObjective[d.mainObjective]}"`);
    notes.push(`Main objective "${L.mainObjective[d.mainObjective]}" raised ${OBJECTIVE_SERVICES[d.mainObjective]!.join(' and ')} recommendations.`);
  }
  if (d.mainChallenge && CHALLENGE_SERVICES[d.mainChallenge]) {
    for (const s of CHALLENGE_SERVICES[d.mainChallenge]!) boost(s, `challenge "${L.mainChallenge[d.mainChallenge]}"`);
    notes.push(`Main challenge "${L.mainChallenge[d.mainChallenge]}" raised ${CHALLENGE_SERVICES[d.mainChallenge]!.join(' and ')} recommendations.`);
  }
  if (d.followUp === 'none' || d.followUp === 'inbox-or-spreadsheet') boost('AUTOMATE', `follow-up via "${L.followUp[d.followUp]}"`);

  const isShopBusiness = d.businessType === 'ecommerce' || d.needs?.includes('ecommerce');
  const needsKnown = Boolean(d.needs?.length);
  const extra: Opportunity[] = [];
  const ownerOpp = (o: Omit<Opportunity, 'relevance' | 'fromDiscovery' | 'basis' | 'affected' | 'relatedFindingIds'> & Partial<Pick<Opportunity, 'affected' | 'relatedFindingIds'>>) =>
    extra.push({ affected: [], relatedFindingIds: [], ...o, basis: 'discovery', relevance: 'high', fromDiscovery: true });

  if (d.needs?.includes('ecommerce') && !journey?.ecommerce.signals.length) {
    ownerOpp({
      id: 'discovery.ecommerce',
      service: 'BUILD',
      title: 'Online shop capability',
      observation: 'The owner wants to sell online; no e-commerce signals (product data, prices, add-to-cart) were detected on the inspected pages.',
      evidence: ['Owner-supplied: needs online sales', `Observed: no e-commerce signals on ${plural(ctx.report.pagesInspected, 'inspected page')}`],
      whyItMatters: 'Selling online needs product pages, payments, delivery rules and order handling that work well on mobile.',
      nextStep: 'Scope the catalogue size, payment and delivery requirements, then compare platform options.',
      uncertainty: 'The shop may exist on another domain or platform that was not audited.',
      confidence: 'medium',
      informationNeeded: ['Number of products and variants', 'Payment and delivery requirements', 'Existing sales channels (marketplaces, social shops)'],
    });
  }
  if (d.needs?.includes('bookings') && !journey?.bookingLinks.length) {
    ownerOpp({
      id: 'discovery.booking',
      service: 'AUTOMATE',
      title: 'Online booking with confirmations and reminders',
      observation: 'The owner wants to take bookings; no booking link or booking tool was detected on the inspected pages.',
      evidence: ['Owner-supplied: needs bookings', 'Observed: no booking links or known booking providers found'],
      whyItMatters: 'Self-service booking with automatic confirmations and reminders can reduce phone tag and no-shows.',
      nextStep: 'Confirm services, durations and staff calendars, then choose a booking tool that integrates with the calendar and CRM.',
      uncertainty: 'Bookings may currently be handled by phone or another platform deliberately.',
      confidence: 'medium',
      informationNeeded: ['How bookings are taken today', 'Services, durations and staff calendars', 'No-show rate'],
    });
  }
  if (d.needs?.includes('whatsapp') && !journey?.whatsapp.length) {
    ownerOpp({
      id: 'discovery.whatsapp',
      service: 'CONVERT',
      title: 'WhatsApp click-to-chat entry point',
      observation: 'The owner wants WhatsApp conversations; no WhatsApp link was detected on the inspected pages.',
      evidence: ['Owner-supplied: wants WhatsApp chat', 'Observed: no wa.me / WhatsApp links found'],
      whyItMatters: 'A visible click-to-chat button lets mobile visitors start a conversation in the app they already use.',
      nextStep: 'Add a WhatsApp Business click-to-chat link in the header/footer and on service pages, and agree who responds.',
      uncertainty: 'Response capacity and message volume are unknown.',
      confidence: 'medium',
      informationNeeded: ['Who will answer chats and when', 'Whether WhatsApp Business is set up'],
    });
  }
  if (d.followUp === 'none' || d.followUp === 'inbox-or-spreadsheet') {
    ownerOpp({
      id: 'discovery.crm',
      service: 'AUTOMATE',
      title: 'CRM and structured enquiry follow-up',
      observation: `The owner reports follow-up via "${L.followUp[d.followUp]}".`,
      evidence: [`Owner-supplied: enquiry follow-up is "${L.followUp[d.followUp]}"`],
      whyItMatters: 'Logging every enquiry with an owner and next action, and sending automatic acknowledgements, reduces missed follow-ups.',
      nextStep: 'Map how an enquiry flows today (channel → person → response) and agree a lightweight CRM pipeline.',
      uncertainty: 'Enquiry volumes and response times are not known yet.',
      confidence: 'medium',
      informationNeeded: ['Monthly enquiries by channel', 'Average response time', 'Who handles enquiries'],
    });
  }
  if ((d.hasAnalytics === 'no' || d.hasAnalytics === 'unsure') && !base.some((o) => o.id === 'grow.measurement')) {
    const detected = technology?.detections.filter((t) => t.category === 'Analytics').map((t) => t.name) ?? [];
    ownerOpp({
      id: 'discovery.measurement',
      service: 'GROW',
      title: 'Measurement set-up (analytics and Search Console)',
      observation: `The owner answered "${L.hasAnalytics[d.hasAnalytics]}" to having website analytics.${detected.length ? ` Note: ${detected.join(', ')} was detected on the site, so data may exist under another account.` : ''}`,
      evidence: [`Owner-supplied: analytics "${L.hasAnalytics[d.hasAnalytics]}"`, ...(detected.length ? [`Observed: ${detected.join(', ')} tag detected`] : [])],
      whyItMatters: 'Without measurement it is not possible to see which channels and pages produce enquiries or whether changes work.',
      nextStep: detected.length ? 'Find out who owns the existing analytics account and request access.' : 'Set up privacy-compliant analytics and Google Search Console.',
      uncertainty: 'Existing accounts may belong to a previous agency or developer.',
      confidence: detected.length ? 'high' : 'medium',
      informationNeeded: ['Who set up the website and any analytics accounts'],
    });
  }
  if (d.usesAdvertising === 'yes') {
    ownerOpp({
      id: 'discovery.ads-landing',
      service: 'CONVERT',
      title: 'Landing pages and tracking for paid campaigns',
      observation: 'The owner reports running advertising.',
      evidence: ['Owner-supplied: uses advertising', ...(technology?.detections.filter((t) => t.category === 'Advertising tag').map((t) => `Observed: ${t.name} detected`) ?? [])],
      whyItMatters: 'Ads perform best when they lead to a focused page with one clear action and conversions are tracked.',
      nextStep: 'Review the ad destinations, conversion tracking and cost per enquiry with the ad account data.',
      uncertainty: 'Ad spend, targeting and results are only visible in the ad accounts.',
      confidence: 'medium',
      informationNeeded: ['Ad platforms and monthly spend', 'Read access to ad accounts', 'Which pages ads link to'],
    });
  }
  if ((d.mainChallenge === 'not-enough-traffic' || d.mainChallenge === 'low-search-visibility' || d.mainObjective === 'search-visibility') && !base.some((o) => o.service === 'GROW')) {
    ownerOpp({
      id: 'discovery.search-review',
      service: 'GROW',
      title: 'Search visibility review with Search Console data',
      observation: 'The owner reports that being found online is a priority, while this audit found few technical SEO issues on the inspected pages.',
      evidence: ['Owner-supplied: search visibility is a priority', 'Observed: no GROW opportunities from the technical checks'],
      whyItMatters: 'When technical foundations look fine, visibility usually depends on content, competition and authority, which need search data to assess.',
      nextStep: 'Request Search Console access and review queries, impressions and pages before proposing content or SEO work.',
      uncertainty: 'Rankings and impressions cannot be seen from a URL.',
      confidence: 'low',
      informationNeeded: ['Google Search Console access', 'Main competitors and target locations'],
    });
  }

  // Relevance of observed opportunities.
  const opportunities = base.map((o): Opportunity => {
    const why = boosts.get(o.service);
    let relevance: Relevance = why ? 'high' : 'normal';
    let relevanceNote = why ? `Raised by the owner’s ${why.join(' and ')}.` : undefined;
    if (o.id === 'convert.product-discovery' && needsKnown && !isShopBusiness) {
      relevance = 'low';
      relevanceNote = 'Lowered: the owner did not list online sales as a need.';
    }
    if (o.id === 'automate.booking' && needsKnown && !d.needs?.includes('bookings')) {
      relevance = 'low';
      relevanceNote = 'Lowered: the owner did not list bookings as a need.';
    }
    if (o.id === 'grow.measurement' && d.hasAnalytics === 'yes') {
      relevance = 'low';
      relevanceNote = 'Lowered: the owner reports having analytics (it may be loaded in a way this tool cannot detect).';
    }
    return { ...o, relevance, ...(relevanceNote ? { relevanceNote } : {}) };
  });
  if (extra.length) notes.push(`${plural(extra.length, 'opportunity', 'opportunities')} added from the owner’s answers (marked "owner-supplied").`);
  const lowered = opportunities.filter((o) => o.relevance === 'low').length;
  if (lowered) notes.push(`${plural(lowered, 'opportunity', 'opportunities')} lowered because the answers suggest they are less relevant.`);
  return { opportunities: [...extra, ...opportunities], notes };
}

// --- Action plan -----------------------------------------------------------------------------


function priorityBand(n: number): ActionItem['priority'] {
  return n >= 60 ? 'high' : n >= 35 ? 'medium' : 'low';
}
const RAISE: Record<ActionItem['priority'], ActionItem['priority']> = { low: 'medium', medium: 'high', high: 'high' };

function horizonFor(f: Finding): ActionItem['horizon'] {
  if (f.status === 'hypothesis') return 'strategic';
  if (f.severity === 'critical') return 'immediate';
  if (f.effort === 'high') return 'strategic';
  if (f.effort === 'low' && (f.severity === 'high' || f.severity === 'medium') && f.affected.length <= 5) return 'immediate';
  return 'short-term';
}

/** Lighthouse performance/accessibility audits are grouped so the plan is not one line per audit. */
const GROUPABLE = (f: Finding) => f.source === 'lighthouse' && (f.category === 'performance' || f.category === 'accessibility') && !f.id.startsWith('lh.metric.');

export function buildActionPlan(findings: Finding[], opportunities: Opportunity[]): ActionItem[] {
  const boosted = new Set(opportunities.filter((o) => o.relevance === 'high').map((o) => o.service));
  const actionable = findings.filter((f) => f.severity !== 'info' && f.status !== 'manual-review');
  const items: (ActionItem & { score: number })[] = [];

  const fromFinding = (f: Finding): ActionItem & { score: number } => {
    const base = priorityBand(f.priority);
    return {
      id: `act.${f.id}`,
      horizon: horizonFor(f),
      problem: f.title,
      evidence: [f.observed, ...f.evidence.slice(0, 3)].filter((x): x is string => Boolean(x)),
      action: f.status === 'hypothesis' ? `Confirm first: ${f.verification} If confirmed: ${f.recommendation}` : f.recommendation,
      priority: boosted.has(f.service) ? RAISE[base] : base,
      confidence: f.confidence,
      complexity: f.effort,
      complexityRationale: f.effortRationale,
      dependencies: [CATEGORY_DEPENDENCIES[f.category], ...(f.status === 'hypothesis' ? ['Manual confirmation that the issue is real'] : [])],
      validation: f.verification,
      service: f.service,
      findingIds: [f.id],
      score: f.priority,
    };
  };

  for (const f of actionable.filter((x) => !GROUPABLE(x))) items.push(fromFinding(f));

  for (const cat of ['performance', 'accessibility'] as const) {
    const group = actionable.filter((f) => GROUPABLE(f) && f.category === cat);
    for (const horizon of ['immediate', 'short-term', 'strategic'] as const) {
      const list = group.filter((f) => horizonFor(f) === horizon);
      if (list.length === 0) continue;
      if (list.length === 1) {
        items.push(fromFinding(list[0]!));
        continue;
      }
      const top = list.reduce((a, b) => (b.priority > a.priority ? b : a));
      const effort = list.some((f) => f.effort === 'high') ? 'high' : list.some((f) => f.effort === 'medium') ? 'medium' : 'low';
      const base = priorityBand(top.priority);
      items.push({
        id: `act.lh-${cat}-${horizon}`,
        horizon,
        problem: cat === 'performance' ? `${list.length} Lighthouse performance opportunities` : `${list.length} automated accessibility failures (Lighthouse)`,
        evidence: list.slice(0, 5).map((f) => `${f.title}${f.observed ? ` - ${f.observed}` : ''}`),
        action:
          cat === 'performance'
            ? 'Work through the listed performance opportunities in order of estimated savings (images, render-blocking resources, unused code), then re-test several times.'
            : 'Fix the elements listed in each accessibility finding (contrast, ARIA roles, names and labels), then test key pages with a keyboard and screen reader.',
        priority: boosted.has('BUILD') ? RAISE[base] : base,
        confidence: top.confidence,
        complexity: effort,
        complexityRationale: cat === 'performance' ? 'Several asset and template changes, each needing re-testing.' : 'Mostly template/markup changes across shared components.',
        dependencies: [CATEGORY_DEPENDENCIES[cat]],
        validation: 'Re-run this audit for the same device and confirm each Lighthouse audit passes.',
        service: 'BUILD',
        findingIds: list.map((f) => f.id),
        score: top.priority,
      });
    }
  }

  // Strategic items from opportunities that need investigation or are larger projects.
  for (const o of opportunities) {
    if (o.relevance === 'low') continue;
    if (o.basis === 'confirmed' && o.service !== 'AUTOMATE' && !/rebuild|rendering/i.test(o.title)) continue;
    const base: ActionItem['priority'] = o.relevance === 'high' ? 'high' : o.confidence === 'low' ? 'low' : 'medium';
    items.push({
      id: `act.opp.${o.id}`,
      horizon: 'strategic',
      problem: o.title,
      evidence: [o.observation, ...o.evidence.slice(0, 3)],
      action: o.nextStep,
      priority: base,
      confidence: o.confidence,
      complexity: /rebuild|shop|rendering|e-commerce/i.test(o.title) ? 'high' : 'medium',
      complexityRationale: o.service === 'AUTOMATE' ? 'Needs process mapping with the business before any integration work.' : 'A project with several steps that should be scoped with the business first.',
      dependencies: o.informationNeeded.length ? o.informationNeeded : ['Discovery conversation with the business owner'],
      validation: 'Agree a measurable baseline with the business first (e.g. monthly enquiries, bookings or sales from analytics/CRM), then compare after the change.',
      service: o.service,
      findingIds: o.relatedFindingIds,
      opportunityId: o.id,
      score: base === 'high' ? 70 : base === 'medium' ? 45 : 25,
    });
  }

  const RANK = { high: 3, medium: 2, low: 1 } as const;
  const LIMIT: Record<ActionItem['horizon'], number> = { immediate: 12, 'short-term': 12, strategic: 10 };
  const out: ActionItem[] = [];
  for (const horizon of ['immediate', 'short-term', 'strategic'] as const) {
    out.push(
      ...items
        .filter((i) => i.horizon === horizon)
        .sort((a, b) => RANK[b.priority] - RANK[a.priority] || b.score - a.score)
        .slice(0, LIMIT[horizon])
        .map(({ score: _score, ...rest }) => rest),
    );
  }
  return out;
}

// --- Executive summary -----------------------------------------------------------------------

const SCORE_SHORT: Partial<Record<ScoreKey, string>> = {
  performance: 'speed',
  technicalSeo: 'technical SEO',
  accessibility: 'accessibility',
  bestPractices: 'web best practices',
  mobileUx: 'mobile experience',
  conversionReadiness: 'conversion readiness',
};

function band(v: number | null): ExecutiveSummary['band'] {
  if (v === null) return 'none';
  return v >= 90 ? 'good' : v >= 50 ? 'average' : 'poor';
}

const HEADLINES: Record<ExecutiveSummary['band'], string> = {
  good: 'In good technical shape',
  average: 'Solid base, with room to improve',
  poor: 'Needs attention',
  none: 'Not enough data for an overall verdict',
};

/** "Metadata and…" -> "metadata and…", but keeps acronyms such as "UI/UX" intact. */
function lowerFirst(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/** A finding's plain summary when a specific one exists, otherwise its (quoted) title. */
function shortLabel(f: Finding): string {
  return guideFor(f.id) ? f.plainSummary.replace(/\.$/, '') : `“${f.title.replace(/\.$/, '')}”`;
}

function rankOpportunity(o: Opportunity): number {
  const rel = { high: 300, normal: 200, low: 0 }[o.relevance];
  const conf = { high: 30, medium: 20, low: 10 }[o.confidence as Confidence];
  const basis = { confirmed: 3, inferred: 2, discovery: 1 }[o.basis];
  return rel + conf + basis;
}

export function buildSummary(r: ReportCore, opportunities: Opportunity[], discovery: DiscoveryAnswers | null): ExecutiveSummary {
  const overall = r.scores.find((s) => s.key === 'overallHealth')?.value ?? null;
  const b = band(overall);
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
  for (const f of r.findings) severityCounts[f.severity]++;
  const host = (() => {
    try {
      return new URL(r.finalUrl ?? r.inputUrl).hostname;
    } catch {
      return r.inputUrl;
    }
  })();
  const date = new Date(r.completedAt).toUTCString().replace(/:\d\d GMT$/, ' UTC');

  const paragraphs: string[] = [];
  paragraphs.push(
    `This audit inspected ${plural(r.pagesInspected, 'page')} of ${host} on ${date}, using a ${r.strategy} Lighthouse test${r.lighthouse ? '' : ' (Lighthouse data was not available)'}. The results describe those pages only, not the whole website.`,
  );

  const scored = r.scores.filter((s) => s.key !== 'overallHealth' && s.value !== null && SCORE_SHORT[s.key]);
  if (overall !== null) {
    const sorted = [...scored].sort((a, b2) => b2.value! - a.value!);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    paragraphs.push(
      `Overall technical health is ${overall}/100 (${b === 'good' ? 'good' : b === 'average' ? 'needs improvement' : 'poor'}).${best && worst && best !== worst ? ` The strongest area is ${SCORE_SHORT[best.key]} (${best.value}); the weakest is ${SCORE_SHORT[worst.key]} (${worst.value}).` : ''} Performance and accessibility checks combine Google Lighthouse lab data (when enabled) with direct server/HTML inspections; Technical SEO, Mobile UX and Conversion Readiness are always measured directly from your live pages.`,
    );
  } else {
    paragraphs.push(`Not enough checks could be completed to calculate an overall score${scored.length ? `; the available scores are shown individually (${scored.map((s) => `${SCORE_SHORT[s.key]} ${s.value}`).join(', ')})` : ''}.`);
  }

  const actionable = r.findings.filter((f) => f.severity !== 'info');
  const top = r.topFindingIds.map((id) => r.findings.find((f) => f.id === id)).filter((f): f is Finding => Boolean(f));
  if (actionable.length) {
    const parts = (['critical', 'high', 'medium', 'low'] as const).filter((s) => severityCounts[s]).map((s) => `${severityCounts[s]} ${s}`);
    paragraphs.push(
      `${plural(actionable.length, 'issue')} need${actionable.length === 1 ? 's' : ''} attention (${parts.join(', ')}).${top.length ? ` The most important: ${[...new Set(top.slice(0, 3).map(shortLabel))].join('; ')}.` : ''}`,
    );
  } else {
    paragraphs.push('No issues needing action were found in the checks that ran.');
  }

  const bestPerService = SERVICE_ORDER.map((svc) => opportunities.filter((o) => o.service === svc && o.relevance !== 'low').sort((a, c) => rankOpportunity(c) - rankOpportunity(a))[0]).filter(
    (o): o is Opportunity => Boolean(o),
  );
  if (bestPerService.length) {
    paragraphs.push(
      `Possible opportunities: ${bestPerService.map((o) => `${o.service} - ${lowerFirst(o.title)}${o.basis === 'discovery' ? ' (needs discussion)' : ''}`).join('; ')}.`,
    );
  }

  const keyCaveats: string[] = [];
  if (!r.lighthouse) keyCaveats.push('Google Lighthouse (lab Core Web Vitals) did not run, so Performance, Accessibility and Best Practices were scored using this tool’s HTTP header and HTML inspections.');
  if (r.pagesInspected <= 3) keyCaveats.push(`Only ${plural(r.pagesInspected, 'page was', 'pages were')} inspected, so site-wide conclusions are limited.`);
  if (r.findings.some((f) => f.id === 'crawl.client-rendered')) keyCaveats.push('The site builds much of its content with JavaScript, so HTML-based checks may under-report.');
  if (r.findings.some((f) => f.id === 'crawl.start-refused' || f.id === 'crawl.start-unreachable')) keyCaveats.push('The site refused or blocked this tool’s direct requests, so HTML-based checks did not run.');
  const incomplete = r.incompleteChecks.length;
  if (incomplete) keyCaveats.push(`${plural(incomplete, 'check')} could not be completed and are listed under “Missing data”.`);
  keyCaveats.push('Traffic, rankings, conversion rates, enquiries and revenue cannot be measured from a URL.');

  if (hasAnswers(discovery)) paragraphs.push('The business owner’s questionnaire answers were used to prioritise recommendations; they are labelled “owner-supplied” and were not verified by this audit.');

  return {
    headline: HEADLINES[b],
    paragraphs,
    band: b,
    severityCounts,
    topFindingIds: top.map((f) => f.id),
    topOpportunityIds: bestPerService.map((o) => o.id),
    keyCaveats,
    scoreNotes: [
      'When Google Lighthouse runs, lab scores reflect a single simulated load; otherwise scores are derived deterministically from HTTP response timing, security headers and HTML DOM checks.',
      'Technical SEO, Mobile & User Experience and Conversion Readiness are this tool’s own weighted checks. Skipped checks are excluded, never counted as passed.',
      'Overall Technical Website Health is a weighted average of the technical scores and needs at least three of them.',
      'None of the scores are Google rankings, traffic, conversion rates or business results.',
    ],
  };
}

// --- What cannot be determined from a URL ------------------------------------------------------

export function buildUnknowns(r: ReportCore): Unknown[] {
  const tech = r.technology?.detections ?? [];
  const names = (pred: (d: (typeof tech)[number]) => boolean) => tech.filter(pred).map((d) => d.name);
  const analytics = names((d) => d.category === 'Analytics' || /tag manager/i.test(d.name));
  const ads = names((d) => d.category === 'Advertising tag');
  const crm = names((d) => /hubspot|intercom|zendesk|klaviyo|mailchimp/i.test(d.name));
  const hint = (list: string[], text: string) => (list.length ? { hint: `${list.join(', ')} detected - ${text}` } : {});
  return [
    { topic: 'Website traffic and visitor behaviour', why: 'Visits, sources, devices and engagement are recorded only in the site’s analytics.', howToObtain: 'Request read-only access to Google Analytics (or the analytics tool used).', ...hint(analytics, 'data probably exists; ask who owns the account.') },
    { topic: 'Search impressions, clicks and queries', why: 'Only Google Search Console shows how often pages appear and are clicked in Google.', howToObtain: 'Ask to be added as a user in Google Search Console.' },
    { topic: 'Keyword ranking history', why: 'Rankings change by location, device and time and are not visible from a single page load.', howToObtain: 'Use Search Console history or the business’s rank-tracking tool, if any.' },
    { topic: 'Actual conversion rate', why: 'Requires counting visits and completed enquiries, bookings or purchases.', howToObtain: 'Analytics with conversion tracking, or enquiry counts compared with visits.' },
    { topic: 'Advertising spend and return', why: 'Spend, targeting and results live inside the ad accounts.', howToObtain: 'Request read access to Google Ads, Meta Ads or other ad accounts.', ...hint(ads, 'advertising tags are present, so campaigns may be running.') },
    { topic: 'Number and quality of leads', why: 'Enquiry volume and qualification happen in inboxes, phones and CRMs.', howToObtain: 'Ask for monthly enquiry counts by channel and how many become customers.' },
    { topic: 'Sales revenue and profit', why: 'Financial results are private business data.', howToObtain: 'Discuss with the business owner if relevant to the engagement.' },
    { topic: 'CRM and internal tools', why: 'Back-office systems are not visible from public pages.', howToObtain: 'Ask which CRM, booking or email tools are used and how they connect.', ...hint(crm, 'some customer-communication tools are visible; ask how they are used.') },
    { topic: 'Response times and follow-up quality', why: 'How quickly and well enquiries are answered happens after the website.', howToObtain: 'Ask about current response times, or agree a mystery-shopper test with the owner’s permission.' },
    { topic: 'Customer satisfaction', why: 'Satisfaction is measured through reviews, surveys and repeat business, not website code.', howToObtain: 'Review public review profiles and any survey data the business shares.' },
    { topic: 'Whether a redesign would increase revenue', why: 'Outcomes depend on market, offer, traffic and follow-up as well as the website.', howToObtain: 'Agree baseline metrics first and test changes incrementally where possible.' },
  ];
}

// --- Assembly ---------------------------------------------------------------------------------

/** Builds all insight fields for a report. Safe to call again with new discovery answers. */
export function buildInsights(
  core: ReportCore,
  discovery: DiscoveryAnswers | null,
): Pick<AuditReport, 'opportunities' | 'summary' | 'actionPlan' | 'unknowns' | 'discovery' | 'discoveryNotes'> & Required<Pick<AuditReport, 'readiness' | 'fixGuides'>> {
  const base = buildOpportunities({ findings: core.findings, scores: core.scores, journey: core.journey, technology: core.technology, strategy: core.strategy });
  const answers = hasAnswers(discovery) ? discovery : null;
  const { opportunities, notes } = applyDiscovery(base, answers, { report: core });
  return {
    opportunities,
    summary: buildSummary(core, opportunities, answers),
    actionPlan: buildActionPlan(core.findings, opportunities),
    unknowns: buildUnknowns(core),
    discovery: answers,
    discoveryNotes: notes,
    readiness: buildReadiness(core, answers),
    fixGuides: buildFixGuides(core.findings, core.pagesInspected),
  };
}

/** Re-applies (or clears) discovery answers on a finished report without re-auditing. */
export function withDiscovery(report: AuditReport, discovery: DiscoveryAnswers | null): AuditReport {
  const { summary: _s, actionPlan: _a, unknowns: _u, discovery: _d, discoveryNotes: _n, opportunities: _o, readiness: _r, fixGuides: _g, ...core } = report;
  return { ...report, ...buildInsights({ ...core, opportunities: [] }, discovery) };
}

export { describeDiscovery, DISCOVERY_LABELS, hasAnswers, supportFrom };
