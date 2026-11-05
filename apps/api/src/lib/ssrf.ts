import dns from 'node:dns/promises'
import net from 'node:net'

export class SecurityError extends Error {
  code: string
  constructor(message: string, code = 'SSRF_BLOCKED') {
    super(message)
    this.name = 'SecurityError'
    this.code = code
  }
}

/**
 * Converts an IPv4 string to an unsigned 32-bit number.
 */
function ipv4ToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  return parts[0] * 16777216 + parts[1] * 65536 + parts[2] * 256 + parts[3]
}

/**
 * Checks if an IP address belongs to private, loopback, link-local, carrier-grade NAT,
 * multicast, reserved, or cloud metadata network ranges.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) {
      return true
    }
    const num = ipv4ToNumber(ip)

    // 0.0.0.0/8 (Current network)
    if (num <= ipv4ToNumber('0.255.255.255')) return true

    // 10.0.0.0/8 (Private RFC 1918)
    if (num >= ipv4ToNumber('10.0.0.0') && num <= ipv4ToNumber('10.255.255.255')) return true

    // 100.64.0.0/10 (Carrier-grade NAT RFC 6598)
    if (num >= ipv4ToNumber('100.64.0.0') && num <= ipv4ToNumber('100.127.255.255')) return true

    // 127.0.0.0/8 (Loopback RFC 1122)
    if (num >= ipv4ToNumber('127.0.0.0') && num <= ipv4ToNumber('127.255.255.255')) return true

    // 169.254.0.0/16 (Link-local RFC 3927 — includes AWS/GCP/Azure metadata 169.254.169.254)
    if (num >= ipv4ToNumber('169.254.0.0') && num <= ipv4ToNumber('169.254.255.255')) return true

    // 172.16.0.0/12 (Private RFC 1918)
    if (num >= ipv4ToNumber('172.16.0.0') && num <= ipv4ToNumber('172.31.255.255')) return true

    // 192.0.0.0/24 (IETF protocol assignments)
    if (num >= ipv4ToNumber('192.0.0.0') && num <= ipv4ToNumber('192.0.0.255')) return true

    // 192.0.2.0/24 (TEST-NET-1)
    if (num >= ipv4ToNumber('192.0.2.0') && num <= ipv4ToNumber('192.0.2.255')) return true

    // 192.168.0.0/16 (Private RFC 1918)
    if (num >= ipv4ToNumber('192.168.0.0') && num <= ipv4ToNumber('192.168.255.255')) return true

    // 198.18.0.0/15 (Network benchmark tests RFC 2544)
    if (num >= ipv4ToNumber('198.18.0.0') && num <= ipv4ToNumber('198.19.255.255')) return true

    // 198.51.100.0/24 (TEST-NET-2)
    if (num >= ipv4ToNumber('198.51.100.0') && num <= ipv4ToNumber('198.51.100.255')) return true

    // 203.0.113.0/24 (TEST-NET-3)
    if (num >= ipv4ToNumber('203.0.113.0') && num <= ipv4ToNumber('203.0.113.255')) return true

    // 224.0.0.0/4 (Multicast RFC 5771) and 240.0.0.0/4 (Reserved RFC 1112)
    if (num >= ipv4ToNumber('224.0.0.0')) return true

    return false
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()

    // Loopback & Unspecified
    if (
      lower === '::1' ||
      lower === '::' ||
      lower === '0:0:0:0:0:0:0:1' ||
      lower === '0:0:0:0:0:0:0:0'
    ) {
      return true
    }

    // IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.substring(7)
      if (net.isIPv4(v4)) return isPrivateOrRestrictedIp(v4)
    }

    // fe80::/10 (Link-local)
    if (/^fe[89ab][0-9a-f]/i.test(lower)) return true

    // fc00::/7 (Unique local address / private)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true

    // fec0::/10 (Site-local deprecated)
    if (/^fec[0-9a-f]/i.test(lower)) return true

    // ff00::/8 (Multicast)
    if (lower.startsWith('ff')) return true

    // 2001:db8::/32 (Documentation)
    if (lower.startsWith('2001:db8:')) return true

    return false
  }

  // Non-standard or unparseable format
  return true
}

/**
 * Checks whether a hostname is prohibited (localhost, internal, metadata endpoints).
 */
export function isForbiddenHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim()

  const forbiddenLiterals = new Set([
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    'metadata.google',
    'instance-data',
    '169.254.169.254',
  ])

  if (forbiddenLiterals.has(lower)) return true

  const forbiddenSuffixes = [
    '.localhost',
    '.local',
    '.internal',
    '.corp',
    '.lan',
    '.home',
    '.arpa',
    '.onion',
  ]

  for (const suffix of forbiddenSuffixes) {
    if (lower.endsWith(suffix)) return true
  }

  return false
}

/**
 * Validates a target URL and performs DNS resolution to guarantee the target
 * is a valid, publicly-routable HTTP(S) address and not an internal network resource.
 */
export async function validateSafeTarget(targetUrl: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    throw new SecurityError(`Invalid URL structure: "${targetUrl}"`, 'INVALID_URL')
  }

  // 1. Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SecurityError(
      `Unsafe protocol "${parsed.protocol}". Only standard http: and https: protocols are permitted.`,
      'UNSAFE_PROTOCOL'
    )
  }

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    throw new SecurityError('URLs containing user credentials are not allowed.', 'CREDENTIALS_FORBIDDEN')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  // 3. Hostname check
  if (isForbiddenHostname(hostname)) {
    throw new SecurityError(
      `Access to internal or local hostname "${hostname}" is forbidden.`,
      'HOSTNAME_FORBIDDEN'
    )
  }

  // 4. If hostname is a direct IP literal, check it immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrRestrictedIp(hostname)) {
      throw new SecurityError(
        `Direct access to private or restricted IP address "${hostname}" is blocked.`,
        'PRIVATE_IP_BLOCKED'
      )
    }
    return parsed
  }

  // 5. DNS Resolution check (prevents DNS rebinding and internal network scanning)
  let addresses: Array<{ address: string; family: number }> = []
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new SecurityError(
      `Could not resolve domain "${hostname}". Please verify the domain name is registered and has valid public DNS records.`,
      'DNS_LOOKUP_FAILED'
    )
  }

  if (!addresses || addresses.length === 0) {
    throw new SecurityError(`No IP records resolved for domain "${hostname}".`, 'DNS_NO_RECORDS')
  }

  // Check EVERY resolved IP
  for (const { address } of addresses) {
    if (isPrivateOrRestrictedIp(address)) {
      throw new SecurityError(
        `Security blocked: Domain "${hostname}" resolves to a restricted or private network address (${address}).`,
        'DNS_REBOUND_PRIVATE_IP'
      )
    }
  }

  return parsed
}

