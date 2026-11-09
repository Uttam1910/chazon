/**
 * Types shared by the audit engine (server) and the dashboard (client).
 * Everything in an AuditReport is plain JSON so it can be stored, exported or
 * sent to another system unchanged.
 */

export type Strategy = 'mobile' | 'desktop';

/** Audit categories the user can choose to run (A–F). G (opportunities) is always derived. */
export type AuditCategoryKey =
  | 'performance'
  | 'seo'
  | 'accessibility'
  | 'journey'
  | 'crawl'
  | 'technology';

export const ALL_AUDIT_CATEGORIES: AuditCategoryKey[] = [
  'performance',
  'seo',
  'accessibility',
  'journey',
  'crawl',
  'technology',
];

export interface AuditRequest {
  url: string;
  strategy: Strategy;
  categories: AuditCategoryKey[];
  /** Maximum number of HTML pages to fetch (including the start page). */
  crawlLimit: number;
  /** Check a bounded number of discovered links for 404/410 and errors. */
  checkLinks: boolean;
  /** Optional answers from the business owner, used only to prioritise recommendations. */
  discovery?: DiscoveryAnswers;
}

// --- Business discovery questionnaire ---------------------------------------------------------
// Everything here is supplied by the business owner and is always labelled as such in reports.
// No personal contact details are collected.

export const BUSINESS_TYPES = ['local-service', 'professional-service', 'ecommerce', 'hospitality', 'healthcare', 'education', 'nonprofit', 'software', 'other'] as const;
export const OBJECTIVES = ['more-enquiries', 'more-online-sales', 'more-bookings', 'search-visibility', 'brand-awareness', 'reduce-admin', 'other'] as const;
export const LEAD_CHANNELS = ['organic-search', 'paid-ads', 'social-media', 'referrals', 'email', 'walk-in', 'marketplaces', 'other'] as const;
export const CHALLENGES = ['not-enough-traffic', 'visitors-do-not-enquire', 'slow-or-outdated-site', 'hard-to-update', 'manual-follow-up', 'low-search-visibility', 'other'] as const;
export const NEEDS = ['ecommerce', 'bookings', 'enquiries', 'whatsapp'] as const;
export const TIMEFRAMES = ['asap', '1-3-months', '3-6-months', 'exploring'] as const;
export const TRI_STATE = ['yes', 'no', 'unsure'] as const;
export const FOLLOW_UP = ['crm', 'inbox-or-spreadsheet', 'none', 'unsure'] as const;

