import { z } from 'zod';
import type { AuditReport } from '@chazon/shared';

/**
 * Strict schema for a report sent back by the browser (stateless exports and
 * questionnaire updates). It is the server's own report shape, but it arrives
 * from the client, so every field is type-checked and length-limited, unknown
 * keys are stripped, and numbers must be finite numbers - which keeps the HTML
 * renderer's numeric interpolations safe. Strings are still escaped on output.
 */

const str = (max = 20_000) => z.string().max(max);
const num = z.number().finite();
const arr = <T extends z.ZodType>(t: T, max = 2_000) => z.array(t).max(max);
const opt = <T extends z.ZodType>(t: T) => t.optional();
const nul = <T extends z.ZodType>(t: T) => t.nullable();
const IMAGE = z.string().max(450_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/);

const severity = z.enum(['critical', 'high', 'medium', 'low', 'info']);
const confidence = z.enum(['high', 'medium', 'low']);
const effort = z.enum(['low', 'medium', 'high']);
const service = z.enum(['BUILD', 'GROW', 'CONVERT', 'AUTOMATE']);
const category = z.enum(['performance', 'best-practices', 'seo', 'accessibility', 'mobile', 'journey', 'crawl', 'technology', 'security']);
const scoreKey = z.enum(['performance', 'technicalSeo', 'accessibility', 'bestPractices', 'mobileUx', 'conversionReadiness', 'overallHealth']);
const auditCategory = z.enum(['performance', 'seo', 'accessibility', 'journey', 'crawl', 'technology']);
const counts = z.object({ total: num, completed: num, passed: num, warnings: num, failed: num, skipped: num });
const link = z.object({ text: str(500), href: str(2_000) });

const finding = z.object({
  id: str(200),
  title: str(1_000),
  category,
  severity,
  confidence,
  source: z.enum(['lighthouse', 'custom']),
  evidence: arr(str(), 100),
  affected: arr(str(2_000), 100),
  affectedTotal: opt(num),
  explanation: str(),
  recommendation: str(),
  service,
  effort,
  estimatedSavings: opt(str(500)),
  tags: opt(arr(str(100), 20)),
  learnMoreUrl: opt(str(2_000)),
  priority: num,
  plainSummary: str(),
  observed: opt(str(2_000)),
  expected: opt(str(2_000)),
  effortRationale: str(2_000),
  verification: str(2_000),
  status: z.enum(['confirmed', 'likely', 'hypothesis', 'manual-review']),
});

const score = z.object({
  key: scoreKey,
  label: str(200),
  value: nul(num),
  kind: z.enum(['lighthouse', 'custom', 'composite']),
  note: str(),
  counts: opt(counts),
  components: opt(arr(z.object({ key: scoreKey, label: str(200), weight: num, value: num }), 10)),
});

const check = z.object({
  id: str(200),
  label: str(500),
  score: scoreKey,
  status: z.enum(['pass', 'warn', 'fail', 'skipped']),
  weight: num,
  credit: num,
  detail: str(5_000),
  outcome: z.enum(['pass', 'issue', 'warning', 'not-applicable', 'not-checked', 'inconclusive']),
});

const lighthouse = z.object({
  strategy: z.enum(['mobile', 'desktop']),
  requestedUrl: str(2_000),
  finalUrl: str(2_000),
  lighthouseVersion: str(50),
  fetchTime: str(100),
  categories: z.object({ performance: nul(num), accessibility: nul(num), bestPractices: nul(num), seo: nul(num) }),
  metrics: arr(z.object({ id: str(100), label: str(200), displayValue: str(100), numericValue: nul(num), unit: str(50), score: nul(num), rating: nul(z.enum(['good', 'needs-improvement', 'poor'])) }), 20),
  field: nul(
    z.object({
      scope: z.enum(['url', 'origin']),
      overallCategory: nul(str(50)),
      coreWebVitalsPassed: nul(z.boolean()),
      metrics: arr(z.object({ id: str(50), label: str(200), percentile: num, displayValue: str(100), category: str(50) }), 20),
    }),
  ),
  fieldUnavailableReason: opt(str(2_000)),
  runWarnings: arr(str(2_000), 50),
  categoryCounts: z.partialRecord(z.enum(['performance', 'accessibility', 'bestPractices', 'seo']), counts).optional().default({}),
  screenshot: opt(IMAGE),
  filmstrip: opt(arr(z.object({ timingMs: num, data: IMAGE }), 10)),
  auditOutcomes: z.record(str(200), z.object({ score: nul(num), mode: str(50), displayValue: opt(str(500)) })).optional().default({}),
});

const http = z.object({
  inputUrl: str(2_000),
  finalUrl: nul(str(2_000)),
  status: nul(num),
  redirects: arr(z.object({ url: str(2_000), status: num, location: str(2_000) }), 30),
  httpsUsed: nul(z.boolean()),
  httpRedirectsToHttps: nul(z.boolean()),
  httpCheckDetail: str(2_000),
  responseTimeMs: nul(num),
  error: opt(str(2_000)),
});

const crawl = z.object({
  limit: num,
  discovered: num,
  visited: num,
  skipped: num,
  failed: num,
  pages: arr(z.object({ url: str(2_000), finalUrl: str(2_000), status: num, title: nul(str(1_000)), description: nul(str(2_000)), h1Count: num, responseTimeMs: num, bytes: num, truncated: z.boolean(), source: z.enum(['start', 'link', 'sitemap']) }), 200),
  skippedUrls: arr(z.object({ url: str(2_000), reason: str(500) }), 500),
  skippedByReason: z.record(str(500), num),
  failedUrls: arr(z.object({ url: str(2_000), reason: str(500) }), 500),
  crawlDelayMs: num,
  crawlDelayNote: opt(str(1_000)),
});

