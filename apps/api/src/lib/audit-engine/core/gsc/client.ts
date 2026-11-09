import type { GscSite, SearchMetrics, SearchRow } from '@chazon/shared';

/**
 * Read-only client for Google's official OAuth 2.0 and Search Console (Webmasters v3) APIs.
 * Only fixed Google hosts are contacted; the property URL is used solely as an encoded path
 * segment after the caller has checked it against the user's own property list. Responses are
 * shape-checked and nothing from them is logged.
 */

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const API = 'https://www.googleapis.com/webmasters/v3';
const TIMEOUT_MS = 15_000;

export type GscErrorCode = 'GSC_RECONNECT' | 'GSC_PERMISSION' | 'GSC_RATE_LIMITED' | 'GSC_UNAVAILABLE' | 'GSC_BAD_RESPONSE' | 'GSC_OAUTH_FAILED';

export class GscError extends Error {
  constructor(
    public readonly code: GscErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GscError';
  }
}

export interface OAuthSettings {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function authorizationUrl(o: OAuthSettings, state: string, codeChallenge: string): string {
  const u = new URL(AUTH_URL);
  u.search = new URLSearchParams({
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    response_type: 'code',
    scope: GSC_SCOPE,
    // Online access: Google issues no refresh token, so nothing long-lived ever exists.
    access_type: 'online',
    include_granted_scopes: 'false',
    prompt: 'select_account',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();
  return u.toString();
}

function mapStatus(status: number): GscError {
  if (status === 401) return new GscError('GSC_RECONNECT', 'Your Search Console session has expired or was revoked. Please connect again.');
  if (status === 403) return new GscError('GSC_PERMISSION', 'Google refused access. Your account may not have permission for this property.');
  if (status === 429) return new GscError('GSC_RATE_LIMITED', 'Search Console is limiting requests right now. Please wait a minute and try again.');
  return new GscError('GSC_UNAVAILABLE', `Search Console could not be reached (HTTP ${status}). Please try again later.`);
}

export function createGscClient(fetchImpl: typeof fetch = fetch) {
  const call = async (url: string, init: RequestInit): Promise<unknown> => {
    let res: Response;
    try {
      res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      throw new GscError('GSC_UNAVAILABLE', 'Search Console could not be reached. Please try again later.');
    }
    if (!res.ok) throw mapStatus(res.status);
    try {
      return await res.json();
    } catch {
      throw new GscError('GSC_BAD_RESPONSE', 'Search Console returned an unexpected response.');
    }
  };
  const auth = (token: string) => ({ authorization: `Bearer ${token}` });

  return {
    /** Exchanges an authorization code (with its PKCE verifier) for a short-lived access token. */
    async exchangeCode(o: OAuthSettings, code: string, verifier: string): Promise<{ accessToken: string; expiresIn: number }> {
      let res: Response;
      try {
        res = await fetchImpl(TOKEN_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code, client_id: o.clientId, client_secret: o.clientSecret, redirect_uri: o.redirectUri, grant_type: 'authorization_code', code_verifier: verifier }).toString(),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        throw new GscError('GSC_OAUTH_FAILED', 'Could not reach Google to finish connecting.');
      }
      const body = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown; scope?: unknown } | null;
      if (!res.ok || !body || typeof body.access_token !== 'string' || !body.access_token) throw new GscError('GSC_OAUTH_FAILED', 'Google did not complete the connection.');
      const scopes = typeof body.scope === 'string' ? body.scope.split(' ') : [];
      if (!scopes.includes(GSC_SCOPE)) throw new GscError('GSC_OAUTH_FAILED', 'Read-only Search Console access was not granted.');
      const expiresIn = typeof body.expires_in === 'number' && body.expires_in > 0 ? Math.min(body.expires_in, 3600) : 3600;
      return { accessToken: body.access_token, expiresIn };
    },

    /** Best-effort revocation; a failure does not stop disconnecting locally. */
    async revoke(token: string): Promise<void> {
      try {
        await fetchImpl(REVOKE_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token }).toString(), signal: AbortSignal.timeout(TIMEOUT_MS) });
      } catch {
        /* the token also expires on its own within an hour */
      }
    },

    async listSites(token: string): Promise<GscSite[]> {
      const body = (await call(`${API}/sites`, { headers: auth(token) })) as { siteEntry?: unknown };
      const entries = Array.isArray(body?.siteEntry) ? body.siteEntry : [];
      return entries
        .filter((e): e is { siteUrl: string; permissionLevel: string } => typeof e?.siteUrl === 'string' && typeof e?.permissionLevel === 'string')
        .map((e) => ({ siteUrl: e.siteUrl.slice(0, 500), permissionLevel: e.permissionLevel.slice(0, 50) }));
    },

    /** One searchAnalytics.query call. Rows with non-numeric metrics are dropped, never patched. */
    async query(token: string, siteUrl: string, req: { startDate: string; endDate: string; dimensions: ('query' | 'page')[]; rowLimit: number }): Promise<SearchRow[]> {
      const body = (await call(`${API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { ...auth(token), 'content-type': 'application/json' },
        body: JSON.stringify({ startDate: req.startDate, endDate: req.endDate, dimensions: req.dimensions, rowLimit: req.rowLimit, type: 'web', dataState: 'final' }),
      })) as { rows?: unknown };
      const rows = Array.isArray(body?.rows) ? body.rows : [];
      const out: SearchRow[] = [];
      for (const r of rows as Record<string, unknown>[]) {
        const m = metricsOf(r);
        if (!m) continue;
        const keys = Array.isArray(r.keys) ? r.keys.filter((k): k is string => typeof k === 'string') : [];
        out.push({ key: (keys[0] ?? '').slice(0, 2_000), ...m });
      }
      return out;
    },
  };
}

function metricsOf(r: Record<string, unknown>): SearchMetrics | null {
  const { clicks, impressions, ctr, position } = r;
  if (![clicks, impressions, ctr, position].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  return { clicks: clicks as number, impressions: impressions as number, ctr: ctr as number, position: position as number };
}

export type GscClient = ReturnType<typeof createGscClient>;
