import type { BusinessReadiness, BusinessSignals, DiscoveryAnswers, JourneySummary, ReadinessItem, ReadinessOutcome, ReadinessProfile } from '@chazon/shared';
import { plural, uniq } from '../util/text';
import type { ReportCore } from './insights';

/**
 * India business readiness checklist. Every item is derived from signals already in the report
 * (journey summary and its business signals); nothing is measured here. Absence is reported as
 * "not detected" - a prompt for a manual check, never a conclusion that something is missing,
 * non-compliant or costing sales.
 */

/** Below this many visible words a service page is reported as only partly described (a guideline). */
export const SERVICE_WORDS_MIN = 150;

const EMPTY_SIGNALS: BusinessSignals = { policyLinks: [], paymentMethods: [], mapLinks: [], pinCodes: [], gstinPages: [], indianPhones: [], formHints: [], serviceDescriptions: [] };

const OWNER_PROFILE: Partial<Record<NonNullable<DiscoveryAnswers['businessType']>, ReadinessProfile>> = {
  ecommerce: 'ecommerce',
  'local-service': 'local-service',
  hospitality: 'local-service',
  healthcare: 'local-service',
  'professional-service': 'service-b2b',
  software: 'service-b2b',
  education: 'service-b2b',
  nonprofit: 'service-b2b',
};

const PROFILE_LABEL: Record<ReadinessProfile, string> = { 'local-service': 'local service business', ecommerce: 'e-commerce website', 'service-b2b': 'service / B2B website' };

function pickProfile(j: JourneySummary, d: DiscoveryAnswers | null): Pick<BusinessReadiness, 'profile' | 'profileBasis' | 'profileNote'> {
  const owner = d?.businessType ? OWNER_PROFILE[d.businessType] : undefined;
  if (owner) return { profile: owner, profileBasis: 'owner-answer', profileNote: `Shown first as a ${PROFILE_LABEL[owner]} because of the owner’s answer to “type of business”.` };
  const b = j.business ?? EMPTY_SIGNALS;
  const shop = j.ecommerce.signals.length > 0 || j.ecommerce.cartLinks.length + j.ecommerce.checkoutLinks.length > 0;
  if (shop) return { profile: 'ecommerce', profileBasis: 'detected', profileNote: `Shown first as an e-commerce website because product signals were detected (${j.ecommerce.signals.slice(0, 2).join(', ') || 'cart/checkout links'}).` };
  const local = j.address.length > 0 || b.mapLinks.length > 0 || b.pinCodes.length > 0 || j.openingHours.length > 0;
  if (local) return { profile: 'local-service', profileBasis: 'detected', profileNote: 'Shown first as a local service business because address, map, PIN code or opening-hours details were detected.' };
  return { profile: 'service-b2b', profileBasis: 'default', profileNote: 'No shop or local-business signals were detected, so service / B2B checks are shown first. Choose another profile if it fits better.' };
}

type Draft = Omit<ReadinessItem, 'profile' | 'pages' | 'evidence' | 'relatedFindingIds'> & Partial<Pick<ReadinessItem, 'pages' | 'evidence' | 'relatedFindingIds'>>;

