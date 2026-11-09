import type { BusinessSignals, CheckResult, JourneySummary } from '@chazon/shared';
import type { FindingDraft } from '../findings/priority';
import { CheckList } from '../scoring/checks';
import { normaliseUrl } from '../crawl/urls';
import { plural, uniq } from '../util/text';
import type { PageData } from './page';

const CONTACT_PATH = /(contact|enquir|inquir|get-in-touch|kontakt|contacto)/i;
export const SERVICE_PATH = /\/(services?|solutions|what-we-do|offerings?|treatments|products?|packages|pricing|plans|courses|menu)(\/|$)/i;
/** Enquiry forms with more fields than this are flagged for review (heuristic, not a rule). */
export const LONG_FORM_FIELDS = 8;

function hasNextStep(p: PageData): boolean {
  return p.ctas.some((c) => c.strength === 'primary') || p.contactLinks.length > 0 || p.tel.length + p.mailto.length + p.whatsapp.length > 0 || p.booking.length > 0 || p.forms.some((f) => f.kind === 'enquiry') || p.embeddedForms.length > 0;
}

/** Aggregates the per-page business signals used by the readiness checklist (findings/readiness.ts). */
export function summariseBusiness(pages: PageData[]): BusinessSignals {
  const policyLinks: BusinessSignals['policyLinks'] = [];
  for (const p of pages) {
    for (const l of p.business.policyLinks) {
      if (policyLinks.filter((x) => x.kind === l.kind).length < 3 && !policyLinks.some((x) => x.href === l.href)) policyLinks.push(l);
    }
  }
  const paymentMethods = new Map<string, string>();
  for (const p of pages) for (const m of p.business.paymentMethods) if (!paymentMethods.has(m)) paymentMethods.set(m, p.finalUrl);
  return {
    policyLinks,
    paymentMethods: [...paymentMethods.entries()].slice(0, 15).map(([method, pageUrl]) => ({ method, pageUrl })),
    mapLinks: uniq(pages.flatMap((p) => p.business.mapLinks)).slice(0, 5),
    pinCodes: uniq(pages.flatMap((p) => p.business.pinCodes)).slice(0, 5),
    gstinPages: pages.filter((p) => p.business.gstin).map((p) => p.finalUrl).slice(0, 5),
    indianPhones: uniq(pages.flatMap((p) => p.business.indianPhones)).slice(0, 5),
    formHints: pages
      .flatMap((p) => p.forms.filter((f) => f.kind === 'enquiry').map((f) => ({ pageUrl: p.finalUrl, ...f.hints })))
      .slice(0, 10),
    serviceDescriptions: pages
      .filter((p, i) => i > 0 && SERVICE_PATH.test(new URL(p.finalUrl).pathname))
      .slice(0, 15)
      .map((p) => ({ url: p.finalUrl, heading: p.h1[0] ?? null, words: p.wordCount })),
  };
}

