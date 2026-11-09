import dns from 'node:dns';
import net from 'node:net';
import ipaddr from 'ipaddr.js';
import { parse as parseDomain } from 'tldts';

/**
 * Deny-by-default network policy for every outbound request made on behalf of
 * a user-submitted URL. URL syntax is checked with the WHATWG URL parser (not a
 * regex); the authoritative IP check happens at connect time (see safeFetch).
 */

export class UnsafeUrlError extends Error {
  constructor(
    public readonly code: 'INVALID_URL' | 'UNSUPPORTED_PROTOCOL' | 'BLOCKED_HOST' | 'BLOCKED_ADDRESS' | 'BLOCKED_PORT',
    message: string,
  ) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const ALLOWED_PORTS = new Set(['', '80', '443']);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'instance-data.ec2.internal',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.lan', '.intranet', '.corp', '.localdomain'];

/** True only for globally routable unicast addresses. Everything else is denied. */
export function isPublicAddress(address: string): boolean {
  let ip: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    ip = ipaddr.parse(address.replace(/^\[|\]$/g, '').split('%')[0] ?? '');
  } catch {
    return false;
  }
  if (ip.kind() === 'ipv6') {
    const v6 = ip as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) ip = v6.toIPv4Address();
  }
  // ipaddr.js classifies private, loopback, link-local (incl. 169.254.169.254
  // cloud metadata), CGNAT, multicast, reserved, unique-local (fd00::/8),
  // 6to4/Teredo/NAT64 etc. as named ranges; only plain 'unicast' is public.
  return ip.range() === 'unicast';
}

/** Normalises user input into an absolute URL string (adds https:// when no scheme given). */
export function normaliseInput(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // A scheme such as "ftp:", "file:" or "javascript:" (but not "host:8080").
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Synchronous structural checks. Throws UnsafeUrlError. */
export function checkUrlStructure(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('UNSUPPORTED_PROTOCOL', `Only http and https URLs are supported (got "${url.protocol}").`);
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('INVALID_URL', 'URLs containing credentials are not allowed.');
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UnsafeUrlError('BLOCKED_PORT', `Only the standard web ports (80, 443) are allowed (got ${url.port}).`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (!host) throw new UnsafeUrlError('INVALID_URL', 'The URL has no host name.');

  if (net.isIP(host)) {
    if (!isPublicAddress(host)) {
      throw new UnsafeUrlError('BLOCKED_ADDRESS', 'That address is private, local or reserved and cannot be audited.');
    }
    return;
  }
  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UnsafeUrlError('BLOCKED_HOST', 'Local, internal or metadata host names cannot be audited.');
  }
  const parsed = parseDomain(host, { allowPrivateDomains: true });
  if (!parsed.domain || !(parsed.isIcann || parsed.isPrivate)) {
    throw new UnsafeUrlError('BLOCKED_HOST', 'The host name must end in a public domain suffix (e.g. .com, .co.uk).');
  }
}

export function parseTargetUrl(input: string, check: (url: URL) => void = checkUrlStructure): URL {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new UnsafeUrlError('INVALID_URL', 'Please enter a website URL.');
  }
  if (input.length > 2048) throw new UnsafeUrlError('INVALID_URL', 'The URL is too long.');
  let url: URL;
  try {
    url = new URL(normaliseInput(input));
  } catch {
    throw new UnsafeUrlError('INVALID_URL', 'That does not look like a valid URL.');
  }
  check(url);
  url.hash = '';
  return url;
}

export interface LookupAddress {
  address: string;
  family: number;
}
export type Resolver = (hostname: string) => Promise<LookupAddress[]>;

export const systemResolver: Resolver = (hostname) =>
  new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });

export interface NetworkPolicy {
  checkUrl(url: URL): void;
  isAddressAllowed(address: string): boolean;
  resolve: Resolver;
}

export const strictPolicy: NetworkPolicy = {
  checkUrl: checkUrlStructure,
  isAddressAllowed: isPublicAddress,
  resolve: systemResolver,
};

/**
 * Resolves a host and verifies every returned address is allowed. Used both for
 * a friendly pre-flight error and (via safeFetch's connect hook) at connect time.
 */
export async function resolveAllowed(hostname: string, policy: NetworkPolicy): Promise<LookupAddress[]> {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (!policy.isAddressAllowed(host)) {
      throw new UnsafeUrlError('BLOCKED_ADDRESS', 'That address is private, local or reserved and cannot be audited.');
    }
    return [{ address: host, family: net.isIP(host) }];
  }
  const addresses = await policy.resolve(host);
  if (addresses.length === 0) throw Object.assign(new Error(`No DNS records for ${host}`), { code: 'ENOTFOUND' });
  if (addresses.some((a) => !policy.isAddressAllowed(a.address))) {
    throw new UnsafeUrlError('BLOCKED_ADDRESS', `${host} resolves to a private, local or reserved address and cannot be audited.`);
  }
  return addresses;
}
