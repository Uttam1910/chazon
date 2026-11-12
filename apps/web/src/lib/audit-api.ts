import type {
  AuditJobStatus,
  AuditReport,
  AuditRequest,
  PublicConfig,
} from '@chazon/shared'
import { config } from '../config'

export class AuditApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'AuditApiError'
  }
}

// Candidate base URLs to try in order
function getCandidateBases(): string[] {
  const list: string[] = ['/api/audit'] // 1. Relative via Vite proxy / current domain
  if (config.apiUrl) {
    list.push(`${config.apiUrl}/api/audit`) // 2. Explicit API URL from environment
  }
  list.push('http://localhost:5000/api/audit') // 3. Local API default
  list.push('http://localhost:8787/api') // 4. Standalone audit server port
  return [...new Set(list)]
}

async function tryFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const candidates = getCandidateBases()
  let lastError: unknown = null

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })

      let body: unknown = null
      try {
        body = await response.json()
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const errorObj = (body as { error?: { code?: string; message?: string } })?.error
        const code = errorObj?.code || `HTTP_${response.status}`
        const message = errorObj?.message || `Audit service responded with error status ${response.status}.`
        // Server actively responded with an error (e.g. 400 validation, 422 DNS failure, 429 rate limit).
        // Surface this authentic error immediately!
        throw new AuditApiError(code, message)
      }

      return body as T
    } catch (err) {
      if (err instanceof AuditApiError) {
        throw err
      }
      if (
        (err instanceof DOMException || err instanceof Error) &&
        err.name === 'AbortError'
      ) {
        throw new AuditApiError('CANCELLED', 'The audit scan was cancelled.')
      }
      lastError = err
      // Try next candidate URL for network/connection failures
    }
  }

  throw new AuditApiError(
    'CONNECTION_ERROR',
    (lastError as Error)?.message ||
      'Unable to connect to the Chazon Audit Engine. Please verify the API server is running.'
  )
}

export const auditApi = {
  getConfig: async (): Promise<PublicConfig> => {
    return await tryFetchJson<PublicConfig>('/config')
  },

  start: async (
    req: { url: string; strategy?: 'mobile' | 'desktop'; crawlLimit?: number; checkLinks?: boolean },
    signal?: AbortSignal
  ): Promise<{ id: string; status: AuditJobStatus }> => {
    let normalized = req.url.trim()
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`
    }

    const auditRequest: AuditRequest = {
      url: normalized,
      strategy: req.strategy || 'mobile',
      categories: ['performance', 'seo', 'accessibility', 'journey', 'crawl', 'technology'],
      crawlLimit: req.crawlLimit ?? 10,
      checkLinks: req.checkLinks ?? true,
    }

    return await tryFetchJson<{ id: string; status: AuditJobStatus }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(auditRequest),
      signal,
    })
  },

  getStatus: async (id: string, signal?: AbortSignal): Promise<AuditJobStatus> => {
    return tryFetchJson<{ id: string; status: AuditJobStatus }>(`/jobs/${encodeURIComponent(id)}`, {
      signal,
    }).then((d) => d.status)
  },

  getReport: async (id: string, signal?: AbortSignal): Promise<AuditReport> => {
    return tryFetchJson<{ id: string; report: AuditReport }>(
      `/jobs/${encodeURIComponent(id)}/report`,
      { signal }
    ).then((d) => d.report)
  },

  cancel: async (id: string): Promise<void> => {
    await tryFetchJson<{ ok: boolean }>(`/jobs/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }).catch(() => {})
  },

  getPrintableReportUrl: (id: string): string => {
    return `/api/audit/jobs/${encodeURIComponent(id)}/html`
  },

  /**
   * Polls the authentic backend job status until the scan completes or fails.
   * Never generates fabricated scores.
   */
  pollUntilComplete: async (
    id: string,
    onProgress: (status: AuditJobStatus) => void,
    signal?: AbortSignal,
    initialStatus?: AuditJobStatus
  ): Promise<AuditReport> => {
    if (initialStatus) {
      onProgress(initialStatus)
      if (initialStatus.state === 'completed') {
        if (initialStatus.report) return initialStatus.report
        return await auditApi.getReport(id, signal)
      }
      if (initialStatus.state === 'failed') {
        throw new AuditApiError(
          initialStatus.error?.code || 'AUDIT_FAILED',
          initialStatus.error?.message || 'Audit job failed'
        )
      }
    }
    let attempts = 0
    while (!signal?.aborted && attempts < 90) {
      attempts++
      const status = await auditApi.getStatus(id, signal)
      onProgress(status)

      if (status.state === 'completed') {
        if (status.report) return status.report
        return await auditApi.getReport(id, signal)
      }

      if (status.state === 'failed') {
        throw new AuditApiError(
          status.error?.code || 'AUDIT_FAILED',
          status.error?.message || status.message || 'The website audit scan could not be completed.'
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (signal?.aborted) {
      throw new AuditApiError('CANCELLED', 'The audit scan was cancelled.')
    }

    throw new AuditApiError('TIMEOUT', 'The website audit scan timed out. Please try again with a lower crawl limit.')
  },
}
