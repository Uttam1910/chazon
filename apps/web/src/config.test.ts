import { describe, expect, it } from 'vitest'
import { buildChannels, getEnquiryEndpoints, resolveApiUrl, resolveEnquiryEndpoint } from './config'

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

describe('production endpoint resolution', () => {
  it('ignores leaked localhost VITE_API_URL when running in production on a public host', () => {
    expect(resolveApiUrl('http://localhost:5000', { isDev: false, runtimeHostname: 'chazon.in' })).toBe('')
    expect(resolveApiUrl('http://127.0.0.1:5000/', { isDev: false, runtimeHostname: 'chazon.vercel.app' })).toBe('')
  })

  it('keeps localhost VITE_API_URL in development or on a loopback host, and keeps HTTPS origins in production', () => {
    expect(resolveApiUrl('http://localhost:5000/', { isDev: true, runtimeHostname: 'localhost' })).toBe('http://localhost:5000')
    expect(resolveApiUrl('http://localhost:5000', { isDev: false, runtimeHostname: 'localhost' })).toBe('http://localhost:5000')
    expect(resolveApiUrl('https://api.chazon.in/', { isDev: false, runtimeHostname: 'chazon.in' })).toBe('https://api.chazon.in')
  })

  it('resolves enquiry endpoint and always includes same-origin fallback', () => {
    expect(resolveEnquiryEndpoint('http://localhost:5000/api/public/enquiries', '', true, { isDev: false, runtimeHostname: 'chazon.in' })).toBe('/api/public/enquiries')
    expect(getEnquiryEndpoints({ apiUrl: 'https://api.chazon.in', enquiryEndpoint: 'https://api.chazon.in/api/public/enquiries' })).toEqual([
      'https://api.chazon.in/api/public/enquiries',
      '/api/public/enquiries',
    ])
    expect(getEnquiryEndpoints({ apiUrl: '', enquiryEndpoint: '' })).toEqual(['/api/public/enquiries'])
  })
})
