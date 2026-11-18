import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashOtp,
  verifyOtpHash,
  issueAuditToken,
  verifyAuditToken,
} from '../src/lib/audit-auth'

describe('Audit Auth Security & Verification Unit Tests', () => {
  it('correctly hashes and verifies 6-digit OTP codes in constant time', () => {
    const code = '482910'
    const wrongCode = '482911'
    const hash = hashOtp(code)

    assert.equal(typeof hash, 'string')
    assert.equal(hash.length, 64) // SHA-256 hex length
    assert.equal(verifyOtpHash(code, hash), true)
    assert.equal(verifyOtpHash(wrongCode, hash), false)
    assert.equal(verifyOtpHash('000000', hash), false)
  })

  it('issues tamper-proof signed audit session tokens', () => {
    const userId = 'usr_test_123'
    const email = 'alex@example.com'
    const token = issueAuditToken(userId, email)

    assert.equal(typeof token, 'string')
    assert.match(token, /^audit\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)

    const payload = verifyAuditToken(token)
    assert.notEqual(payload, null)
    assert.equal(payload?.userId, userId)
    assert.equal(payload?.email, email)
    assert.ok((payload?.exp ?? 0) > Date.now())
  })

  it('rejects tampered or forged audit tokens', () => {
    const token = issueAuditToken('usr_test_123', 'alex@example.com')
    const parts = token.split('.')

    // Corrupted signature
    const badSig = `${parts[0]}.${parts[1]}.tamperedSignature123`
    assert.equal(verifyAuditToken(badSig), null)

    // Altered payload
    const badPayload = `${parts[0]}.eyJuYW1lIjoiZmFrZSJ9.${parts[2]}`
    assert.equal(verifyAuditToken(badPayload), null)

    // Malformed strings
    assert.equal(verifyAuditToken(''), null)
    assert.equal(verifyAuditToken('random-invalid-string'), null)
  })
})
