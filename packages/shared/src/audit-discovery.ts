import type { DiscoveryAnswers } from './audit-types';

/** Display labels for the business discovery questionnaire (used by the server export and the dashboard). */
export const DISCOVERY_LABELS = {
  businessType: {
    'local-service': 'Local service business',
    'professional-service': 'Professional services',
    ecommerce: 'Online shop / e-commerce',
    hospitality: 'Hospitality, food or travel',
    healthcare: 'Health or wellbeing',
    education: 'Education or training',
    nonprofit: 'Non-profit or community',
    software: 'Software or digital product',
    other: 'Other',
  },
  mainObjective: {
    'more-enquiries': 'Get more enquiries or leads',
    'more-online-sales': 'Sell more online',
    'more-bookings': 'Get more bookings or appointments',
    'search-visibility': 'Be found more on Google',
    'brand-awareness': 'Build brand awareness',
    'reduce-admin': 'Save time on admin and follow-up',
    other: 'Other',
  },
  leadChannels: {
    'organic-search': 'Google / organic search',
    'paid-ads': 'Paid advertising',
    'social-media': 'Social media',
    referrals: 'Word of mouth / referrals',
    email: 'Email',
    'walk-in': 'Walk-in / phone',
    marketplaces: 'Marketplaces or directories',
    other: 'Other',
  },
  mainChallenge: {
    'not-enough-traffic': 'Not enough visitors',
    'visitors-do-not-enquire': 'Visitors do not enquire or buy',
    'slow-or-outdated-site': 'Website is slow or outdated',
    'hard-to-update': 'Website is hard to update',
    'manual-follow-up': 'Follow-up is manual or slow',
    'low-search-visibility': 'Hard to find on Google',
    other: 'Other',
  },
  hasAnalytics: { yes: 'Yes', no: 'No', unsure: 'Not sure' },
  usesAdvertising: { yes: 'Yes', no: 'No', unsure: 'Not sure' },
  followUp: { crm: 'A CRM system', 'inbox-or-spreadsheet': 'Email inbox or spreadsheet', none: 'No structured process', unsure: 'Not sure' },
  needs: { ecommerce: 'Sell online', bookings: 'Take bookings', enquiries: 'Generate enquiries', whatsapp: 'Chat on WhatsApp' },
  timeframe: { asap: 'As soon as possible', '1-3-months': '1–3 months', '3-6-months': '3–6 months', exploring: 'Just exploring' },
} as const;

/** Question, answer pairs for display (only answered questions). */
export function describeDiscovery(d: DiscoveryAnswers | null): { question: string; answer: string }[] {
  if (!d) return [];
  const L = DISCOVERY_LABELS;
  const rows: [string, string | undefined][] = [
    ['Business type', d.businessType && L.businessType[d.businessType]],
    ['Main products or services', d.offerings],
    ['Main objective', d.mainObjective && L.mainObjective[d.mainObjective]],
    ['Current lead channels', d.leadChannels?.length ? d.leadChannels.map((c) => L.leadChannels[c]).join(', ') : undefined],
    ['Main digital challenge', d.mainChallenge && L.mainChallenge[d.mainChallenge]],
    ['Has website analytics', d.hasAnalytics && L.hasAnalytics[d.hasAnalytics]],
    ['Uses advertising', d.usesAdvertising && L.usesAdvertising[d.usesAdvertising]],
    ['Enquiry follow-up', d.followUp && L.followUp[d.followUp]],
    ['Needs', d.needs?.length ? d.needs.map((n) => L.needs[n]).join(', ') : undefined],
    ['Timeframe', d.timeframe && L.timeframe[d.timeframe]],
    ['Budget range', d.budgetRange],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1])).map(([question, answer]) => ({ question, answer }));
}

export function hasAnswers(d: DiscoveryAnswers | null | undefined): d is DiscoveryAnswers {
  return Boolean(d && describeDiscovery(d).length);
}
