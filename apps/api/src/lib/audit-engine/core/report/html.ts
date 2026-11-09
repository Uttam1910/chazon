import type { ActionItem, AuditReport, CheckOutcome, CheckResult, Finding, FindingCategory, FixGuide, Implementer, Opportunity, ReadinessOutcome, ReadinessProfile, ScoreResult, ServiceCategory, Severity } from '@chazon/shared';
import { describeDiscovery } from '../findings/insights';
import { isHttpUrl } from '../util/text';

/**
 * Renders a standalone, print-ready HTML report. Every value that originates
 * from the audited website or the user is escaped; links are emitted only for
 * http(s) URLs. The response is served with a restrictive CSP (no scripts), and
 * the document contains no navigation or controls - it is the full report.
 */

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;

function link(url: string): string {
  return isHttpUrl(url) ? `<a href="${e(url)}" rel="noopener noreferrer nofollow">${e(url)}</a>` : e(url);
}

const SEV_LABEL: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Informational' };
const STATUS_LABEL: Record<Finding['status'], string> = { confirmed: 'Confirmed', likely: 'Likely', hypothesis: 'Hypothesis - needs confirming', 'manual-review': 'Needs manual review' };
const OUTCOME_LABEL: Record<CheckOutcome, string> = { pass: 'Pass', issue: 'Confirmed issue', warning: 'Warning', 'not-applicable': 'Not applicable', 'not-checked': 'Not checked', inconclusive: 'Inconclusive' };
const BASIS_LABEL: Record<Opportunity['basis'], string> = { confirmed: 'Confirmed by evidence', inferred: 'Inferred from evidence', discovery: 'Requires discovery' };
const CATEGORY_LABEL: Record<FindingCategory, string> = {
  performance: 'Performance',
  'best-practices': 'Best practices',
  seo: 'Technical SEO',
  accessibility: 'Accessibility',
  mobile: 'Mobile experience',
  journey: 'Structure & user journey',
  crawl: 'Crawl',
  technology: 'Technology',
  security: 'Security & HTTPS',
};
const SERVICE_BLURB: Record<ServiceCategory, string> = {
  BUILD: 'Website development, redesign, landing pages, e-commerce, UI/UX, accessibility and technical improvements.',
  GROW: 'Technical SEO, content structure, search visibility, organic growth and digital marketing.',
  CONVERT: 'Conversion optimisation, calls to action, enquiry forms, customer journeys and product discovery.',
  AUTOMATE: 'WhatsApp workflows, enquiry follow-up, booking processes, CRM integration and customer communication.',
};

/** Report sections and the finding categories they contain (shared with the dashboard tabs). */
export const FINDING_SECTIONS: { id: string; title: string; categories: FindingCategory[] }[] = [
  { id: 'technical', title: 'Technical issues', categories: ['performance', 'best-practices', 'security', 'crawl', 'technology'] },
  { id: 'seo', title: 'SEO and discoverability', categories: ['seo'] },
  { id: 'accessibility', title: 'Accessibility and mobile', categories: ['accessibility', 'mobile'] },
  { id: 'conversion', title: 'Conversion and user journey', categories: ['journey'] },
];

