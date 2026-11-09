import type { CheckResult, LighthouseSummary } from '@chazon/shared';
import type { FindingDraft } from '../findings/priority';
import { CheckList } from '../scoring/checks';
import { plural } from '../util/text';
import type { PageData } from './page';

/** Custom finding id -> equivalent Lighthouse audit id (used to merge duplicates). */
export const LIGHTHOUSE_EQUIVALENTS: Record<string, string> = {
  'a11y.images-missing-alt': 'image-alt',
  'a11y.unlabeled-fields': 'label',
  'a11y.unnamed-buttons': 'button-name',
  'a11y.unnamed-links': 'link-name',
  'a11y.missing-lang': 'html-has-lang',
  'a11y.heading-skips': 'heading-order',
  'a11y.positive-tabindex': 'tabindex',
  'a11y.zoom-disabled': 'meta-viewport',
  'mobile.missing-viewport': 'viewport',
};

export function zoomDisabled(viewport: string | null): boolean {
  if (!viewport) return false;
  const v = viewport.toLowerCase().replace(/\s+/g, '');
  if (/user-scalable=(no|0)(,|;|$)/.test(v)) return true;
  const max = /maximum-scale=([\d.]+)/.exec(v);
  return max ? Number.parseFloat(max[1]!) < 2 : false;
}

function pagesWith(pages: PageData[], pred: (p: PageData) => boolean) {
  return pages.filter(pred);
}

