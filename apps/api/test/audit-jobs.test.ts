import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isPublicAddress,
  strictPolicy,
  parseTargetUrl,
  UnsafeUrlError,
  planSteps,
} from '../src/lib/audit-engine/core'
import { JobStore } from '../src/lib/audit-engine/jobs/jobStore'

describe('Audit Engine Core Unit Tests', () => {
  it('isPublicAddress blocks private IP and metadata addresses', () => {
    // IPv4 private ranges
    assert.equal(isPublicAddress('127.0.0.1'), false)
    assert.equal(isPublicAddress('10.0.0.1'), false)
    assert.equal(isPublicAddress('172.16.0.1'), false)
    assert.equal(isPublicAddress('192.168.1.1'), false)
    assert.equal(isPublicAddress('169.254.169.254'), false)

    // IPv6 private ranges and localhost
    assert.equal(isPublicAddress('::1'), false)
    assert.equal(isPublicAddress('fc00::1'), false)
    assert.equal(isPublicAddress('fe80::1'), false)

    // Public IPs allowed
    assert.equal(isPublicAddress('93.184.216.34'), true)
    assert.equal(isPublicAddress('8.8.8.8'), true)
  })

  it('strictPolicy.checkUrl blocks internal hostnames and bad protocols', () => {
    assert.throws(
      () => strictPolicy.checkUrl(new URL('ftp://example.com')),
      (err: unknown) => err instanceof UnsafeUrlError && err.code === 'UNSUPPORTED_PROTOCOL'
    )
    assert.throws(
      () => strictPolicy.checkUrl(new URL('file:///etc/passwd')),
      (err: unknown) => err instanceof UnsafeUrlError && err.code === 'UNSUPPORTED_PROTOCOL'
    )
    assert.throws(
      () => strictPolicy.checkUrl(new URL('http://localhost:8080')),
      (err: unknown) => err instanceof UnsafeUrlError && (err.code === 'BLOCKED_HOST' || err.code === 'BLOCKED_PORT')
    )
    assert.throws(
      () => strictPolicy.checkUrl(new URL('http://metadata.google.internal')),
      (err: unknown) => err instanceof UnsafeUrlError && err.code === 'BLOCKED_HOST'
    )

    // Valid public domains do not throw
    assert.doesNotThrow(() => strictPolicy.checkUrl(new URL('https://chazon.in')))
    assert.doesNotThrow(() => strictPolicy.checkUrl(new URL('https://example.com')))
  })

  it('parseTargetUrl normalises URLs and validates targets', () => {
    const url1 = parseTargetUrl('chazon.in')
    assert.equal(url1.protocol, 'https:')
    assert.equal(url1.hostname, 'chazon.in')

    const url2 = parseTargetUrl('http://example.com/test?a=1#frag')
    assert.equal(url2.protocol, 'http:')
    assert.equal(url2.hostname, 'example.com')
    assert.equal(url2.hash, '') // fragment stripped
  })

  it('JobStore manages audit lifecycle and step state updates', () => {
    const store = new JobStore(60_000, 10)
    const steps = planSteps(
      {
        url: 'https://example.com',
        strategy: 'mobile',
        categories: ['seo', 'performance'],
        crawlLimit: 5,
        checkLinks: false,
      },
      {}
    )

    assert.ok(steps.length > 0)
    const job = store.create(steps)
    assert.ok(job.status.id)
    assert.equal(job.status.state, 'running')

    const firstStep = steps[0]
    store.updateStep(job, firstStep.key, 'running', 'Connecting to site')
    assert.equal(job.status.steps[0].state, 'running')
    assert.equal(job.status.steps[0].detail, 'Connecting to site')

    store.updateStep(job, firstStep.key, 'done')
    assert.equal(job.status.steps[0].state, 'done')

    store.fail(job, 'TEST_ERROR', 'Scan failed for testing')
    assert.equal(job.status.state, 'failed')
    assert.equal(job.status.error?.code, 'TEST_ERROR')

    store.close()
  })
})