export function buildReadiness(r: ReportCore, discovery: DiscoveryAnswers | null): BusinessReadiness | null {
  const j = r.journey;
  if (!j) return null;
  const b = j.business ?? EMPTY_SIGNALS;
  const scope = plural(j.pagesAnalysed, 'inspected page');
  const notDetected = (what: string) => `${what} was not detected on the ${scope}. It may exist on other pages, in images or behind JavaScript - check manually.`;
  const items: ReadinessItem[] = [];
  const findingIds = new Set(r.findings.map((f) => f.id));
  const add = (profile: ReadinessProfile, d: Draft) => {
    items.push({ ...d, evidence: (d.evidence ?? []).slice(0, 10), relatedFindingIds: (d.relatedFindingIds ?? []).filter((id) => findingIds.has(id)), pages: uniq(d.pages ?? []).slice(0, 8), profile });
  };

  const forms = j.forms.filter((f) => f.kind === 'enquiry');
  const hasForm = forms.length + j.embeddedForms.length > 0;
  const direct = [...j.phones.map((p) => `Phone link: ${p}`), ...j.emails.map((e) => `Email link: ${e}`), ...j.whatsapp.map((w) => `WhatsApp link: ${w}`)];
  const policies = (kind: BusinessSignals['policyLinks'][number]['kind']) => b.policyLinks.filter((p) => p.kind === kind);
  const policyEvidence = (list: BusinessSignals['policyLinks']) => list.map((p) => `Link “${p.text || p.href}” → ${p.href}`);
  const contactEvidence = [...j.contactPages.slice(0, 3).map((u) => `Contact page: ${u}`), ...direct.slice(0, 4), ...(hasForm ? [`${forms.length} enquiry form(s), ${j.embeddedForms.length} embedded form(s)`] : [])];

  // --- Local service ---------------------------------------------------------------------------
  {
    const indian = b.indianPhones.length ? ` (${b.indianPhones.length} in Indian format)` : '';
    const outcome: ReadinessOutcome = j.phones.length ? 'found' : j.unlinkedPhones.length ? 'partial' : 'not-detected';
    add('local-service', {
      id: 'local.phone-clickable',
      question: 'Is the phone number visible and clickable?',
      outcome,
      detail:
        outcome === 'found'
          ? `${plural(j.phones.length, 'tap-to-call (tel:) link')} found${indian}.`
          : outcome === 'partial'
            ? `A phone number is shown as text (${j.unlinkedPhones.slice(0, 2).join(', ')}) but no tap-to-call link was found.`
            : notDetected('A phone number'),
      evidence: [...j.phones.map((p) => `tel: ${p}`), ...j.unlinkedPhones.map((p) => `Text only: ${p}`)],
      whyItMatters: 'Many visitors in India browse on phones and prefer to call or WhatsApp. A tap-to-call link removes the need to copy the number.',
      suggestion: outcome === 'found' ? 'Keep the number in the header or footer of every page.' : 'Show the business number in the header and footer and wrap it in a tel: link (for example tel:+91XXXXXXXXXX).',
      service: 'CONVERT',
      relatedFindingIds: ['journey.phone-not-clickable'],
    });
  }
  {
    const anyContact = contactEvidence.length > 0;
    const outcome: ReadinessOutcome = anyContact && j.contactInHeader ? 'found' : anyContact ? 'partial' : 'not-detected';
    add('local-service', {
      id: 'local.contact-discoverable',
      question: 'Are contact and enquiry options discoverable?',
      outcome,
      detail:
        outcome === 'found'
          ? 'Contact options were found, including one in the header or main navigation.'
          : outcome === 'partial'
            ? 'Contact options were found, but none in the header or main navigation of the start page.'
            : notDetected('A contact page, phone/email/WhatsApp link or enquiry form'),
      evidence: contactEvidence,
      pages: j.contactPages,
      whyItMatters: 'Visitors who are ready to enquire look for contact options at the top of the page, especially on mobile.',
      suggestion: 'Put a “Contact” or “Call / WhatsApp” link in the header and repeat the main contact routes in the footer.',
      service: 'CONVERT',
      relatedFindingIds: ['journey.no-contact-route', 'journey.contact-not-in-header', 'journey.contact-not-on-start'],
    });
  }
  {
    const hasAddr = j.address.length > 0;
    const hasLoc = b.mapLinks.length + b.pinCodes.length > 0;
    const outcome: ReadinessOutcome = hasAddr && hasLoc ? 'found' : hasAddr || hasLoc || j.openingHours.length ? 'partial' : 'not-detected';
    add('local-service', {
      id: 'local.address',
      question: 'Are the address and location details visible?',
      outcome,
      detail:
        outcome === 'found'
          ? 'An address and location details (map link or PIN code) were found.'
          : outcome === 'partial'
            ? `Some location details were found (${[hasAddr && 'address', b.mapLinks.length && 'map link', b.pinCodes.length && 'PIN code', j.openingHours.length && 'opening hours'].filter(Boolean).join(', ')}), but not all of them.`
            : notDetected('An address, map link or PIN code'),
      evidence: [...j.address.map((a) => `Address: ${a}`), ...b.pinCodes.map((p) => `PIN code: ${p}`), ...b.mapLinks.map((m) => `Map: ${m}`), ...j.openingHours.slice(0, 2).map((h) => `Hours: ${h}`)],
      whyItMatters: 'Local customers check where you are and when you are open before visiting or calling; consistent address details also support local search listings.',
      suggestion: 'Show the full address with PIN code, a map link (e.g. your Google Business Profile) and opening hours on the contact page and in the footer, if customers visit you.',
      service: 'GROW',
    });
  }
  {
    const primary = j.homepagePrimaryCtas > 0 || j.bookingLinks.length > 0;
    const secondary = j.ctas.some((c) => c.strength === 'secondary');
    const outcome: ReadinessOutcome = primary ? 'found' : secondary ? 'partial' : 'not-detected';
    add('local-service', {
      id: 'local.next-step',
      question: 'Is there a clear next step, such as calling, booking or requesting a quote?',
      outcome,
      detail:
        outcome === 'found'
          ? `${j.homepagePrimaryCtas} primary call(s) to action on the start page${j.bookingLinks.length ? ` and ${plural(j.bookingLinks.length, 'booking link')}` : ''}.`
          : outcome === 'partial'
            ? 'Only general links such as “Learn more” were found; no specific action like “Call now”, “Book” or “Get a quote”.'
            : notDetected('A call to action'),
      evidence: [...j.ctas.filter((c) => c.strength === 'primary').slice(0, 5).map((c) => `“${c.text}” on ${c.pageUrl}`), ...j.bookingLinks.slice(0, 3).map((l) => `Booking: ${l.href}`)],
      whyItMatters: 'A specific next step tells ready visitors exactly what to do. Detection is text-based, so image buttons may be missed.',
      suggestion: 'Add one prominent, specific action near the top of the home page, e.g. “Call now”, “Book an appointment” or “Get a free quote”.',
      service: 'CONVERT',
      relatedFindingIds: ['journey.no-primary-cta'],
    });
  }
  {
    const extras = [j.aboutPage && `About page: ${j.aboutPage}`, ...b.gstinPages.slice(0, 1).map((u) => `GSTIN mentioned on ${u}`), j.socialProfiles.length && `${plural(j.socialProfiles.length, 'social profile')} linked`].filter((x): x is string => Boolean(x));
    const outcome: ReadinessOutcome = j.trustSignals.length ? 'found' : extras.length ? 'partial' : 'not-detected';
    add('local-service', {
      id: 'local.trust',
      question: 'Are relevant trust signals present?',
      outcome,
      detail:
        outcome === 'found'
          ? `${plural(j.trustSignals.length, 'testimonial/review signal')} found. Presence only - content is never judged.`
          : outcome === 'partial'
            ? 'No testimonials or reviews were detected, but other reassurance was found (about page, registration details or social profiles).'
            : notDetected('Testimonials, reviews, an about page or registration details'),
      evidence: [...j.trustSignals.slice(0, 4).map((t) => `${t.signal} - ${t.pageUrl}`), ...extras],
      whyItMatters: 'New customers often look for genuine reviews, who is behind the business and how to reach them before they enquire.',
      suggestion: 'If you have genuine customer feedback, show a few reviews (with permission), link your Google reviews, and add an About page with the people and business details.',
      service: 'CONVERT',
      relatedFindingIds: ['journey.no-trust-signals'],
    });
  }

  // --- E-commerce ------------------------------------------------------------------------------
  const shopSignals = j.ecommerce.signals.length > 0;
  const shopNote = shopSignals ? '' : ' No product signals were detected, so this may not apply.';
  const policyItem = (id: string, question: string, kinds: BusinessSignals['policyLinks'][number]['kind'][], what: string, whyItMatters: string, suggestion: string) => {
    const list = kinds.flatMap(policies);
    add('ecommerce', {
      id,
      question,
      outcome: list.length ? 'found' : 'not-detected',
      detail: list.length ? `${plural(list.length, 'link')} found, e.g. “${list[0]!.text || list[0]!.href}”.` : `${notDetected(what)}${shopNote}`,
      evidence: policyEvidence(list),
      pages: list.map((p) => p.href),
      whyItMatters,
      suggestion,
      service: 'CONVERT',
    });
  };
  policyItem(
    'shop.delivery',
    'Are delivery and shipping details discoverable?',
    ['shipping'],
    'A delivery or shipping information link',
    'Shoppers want to know delivery areas, charges and timelines (including PIN-code serviceability) before they buy.',
    'Link a delivery/shipping page from the footer and product pages: areas served, charges, timelines and how to check a PIN code.',
  );
  policyItem(
    'shop.returns',
    'Are returns, refunds and cancellations explained?',
    ['returns'],
    'A returns, refund or cancellation policy link',
    'A clear returns and refund policy reduces hesitation at checkout and avoids support queries.',
    'Publish a returns/refund/cancellation page and link it from the footer, product pages and checkout.',
  );
  {
    const methods = b.paymentMethods;
    const payLinks = policies('payment');
    const outcome: ReadinessOutcome = methods.length || payLinks.length ? 'found' : 'not-detected';
    add('ecommerce', {
      id: 'shop.payment',
      question: 'Are payment options described?',
      outcome,
      detail: outcome === 'found' ? `Payment information found: ${[...methods.map((m) => m.method), ...payLinks.map((p) => p.text)].slice(0, 6).join(', ')}.` : `${notDetected('Information about payment methods (e.g. UPI, cards, cash on delivery)')}${shopNote}`,
      evidence: [...methods.map((m) => `${m.method} mentioned on ${m.pageUrl}`), ...policyEvidence(payLinks)],
      pages: [...methods.map((m) => m.pageUrl), ...payLinks.map((p) => p.href)],
      whyItMatters: 'Showing accepted methods such as UPI, cards, net banking or cash on delivery early reassures shoppers before checkout.',
      suggestion: 'List accepted payment methods on product pages, in the footer and on a payment/FAQ page.',
      service: 'CONVERT',
    });
  }
  {
    const help = [...policies('support'), ...policies('faq'), ...policies('grievance')];
    const outcome: ReadinessOutcome = help.length && direct.length ? 'found' : help.length || direct.length || j.contactPages.length ? 'partial' : 'not-detected';
    add('ecommerce', {
      id: 'shop.support',
      question: 'Is customer support easy to find?',
      outcome,
      detail:
        outcome === 'found'
          ? 'Help/FAQ or support links and direct contact options were found.'
          : outcome === 'partial'
            ? `Some support routes were found (${[help.length && 'help/FAQ/grievance links', direct.length && 'phone/email/WhatsApp', j.contactPages.length && 'contact page'].filter(Boolean).join(', ')}), but not both help pages and direct contact.`
            : `${notDetected('A support, FAQ or contact route')}${shopNote}`,
      evidence: [...policyEvidence(help), ...direct.slice(0, 3)],
      pages: help.map((p) => p.href),
      whyItMatters: 'Shoppers want to know how to get help with an order. India’s Consumer Protection (E-Commerce) Rules, 2020 include expectations such as grievance-redressal details; this tool cannot assess compliance.',
      suggestion: 'Link a help/FAQ page and order-support contact (phone, email or WhatsApp) from the footer; confirm any legal disclosure requirements with a qualified adviser.',
      service: 'CONVERT',
    });
  }
  {
    const cart = j.ecommerce.cartLinks.length + j.ecommerce.checkoutLinks.length > 0 || j.ecommerce.signals.includes('Add-to-cart control');
    const products = j.ecommerce.productPages.length > 0;
    const outcome: ReadinessOutcome = !shopSignals ? 'manual-review' : products && cart ? 'found' : 'partial';
    add('ecommerce', {
      id: 'shop.purchase-path',
      question: 'Is there a clear route to product details and purchase actions?',
      outcome,
      detail:
        outcome === 'manual-review'
          ? `No product signals were detected on the ${scope}. If this is a shop, products may load with JavaScript or sit on pages that were not crawled - check the route from home page to checkout manually.`
          : outcome === 'found'
            ? `${plural(j.ecommerce.productPages.length, 'product page')} and a cart/checkout path were detected.`
            : `${products ? 'Product pages were found' : 'Product signals were found'}, but ${cart ? 'no product page was among the inspected pages' : 'no cart, checkout or add-to-cart control was detected'}.`,
      evidence: [...j.ecommerce.signals, ...j.ecommerce.productPages.slice(0, 3).map((u) => `Product page: ${u}`), ...[...j.ecommerce.cartLinks, ...j.ecommerce.checkoutLinks].slice(0, 2).map((u) => `Cart/checkout: ${u}`)],
      pages: j.ecommerce.productPages,
      whyItMatters: 'Shoppers should reach a product and add it to the cart in a few taps on a phone.',
      suggestion: 'Check the journey home → category → product → cart → checkout on a phone; make “Add to cart” and price visible without scrolling far.',
      service: 'BUILD',
      relatedFindingIds: ['journey.shop-no-cart'],
    });
  }
  {
    const terms = policies('terms');
    const found = terms.length > 0 && Boolean(j.privacyPolicy);
    const outcome: ReadinessOutcome = found ? 'found' : terms.length || j.privacyPolicy ? 'partial' : 'not-detected';
    add('ecommerce', {
      id: 'shop.policies',
      question: 'Are important customer-facing policies (terms, privacy) linked?',
      outcome,
      detail:
        outcome === 'found'
          ? 'Terms and a privacy policy are linked.'
          : outcome === 'partial'
            ? `${terms.length ? 'Terms are linked' : 'A privacy policy is linked'}, but ${terms.length ? 'no privacy policy link' : 'no terms link'} was detected.`
            : `${notDetected('Terms or privacy policy links')}${shopNote}`,
      evidence: [...policyEvidence(terms), ...(j.privacyPolicy ? [`Privacy policy: ${j.privacyPolicy}`] : [])],
      pages: [...terms.map((p) => p.href), ...(j.privacyPolicy ? [j.privacyPolicy] : [])],
      whyItMatters: 'Customers look for the terms of sale and how their data is used before paying. This is not legal advice.',
      suggestion: 'Link terms of sale and a privacy policy from the footer and checkout; have a qualified adviser confirm what your business must publish.',
      service: 'BUILD',
      relatedFindingIds: ['journey.form-no-privacy-link'],
    });
  }

  // --- Service / B2B ---------------------------------------------------------------------------
  {
    const pages = b.serviceDescriptions;
    const described = pages.filter((p) => p.words >= SERVICE_WORDS_MIN);
    const outcome: ReadinessOutcome = !pages.length ? 'manual-review' : described.length === pages.length ? 'found' : 'partial';
    add('service-b2b', {
      id: 'b2b.services-described',
      question: 'Are services clearly described?',
      outcome,
      detail:
        outcome === 'manual-review'
          ? `No dedicated service pages were among the ${scope}. Services may be described on the home page or on pages that were not crawled - check manually.`
          : outcome === 'found'
            ? `${plural(pages.length, 'service page')} inspected, each with at least ${SERVICE_WORDS_MIN} words of visible text.`
            : `${described.length} of ${plural(pages.length, 'inspected service page')} have at least ${SERVICE_WORDS_MIN} words; the others look brief. Word count is only a rough guide to clarity.`,
      evidence: pages.map((p) => `${p.url}: ${p.heading ? `“${p.heading}”, ` : ''}${p.words} words`),
      pages: pages.map((p) => p.url),
      whyItMatters: 'Buyers need to understand what you offer, who it is for and what happens next before they get in touch.',
      suggestion: 'Give each main service its own page: who it is for, what is included, typical process or timelines, and a clear enquiry button.',
      service: 'GROW',
      relatedFindingIds: ['seo.thin-content'],
    });
  }
  {
    const withStep = j.servicePages.filter((s) => s.hasNextStep).length;
    const startCta = j.homepagePrimaryCtas > 0;
    const servicesOk = j.servicePages.length === 0 || withStep === j.servicePages.length;
    const outcome: ReadinessOutcome = startCta && servicesOk ? 'found' : startCta || withStep > 0 ? 'partial' : 'not-detected';
    add('service-b2b', {
      id: 'b2b.cta',
      question: 'Is a relevant call to action discoverable?',
      outcome,
      detail:
        outcome === 'found'
          ? `A primary call to action is on the start page${j.servicePages.length ? ` and all ${plural(j.servicePages.length, 'inspected service page')} offer a next step` : ''}.`
          : outcome === 'partial'
            ? `${startCta ? 'The start page has a call to action' : 'The start page has no clear call to action'}; ${withStep} of ${plural(j.servicePages.length, 'service page')} offer a next step.`
            : notDetected('A call to action'),
      evidence: j.ctas.filter((c) => c.strength === 'primary').slice(0, 5).map((c) => `“${c.text}” on ${c.pageUrl}`),
      pages: j.servicePages.filter((s) => !s.hasNextStep).map((s) => s.url),
      whyItMatters: 'Service pages are where interested buyers decide; a relevant action there (e.g. “Request a proposal”) shortens the path to an enquiry.',
      suggestion: 'End every service page with a specific action linked to the enquiry route, e.g. “Request a quote for this service”.',
      service: 'CONVERT',
      relatedFindingIds: ['journey.no-primary-cta', 'journey.service-pages-no-next-step'],
    });
  }
  {
    const outcome: ReadinessOutcome = hasForm && (j.contactPages.length > 0 || direct.length > 0) ? 'found' : hasForm || j.contactPages.length || direct.length ? 'partial' : 'not-detected';
    add('service-b2b', {
      id: 'b2b.enquiry-path',
      question: 'Is there a clear enquiry path?',
      outcome,
      detail:
        outcome === 'found'
          ? 'An enquiry form and a contact page or direct contact option were found.'
          : outcome === 'partial'
            ? `Part of an enquiry path was found (${[hasForm && 'enquiry form', j.contactPages.length && 'contact page', direct.length && 'direct contact link'].filter(Boolean).join(', ')}).`
            : notDetected('An enquiry form, contact page or direct contact link'),
      evidence: contactEvidence,
      pages: [...forms.map((f) => f.pageUrl), ...j.contactPages],
      whyItMatters: 'Business buyers often prefer a form for detailed requests and a phone or email for quick questions.',
      suggestion: 'Offer a short enquiry form plus a direct email/phone, and say when you will reply.',
      service: 'CONVERT',
      relatedFindingIds: ['journey.no-contact-route'],
    });
  }
  {
    const unlabeled = forms.filter((f) => f.unlabeledFields > 0);
    const hints = b.formHints;
    const outcome: ReadinessOutcome = !hasForm ? 'not-checked' : unlabeled.length ? 'partial' : 'manual-review';
    const hintText = hints.length
      ? `Declared hints: ${hints.filter((h) => h.requiredFields > 0).length} of ${plural(hints.length, 'form')} mark required fields, ${hints.filter((h) => h.typedFields > 0).length} use typed inputs (email/tel), ${hints.filter((h) => h.hasLiveRegion || h.hasSuccessMessage).length} contain a status/success message area.`
      : j.embeddedForms.length
        ? 'Only embedded third-party forms were found; their behaviour cannot be inspected.'
        : '';
    add('service-b2b', {
      id: 'b2b.forms',
      question: 'Are forms usable, and do they give appropriate feedback?',
      outcome,
      detail:
        outcome === 'not-checked'
          ? `No enquiry forms were found on the ${scope}, so form usability was not checked.`
          : `${unlabeled.length ? `${plural(unlabeled.length, 'form')} have fields without labels. ` : 'All native enquiry-form fields have labels. '}Forms are never submitted by this tool, so error and success messages need a manual test. ${hintText}`.trim(),
      evidence: [...forms.map((f) => `${f.pageUrl}: ${f.fieldCount} fields${f.unlabeledFields ? `, ${f.unlabeledFields} without label` : ''}`), ...j.embeddedForms.map((f) => `${f.provider} (embedded) on ${f.pageUrl}`)],
      pages: [...forms.map((f) => f.pageUrl), ...j.embeddedForms.map((f) => f.pageUrl)],
      whyItMatters: 'Labelled fields, sensible required fields and a clear “thank you” or error message make it more likely an enquiry is sent and that the visitor knows it worked.',
      suggestion: 'Send a test enquiry from a phone: check every field has a label, errors explain what to fix, and a confirmation appears (and arrives in your inbox).',
      service: 'CONVERT',
      relatedFindingIds: ['a11y.unlabeled-fields', 'journey.long-enquiry-form'],
    });
  }

  return {
    ...pickProfile(j, discovery),
    items,
    caveat: `Pattern-based checks on ${scope}. “Not detected” means this tool did not find the element - not that it is missing. These checks never establish whether a business is trustworthy, legally compliant or losing sales.`,
  };
}
