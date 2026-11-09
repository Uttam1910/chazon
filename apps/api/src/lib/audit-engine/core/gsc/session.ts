import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Small, dependency-free helpers for the Search Console OAuth flow.
 *
 * Session data (the short-lived access token, the OAuth state and PKCE verifier) is sealed with
 * AES-256-GCM using a key derived from SESSION_SECRET, and kept only in an HttpOnly cookie. The
 * server stores nothing, which suits serverless hosting, and browser JavaScript can never read the
 * token. The expiry is inside the authenticated payload, so a tampered or replayed-late cookie
 * fails to open.
 */

const VERSION = 'v1';

function keyFor(secret: string, purpose: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, 'website-audit-gsc', purpose, 32));
}

export function seal(data: Record<string, unknown>, secret: string, purpose: string, ttlSeconds: number, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(secret, purpose), iv);
  const body = Buffer.from(JSON.stringify({ ...data, exp: now + ttlSeconds * 1000 }), 'utf8');
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  return [VERSION, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

/** Returns the sealed data, or null when the value is missing, tampered with, for another purpose or expired. */
export function unseal<T extends Record<string, unknown>>(value: string | undefined, secret: string, purpose: string, now = Date.now()): (T & { exp: number }) | null {
  if (!value || value.length > 8_000) return null;
  const [version, iv, tag, data] = value.split('.');
  if (version !== VERSION || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyFor(secret, purpose), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const plain = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plain) as T & { exp: number };
    if (typeof parsed.exp !== 'number' || parsed.exp <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** PKCE S256 challenge for a verifier. */
export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Minimal Cookie header parser (no dependency). Values are not decoded beyond URI decoding. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export interface CookieOptions {
  maxAgeSeconds: number;
  secure: boolean;
  path?: string;
}

export function serializeCookie(name: string, value: string, opts: CookieOptions): string {
  return [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path ?? '/api/gsc'}`, `Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`, 'HttpOnly', 'SameSite=Lax', ...(opts.secure ? ['Secure'] : [])].join('; ');
}