export function summariseJourney(pages: PageData[], sitemapUrls: string[]): JourneySummary {
  const start = pages[0];
  const allInternal = new Set(pages.flatMap((p) => p.internalLinks.map((l) => l.href)));
  const inspected = new Set(pages.flatMap((p) => [p.url, p.finalUrl]));

  const contactPages = uniq(
    [...pages.flatMap((p) => p.contactLinks.map((c) => c.href)), ...pages.filter((p) => CONTACT_PATH.test(new URL(p.finalUrl).pathname)).map((p) => p.finalUrl)].filter(
      (u) => !/^(mailto|tel):/i.test(u),
    ),
  ).slice(0, 10);

  const discoverability: string[] = [];
  if (start) {
    const homeLinks = new Set(start.internalLinks.map((l) => l.href));
    const contactNotOnHome = contactPages.filter((u) => inspected.has(u) && !homeLinks.has(u));
    if (contactPages.length && contactPages.every((u) => !homeLinks.has(u)) && contactNotOnHome.length) {
      discoverability.push(`A contact page (${contactNotOnHome[0]}) exists but is not linked from the start page.`);
    }
    const sample = sitemapUrls
      .slice(0, 50)
      .map((u) => normaliseUrl(u))
      .filter((u): u is string => Boolean(u));
    const unlinked = sample.filter((u) => !allInternal.has(u) && !inspected.has(u));
    if (sample.length >= 5 && unlinked.length / sample.length >= 0.3) {
      discoverability.push(
        `${unlinked.length} of the first ${sample.length} sitemap URLs were not linked from any inspected page (limited sample - they may be linked from pages that were not crawled).`,
      );
    }
  }

  const ctas = pages.flatMap((p) => p.ctas.map((c) => ({ ...c, pageUrl: p.finalUrl })));
  const dedupCtas = new Map<string, JourneySummary['ctas'][number]>();
  for (const c of ctas) if (!dedupCtas.has(c.text.toLowerCase()) && dedupCtas.size < 30) dedupCtas.set(c.text.toLowerCase(), c);

  const productPages = pages.filter((p) => p.ecommerce.isProductPage).map((p) => p.finalUrl);
  const ecomSignals = uniq(pages.flatMap((p) => p.ecommerce.signals));

  return {
    pagesAnalysed: pages.length,
    navigation: {
      present: Boolean(start?.nav.present),
      linkCount: start?.nav.links.length ?? 0,
      links: start?.nav.links.slice(0, 30) ?? [],
    },
    contactPages,
    emails: uniq(pages.flatMap((p) => p.mailto)).slice(0, 10),
    phones: uniq(pages.flatMap((p) => p.tel)).slice(0, 10),
    whatsapp: uniq(pages.flatMap((p) => p.whatsapp)).slice(0, 5),
    forms: pages.flatMap((p) => p.forms.map((f) => ({ pageUrl: p.finalUrl, kind: f.kind, fieldCount: f.fieldCount, unlabeledFields: f.unlabeled.length }))).slice(0, 30),
    embeddedForms: pages.flatMap((p) => p.embeddedForms.map((provider) => ({ pageUrl: p.finalUrl, provider }))).slice(0, 10),
    bookingLinks: uniq(pages.flatMap((p) => p.booking.map((b) => JSON.stringify(b))))
      .slice(0, 10)
      .map((s) => JSON.parse(s) as JourneySummary['bookingLinks'][number]),
    ctas: [...dedupCtas.values()],
    homepagePrimaryCtas: start?.ctas.filter((c) => c.strength === 'primary').length ?? 0,
    ecommerce: {
      signals: ecomSignals,
      productPages: productPages.slice(0, 10),
      priceSamples: uniq(pages.flatMap((p) => p.ecommerce.prices)).slice(0, 6),
      cartLinks: uniq(pages.flatMap((p) => p.ecommerce.cartLinks)).slice(0, 5),
      checkoutLinks: uniq(pages.flatMap((p) => p.ecommerce.checkoutLinks)).slice(0, 5),
    },
    socialProfiles: uniq(pages.flatMap((p) => p.social.map((s) => JSON.stringify(s))))
      .slice(0, 12)
      .map((s) => JSON.parse(s) as { network: string; url: string }),
    address: uniq(pages.flatMap((p) => p.address)).slice(0, 4),
    openingHours: uniq(pages.flatMap((p) => p.openingHours)).slice(0, 7),
    discoverability,
    contactInHeader: Boolean(start?.contactInHeader),
    trustSignals: pages.flatMap((p) => p.trust.signals.map((signal) => ({ pageUrl: p.finalUrl, signal }))).slice(0, 12),
    privacyPolicy: pages.map((p) => p.trust.privacyLink).find(Boolean) ?? null,
    aboutPage: pages.map((p) => p.trust.aboutLink).find(Boolean) ?? null,
    servicePages: pages
      .filter((p, i) => i > 0 && SERVICE_PATH.test(new URL(p.finalUrl).pathname))
      .slice(0, 15)
      .map((p) => ({ url: p.finalUrl, hasNextStep: hasNextStep(p) })),
    unlinkedPhones: pages.some((p) => p.tel.length) ? [] : uniq(pages.flatMap((p) => p.phoneText)).slice(0, 5),
    business: summariseBusiness(pages),
  };
}

