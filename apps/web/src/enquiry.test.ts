import { describe, expect, it, vi } from 'vitest'
import { submitEnquiry, validateEnquiry, type EnquiryValues } from './enquiry'

const valid: EnquiryValues = { name: 'Asha Mehta', email: 'asha@example.com', phone: '+91 98200 00000', business: 'Mehta Foods', website: '', category: '', service: 'Digital Foundation', budget: '', message: '' }

describe('validateEnquiry', () => {
  it('accepts a complete enquiry with only the required fields', () => {
    expect(validateEnquiry(valid, 'talk')).toEqual({})
  })

  it('flags each missing required field with its own message', () => {
    const errors = validateEnquiry({ ...valid, name: '', email: '', phone: '', business: '', service: '' }, 'talk')
    expect(Object.keys(errors).sort()).toEqual(['business', 'email', 'name', 'phone', 'service'])
  })

  it('does not require a service for audit requests (the form sets it)', () => {
    expect(validateEnquiry({ ...valid, service: '' }, 'audit')).toEqual({})
  })

  it('leaves optional fields optional', () => {
    expect(validateEnquiry({ ...valid, website: '', category: '', budget: '', message: '' }, 'talk')).toEqual({})
  })

  it.each([
    ['email', 'not-an-email'],
    ['email', 'a@b'],
    ['phone', '12345'],
    ['phone', 'call me maybe'],
    ['name', 'A'],
  ] as const)('rejects an invalid %s (%s)', (field, value) => {
    expect(validateEnquiry({ ...valid, [field]: value }, 'talk')[field]).toBeTruthy()
  })

  it('mirrors the API length limits', () => {
    expect(validateEnquiry({ ...valid, message: 'x'.repeat(3001) }, 'talk').message).toBeTruthy()
    expect(validateEnquiry({ ...valid, website: 'x'.repeat(201) }, 'talk').website).toBeTruthy()
  })
})

const respond = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('submitEnquiry', () => {
  it('reports success only for a 2xx response', async () => {
    expect(await submitEnquiry('/api', {}, respond(201, { data: { received: true } }))).toEqual({ ok: true })
  })

  it('maps API field errors back onto known fields', async () => {
    const result = await submitEnquiry('/api', {}, respond(422, { error: { message: 'Please check the highlighted fields.', details: { email: 'Enter a valid email address', form_started: 'ignored' } } }))
    expect(result).toMatchObject({ ok: false, reason: 'validation', errors: { email: 'Enter a valid email address' } })
    expect(result.ok === false && result.reason === 'validation' && 'form_started' in result.errors).toBe(false)
  })

  it.each([[429, 'rate_limited'], [403, 'rejected'], [500, 'server'], [503, 'server']] as const)('treats HTTP %i as %s, never as sent', async (status, reason) => {
    expect(await submitEnquiry('/api', {}, respond(status))).toMatchObject({ ok: false, reason })
  })

  it('handles a network failure', async () => {
    const offline = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch
    expect(await submitEnquiry('/api', {}, offline)).toMatchObject({ ok: false, reason: 'network' })
  })

  it('sends the payload as JSON', async () => {
    const fetcher = respond(201)
    await submitEnquiry('https://api.example.com/api/public/enquiries', { name: 'Asha' }, fetcher)
    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/api/public/enquiries', expect.objectContaining({ method: 'POST', body: '{"name":"Asha"}' }))
  })
})