export interface DiscoveryAnswers {
  businessType?: (typeof BUSINESS_TYPES)[number];
  offerings?: string;
  mainObjective?: (typeof OBJECTIVES)[number];
  leadChannels?: (typeof LEAD_CHANNELS)[number][];
  mainChallenge?: (typeof CHALLENGES)[number];
  hasAnalytics?: (typeof TRI_STATE)[number];
  usesAdvertising?: (typeof TRI_STATE)[number];
  followUp?: (typeof FOLLOW_UP)[number];
  needs?: (typeof NEEDS)[number][];
  timeframe?: (typeof TIMEFRAMES)[number];
  budgetRange?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'high' | 'medium' | 'low';
export type Effort = 'low' | 'medium' | 'high';
/**
 * How well a finding is established:
 *  - confirmed: directly observed and unambiguous;
 *  - likely: observed, but detection is heuristic or depends on a single lab run;
 *  - hypothesis: indirect signal only - treat as a question, not a conclusion;
 *  - manual-review: could not be verified automatically and needs a human check.
 */
export type EvidenceStatus = 'confirmed' | 'likely' | 'hypothesis' | 'manual-review';
export type ServiceCategory = 'BUILD' | 'GROW' | 'CONVERT' | 'AUTOMATE';
export type FindingCategory =
  | 'performance'
  | 'best-practices'
  | 'seo'
  | 'accessibility'
  | 'mobile'
  | 'journey'
  | 'crawl'
  | 'technology'
  | 'security';

export interface Finding {
  /** Stable identifier, e.g. "seo.missing-title" or "lh.unused-javascript". */
  id: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  /** Where the evidence came from: Lighthouse (via PSI) or this tool's own checks. */
  source: 'lighthouse' | 'custom';
  evidence: string[];
  affected: string[];
  /** Total number of affected items when `affected` was truncated. */
  affectedTotal?: number;
  explanation: string;
  recommendation: string;
  service: ServiceCategory;
  effort: Effort;
  /** Only ever populated from savings reported by Lighthouse itself. */
  estimatedSavings?: string;
  /** Grouping hints, e.g. "images", "render-blocking", "unused-code". */
  tags?: string[];
  learnMoreUrl?: string;
  /** Computed priority (higher = more important). See findings/priority.ts. */
  priority: number;
  /** One or two sentences in plain English for non-technical readers. */
  plainSummary: string;
  /** The value actually observed, when one exists (e.g. "Title is 92 characters"). */
  observed?: string;
  /** The expected / recommended condition, where technically justified. */
  expected?: string;
  /** Why the effort rating was chosen. */
  effortRationale: string;
  /** How to confirm the issue has been fixed. */
  verification: string;
  status: EvidenceStatus;
}

export type ScoreKey =
  | 'performance'
  | 'technicalSeo'
  | 'accessibility'
  | 'bestPractices'
  | 'mobileUx'
  | 'conversionReadiness'
  | 'overallHealth';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skipped';
/**
 * Reader-facing outcome of a check. `status` drives scoring; `outcome` explains it:
 * skipped checks are split into not applicable, not checked and inconclusive, and
 * none of those is ever treated as a pass.
 */
export type CheckOutcome = 'pass' | 'issue' | 'warning' | 'not-applicable' | 'not-checked' | 'inconclusive';

export interface CheckResult {
  id: string;
  label: string;
  score: ScoreKey;
  status: CheckStatus;
  weight: number;
  /** 0..1 credit awarded (only meaningful when status is not skipped). */
  credit: number;
  detail: string;
  outcome: CheckOutcome;
}

export interface CheckCounts {
  total: number;
  completed: number;
  passed: number;
  warnings: number;
  failed: number;
  skipped: number;
}

export interface ScoreResult {
  key: ScoreKey;
  label: string;
  /** null = "Not enough data". Never substituted with a guess. */
  value: number | null;
  kind: 'lighthouse' | 'custom' | 'composite';
  note: string;
  counts?: CheckCounts;
  /** For composites: which inputs were used and their normalised weights. */
  components?: { key: ScoreKey; label: string; weight: number; value: number }[];
}

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export interface LabMetric {
  id: string;
  label: string;
  displayValue: string;
  numericValue: number | null;
  unit: string;
  /** Lighthouse's own 0..1 score for this metric, if reported. */
  score: number | null;
  rating: MetricRating | null;
}

export interface FieldMetric {
  id: string;
  label: string;
  percentile: number;
  displayValue: string;
  category: 'FAST' | 'AVERAGE' | 'SLOW' | string;
}

export interface FieldData {
  scope: 'url' | 'origin';
  overallCategory: string | null;
  /** True when every Core Web Vital (LCP, INP, CLS) is in the FAST bucket at p75. */
  coreWebVitalsPassed: boolean | null;
  metrics: FieldMetric[];
}

export interface LighthouseSummary {
  strategy: Strategy;
  requestedUrl: string;
  finalUrl: string;
  lighthouseVersion: string;
  fetchTime: string;
  categories: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: LabMetric[];
  /** Real-user data for this URL (or the origin, see scope). null = unavailable. */
  field: FieldData | null;
  fieldUnavailableReason?: string;
  runWarnings: string[];
  /** Pass/fail/skip counts of Lighthouse audits per category (manual and N/A audits count as skipped). */
  categoryCounts: Partial<Record<'performance' | 'accessibility' | 'bestPractices' | 'seo', CheckCounts>>;
  /** Final rendered screenshot from Lighthouse (validated base64 data: URI), if reported. */
  screenshot?: string;
  /** Lighthouse load filmstrip: what the page looked like over time (validated data: URIs). */
  filmstrip?: { timingMs: number; data: string }[];
  /** Raw audit outcomes needed by custom scores (id -> score / displayMode). */
  auditOutcomes: Record<string, { score: number | null; mode: string; displayValue?: string }>;
}

export interface RedirectHop {
  url: string;
  status: number;
  location: string;
}

export interface CrawledPageSummary {
  url: string;
  finalUrl: string;
  status: number;
  title: string | null;
  description: string | null;
  h1Count: number;
  responseTimeMs: number;
  bytes: number;
  truncated: boolean;
  source: 'start' | 'link' | 'sitemap';
}

export interface CrawlSummary {
  limit: number;
  discovered: number;
  visited: number;
  skipped: number;
  failed: number;
  pages: CrawledPageSummary[];
  skippedUrls: { url: string; reason: string }[];
  skippedByReason: Record<string, number>;
  failedUrls: { url: string; reason: string }[];
  crawlDelayMs: number;
  crawlDelayNote?: string;
}

export interface RobotsInfo {
  url: string;
  status: number | null;
  found: boolean;
  error?: string;
  blocksAll: boolean;
  sitemaps: string[];
  crawlDelaySeconds: number | null;
  startUrlAllowed: boolean | null;
}

export interface SitemapInfo {
  checked: { url: string; status: number | null; outcome: string }[];
  found: string | null;
  type: 'urlset' | 'sitemapindex' | null;
  urlCount: number;
  childSitemaps: number;
  sampleUrls: string[];
  error?: string;
}

export interface HttpInfo {
  inputUrl: string;
  finalUrl: string | null;
  status: number | null;
  redirects: RedirectHop[];
  httpsUsed: boolean | null;
  httpRedirectsToHttps: boolean | null;
  httpCheckDetail: string;
  responseTimeMs: number | null;
  error?: string;
}

export interface LinkCheckSummary {
  ran: boolean;
  checked: number;
  internalChecked: number;
  externalChecked: number;
  broken: { url: string; status: number | null; reason: string; foundOn: string[]; internal: boolean }[];
  unverified: { url: string; status: number | null; reason: string; internal: boolean }[];
  notCheckedCount: number;
  note: string;
}

export interface JourneySummary {
  pagesAnalysed: number;
  navigation: { present: boolean; linkCount: number; links: { text: string; href: string }[] };
  contactPages: string[];
  emails: string[];
  phones: string[];
  whatsapp: string[];
  forms: { pageUrl: string; kind: string; fieldCount: number; unlabeledFields: number }[];
  embeddedForms: { pageUrl: string; provider: string }[];
  bookingLinks: { text: string; href: string; provider: string | null }[];
  ctas: { text: string; href: string | null; pageUrl: string; strength: 'primary' | 'secondary' }[];
  homepagePrimaryCtas: number;
  ecommerce: {
    signals: string[];
    productPages: string[];
    priceSamples: string[];
    cartLinks: string[];
    checkoutLinks: string[];
  };
  socialProfiles: { network: string; url: string }[];
  address: string[];
  openingHours: string[];
  discoverability: string[];
  /** A contact link, email, phone or WhatsApp link appears in the start page header/navigation. */
  contactInHeader: boolean;
  /** Public trust signals detected (presence only - testimonials are never judged as genuine or not). */
  trustSignals: { pageUrl: string; signal: string }[];
  privacyPolicy: string | null;
  aboutPage: string | null;
  /** Inspected service/product pages and whether a next step (CTA or contact route) was found on them. */
  servicePages: { url: string; hasNextStep: boolean }[];
  /** Phone numbers shown as text while no tel: link was found on the inspected pages. */
  unlinkedPhones: string[];
  /** Customer-facing business signals used by the readiness checklist (absent in reports from older versions). */
  business?: BusinessSignals;
}

// --- Business readiness ------------------------------------------------------------------------
// Signals are presence-only observations from public page content. They never establish trust,
// legal compliance or sales impact.

export type PolicyKind = 'shipping' | 'returns' | 'terms' | 'payment' | 'support' | 'faq' | 'grievance';

export interface BusinessSignals {
  /** Customer-facing policy and help links found on the inspected pages (matched by link text or URL). */
  policyLinks: { kind: PolicyKind; href: string; text: string }[];
  /** Payment methods mentioned in visible text or loaded checkout scripts, e.g. "UPI". */
  paymentMethods: { method: string; pageUrl: string }[];
  /** Links to, or embeds of, a map service. */
  mapLinks: string[];
  /** Six-digit Indian PIN codes found in address data or next to address words. */
  pinCodes: string[];
  /** Pages whose visible text mentions a GSTIN / GST number. Presence only - never validated. */
  gstinPages: string[];
  /** Phone numbers in an Indian format (+91 or a 10-digit mobile number) among tel: links and phone text. */
  indianPhones: string[];
  /** Client-side hints declared by enquiry forms. Forms are never submitted, so feedback after sending is unknown. */
  formHints: { pageUrl: string; requiredFields: number; typedFields: number; hasLiveRegion: boolean; hasSuccessMessage: boolean }[];
  /** Inspected service/product pages with their main heading and visible word count. */
  serviceDescriptions: { url: string; heading: string | null; words: number }[];
}

export type ReadinessProfile = 'local-service' | 'ecommerce' | 'service-b2b';
/**
 * found: observed on the inspected pages; partial: some of it observed; not-detected: not found
 * (absence-based, so it needs a manual check); manual-review: cannot be determined automatically;
 * not-checked: the data needed was not collected.
 */
export type ReadinessOutcome = 'found' | 'partial' | 'not-detected' | 'manual-review' | 'not-checked';

export interface ReadinessItem {
  id: string;
  profile: ReadinessProfile;
  question: string;
  outcome: ReadinessOutcome;
  /** What was (or was not) observed, in plain words. */
  detail: string;
  evidence: string[];
  pages: string[];
  whyItMatters: string;
  suggestion: string;
  service: ServiceCategory;
  relatedFindingIds: string[];
}

export interface BusinessReadiness {
  /** The profile shown first. All profiles' items are included. */
  profile: ReadinessProfile;
  profileBasis: 'owner-answer' | 'detected' | 'default';
  profileNote: string;
  items: ReadinessItem[];
  caveat: string;
}

// --- Fix-it instructions -----------------------------------------------------------------------

export type Implementer = 'business-owner' | 'content-editor' | 'developer';

export interface FixGuide {
  findingId: string;
  issue: string;
  severity: Severity;
  evidence: string[];
  affected: string[];
  /** What was observed now (the finding's observed value), when one was recorded. */
  current?: string;
  fix: string;
  steps: string[];
  /** Illustrative snippet with placeholders; never applied to the audited site. */
  example?: { label: string; code: string };
  implementer: Implementer;
  implementerNote: string;
  /** Access or agreements needed before starting. */
  dependencies: string[];
  /** Risks to keep in mind while making the change. */
  cautions: string[];
  /** What this kit has not established (always at least one item). */
  notVerified: string[];
  retest: string;
  service: ServiceCategory;
}

export interface TechnologyDetection {
  name: string;
  category: string;
  confidence: Confidence;
  evidence: string[];
}

export interface TechnologySummary {
  detections: TechnologyDetection[];
  structuredDataTypes: string[];
  likelyClientRendered: boolean;
}

/** confirmed = directly evidenced; inferred = reasoned from evidence; discovery = needs a conversation first. */
export type OpportunityBasis = 'confirmed' | 'inferred' | 'discovery';
export type Relevance = 'high' | 'normal' | 'low';

export interface Opportunity {
  id: string;
  service: ServiceCategory;
  title: string;
  observation: string;
  /** Supporting evidence lines (from findings or observed signals). */
  evidence: string[];
  affected: string[];
  whyItMatters: string;
  nextStep: string;
  uncertainty: string;
  relatedFindingIds: string[];
  confidence: Confidence;
  basis: OpportunityBasis;
  /** What to ask the business owner before recommending this confidently. */
  informationNeeded: string[];
  /** Adjusted by the discovery questionnaire; "normal" without answers. */
  relevance: Relevance;
  /** Why relevance changed, citing the owner's answer. */
  relevanceNote?: string;
  /** True when the opportunity exists only because of the owner's answers. */
  fromDiscovery?: boolean;
}

export type ActionHorizon = 'immediate' | 'short-term' | 'strategic';

export interface ActionItem {
  id: string;
  horizon: ActionHorizon;
  problem: string;
  evidence: string[];
  action: string;
  priority: 'high' | 'medium' | 'low';
  /** Confidence of the underlying finding or opportunity. */
  confidence: Confidence;
  complexity: Effort;
  complexityRationale: string;
  dependencies: string[];
  validation: string;
  service: ServiceCategory;
  findingIds: string[];
  opportunityId?: string;
}

export interface ExecutiveSummary {
  headline: string;
  /** Plain-language paragraphs for a business owner. */
  paragraphs: string[];
  band: 'good' | 'average' | 'poor' | 'none';
  severityCounts: Record<Severity, number>;
  topFindingIds: string[];
  /** Strongest opportunity per service, if any. */
  topOpportunityIds: string[];
  /** Limitations that most affect the conclusions of this particular audit. */
  keyCaveats: string[];
  /** What the scores mean / do not mean. */
  scoreNotes: string[];
}

export interface Unknown {
  topic: string;
  why: string;
  howToObtain: string;
  /** Contextual hint from this audit (e.g. an analytics tag was detected). */
  hint?: string;
}

export interface IncompleteCheck {
  name: string;
  reason: string;
}

export interface AuditReport {
  id: string;
  tool: { name: string; version: string };
  inputUrl: string;
  finalUrl: string | null;
  strategy: Strategy;
  categories: AuditCategoryKey[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pagesInspected: number;
  scores: ScoreResult[];
  checks: CheckResult[];
  lighthouse: LighthouseSummary | null;
  http: HttpInfo | null;
  robots: RobotsInfo | null;
  sitemap: SitemapInfo | null;
  crawl: CrawlSummary | null;
  links: LinkCheckSummary | null;
  journey: JourneySummary | null;
  technology: TechnologySummary | null;
  findings: Finding[];
  topFindingIds: string[];
  opportunities: Opportunity[];
  incompleteChecks: IncompleteCheck[];
  limitations: string[];
  summary: ExecutiveSummary;
  actionPlan: ActionItem[];
  unknowns: Unknown[];
  /** Owner-supplied answers (never observed by the audit). */
  discovery: DiscoveryAnswers | null;
  /** How the owner's answers changed prioritisation. */
  discoveryNotes: string[];
  /** Business readiness checklist; null when the user-journey category did not run. Absent in older reports. */
  readiness?: BusinessReadiness | null;
  /** Step-by-step remediation for the most important findings. Absent in older reports. */
  fixGuides?: FixGuide[];
}

// --- Google Search Console (optional, read-only) -------------------------------------------------
// Every number here comes from the Search Console API response for the authorised user. Nothing
// is estimated; when Google returns no rows the value is null / the list is empty.

export interface GscStatus {
  /** The server has OAuth credentials configured. */
  configured: boolean;
  /** This browser holds a valid (unexpired) Search Console session. */
  connected: boolean;
  expiresAt: string | null;
  /** Names (never values) of missing environment variables, to help set the feature up. */
  missing: string[];
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface SearchMetrics {
  clicks: number;
  impressions: number;
  /** 0..1, as returned by Google. */
  ctr: number;
  /** Average position, as returned by Google. */
  position: number;
}

export interface SearchRow extends SearchMetrics {
  key: string;
}

export interface SearchOpportunity {
  id: string;
  kind: 'page-ctr' | 'query-near-page-one';
  /** The page URL or search query. */
  target: string;
  metrics: SearchMetrics;
  reason: string;
  suggestion: string;
}

export interface SearchPerformance {
  siteUrl: string;
  startDate: string;
  endDate: string;
  fetchedAt: string;
  /** Totals for the property and period; null when Google returned no data. */
  totals: SearchMetrics | null;
  queries: SearchRow[];
  pages: SearchRow[];
  /** Investigation suggestions derived from the rows above by fixed rules - not predictions. */
  opportunities: SearchOpportunity[];
  notes: string[];
}

export type StepState = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface ProgressStep {
  key: string;
  label: string;
  state: StepState;
  detail?: string;
}

export interface AuditJobStatus {
  id: string;
  state: 'running' | 'completed' | 'failed';
  createdAt: string;
  message: string;
  steps: ProgressStep[];
  error?: { code: string; message: string };
  report?: AuditReport;
}

export interface PublicConfig {
  pagespeedConfigured: boolean;
  defaultCrawlPages: number;
  maxCrawlPages: number;
  version: string;
  /** Chazon contact link configured by the operator (CHAZON_CONTACT_URL); null when not configured. */
  contactUrl: string | null;
}

export interface ApiError {
  error: { code: string; message: string };
}