const list = (items: string[], cls = '') => (items.length ? `<ul${cls ? ` class="${cls}"` : ''}>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : '');

type Band = 'good' | 'average' | 'poor' | 'none';
const band = (v: number | null): Band => (v === null ? 'none' : v >= 90 ? 'good' : v >= 50 ? 'average' : 'poor');
const BAND_COLOR: Record<Band, string> = { good: '#16a34a', average: '#eab308', poor: '#be123c', none: '#cbd5e1' };
const BAND_LABEL: Record<Band, string> = { good: '✓ Good', average: '! Needs improvement', poor: '✕ Poor', none: '– Not enough data' };

function scoreCell(s: ScoreResult): string {
  const kind = s.kind === 'lighthouse' ? 'Official Lighthouse score' : s.kind === 'composite' ? 'Composite (internal)' : 'Custom (internal)';
  const b = band(s.value);
  const bar = `<div class="bar" aria-hidden="true"><span style="width:${s.value ?? 0}%;background:${BAND_COLOR[b]}"></span></div><span class="chip chip-${b}">${BAND_LABEL[b]}</span> `;
  const counts = s.counts ? `<div class="muted">${s.counts.completed} checks completed: ${s.counts.passed} passed, ${s.counts.warnings} partial, ${s.counts.failed} failed, ${s.counts.skipped} skipped</div>` : '';
  return `<div class="score"><div class="score-label">${e(s.label)}</div><div class="score-value">${s.value === null ? 'Not enough data' : `${s.value}<span>/100</span>`}</div>${bar}<div class="badge">${kind}</div>${counts}<p class="muted">${e(s.note)}</p></div>`;
}

function checksTable(checks: CheckResult[]): string {
  if (!checks.length) return '';
  return `<table><thead><tr><th>Check</th><th>Weight</th><th>Outcome</th><th>Detail</th></tr></thead><tbody>${checks
    .map((c) => `<tr><td>${e(c.label)}</td><td>${c.weight}</td><td class="out-${c.outcome}">${OUTCOME_LABEL[c.outcome]}${c.status === 'warn' ? ` (${Math.round(c.credit * 100)}%)` : ''}</td><td>${e(c.detail)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function findingBlock(f: Finding): string {
  const row = (label: string, value: string | undefined) => (value ? `<tr><th>${label}</th><td>${value}</td></tr>` : '');
  return `<article class="finding sev-${f.severity}">
  <h4><span class="sev">${SEV_LABEL[f.severity]}</span> ${e(f.title)}</h4>
  <p class="meta">${e(CATEGORY_LABEL[f.category])} · ${e(STATUS_LABEL[f.status])} · Confidence: ${e(f.confidence)} · Source: ${f.source === 'lighthouse' ? 'Google Lighthouse' : 'Custom check'} · Chazon service: <strong>${e(f.service)}</strong> · Priority ${f.priority}/100</p>
  <p class="plain">${e(f.plainSummary)}</p>
  <table class="kv">
    ${row('Observed', f.observed ? e(f.observed) : undefined)}
    ${row('Expected', f.expected ? e(f.expected) : undefined)}
    ${row('Why it may matter', e(f.explanation))}
    ${row('Recommended fix', e(f.recommendation))}
    ${row('Estimated savings', f.estimatedSavings ? `${e(f.estimatedSavings)} <span class="muted">(reported by Lighthouse)</span>` : undefined)}
    ${row('Complexity', `${e(f.effort)} - ${e(f.effortRationale)}`)}
    ${row('How to verify', e(f.verification))}
  </table>
  ${f.evidence.length ? `<div><strong>Evidence</strong>${list(f.evidence.map(e))}</div>` : ''}
  ${f.affected.length ? `<div><strong>Affected${f.affectedTotal ? ` (showing ${f.affected.length} of ${f.affectedTotal})` : ''}</strong>${list(f.affected.map(link), 'urls')}</div>` : ''}
  ${f.learnMoreUrl ? `<p class="muted">Learn more: ${link(f.learnMoreUrl)}</p>` : ''}
</article>`;
}

export interface HtmlOptions {
  /** Operator-configured Chazon contact link (already validated as https: or mailto:). */
  contactUrl?: string | null;
  /** The person exporting chose to leave questionnaire answers out of this copy. */
  discoveryOmitted?: boolean;
}

const READINESS_LABEL: Record<ReadinessOutcome, string> = { found: 'Found', partial: 'Partly found', 'not-detected': 'Not detected - check manually', 'manual-review': 'Needs manual review', 'not-checked': 'Not checked' };
const PROFILE_LABEL: Record<ReadinessProfile, string> = { 'local-service': 'Local service business', ecommerce: 'E-commerce', 'service-b2b': 'Service / B2B' };
const IMPLEMENTER_LABEL: Record<Implementer, string> = { 'business-owner': 'Business owner', 'content-editor': 'Content editor', developer: 'Developer' };
const CHECKLIST_STATES = 'Detected → Planned → Fixed - awaiting verification → Verified (or Unable to verify)';

function contactHref(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https:\/\//i.test(url) || /^mailto:/i.test(url) ? url : null;
}

/** The three highest-priority findings with everything needed to act on them. */
function actionCenter(r: AuditReport): string {
  const ids = r.summary.topFindingIds.length ? r.summary.topFindingIds : r.topFindingIds;
  const top = ids.map((id) => r.findings.find((f) => f.id === id)).filter((f): f is Finding => Boolean(f)).slice(0, 3);
  if (!top.length) return '<p class="muted">No issues needing action were found in the checks that ran.</p>';
  return `${top
    .map(
      (f, i) => `<article class="finding sev-${f.severity}">
  <h4>${i + 1}. <span class="sev">${SEV_LABEL[f.severity]}</span> ${e(f.title)} <span class="muted">[${e(f.service)}]</span></h4>
  <table class="kv">
    <tr><th>In plain English</th><td>${e(f.plainSummary)}</td></tr>
    <tr><th>Evidence</th><td>${[f.observed, ...f.evidence.slice(0, 3)].filter(Boolean).map(e).join('<br>')}</td></tr>
    <tr><th>Why it may matter</th><td>${e(f.explanation)}</td></tr>
    <tr><th>Recommended fix</th><td>${e(f.recommendation)}</td></tr>
    <tr><th>Severity / confidence</th><td>${SEV_LABEL[f.severity]} · ${e(f.confidence)} confidence · ${e(STATUS_LABEL[f.status])}</td></tr>
    <tr><th>Affected</th><td>${f.affected.slice(0, 5).map(link).join('<br>') || '<span class="muted">Site-wide</span>'}</td></tr>
    <tr><th>Complexity</th><td>${e(f.effort)} - ${e(f.effortRationale)}</td></tr>
    <tr><th>How to verify</th><td>${e(f.verification)}</td></tr>
    <tr><th>Status in this copy</th><td>Detected (as found by this audit)</td></tr>
  </table>
</article>`,
    )
    .join('')}<p class="muted">Track each item through: ${CHECKLIST_STATES}. Marking an item as fixed does not verify it; verification needs a re-scan where the finding no longer appears, or a documented manual check.</p>`;
}

function readinessSection(r: AuditReport): string {
  const rd = r.readiness;
  if (rd === undefined) return '';
  if (rd === null) return '<h2>India business readiness</h2><p class="notice">Not checked: this needs the “Structure &amp; user journey” category.</p>';
  const order: ReadinessProfile[] = [rd.profile, ...(['local-service', 'ecommerce', 'service-b2b'] as const).filter((p) => p !== rd.profile)];
  return `<h2>India business readiness</h2>
<p class="muted">${e(rd.profileNote)} ${e(rd.caveat)}</p>
${order
  .map((p) => {
    const items = rd.items.filter((i) => i.profile === p);
    return `<h3>${PROFILE_LABEL[p]}${p === rd.profile ? ' (shown first)' : ''}</h3><table><thead><tr><th>Question</th><th>Result</th><th>What was observed</th><th>Suggestion</th></tr></thead><tbody>${items
      .map((i) => `<tr><td>${e(i.question)}</td><td class="rd-${i.outcome}">${READINESS_LABEL[i.outcome]}</td><td>${e(i.detail)}${i.evidence.length ? `<div class="muted">${i.evidence.slice(0, 4).map(e).join('<br>')}</div>` : ''}</td><td>${e(i.suggestion)} <span class="muted">[${e(i.service)}]</span></td></tr>`)
      .join('')}</tbody></table>`;
  })
  .join('')}`;
}

function fixGuideBlock(g: FixGuide): string {
  return `<article class="action">
  <h4><span class="sev">${SEV_LABEL[g.severity]}</span> ${e(g.issue)} <span class="muted">[${e(g.service)} · ${IMPLEMENTER_LABEL[g.implementer]}]</span></h4>
  <table class="kv">
    <tr><th>Evidence</th><td>${g.evidence.map(e).join('<br>') || '<span class="muted">See the finding.</span>'}</td></tr>
    ${g.affected.length ? `<tr><th>Affected</th><td>${g.affected.map(link).join('<br>')}</td></tr>` : ''}
    ${g.current ? `<tr><th>Current behaviour</th><td>${e(g.current)}</td></tr>` : ''}
    <tr><th>Recommended fix</th><td>${e(g.fix)}</td></tr>
    <tr><th>Steps</th><td><ol>${g.steps.map((x) => `<li>${e(x)}</li>`).join('')}</ol></td></tr>
    ${g.example ? `<tr><th>Example</th><td><div class="muted">${e(g.example.label)}</div><pre>${e(g.example.code)}</pre></td></tr>` : ''}
    <tr><th>Who can do it</th><td>${IMPLEMENTER_LABEL[g.implementer]} - ${e(g.implementerNote)}</td></tr>
    <tr><th>Dependencies</th><td>${g.dependencies.map(e).join('<br>')}</td></tr>
    ${g.cautions.length ? `<tr><th>Cautions</th><td>${g.cautions.map(e).join('<br>')}</td></tr>` : ''}
    <tr><th>How to retest</th><td>${e(g.retest)}</td></tr>
    <tr><th>Not verified</th><td>${g.notVerified.map(e).join('<br>')}</td></tr>
  </table>
</article>`;
}

function helpSection(opts: HtmlOptions): string {
  const href = contactHref(opts.contactUrl);
  return `<h2>Need help implementing these improvements?</h2>
<p>This report is free to use. Share it with your own developer or team - every recommendation includes the evidence, the fix and how to verify it.</p>
${href ? `<p>If you would like Chazon Digital Ventures to help, you can get in touch: <a href="${e(href)}" rel="noopener noreferrer">${e(href.replace(/^mailto:/i, ''))}</a>. There is no obligation.</p>` : ''}`;
}

const STYLE_EXTRA = `
  .rd-found { color: #166534; font-weight: 600; } .rd-partial { color: #92400e; font-weight: 600; } .rd-not-detected, .rd-manual-review, .rd-not-checked { color: var(--muted); font-weight: 600; }
  pre { background: #f6f3ef; border: 1px solid var(--line); border-radius: 6px; padding: 8px; white-space: pre-wrap; word-break: break-word; font-size: 11px; }
  ol { margin: 4px 0; padding-left: 18px; }`;

function actionRow(a: ActionItem): string {
  return `<article class="action">
  <h4><span class="prio prio-${a.priority}">${e(a.priority)} priority</span> ${e(a.problem)} <span class="muted">[${e(a.service)} · ${e(a.confidence)} confidence]</span></h4>
  <table class="kv">
    <tr><th>Proposed action</th><td>${e(a.action)}</td></tr>
    <tr><th>Evidence</th><td>${a.evidence.map(e).join('<br>') || '<span class="muted">See related findings.</span>'}</td></tr>
    <tr><th>Complexity</th><td>${e(a.complexity)} - ${e(a.complexityRationale)}</td></tr>
    <tr><th>Dependencies</th><td>${a.dependencies.map(e).join('<br>')}</td></tr>
    <tr><th>Validation</th><td>${e(a.validation)}</td></tr>
  </table>
</article>`;
}

function opportunityBlock(o: Opportunity): string {
  return `<div class="opp">
  <h4>${e(o.title)}${o.fromDiscovery ? ' <span class="badge">owner-supplied</span>' : ''}</h4>
  <p class="meta">${e(BASIS_LABEL[o.basis])} · Confidence: ${e(o.confidence)} · Relevance: ${e(o.relevance)}${o.relevanceNote ? ` (${e(o.relevanceNote)})` : ''}</p>
  <p><strong>Observation:</strong> ${e(o.observation)}</p>
  ${o.evidence.length ? `<div><strong>Supporting evidence</strong>${list(o.evidence.map(e))}</div>` : ''}
  ${o.affected.length ? `<div><strong>Affected pages</strong>${list(o.affected.map(link), 'urls')}</div>` : ''}
  <p><strong>Why it may be relevant:</strong> ${e(o.whyItMatters)}</p>
  <p><strong>Recommended next action:</strong> ${e(o.nextStep)}</p>
  ${o.informationNeeded.length ? `<div><strong>Information needed from the business owner</strong>${list(o.informationNeeded.map(e))}</div>` : ''}
  <p class="muted"><strong>Uncertainty:</strong> ${e(o.uncertainty)}</p>
</div>`;
}

export function renderReportHtml(r: AuditReport, opts: HtmlOptions = {}): string {
  const top = r.summary.topFindingIds.map((id) => r.findings.find((f) => f.id === id)).filter((f): f is Finding => Boolean(f));
  const topOpps = r.summary.topOpportunityIds.map((id) => r.opportunities.find((o) => o.id === id)).filter((o): o is Opportunity => Boolean(o));
  const lh = r.lighthouse;
  const c = r.crawl;
  const j = r.journey;
  const answers = describeDiscovery(r.discovery);
  const scoreGroups: { key: CheckResult['score']; label: string }[] = [
    { key: 'technicalSeo', label: 'Technical SEO' },
    { key: 'mobileUx', label: 'Mobile & User Experience' },
    { key: 'conversionReadiness', label: 'Conversion Readiness' },
  ];
  const yesNo = (v: boolean) => (v ? 'Found' : 'Not found on the inspected pages');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Website audit - ${e(r.finalUrl ?? r.inputUrl)}</title>
<style>
  :root { --ink:#1f1b18; --muted:#5f5750; --line:#e8e1d9; --ivory:#faf7f3; --accent:#d44720; --accent-strong:#b83a17; --good:#16a34a; --warn:#eab308; --poor:#be123c; }
  * { box-sizing: border-box; }
  body { font: 14px/1.5 "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink); background: #fff; margin: 0; padding: 32px; max-width: 1000px; margin-inline: auto; }
  h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 19px; border-bottom: 2px solid var(--accent); padding-bottom: 4px; margin-top: 36px; break-after: avoid; }
  h3 { font-size: 15px; margin: 20px 0 8px; break-after: avoid; } h4 { font-size: 14px; margin: 0 0 4px; }
  a { color: var(--accent-strong); word-break: break-all; }
  .muted, .meta { color: var(--muted); font-size: 12px; }
  .plain { font-size: 14px; margin: 6px 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .score { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--ivory); break-inside: avoid; }
  .score-label { font-weight: 600; } .score-value { font-size: 26px; font-weight: 700; } .score-value span { font-size: 13px; color: var(--muted); }
  .badge { display: inline-block; font-size: 11px; border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; background: #fff; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; } th, td { border-bottom: 1px solid var(--line); padding: 6px 4px; text-align: left; vertical-align: top; }
  table.kv th { width: 150px; color: var(--muted); font-weight: 600; }
  .finding, .action { border: 1px solid var(--line); border-left: 4px solid var(--muted); border-radius: 6px; padding: 10px 12px; margin: 10px 0; break-inside: avoid; }
  .finding ul, .opp ul { margin: 4px 0 8px; padding-left: 18px; } .urls li { word-break: break-all; }
  .sev, .prio { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 4px; background: #eee; margin-right: 6px; }
  .sev-critical { border-left-color: #be123c; } .sev-critical .sev { background: #be123c; color: #fff; }
  .sev-high { border-left-color: #ea580c; } .sev-high .sev { background: #ffedd5; color: #7c2d12; }
  .sev-medium { border-left-color: #eab308; } .sev-medium .sev { background: #fef9c3; color: #713f12; }
  .sev-low { border-left-color: #2563eb; } .sev-low .sev { background: #dbeafe; color: #1e3a8a; }
  .sev-info .sev { background: #f1f5f9; color: #334155; }
  .prio-high { background: #be123c; color: #fff; } .prio-medium { background: #fef3c7; color: #713f12; } .prio-low { background: #e0f2fe; color: #075985; }
  .out-pass { color: #166534; } .out-issue { color: #991b1b; font-weight: 600; } .out-warning { color: #92400e; } .out-inconclusive, .out-not-checked, .out-not-applicable { color: var(--muted); }
  .opp { border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; margin: 8px 0; break-inside: avoid; }
  .notice { background: var(--ivory); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; }
  .owner { background: #eef6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 12px; }
  .counts td, .counts th { text-align: center; }
  .hero { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; background: linear-gradient(135deg, #1a1614, #2a201b 60%, #4a2a1d); color: #fff; border-radius: 16px; padding: 24px; border-bottom: 4px solid var(--accent); }
  .hero a { color: #fff; } .hero .muted { color: #f5d6ca; } .hero .notice { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); color: #fbe9e2; }
  .hero-shot { width: 180px; border-radius: 18px; border: 6px solid #0f172a; box-shadow: 0 10px 30px rgba(0,0,0,.35); background: #fff; }
  .bar { height: 8px; border-radius: 999px; background: #eceff5; overflow: hidden; margin-top: 6px; } .bar > span { display: block; height: 100%; border-radius: 999px; }
  .chip { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px; }
  .chip-good { background: #dcfce7; color: #14532d; } .chip-average { background: #fef9c3; color: #713f12; } .chip-poor { background: #ffe4e6; color: #881337; } .chip-none { background: #f1f5f9; color: #334155; }
  @media print { body { padding: 0; font-size: 12px; } a { color: inherit; text-decoration: none; } h2 { break-before: auto; } }${STYLE_EXTRA}
</style>
</head>
<body>
<header class="hero">
  ${lh?.screenshot ? `<img class="hero-shot" src="${e(lh.screenshot)}" alt="Screenshot captured by Google Lighthouse">` : ''}
  <div style="flex:1;min-width:260px">
  <h1>Website Audit &amp; Digital Growth Report</h1>
  <p><strong>Website:</strong> ${link(r.finalUrl ?? r.inputUrl)}${r.finalUrl && r.finalUrl !== r.inputUrl ? ` <span class="muted">(submitted as ${e(r.inputUrl)})</span>` : ''}<br>
  <strong>Audit completed:</strong> ${e(new Date(r.completedAt).toISOString().replace('T', ' ').slice(0, 16))} UTC (took ${Math.round(r.durationMs / 1000)} s)<br>
  <strong>Lighthouse device:</strong> ${e(r.strategy)}${lh ? ` (Lighthouse ${e(lh.lighthouseVersion)}, run ${e(lh.fetchTime)})` : ' (Lighthouse not available for this audit)'}<br>
  <strong>Pages inspected:</strong> ${r.pagesInspected}${c ? ` (crawl limit ${c.limit}; discovered ${c.discovered}, visited ${c.visited}, skipped ${c.skipped}, failed ${c.failed})` : ''}<br>
  <strong>Categories run:</strong> ${e(r.categories.join(', '))}</p>
  <p class="notice muted">Generated by ${e(r.tool.name)} v${e(r.tool.version)}. Every finding comes from requests made to the site or from Google Lighthouse. Lighthouse scores are Google's official lab scores; all other scores are internal heuristics and are not Google metrics. Missing data is reported, never estimated.</p>
  </div>
</header>

<h2>Executive summary</h2>
<h3>${e(r.summary.headline)}</h3>
${r.summary.paragraphs.map((p) => `<p>${e(p)}</p>`).join('')}
<table class="counts"><thead><tr>${(['critical', 'high', 'medium', 'low', 'info'] as const).map((s) => `<th>${SEV_LABEL[s]}</th>`).join('')}</tr></thead><tbody><tr>${(['critical', 'high', 'medium', 'low', 'info'] as const).map((s) => `<td>${r.summary.severityCounts[s]}</td>`).join('')}</tr></tbody></table>
<h3>Top priority findings</h3>
${top.length ? `<ol>${top.map((f) => `<li><strong>${e(f.title)}</strong> <span class="muted">[${SEV_LABEL[f.severity]}, ${e(f.service)}]</span><br>${e(f.plainSummary)} <em>Fix:</em> ${e(f.recommendation)}</li>`).join('')}</ol>` : '<p class="muted">No prioritised findings.</p>'}
<h3>Strongest opportunities</h3>
${topOpps.length ? `<ul>${topOpps.map((o) => `<li><strong>${e(o.service)}:</strong> ${e(o.title)} <span class="muted">(${e(BASIS_LABEL[o.basis])}, confidence ${e(o.confidence)})</span></li>`).join('')}</ul>` : '<p class="muted">No evidence-based opportunities identified.</p>'}
<h3>What affects these conclusions</h3>
${list(r.summary.keyCaveats.map(e))}
<h3>About the scores</h3>
${list(r.summary.scoreNotes.map(e))}

<h2>Website Growth Action Center</h2>
<p class="muted">The three highest-priority findings, ranked by severity, confidence and practicality. No financial or conversion estimates are made.</p>
${actionCenter(r)}

<h2>Scores and metrics</h2>
<div class="grid">${r.scores.map(scoreCell).join('')}</div>
${lh ? `<h3>Lab data (${e(lh.strategy)}, simulated, single run)</h3>
<table><thead><tr><th>Metric</th><th>Value</th><th>Rating (Lighthouse)</th></tr></thead><tbody>
${lh.metrics.map((m) => `<tr><td>${e(m.label)}</td><td>${e(m.displayValue)}</td><td>${e(m.rating ?? 'n/a')}</td></tr>`).join('')}
</tbody></table>
<h3>Field data (real users, Chrome UX Report)</h3>
${lh.field ? `<p class="muted">Scope: ${lh.field.scope === 'url' ? 'this URL' : 'whole origin (URL-level data unavailable)'} · Core Web Vitals assessment: ${lh.field.coreWebVitalsPassed === null ? 'not enough data' : lh.field.coreWebVitalsPassed ? 'passed' : 'failed'}</p>
<table><thead><tr><th>Metric</th><th>75th percentile</th><th>Category</th></tr></thead><tbody>
${lh.field.metrics.map((m) => `<tr><td>${e(m.label)}</td><td>${e(m.displayValue)}</td><td>${e(m.category)}</td></tr>`).join('')}
</tbody></table>` : `<p class="notice">${e(lh.fieldUnavailableReason ?? 'Field data unavailable.')}</p>`}` : '<p class="notice">Lighthouse data is not available for this audit; no performance metrics are shown rather than estimated.</p>'}
${scoreGroups
  .map((g) => {
    const checks = r.checks.filter((x) => x.score === g.key);
    return checks.length ? `<h3>${e(g.label)} - checks and outcomes</h3>${checksTable(checks)}` : '';
  })
  .join('')}

<h2>Free website improvement plan</h2>
<p class="muted">Immediate: clearly evidenced and relatively straightforward. Short-term: some implementation effort or several pages. Strategic: larger projects that need investigation. No savings, revenue or lead estimates are given.</p>
${(['immediate', 'short-term', 'strategic'] as const)
  .map((h) => {
    const items = r.actionPlan.filter((a) => a.horizon === h);
    const title = h === 'immediate' ? 'Immediate priorities' : h === 'short-term' ? 'Short-term improvements' : 'Strategic opportunities';
    return `<h3>${title} (${items.length})</h3>${items.length ? items.map(actionRow).join('') : '<p class="muted">None identified.</p>'}`;
  })
  .join('')}

${r.fixGuides?.length ? `<h2>Fix-it instructions</h2><p class="muted">Step-by-step guidance for the ${r.fixGuides.length} most important findings. Examples use placeholders - replace them with your real details. This tool never changes your website.</p>${r.fixGuides.map(fixGuideBlock).join('')}` : ''}

${FINDING_SECTIONS.map((s) => {
  const items = r.findings.filter((f) => s.categories.includes(f.category));
  return `<h2>${e(s.title)} (${items.length})</h2>${items.length ? items.map(findingBlock).join('') : '<p class="muted">No findings in this area for the checks that ran.</p>'}`;
}).join('\n')}

${j ? `<h2>Conversion and user journey signals</h2>
<p class="muted">Public signals on the ${j.pagesAnalysed} inspected page(s). Forms are detected but never submitted.</p>
<table class="kv">
  <tr><th>Navigation</th><td>${j.navigation.present ? `${j.navigation.linkCount} links in the start page navigation` : 'No &lt;nav&gt; element found'}</td></tr>
  <tr><th>Contact route in header</th><td>${yesNo(j.contactInHeader)}</td></tr>
  <tr><th>Primary calls to action (start page)</th><td>${j.homepagePrimaryCtas}${j.ctas.length ? ` - e.g. ${j.ctas.slice(0, 6).map((x) => `"${e(x.text)}"`).join(', ')}` : ''}</td></tr>
  <tr><th>Contact pages</th><td>${j.contactPages.map(link).join('<br>') || 'None found'}</td></tr>
  <tr><th>Email / phone / WhatsApp links</th><td>${j.emails.length} / ${j.phones.length} / ${j.whatsapp.length}${j.unlinkedPhones.length ? `<br><span class="muted">Phone shown as text only: ${j.unlinkedPhones.map(e).join(', ')}</span>` : ''}</td></tr>
  <tr><th>Forms</th><td>${[...j.forms.map((f) => `${e(f.kind)} form, ${f.fieldCount} fields${f.unlabeledFields ? `, ${f.unlabeledFields} unlabelled` : ''} - ${link(f.pageUrl)}`), ...j.embeddedForms.map((f) => `${e(f.provider)} (embedded) - ${link(f.pageUrl)}`)].join('<br>') || 'None found'}</td></tr>
  <tr><th>Booking links</th><td>${j.bookingLinks.map((b) => `${link(b.href)}${b.provider ? ` (${e(b.provider)})` : ''}`).join('<br>') || 'None found'}</td></tr>
  <tr><th>Service/product pages with a next step</th><td>${j.servicePages.length ? j.servicePages.map((p) => `${link(p.url)} - ${p.hasNextStep ? 'yes' : '<strong>no</strong>'}`).join('<br>') : 'No service/product pages among the inspected pages'}</td></tr>
  <tr><th>Trust signals</th><td>${j.trustSignals.map((t) => `${e(t.signal)} - ${link(t.pageUrl)}`).join('<br>') || 'None detected (presence only; content is never judged)'}</td></tr>
  <tr><th>Privacy policy / About page</th><td>${j.privacyPolicy ? link(j.privacyPolicy) : 'Privacy link not found'} / ${j.aboutPage ? link(j.aboutPage) : 'About page link not found'}</td></tr>
  <tr><th>E-commerce</th><td>${j.ecommerce.signals.map(e).join(', ') || 'No e-commerce signals'}${j.ecommerce.priceSamples.length ? `<br>Prices seen: ${j.ecommerce.priceSamples.map(e).join(', ')}` : ''}</td></tr>
  <tr><th>Social profiles</th><td>${j.socialProfiles.map((s) => `${e(s.network)}: ${link(s.url)}`).join('<br>') || 'None found'}</td></tr>
  <tr><th>Address / opening hours</th><td>${[...j.address, ...j.openingHours].map(e).join('<br>') || 'None found'}</td></tr>
</table>` : ''}

${readinessSection(r)}

<h2>Website structure and technology</h2>
${c ? `<h3>Pages inspected</h3>
<p>Discovered ${c.discovered} · Visited ${c.visited} · Skipped ${c.skipped} · Failed ${c.failed} · Limit ${c.limit}. Only these pages were inspected - this is not an audit of the entire website.${c.crawlDelayNote ? `<br><span class="muted">${e(c.crawlDelayNote)}</span>` : ''}</p>
<table><thead><tr><th>URL</th><th>Status</th><th>Title</th><th>Time</th></tr></thead><tbody>
${c.pages.map((p) => `<tr><td>${link(p.finalUrl)}</td><td>${p.status}</td><td>${e(p.title ?? '(none)')}</td><td>${p.responseTimeMs} ms</td></tr>`).join('')}
</tbody></table>
${c.failedUrls.length ? `<h3>Failed</h3><ul>${c.failedUrls.map((f) => `<li>${link(f.url)} - ${e(f.reason)}</li>`).join('')}</ul>` : ''}
${Object.keys(c.skippedByReason).length ? `<h3>Skipped (by reason)</h3><ul>${Object.entries(c.skippedByReason).map(([k, v]) => `<li>${e(k)}: ${v}</li>`).join('')}</ul>` : ''}` : `<p class="muted">The crawl category was not run; ${r.pagesInspected} page(s) inspected.</p>`}
${r.http ? `<h3>HTTP and HTTPS</h3><p>Status ${e(r.http.status ?? r.http.error ?? 'n/a')} · HTTPS: ${r.http.httpsUsed === null ? 'unknown' : r.http.httpsUsed ? 'yes' : 'no'} · HTTP → HTTPS: ${e(r.http.httpCheckDetail || 'not checked')} · ${r.http.redirects.length} redirect(s)</p>` : ''}
${r.robots || r.sitemap ? `<h3>robots.txt and sitemap</h3><p>${r.robots ? `${link(r.robots.url)}: ${e(r.robots.error ?? (r.robots.found ? `found (HTTP ${r.robots.status})` : `not found (HTTP ${r.robots.status})`))}` : ''}${r.sitemap ? `<br>Sitemap: ${r.sitemap.found ? `${link(r.sitemap.found)} (${r.sitemap.urlCount} URLs)` : 'not found at the checked locations'}` : ''}</p>` : ''}
${r.links ? `<h3>Link checking</h3><p>${r.links.checked} links checked (${r.links.internalChecked} internal, ${r.links.externalChecked} external) · ${r.links.broken.length} broken · ${r.links.unverified.length} could not be verified · ${r.links.notCheckedCount} not checked (limits). <span class="muted">${e(r.links.note)}</span></p>` : ''}
${r.technology ? `<h3>Detected technologies</h3>
${r.technology.detections.length ? `<table><thead><tr><th>Technology</th><th>Category</th><th>Confidence</th><th>Public evidence</th></tr></thead><tbody>${r.technology.detections.map((d) => `<tr><td>${e(d.name)}</td><td>${e(d.category)}</td><td>${e(d.confidence)}</td><td>${d.evidence.map(e).join('<br>')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No technologies identified from public signatures.</p>'}
${r.technology.structuredDataTypes.length ? `<p><strong>Structured data types:</strong> ${e(r.technology.structuredDataTypes.join(', '))}</p>` : ''}` : ''}

<h2>Digital growth opportunities</h2>
<p class="muted">Suggestions mapped to Chazon services, based on observed signals. A business may intentionally not offer some features; each item says how sure it is and what needs confirming.</p>
${(['BUILD', 'GROW', 'CONVERT', 'AUTOMATE'] as const)
  .map((svc) => {
    const items = r.opportunities.filter((o) => o.service === svc);
    return `<h3>${svc}</h3><p class="muted">${e(SERVICE_BLURB[svc])}</p>${items.length ? items.map(opportunityBlock).join('') : '<p class="muted">No evidence-based opportunities identified in this category.</p>'}`;
  })
  .join('')}

<h2>Business discovery (owner-supplied)</h2>
${opts.discoveryOmitted ? '<p class="muted">Questionnaire answers were left out of this copy for privacy, and recommendations here are based only on what the audit observed.</p>' : answers.length ? `<div class="owner"><p class="muted">Supplied by the business owner and not verified by this audit. Used only to prioritise recommendations.</p><table class="kv">${answers.map((a) => `<tr><th>${e(a.question)}</th><td>${e(a.answer)}</td></tr>`).join('')}</table>${r.discoveryNotes.length ? `<p><strong>Effect on prioritisation:</strong></p>${list(r.discoveryNotes.map(e))}` : ''}</div>` : '<p class="muted">No questionnaire answers were provided. Recommendations are based only on what the audit observed.</p>'}

<h2>Missing data and limitations</h2>
<h3>Checks that could not be completed</h3>
${r.incompleteChecks.length ? `<ul>${r.incompleteChecks.map((x) => `<li><strong>${e(x.name)}:</strong> ${e(x.reason)}</li>`).join('')}</ul>` : '<p class="muted">All selected checks completed.</p>'}
<h3>What cannot be determined from a URL</h3>
<table><thead><tr><th>Question</th><th>Why the audit cannot answer it</th><th>How to obtain it</th></tr></thead><tbody>
${r.unknowns.map((u) => `<tr><td>${e(u.topic)}</td><td>${e(u.why)}</td><td>${e(u.howToObtain)}${u.hint ? `<br><span class="muted">${e(u.hint)}</span>` : ''}</td></tr>`).join('')}
</tbody></table>
<p class="muted">Only authorised access to analytics, Search Console, advertising or CRM data can answer these. This tool never attempts to access private data.</p>
<h3>Limitations</h3>
<ul>${r.limitations.map((l) => `<li>${e(l)}</li>`).join('')}</ul>

${helpSection(opts)}
</body>
</html>`;
}

/**
 * Standalone "Free Website Improvement Plan": the action plan grouped by horizon, the readiness
 * gaps for the main profile, and the caveats and limitations that apply to the whole plan.
 */
export function renderPlanHtml(r: AuditReport, opts: HtmlOptions = {}): string {
  const site = r.finalUrl ?? r.inputUrl;
  const rd = r.readiness;
  const gaps = rd ? rd.items.filter((i) => i.profile === rd.profile && i.outcome !== 'found') : [];
  const findingById = new Map(r.findings.map((f) => [f.id, f]));
  const planItem = (a: ActionItem) => {
    const verify = a.findingIds.map((id) => findingById.get(id)?.status).filter(Boolean);
    return `<article class="action">
  <h4><span class="prio prio-${a.priority}">${e(a.priority)} priority</span> ${e(a.problem)}</h4>
  <table class="kv">
    <tr><th>Finding and evidence</th><td>${a.evidence.map(e).join('<br>') || '<span class="muted">See the related findings in the full report.</span>'}</td></tr>
    <tr><th>Priority / confidence</th><td>${e(a.priority)} priority · ${e(a.confidence)} confidence${verify.includes('hypothesis') ? ' · <strong>needs confirming first</strong>' : ''}</td></tr>
    <tr><th>Recommended action</th><td>${e(a.action)}</td></tr>
    <tr><th>Dependencies</th><td>${a.dependencies.map(e).join('<br>')}</td></tr>
    <tr><th>Estimated complexity</th><td>${e(a.complexity)} - ${e(a.complexityRationale)}</td></tr>
    <tr><th>Verification method</th><td>${e(a.validation)}</td></tr>
    <tr><th>Chazon service</th><td>${e(a.service)}</td></tr>
  </table>
</article>`;
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Website improvement plan - ${e(site)}</title>
<style>
  :root { --ink:#1f1b18; --muted:#5f5750; --line:#e8e1d9; --ivory:#faf7f3; --accent:#d44720; }
  * { box-sizing: border-box; }
  body { font: 14px/1.5 "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink); background: #fff; margin: 0 auto; padding: 32px; max-width: 900px; }
  h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 19px; border-bottom: 2px solid var(--accent); padding-bottom: 4px; margin-top: 32px; } h3 { font-size: 15px; } h4 { font-size: 14px; margin: 0 0 6px; }
  a { color: #b83a17; word-break: break-all; } .muted { color: var(--muted); font-size: 12px; }
  .notice { background: var(--ivory); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; } th, td { border-bottom: 1px solid var(--line); padding: 6px 4px; text-align: left; vertical-align: top; }
  table.kv th { width: 170px; color: var(--muted); font-weight: 600; }
  .action { border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 6px; padding: 10px 12px; margin: 10px 0; break-inside: avoid; }
  .prio { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 4px; margin-right: 6px; }
  .prio-high { background: #be123c; color: #fff; } .prio-medium { background: #fef3c7; color: #713f12; } .prio-low { background: #e0f2fe; color: #075985; }
  ${STYLE_EXTRA}
  @media print { body { padding: 0; font-size: 12px; } a { color: inherit; text-decoration: none; } }
</style>
</head>
<body>
<h1>Free Website Improvement Plan</h1>
<p><strong>Website:</strong> ${link(site)}<br>
<strong>Based on the audit completed:</strong> ${e(new Date(r.completedAt).toISOString().replace('T', ' ').slice(0, 16))} UTC · ${e(r.strategy)} test · ${r.pagesInspected} page(s) inspected</p>
<p class="notice">Built only from what this audit observed${r.discovery && !opts.discoveryOmitted ? ' and the owner’s questionnaire answers (used to prioritise, not verified)' : ''}. It contains no revenue, traffic, ranking or conversion estimates. Items marked “needs confirming first” are hypotheses.</p>

${(['immediate', 'short-term', 'strategic'] as const)
  .map((h) => {
    const items = r.actionPlan.filter((a) => a.horizon === h);
    const title = h === 'immediate' ? '1. Immediate priorities' : h === 'short-term' ? '2. Short-term improvements' : '3. Longer-term strategic opportunities';
    const blurb = h === 'immediate' ? 'Clearly evidenced and relatively straightforward.' : h === 'short-term' ? 'Need some implementation effort or affect several pages.' : 'Larger projects that need investigation or a conversation first.';
    return `<h2>${title} (${items.length})</h2><p class="muted">${blurb}</p>${items.length ? items.map(planItem).join('') : '<p class="muted">None identified.</p>'}`;
  })
  .join('')}

${rd ? `<h2>Business readiness gaps (${PROFILE_LABEL[rd.profile]})</h2>${gaps.length ? `<table><thead><tr><th>Question</th><th>Result</th><th>Suggestion</th></tr></thead><tbody>${gaps.map((i) => `<tr><td>${e(i.question)}</td><td class="rd-${i.outcome}">${READINESS_LABEL[i.outcome]}</td><td>${e(i.suggestion)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Every readiness check for this profile found the expected element.</p>'}<p class="muted">${e(rd.caveat)}</p>` : ''}

<h2>What affects this plan</h2>
${list(r.summary.keyCaveats.map(e))}
<h3>Limitations</h3>
${list(r.limitations.map(e))}
${r.incompleteChecks.length ? `<h3>Checks that could not be completed</h3>${list(r.incompleteChecks.map((x) => `<strong>${e(x.name)}:</strong> ${e(x.reason)}`))}` : ''}

${helpSection(opts)}
<p class="muted">Generated by ${e(r.tool.name)} v${e(r.tool.version)}.</p>
</body>
</html>`;
}