export function analyzeAccessibility(pages: PageData[]): FindingDraft[] {
  const findings: FindingDraft[] = [];
  if (pages.length === 0) return findings;
  const n = pages.length;
  const common = {
    category: 'accessibility' as const,
    source: 'custom' as const,
    service: 'BUILD' as const,
    effort: 'low' as const,
  };

  const altPages = pagesWith(pages, (p) => p.images.missingAltCount > 0);
  if (altPages.length) {
    const total = altPages.reduce((s, p) => s + p.images.missingAltCount, 0);
    findings.push({
      ...common,
      id: 'a11y.images-missing-alt',
      title: `${plural(total, 'image')} without alt text`,
      severity: 'medium',
      confidence: 'high',
      evidence: [
        ...altPages.slice(0, 5).map((p) => `${p.finalUrl}: ${p.images.missingAltCount} of ${p.images.total} images have no alt attribute`),
        ...(altPages.length > 1 ? ['The same image can appear on several pages; the count is per page.'] : []),
      ],
      affected: [...new Set(altPages.flatMap((p) => p.images.missingAlt))].slice(0, 15),
      affectedTotal: total,
      explanation: 'Screen-reader users get no description of these images, and search engines lose context. Purely decorative images should use alt="".',
      recommendation: 'Add concise, descriptive alt text to meaningful images and alt="" to decorative ones.',
    });
  }

  const fieldPages = pagesWith(pages, (p) => p.a11y.unlabeledFields.length > 0);
  if (fieldPages.length) {
    findings.push({
      ...common,
      id: 'a11y.unlabeled-fields',
      title: 'Form fields without an accessible label',
      severity: 'medium',
      confidence: 'medium',
      evidence: fieldPages.slice(0, 4).flatMap((p) => p.a11y.unlabeledFields.slice(0, 3).map((f) => `${p.finalUrl}: ${f}`)),
      affected: fieldPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Fields need a programmatic label so screen readers announce them; placeholder text alone disappears while typing and is not a reliable label.',
      recommendation: 'Associate a visible <label for="…"> with each field (or use aria-label where a visible label is impossible).',
    });
  }

  const btnPages = pagesWith(pages, (p) => p.a11y.unnamedButtons.length > 0);
  if (btnPages.length) {
    findings.push({
      ...common,
      id: 'a11y.unnamed-buttons',
      title: 'Buttons without an accessible name',
      severity: 'medium',
      confidence: 'medium',
      evidence: btnPages.slice(0, 4).flatMap((p) => p.a11y.unnamedButtons.slice(0, 3).map((b) => `${p.finalUrl}: ${b}`)),
      affected: btnPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Icon-only buttons with no text or aria-label are announced as just "button", leaving screen-reader users guessing.',
      recommendation: 'Give each button visible text or an aria-label describing its action.',
    });
  }

  const linkPages = pagesWith(pages, (p) => p.a11y.unnamedLinks.length > 0);
  if (linkPages.length) {
    findings.push({
      ...common,
      id: 'a11y.unnamed-links',
      title: 'Links without an accessible name',
      severity: 'medium',
      confidence: 'medium',
      evidence: linkPages.slice(0, 4).flatMap((p) => p.a11y.unnamedLinks.slice(0, 3).map((l) => `${p.finalUrl}: ${l}`)),
      affected: linkPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Links that contain only an icon or image without alt text have no name for assistive technology.',
      recommendation: 'Add link text, an aria-label, or alt text on the linked image.',
    });
  }

  const noLang = pagesWith(pages, (p) => !p.lang);
  if (noLang.length) {
    findings.push({
      ...common,
      id: 'a11y.missing-lang',
      title: `No document language declared on ${plural(noLang.length, 'page')}`,
      severity: 'medium',
      confidence: 'high',
      evidence: [`${noLang.length} of ${n} inspected pages have no lang attribute on <html>.`],
      affected: noLang.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Screen readers use the language to choose pronunciation; browsers use it for translation and hyphenation.',
      recommendation: 'Add a lang attribute, e.g. <html lang="en-GB">.',
    });
  }

  const skipPages = pagesWith(pages, (p) => p.a11y.headingSkips.length > 0);
  if (skipPages.length) {
    findings.push({
      ...common,
      id: 'a11y.heading-skips',
      title: 'Heading levels are skipped',
      severity: 'low',
      confidence: 'high',
      evidence: skipPages.slice(0, 4).flatMap((p) => p.a11y.headingSkips.slice(0, 2).map((s) => `${p.finalUrl}: ${s}`)),
      affected: skipPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Screen-reader users navigate by headings; skipped levels make the structure harder to follow.',
      recommendation: 'Use headings in order (H1 → H2 → H3) and style them with CSS rather than picking levels for their size.',
    });
  }

  const tabPages = pagesWith(pages, (p) => p.a11y.positiveTabindex > 0);
  if (tabPages.length) {
    findings.push({
      ...common,
      id: 'a11y.positive-tabindex',
      title: 'Positive tabindex values change keyboard order',
      severity: 'low',
      confidence: 'high',
      evidence: tabPages.slice(0, 5).map((p) => `${p.finalUrl}: ${p.a11y.positiveTabindex} element(s) with tabindex > 0`),
      affected: tabPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'tabindex values above 0 override the natural keyboard order, which often confuses keyboard users.',
      recommendation: 'Use tabindex="0" or "-1" only, and fix order via the DOM structure.',
    });
  }

  const zoomPages = pagesWith(pages, (p) => zoomDisabled(p.viewport));
  if (zoomPages.length) {
    findings.push({
      ...common,
      category: 'mobile',
      id: 'a11y.zoom-disabled',
      title: 'Pinch-zoom is disabled by the viewport tag',
      severity: 'medium',
      confidence: 'high',
      evidence: zoomPages.slice(0, 5).map((p) => `${p.finalUrl}: viewport="${p.viewport}"`),
      affected: zoomPages.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Preventing zoom (user-scalable=no or maximum-scale below 2) stops low-vision users from enlarging text.',
      recommendation: 'Remove user-scalable=no and maximum-scale restrictions from the viewport meta tag.',
    });
  }

  const noViewport = pagesWith(pages, (p) => !p.viewport);
  if (noViewport.length) {
    findings.push({
      ...common,
      category: 'mobile',
      id: 'mobile.missing-viewport',
      title: `No mobile viewport meta tag on ${plural(noViewport.length, 'page')}`,
      severity: 'high',
      confidence: 'high',
      evidence: [`${noViewport.length} of ${n} inspected pages have no <meta name="viewport">.`],
      affected: noViewport.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Without a viewport tag, mobile browsers render the page at desktop width and shrink it, making text tiny and tap targets hard to hit.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> and make sure the layout is responsive.',
      effort: 'medium',
    });
  }
  const badViewport = pagesWith(pages, (p) => Boolean(p.viewport) && !/width\s*=\s*device-width/i.test(p.viewport ?? ''));
  if (badViewport.length) {
    findings.push({
      ...common,
      category: 'mobile',
      id: 'mobile.viewport-not-device-width',
      title: 'Viewport tag does not use width=device-width',
      severity: 'medium',
      confidence: 'high',
      evidence: badViewport.slice(0, 5).map((p) => `${p.finalUrl}: viewport="${p.viewport}"`),
      affected: badViewport.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'A fixed-width viewport usually means the page is not adapting to phone screens.',
      recommendation: 'Use width=device-width, initial-scale=1 and a responsive layout.',
      effort: 'medium',
    });
  }
  return findings;
}

