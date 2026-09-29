// Lightweight cross-section actions: a CTA anywhere on the page can open the enquiry form in a
// specific mode, or open a service pillar, without prop-drilling or a state library.
export type EnquiryMode = 'talk' | 'audit'
export type EnquiryDetail = { mode: EnquiryMode; service?: string }

export function openEnquiry(mode: EnquiryMode = 'talk', service?: string) {
  window.dispatchEvent(new CustomEvent<EnquiryDetail>('chazon:enquiry', { detail: { mode, service } }))
}
/** Selects a service pillar (desktop tab or mobile step); the link's own #services jump brings it into view. */
export function openPillar(index: number) {
  window.dispatchEvent(new CustomEvent<number>('chazon:pillar', { detail: index }))
}
