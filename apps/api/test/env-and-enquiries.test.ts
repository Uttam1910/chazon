import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { PassThrough } from 'node:stream'

process.env.AUTH_SECRET ||= 'test-secret-key-at-least-32-characters-long'

const { isAllowedOrigin, getRequestOrigin, env } = await import('../src/env.ts')
const { createApp } = await import('../src/app.ts')

async function simulateRequest(
  app: ReturnType<typeof createApp>,
  {
    method = 'POST',
    url = '/api/public/enquiries',
    headers = {},
    body,
  }: {
    method?: string
    url?: string
    headers?: Record<string, string>
    body?: unknown
  },
) {
  const payload = body !== undefined ? JSON.stringify(body) : ''
  const sock = new PassThrough() as unknown as PassThrough & {
    remoteAddress: string
    writable: boolean
    cork: () => void
    uncork: () => void
    destroy: () => void
  }
  sock.remoteAddress = '127.0.0.1'
  sock.writable = true
  sock.cork = () => {}
  sock.uncork = () => {}
  sock.destroy = () => sock

  const req = new http.IncomingMessage(sock as unknown as import('node:net').Socket)
  req.url = url
  req.method = method
  req.headers = {
    ...(body !== undefined ? { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(payload)) } : {}),
    ...headers,
  }
  if (payload) req.push(Buffer.from(payload))
  req.push(null)

  const res = new http.ServerResponse(req)
  const rawChunks: Buffer[] = []
  sock.on('data', (chunk: Buffer) => rawChunks.push(chunk))
  res.assignSocket(sock as unknown as import('node:net').Socket)

  await new Promise<void>((resolve) => {
    res.on('finish', resolve)
    app(req, res)
  })

  const raw = Buffer.concat(rawChunks).toString('utf8')
  const bodyPart = raw.includes('\r\n\r\n') ? raw.split('\r\n\r\n').slice(1).join('\r\n\r\n') : ''
  return {
    status: res.statusCode,
    headers: res.getHeaders(),
    body: bodyPart ? JSON.parse(bodyPart) : null,
  }
}

describe('Production origin & enquiry submission handling', () => {
  it('matches apex and www variants on the same protocol cleanly', () => {
    assert.equal(isAllowedOrigin('https://www.chazon.in', 'https://chazon.in'), true)
    assert.equal(isAllowedOrigin('https://chazon.in', 'https://www.chazon.in'), true)
    assert.equal(isAllowedOrigin('https://evil.example', 'https://chazon.in'), false)
    assert.equal(isAllowedOrigin('http://chazon.in', 'https://chazon.in'), false)
  })

  it('derives request origin from forwarded host/proto headers', () => {
    const derived = getRequestOrigin({
      header: (name) => ({ 'x-forwarded-host': 'www.chazon.in, proxy.internal', 'x-forwarded-proto': 'https' })[name.toLowerCase()],
    })
    assert.equal(derived, 'https://www.chazon.in')
  })

  it('accepts same-origin and www quick-message enquiry submissions even with different PUBLIC_SITE_URL', async () => {
    const prevDb = env.DATABASE_URL
    env.DATABASE_URL = undefined
    const app = createApp()

    try {
      const res = await simulateRequest(app, {
        url: '/api/public/enquiries',
        headers: {
          origin: 'https://www.custom-prod-domain.in',
          'x-forwarded-host': 'www.custom-prod-domain.in',
          'x-forwarded-proto': 'https',
        },
        body: {
          form: 'quick_message',
          name: 'Uttam Thapa',
          email: 'uttam@example.com',
          phone: '7303896794',
          service: 'Website Development',
          message: 'Testing production form reachability',
        },
      })

      assert.equal(res.status, 201)
      assert.equal(res.headers['access-control-allow-origin'], 'https://www.custom-prod-domain.in')
      assert.equal(res.body?.data?.received, true)
      assert.ok(typeof res.body?.data?.reference === 'string')
    } finally {
      env.DATABASE_URL = prevDb
    }
  })
})
