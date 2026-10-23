import { describe, expect, it } from 'vitest'
import { buildChannels } from './config'

const empty = { email: '', phone: '', whatsapp: '', instagram: '', linkedin: '', facebook: '' }

describe('buildChannels', () => {
  it('invents nothing when no contact details are configured', () => {
    const c = buildChannels(empty)
    expect(c.channels).toEqual([])
    expect(c.whatsappReady).toBe(false)
  })

  it('builds direct links from valid details', () => {
    const c = buildChannels({ ...empty, email: 'hello@example.com', phone: '+91 98200 00000', whatsapp: '919820000000' })
    expect(c.directChannels.map(x => x.href)).toEqual(['https://wa.me/919820000000', 'mailto:hello@example.com', 'tel:+919820000000'])
  })

  it('ignores malformed values', () => {
    const c = buildChannels({ ...empty, email: 'not-an-email', phone: '12', whatsapp: '+91 98200' })
    expect(c.channels).toEqual([])
  })

  it('only shows social profiles on the platform’s own domain over HTTPS', () => {
    const c = buildChannels({ ...empty, instagram: 'https://evil.example/instagram.com', linkedin: 'http://linkedin.com/company/x', facebook: 'https://www.facebook.com/chazon' })
    expect(c.socialChannels.map(x => x.key)).toEqual(['facebook'])
  })
})