const journey = z.object({
  pagesAnalysed: num,
  navigation: z.object({ present: z.boolean(), linkCount: num, links: arr(link, 100) }),
  contactPages: arr(str(2_000), 50),
  emails: arr(str(200), 50),
  phones: arr(str(100), 50),
  whatsapp: arr(str(2_000), 50),
  forms: arr(z.object({ pageUrl: str(2_000), kind: str(50), fieldCount: num, unlabeledFields: num }), 100),
  embeddedForms: arr(z.object({ pageUrl: str(2_000), provider: str(100) }), 50),
  bookingLinks: arr(z.object({ text: str(500), href: str(2_000), provider: nul(str(100)) }), 50),
  ctas: arr(z.object({ text: str(500), href: nul(str(2_000)), pageUrl: str(2_000), strength: z.enum(['primary', 'secondary']) }), 100),
  homepagePrimaryCtas: num,
  ecommerce: z.object({ signals: arr(str(200), 50), productPages: arr(str(2_000), 50), priceSamples: arr(str(100), 50), cartLinks: arr(str(2_000), 50), checkoutLinks: arr(str(2_000), 50) }),
  socialProfiles: arr(z.object({ network: str(100), url: str(2_000) }), 50),
  address: arr(str(1_000), 20),
  openingHours: arr(str(1_000), 20),
  discoverability: arr(str(2_000), 20),
  contactInHeader: z.boolean(),
  trustSignals: arr(z.object({ pageUrl: str(2_000), signal: str(500) }), 50),
  privacyPolicy: nul(str(2_000)),
  aboutPage: nul(str(2_000)),
  servicePages: arr(z.object({ url: str(2_000), hasNextStep: z.boolean() }), 50),
  unlinkedPhones: arr(str(100), 20),
  business: opt(
    z.object({
      policyLinks: arr(z.object({ kind: z.enum(['shipping', 'returns', 'terms', 'payment', 'support', 'faq', 'grievance']), href: str(2_000), text: str(500) }), 50),
      paymentMethods: arr(z.object({ method: str(100), pageUrl: str(2_000) }), 30),
      mapLinks: arr(str(2_000), 20),
      pinCodes: arr(str(20), 20),
      gstinPages: arr(str(2_000), 20),
      indianPhones: arr(str(100), 20),
      formHints: arr(z.object({ pageUrl: str(2_000), requiredFields: num, typedFields: num, hasLiveRegion: z.boolean(), hasSuccessMessage: z.boolean() }), 50),
      serviceDescriptions: arr(z.object({ url: str(2_000), heading: nul(str(1_000)), words: num }), 50),
    }),
  ),
});

const technology = z.object({
  detections: arr(z.object({ name: str(200), category: str(100), confidence, evidence: arr(str(1_000), 20) }), 200),
  structuredDataTypes: arr(str(200), 100),
  likelyClientRendered: z.boolean(),
});

const robots = z.object({
  url: str(2_000),
  status: nul(num),
  found: z.boolean(),
  error: opt(str(2_000)),
  blocksAll: z.boolean(),
  sitemaps: arr(str(2_000), 50),
  crawlDelaySeconds: nul(num),
  startUrlAllowed: nul(z.boolean()),
});

const sitemap = z.object({
  checked: arr(z.object({ url: str(2_000), status: nul(num), outcome: str(500) }), 20),
  found: nul(str(2_000)),
  type: nul(z.enum(['urlset', 'sitemapindex'])),
  urlCount: num,
  childSitemaps: num,
  sampleUrls: arr(str(2_000), 100),
  error: opt(str(2_000)),
});

const links = z.object({
  ran: z.boolean(),
  checked: num,
  internalChecked: num,
  externalChecked: num,
  broken: arr(z.object({ url: str(2_000), status: nul(num), reason: str(500), foundOn: arr(str(2_000), 10), internal: z.boolean() }), 500),
  unverified: arr(z.object({ url: str(2_000), status: nul(num), reason: str(500), internal: z.boolean() }), 500),
  notCheckedCount: num,
  note: str(2_000),
});

/** The parts of a report that exports and questionnaire updates read. Insight fields are recomputed or re-validated. */
export const clientReportSchema = z.object({
  id: z.string().uuid(),
  tool: z.object({ name: str(200), version: str(50) }),
  inputUrl: str(2_048),
  finalUrl: nul(str(2_048)),
  strategy: z.enum(['mobile', 'desktop']),
  categories: arr(auditCategory, 10),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationMs: num,
  pagesInspected: num,
  scores: arr(score, 10),
  checks: arr(check, 200),
  lighthouse: nul(lighthouse),
  http: nul(http),
  robots: nul(robots),
  sitemap: nul(sitemap),
  crawl: nul(crawl),
  links: nul(links),
  journey: nul(journey),
  technology: nul(technology),
  findings: arr(finding, 500),
  topFindingIds: arr(str(200), 20),
  incompleteChecks: arr(z.object({ name: str(500), reason: str(2_000) }), 200),
  limitations: arr(str(2_000), 50),
});

export type ClientReport = Omit<AuditReport, 'opportunities' | 'summary' | 'actionPlan' | 'unknowns' | 'discovery' | 'discoveryNotes'>;

export function parseClientReport(raw: unknown): { ok: true; report: ClientReport } | { ok: false; message: string } {
  const parsed = clientReportSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: `The report is not valid${issue ? ` (${issue.path.join('.') || 'root'}: ${issue.message})` : ''}.` };
  }
  return { ok: true, report: parsed.data as unknown as ClientReport };
}