export function analyzeJourney(j: JourneySummary, pages: PageData[]): { findings: FindingDraft[]; checks: CheckResult[] } {
  const findings: FindingDraft[] = [];
  const c = new CheckList('conversionReadiness');
  const start = pages[0];
  const scope = plural(j.pagesAnalysed, 'inspected page');
  const enquiryForms = j.forms.filter((f) => f.kind === 'enquiry');
  const hasForm = enquiryForms.length > 0 || j.embeddedForms.length > 0;
  const directContact = j.emails.length + j.phones.length + j.whatsapp.length > 0;
  const base = { source: 'custom' as const, category: 'journey' as const, effort: 'low' as const };

  if (!start) {
    for (const [id, label, w] of [
      ['contact-path', 'A contact route is visible from the start page', 3],
      ['primary-cta', 'Start page has a clear call to action', 3],
    ] as const) c.skip(id, label, w, 'Start page HTML not available.');
    return { findings, checks: c.items };
  }

  const startContact = start.contactLinks.length > 0 || start.mailto.length + start.tel.length + start.whatsapp.length > 0;
  c.bool('contact-path', 'A contact route is visible from the start page', 3, startContact,
    startContact ? 'Contact link, email, phone or WhatsApp link found on the start page.' : 'No contact link, email, phone or WhatsApp link found on the start page.');
  c.bool('primary-cta', 'Start page has a clear call to action', 3, j.homepagePrimaryCtas > 0,
    j.homepagePrimaryCtas > 0 ? `${j.homepagePrimaryCtas} action-oriented link(s)/button(s) detected.` : 'No action-oriented link or button text detected.');
  c.bool('enquiry-form', 'An enquiry/contact form is available', 2, hasForm,
    hasForm ? `${enquiryForms.length} native enquiry form(s), ${j.embeddedForms.length} embedded form(s).` : `None detected in ${scope}.`);
  c.bool('direct-contact', 'Clickable email, phone or WhatsApp link available', 2, directContact,
    directContact ? `${j.emails.length} email, ${j.phones.length} phone, ${j.whatsapp.length} WhatsApp link(s).` : `None detected in ${scope}.`);
  c.bool('navigation', 'Start page has a navigation menu', 1, j.navigation.present,
    j.navigation.present ? `${j.navigation.linkCount} navigation links.` : 'No <nav> or role="navigation" element found.');
  const formsWithFields = j.forms.filter((f) => f.kind === 'enquiry' || f.kind === 'newsletter');
  if (formsWithFields.length) {
    c.ratio('form-labels', 'Enquiry/newsletter form fields are labelled', 1, formsWithFields.filter((f) => f.unlabeledFields === 0).length, formsWithFields.length, 'forms');
  } else c.skip('form-labels', 'Enquiry/newsletter form fields are labelled', 1, 'Not applicable: no native enquiry or newsletter forms found.');

  const anyContact = startContact || j.contactPages.length > 0 || directContact || hasForm;
  if (anyContact) {
    c.bool('contact-in-header', 'Contact route in the header or main navigation', 2, j.contactInHeader,
      j.contactInHeader ? 'Contact link, email, phone or WhatsApp link found in the start page header/navigation.' : 'Contact options exist, but none were found inside <header> or <nav> on the start page.');
  } else c.skip('contact-in-header', 'Contact route in the header or main navigation', 2, 'Not applicable: no contact route was detected at all (see the contact-route check).', 'not-applicable');

  if (j.servicePages.length) {
    c.ratio('service-next-step', 'Service/product pages offer a next step', 2, j.servicePages.filter((s) => s.hasNextStep).length, j.servicePages.length);
  } else c.skip('service-next-step', 'Service/product pages offer a next step', 2, 'Not applicable: no service or product pages were among the inspected pages.', 'not-applicable');

  if (j.phones.length) c.pass('click-to-call', 'Phone number is tap-to-call (tel: link)', 1, `${j.phones.length} tel: link(s) found.`);
  else if (j.unlinkedPhones.length) c.fail('click-to-call', 'Phone number is tap-to-call (tel: link)', 1, `Phone number shown as text only: ${j.unlinkedPhones.slice(0, 2).join(', ')}`);
  else c.skip('click-to-call', 'Phone number is tap-to-call (tel: link)', 1, 'Not applicable: no phone number detected on the inspected pages.', 'not-applicable');

  const dataForms = pages.filter((p) => p.forms.some((f) => f.kind === 'enquiry' || f.kind === 'newsletter') || p.embeddedForms.length > 0);
  if (dataForms.length) {
    c.ratio('form-privacy', 'Pages with forms link to a privacy policy', 1, dataForms.filter((p) => p.trust.privacyLink).length, dataForms.length);
  } else c.skip('form-privacy', 'Pages with forms link to a privacy policy', 1, 'Not applicable: no forms that collect contact details were found.', 'not-applicable');

  if (j.trustSignals.length) c.pass('trust-signals', 'Testimonials or reviews visible', 1, `${j.trustSignals.length} signal(s), e.g. ${j.trustSignals[0]!.signal}.`);
  else c.warn('trust-signals', 'Testimonials or reviews visible', 1, `None detected in ${scope} (they may exist on other pages or as images).`, 0.5);

  const isShop = j.ecommerce.signals.length > 0;
  if (isShop) {
    const cart = j.ecommerce.cartLinks.length + j.ecommerce.checkoutLinks.length > 0 || j.ecommerce.signals.includes('Add-to-cart control');
    c.bool('cart-path', 'Shop: cart / checkout path detectable', 2, cart, cart ? 'Cart/checkout link or add-to-cart control found.' : 'Product signals found but no cart/checkout link detected.');
    c.bool('prices', 'Shop: prices visible on inspected pages', 1, j.ecommerce.priceSamples.length > 0, j.ecommerce.priceSamples.length ? `e.g. ${j.ecommerce.priceSamples.slice(0, 3).join(', ')}` : 'No price text detected.');
  } else {
    c.skip('cart-path', 'Shop: cart / checkout path detectable', 2, 'No e-commerce signals detected (not applicable).');
    c.skip('prices', 'Shop: prices visible on inspected pages', 1, 'No e-commerce signals detected (not applicable).');
  }

  // Observations ------------------------------------------------------------------------
  if (!startContact && j.contactPages.length === 0 && !directContact && !hasForm) {
    findings.push({
      ...base,
      id: 'journey.no-contact-route',
      title: 'No contact route detected on the inspected pages',
      severity: 'medium',
      confidence: 'medium',
      evidence: [`No contact page link, email/phone/WhatsApp link or enquiry form was found in ${scope}.`],
      affected: pages.map((p) => p.finalUrl).slice(0, 10),
      explanation: 'Visitors who are ready to act need an obvious next step. Contact options may exist on pages that were not crawled or be rendered by JavaScript, so confirm manually.',
      recommendation: 'Make a contact route (page link, click-to-call or email link) visible in the header or footer of every page.',
      service: 'CONVERT',
    });
  } else if (!startContact) {
    findings.push({
      ...base,
      id: 'journey.contact-not-on-start',
      title: 'No contact route visible on the start page',
      severity: 'low',
      confidence: 'medium',
      evidence: ['Contact options were found on other pages, but not on the start page itself.'],
      affected: [start.finalUrl],
      explanation: 'Many visitors land on the home page; a visible contact route there shortens the path to an enquiry.',
      recommendation: 'Add a contact link or button to the header or footer navigation.',
      service: 'CONVERT',
    });
  }
  if (j.homepagePrimaryCtas === 0) {
    findings.push({
      ...base,
      id: 'journey.no-primary-cta',
      title: 'No clear call to action detected on the start page',
      severity: 'low',
      confidence: 'medium',
      evidence: [`No link or button text such as "Contact us", "Book", "Get a quote" or "Shop now" was found on ${start.finalUrl}.`],
      affected: [start.finalUrl],
      explanation: 'A clear call to action tells visitors what to do next. Detection is text-based, so image buttons or unusual wording may be missed.',
      recommendation: 'Add one prominent, specific primary action (e.g. "Request a quote") above the fold.',
      service: 'CONVERT',
    });
  }
  if (!j.navigation.present) {
    findings.push({
      ...base,
      id: 'journey.no-navigation',
      title: 'No semantic navigation menu found on the start page',
      severity: 'low',
      confidence: 'low',
      evidence: ['No <nav> or role="navigation" element in the server HTML.'],
      affected: [start.finalUrl],
      explanation: 'A semantic nav element helps assistive technology and makes key pages discoverable. The site may use a menu built differently.',
      recommendation: 'Wrap the main menu in a <nav> element with clear labels.',
      service: 'BUILD',
    });
  }
  for (const note of j.discoverability) {
    findings.push({
      ...base,
      id: note.startsWith('A contact page') ? 'journey.contact-not-linked' : 'journey.sitemap-unlinked',
      title: note.startsWith('A contact page') ? 'Contact page is not linked from the start page' : 'Some sitemap pages may be hard to discover',
      severity: note.startsWith('A contact page') ? 'low' : 'info',
      confidence: note.startsWith('A contact page') ? 'medium' : 'low',
      evidence: [note],
      affected: [start.finalUrl],
      explanation: 'Pages that are not linked from navigation are harder for visitors and crawlers to find.',
      recommendation: 'Link important pages from the main navigation or footer.',
      service: note.startsWith('A contact page') ? 'CONVERT' : 'GROW',
    });
  }
  if (anyContact && !j.contactInHeader) {
    findings.push({
      ...base,
      id: 'journey.contact-not-in-header',
      title: 'No contact route in the header or main navigation',
      severity: 'low',
      confidence: 'medium',
      evidence: [`Contact options were found (${[j.contactPages.length && 'contact page', j.phones.length && 'phone link', j.emails.length && 'email link', j.whatsapp.length && 'WhatsApp link', hasForm && 'form'].filter(Boolean).join(', ')}), but none inside the <header> or <nav> of ${start.finalUrl}.`],
      observed: 'Contact route only outside the header/navigation',
      affected: [start.finalUrl],
      explanation: 'Visitors usually look for contact options at the top of the page; on mobile the header or menu is often the only persistent navigation. Detection relies on semantic <header>/<nav> elements, so a visually similar layout may be missed.',
      recommendation: 'Add a contact link or button (and a tap-to-call link where phone enquiries matter) to the header or main menu.',
      service: 'CONVERT',
    });
  }
  const noStep = j.servicePages.filter((s) => !s.hasNextStep);
  if (noStep.length) {
    findings.push({
      ...base,
      id: 'journey.service-pages-no-next-step',
      title: `${plural(noStep.length, 'service/product page')} without a clear next step`,
      severity: 'low',
      confidence: 'medium',
      evidence: noStep.slice(0, 6).map((s) => `${s.url}: no action-oriented button, contact link, phone/email link, booking link or enquiry form found`),
      observed: `${noStep.length} of ${j.servicePages.length} inspected service/product pages`,
      affected: noStep.map((s) => s.url).slice(0, 15),
      explanation: 'Service and product pages are where interested visitors decide; if the next step is not on the page, they must go looking for it. Detection is text-based and may miss image buttons.',
      recommendation: 'End each service page with a specific action (e.g. "Request a quote for this service") linking to the enquiry route.',
      service: 'CONVERT',
    });
  }
  if (j.unlinkedPhones.length) {
    findings.push({
      ...base,
      id: 'journey.phone-not-clickable',
      title: 'Phone number shown as text but not tap-to-call',
      severity: 'low',
      confidence: 'low',
      evidence: [`Phone-like number(s) next to words such as "call" or "phone": ${j.unlinkedPhones.join(', ')}`, `No tel: links were found on the ${scope}.`],
      observed: 'Phone number in text, no tel: link',
      expected: `<a href="tel:${j.unlinkedPhones[0]!.replace(/[^\d+]/g, '')}">…</a>`,
      affected: pages.filter((p) => p.phoneText.length).map((p) => p.finalUrl).slice(0, 10),
      explanation: 'On phones, a tel: link lets visitors call with one tap. Number detection is heuristic and may pick up other numbers.',
      recommendation: 'Wrap the business phone number in a tel: link wherever it appears, especially in the header and footer.',
      service: 'CONVERT',
    });
  }
  const formNoPrivacy = dataForms.filter((p) => !p.trust.privacyLink);
  if (formNoPrivacy.length) {
    findings.push({
      ...base,
      id: 'journey.form-no-privacy-link',
      title: `Form without a privacy policy link on ${plural(formNoPrivacy.length, 'page')}`,
      severity: 'low',
      confidence: 'medium',
      evidence: formNoPrivacy.slice(0, 5).map((p) => `${p.finalUrl}: form collecting contact details, no link containing "privacy" on the page`),
      observed: `${formNoPrivacy.length} of ${dataForms.length} pages with forms`,
      affected: formNoPrivacy.map((p) => p.finalUrl).slice(0, 15),
      explanation: 'Visitors are more willing to share details when they can see how they will be used, and many data-protection laws expect a privacy notice where personal data is collected. This is not legal advice.',
      recommendation: 'Link the privacy policy near each form (and in the footer) and say briefly how enquiries are used.',
      service: 'CONVERT',
    });
  }
  const longForms = j.forms.filter((f) => f.kind === 'enquiry' && f.fieldCount > LONG_FORM_FIELDS);
  if (longForms.length) {
    findings.push({
      ...base,
      id: 'journey.long-enquiry-form',
      title: 'Long enquiry form',
      severity: 'info',
      confidence: 'low',
      evidence: longForms.slice(0, 4).map((f) => `${f.pageUrl}: ${f.fieldCount} fields`),
      observed: `Up to ${Math.max(...longForms.map((f) => f.fieldCount))} visible fields`,
      expected: `Only essential fields (often ${LONG_FORM_FIELDS} or fewer for a first enquiry)`,
      affected: uniq(longForms.map((f) => f.pageUrl)).slice(0, 10),
      explanation: 'Each extra field adds effort for the visitor. Some businesses legitimately need detailed forms (e.g. quotes), so review rather than assume a problem.',
      recommendation: 'Review which fields are needed for the first response; make the rest optional or ask later.',
      service: 'CONVERT',
    });
  }
  if (j.trustSignals.length === 0) {
    findings.push({
      ...base,
      id: 'journey.no-trust-signals',
      title: 'No testimonials or reviews detected on the inspected pages',
      severity: 'info',
      confidence: 'low',
      evidence: [`No review markup, testimonial/review sections or review widgets were found in ${scope}.`],
      affected: [start.finalUrl],
      explanation: 'Genuine testimonials and reviews can help new visitors decide. Their absence here is only an observation: they may exist on other pages, as images, or on third-party sites.',
      recommendation: 'If the business has genuine customer feedback, consider showing a selection on key pages with permission.',
      service: 'CONVERT',
    });
  }
  if (isShop && !(j.ecommerce.cartLinks.length + j.ecommerce.checkoutLinks.length > 0 || j.ecommerce.signals.includes('Add-to-cart control'))) {
    findings.push({
      ...base,
      id: 'journey.shop-no-cart',
      title: 'Product signals found but no cart or checkout path detected',
      severity: 'info',
      confidence: 'low',
      evidence: [`Signals: ${j.ecommerce.signals.join(', ')}`],
      affected: j.ecommerce.productPages.slice(0, 10),
      explanation: 'The business may sell offline or via enquiry intentionally, or the cart may be rendered by JavaScript, so this is an observation only.',
      recommendation: 'Confirm with the business how customers are expected to buy, and make that path obvious on product pages.',
      service: 'CONVERT',
    });
  }
  return { findings, checks: c.items };
}