/** Mobile & UX custom score checks. */
export function mobileChecks(start: PageData | null, lh: LighthouseSummary | null): CheckResult[] {
  const c = new CheckList('mobileUx');
  if (start) {
    const ok = Boolean(start.viewport && /width\s*=\s*device-width/i.test(start.viewport));
    c.bool('viewport', 'Responsive viewport (width=device-width)', 3, ok, start.viewport ? `viewport="${start.viewport}"` : 'No viewport meta tag.');
    c.bool('zoom', 'Pinch-zoom not disabled', 2, !zoomDisabled(start.viewport), start.viewport ?? 'No viewport meta tag (zoom not restricted).');
  } else {
    c.skip('viewport', 'Responsive viewport (width=device-width)', 3, 'Start page HTML not available.');
    c.skip('zoom', 'Pinch-zoom not disabled', 2, 'Start page HTML not available.');
  }

  const outcome = (id: string) => lh?.auditOutcomes[id];
  const lhAudit = (id: string, checkId: string, label: string, weight: number) => {
    const o = outcome(id);
    if (!lh) return c.skip(checkId, label, weight, 'Lighthouse did not run.');
    if (!o || o.score === null || o.mode === 'notApplicable' || o.mode === 'manual') {
      return c.skip(checkId, label, weight, `Lighthouse audit "${id}" not available in this run.`);
    }
    if (o.score >= 0.9) c.pass(checkId, label, weight, `Lighthouse "${id}" passed.`);
    else c.fail(checkId, label, weight, `Lighthouse "${id}" failed${o.displayValue ? `: ${o.displayValue}` : ''}.`);
  };
  lhAudit('target-size', 'tap-targets', 'Touch targets large enough and spaced (Lighthouse)', 2);

  const metric = (id: string, checkId: string, label: string, weight: number, good: number, ni: number, fmt: (v: number) => string) => {
    const m = lh?.metrics.find((x) => x.id === id);
    if (!m || m.numericValue === null) return c.skip(checkId, label, weight, lh ? `${id} not reported (performance category not run?).` : 'Lighthouse did not run.');
    const v = m.numericValue;
    const detail = `Lab ${lh!.strategy}: ${fmt(v)} (good ≤ ${fmt(good)}, needs improvement ≤ ${fmt(ni)})`;
    if (v <= good) c.pass(checkId, label, weight, detail);
    else if (v <= ni) c.warn(checkId, label, weight, detail, 0.5);
    else c.fail(checkId, label, weight, detail);
  };
  const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  metric('largest-contentful-paint', 'lcp', 'Largest Contentful Paint (lab)', 2, 2500, 4000, ms);
  metric('cumulative-layout-shift', 'cls', 'Layout stability - CLS (lab)', 2, 0.1, 0.25, (v) => v.toFixed(2));
  metric('total-blocking-time', 'tbt', 'Responsiveness - Total Blocking Time (lab)', 1, 200, 600, ms);
  return c.items;
}
