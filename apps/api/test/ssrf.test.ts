import test from 'node:test'
import assert from 'node:assert/strict'
import { isForbiddenHostname, isPrivateOrRestrictedIp, validateSafeTarget, SecurityError } from '../src/lib/ssrf.ts'

test('isPrivateOrRestrictedIp correctly identifies private and restricted IPs', () => {
  // Loopback
  assert.equal(isPrivateOrRestrictedIp('127.0.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('127.0.1.1'), true)
  assert.equal(isPrivateOrRestrictedIp('127.255.255.255'), true)

  // Current network
  assert.equal(isPrivateOrRestrictedIp('0.0.0.0'), true)
  assert.equal(isPrivateOrRestrictedIp('0.1.2.3'), true)

  // RFC 1918 Private ranges
  assert.equal(isPrivateOrRestrictedIp('10.0.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('10.254.1.2'), true)
  assert.equal(isPrivateOrRestrictedIp('172.16.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('172.25.10.20'), true)
  assert.equal(isPrivateOrRestrictedIp('172.31.255.255'), true)
  assert.equal(isPrivateOrRestrictedIp('192.168.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('192.168.100.200'), true)

  // Public IP near private range should be allowed
  assert.equal(isPrivateOrRestrictedIp('172.32.0.1'), false)
  assert.equal(isPrivateOrRestrictedIp('192.169.1.1'), false)
  assert.equal(isPrivateOrRestrictedIp('11.0.0.1'), false)

  // Link-Local / Cloud Metadata (169.254.169.254)
  assert.equal(isPrivateOrRestrictedIp('169.254.169.254'), true)
  assert.equal(isPrivateOrRestrictedIp('169.254.1.1'), true)

  // CGNAT (100.64.0.0/10)
  assert.equal(isPrivateOrRestrictedIp('100.64.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('100.127.255.255'), true)
  assert.equal(isPrivateOrRestrictedIp('100.128.0.1'), false)

  // Documentation / TEST-NET
  assert.equal(isPrivateOrRestrictedIp('192.0.2.1'), true)
  assert.equal(isPrivateOrRestrictedIp('198.51.100.1'), true)
  assert.equal(isPrivateOrRestrictedIp('203.0.113.1'), true)

  // Multicast and Broadcast
  assert.equal(isPrivateOrRestrictedIp('224.0.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('255.255.255.255'), true)

  // Public IPv4 addresses
  assert.equal(isPrivateOrRestrictedIp('8.8.8.8'), false)
  assert.equal(isPrivateOrRestrictedIp('1.1.1.1'), false)
  assert.equal(isPrivateOrRestrictedIp('93.184.216.34'), false)

  // IPv6 checks
  assert.equal(isPrivateOrRestrictedIp('::1'), true)
  assert.equal(isPrivateOrRestrictedIp('::'), true)
  assert.equal(isPrivateOrRestrictedIp('fe80::1'), true)
  assert.equal(isPrivateOrRestrictedIp('fc00::1'), true)
  assert.equal(isPrivateOrRestrictedIp('fd00::1'), true)
  assert.equal(isPrivateOrRestrictedIp('ff02::1'), true)
  assert.equal(isPrivateOrRestrictedIp('::ffff:127.0.0.1'), true)
  assert.equal(isPrivateOrRestrictedIp('::ffff:169.254.169.254'), true)
  assert.equal(isPrivateOrRestrictedIp('::ffff:8.8.8.8'), false)
  assert.equal(isPrivateOrRestrictedIp('2606:4700:4700::1111'), false)
})

test('isForbiddenHostname blocks internal and metadata hostnames', () => {
  assert.equal(isForbiddenHostname('localhost'), true)
  assert.equal(isForbiddenHostname('127.0.0.1'), true)
  assert.equal(isForbiddenHostname('metadata.google.internal'), true)
  assert.equal(isForbiddenHostname('instance-data'), true)
  assert.equal(isForbiddenHostname('myservice.local'), true)
  assert.equal(isForbiddenHostname('database.internal'), true)
  assert.equal(isForbiddenHostname('router.lan'), true)
  assert.equal(isForbiddenHostname('workstation.corp'), true)

  // Public hostnames allowed
  assert.equal(isForbiddenHostname('google.com'), false)
  assert.equal(isForbiddenHostname('example.com'), false)
  assert.equal(isForbiddenHostname('chazondigital.com'), false)
})

test('validateSafeTarget blocks malicious protocols and SSRF targets', async () => {
  // Protocol tests
  await assert.rejects(
    () => validateSafeTarget('ftp://example.com/file'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'UNSAFE_PROTOCOL'
  )
  await assert.rejects(
    () => validateSafeTarget('file:///etc/passwd'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'UNSAFE_PROTOCOL'
  )
  await assert.rejects(
    () => validateSafeTarget('gopher://127.0.0.1:70/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'UNSAFE_PROTOCOL'
  )

  // Credentials in URL
  await assert.rejects(
    () => validateSafeTarget('http://admin:secret@example.com/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'CREDENTIALS_FORBIDDEN'
  )

  // Forbidden hostnames
  await assert.rejects(
    () => validateSafeTarget('http://localhost:5000/api'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'HOSTNAME_FORBIDDEN'
  )
  await assert.rejects(
    () => validateSafeTarget('http://metadata.google.internal/computeMetadata/v1/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'HOSTNAME_FORBIDDEN'
  )

  // Direct private IPs
  await assert.rejects(
    () => validateSafeTarget('http://127.0.0.1:4000/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'HOSTNAME_FORBIDDEN'
  )
  await assert.rejects(
    () => validateSafeTarget('http://169.254.169.254/latest/meta-data/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'HOSTNAME_FORBIDDEN'
  )
  await assert.rejects(
    () => validateSafeTarget('http://192.168.1.1/admin'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'PRIVATE_IP_BLOCKED'
  )
  await assert.rejects(
    () => validateSafeTarget('http://10.0.0.1:8080/'),
    (err: Error) => err instanceof SecurityError && (err as SecurityError).code === 'PRIVATE_IP_BLOCKED'
  )
})
