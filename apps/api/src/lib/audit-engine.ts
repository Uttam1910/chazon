import type { AuditAnalysisResult, AuditIssue } from '@chazon/shared'
import { validateSafeTarget } from './ssrf'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; ChazonGrowthAnalyzer/2.0; +https://chazondigital.com)'

const MAX_REDIRECTS = 5
const MAX_RESPONSE_BYTES = 2.5 * 1024 * 1024 // 2.5 MB maximum HTML payload
const TOTAL_TIMEOUT_MS = 8500 // 8.5 seconds total budget

export function generateReference(prefix = 'AUD'): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${year}-${random}`
}

export function normalizeUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`
  }
  const parsed = new URL(trimmed)
  return parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname)
}

/**
 * Safely fetches a public website with:
 * 1. Strict SSRF protection and DNS resolution check on every hop
 * 2. Manual redirect following with redirect loop prevention
 * 3. Content-Type verification (HTML only)
 * 4. Response stream byte size limits (prevent OOM)
 * 5. Connection and response timeouts
 */
async function safeFetchHtml(initialUrl: string): Promise<{
  html: string
  finalUrl: string
  responseTimeMs: number
  pageSizeKb: number
  hasSsl: boolean
}> {
  let currentUrl = initialUrl
  const visitedUrls = new Set<string>()
  const startTime = Date.now()
  let redirectsCount = 0

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), TOTAL_TIMEOUT_MS)

  let finalResponse: Response | null = null

  try {
    while (redirectsCount <= MAX_REDIRECTS) {
      // 1. SSRF & DNS check for the target of this hop
      const validatedTarget = await validateSafeTarget(currentUrl)
      const currentHref = validatedTarget.href

      if (visitedUrls.has(currentHref)) {
        throw new Error(`Redirect loop detected: "${currentHref}" has already been visited.`)
      }
      visitedUrls.add(currentHref)

      // 2. Fetch with manual redirect handling
      let response: Response
      try {
        response = await fetch(currentHref, {
          method: 'GET',
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
          },
          signal: abortController.signal,
          redirect: 'manual',
        })
      } catch (fetchErr: unknown) {
        if ((fetchErr as Error)?.name === 'AbortError') {
          throw new Error(`Connection timed out after ${TOTAL_TIMEOUT_MS / 1000}s while reaching ${currentHref}.`)
        }
        throw new Error(`Network failure connecting to ${currentHref}: ${(fetchErr as Error)?.message || 'Connection refused or unreachable'}`)
      }

      // Check for redirect status codes
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectsCount++
        if (redirectsCount > MAX_REDIRECTS) {
          throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS}).`)
        }
        const location = response.headers.get('location')
        if (!location) {
          throw new Error(`Redirect response (${response.status}) did not provide a Location header.`)
        }
        currentUrl = new URL(location, currentHref).href
        continue
      }

      // We reached a final non-redirect response
      finalResponse = response
      currentUrl = currentHref
      break
    }
  } finally {
    clearTimeout(timeoutId)
  }

  const responseTimeMs = Date.now() - startTime

  if (!finalResponse) {
    throw new Error('No response could be retrieved from the target website.')
  }

  // 3. Status code validation
  if (finalResponse.status === 401 || finalResponse.status === 403) {
    throw new Error(
      `Access denied (HTTP ${finalResponse.status}). The website blocks automated crawlers or requires authorization.`
    )
  }
  if (finalResponse.status === 404) {
    throw new Error(`Page not found (HTTP 404) at ${currentUrl}. Please verify the website address.`)
  }
  if (finalResponse.status >= 500) {
    throw new Error(`Target server returned an internal error (HTTP ${finalResponse.status}).`)
  }

  // 4. Content-Type check: Must be HTML
  const contentType = finalResponse.headers.get('content-type') || ''
  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error(
      `Unsupported content type "${contentType}". The website analyzer only audits public HTML web pages.`
    )
  }

  // 5. Content-Length header guard
  const contentLengthHeader = finalResponse.headers.get('content-length')
  if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 5 * 1024 * 1024) {
    throw new Error('Target web page exceeds the maximum allowable size of 5 MB.')
  }

  // 6. Safe streaming response body with hard byte limit
  const body = finalResponse.body
  if (!body) {
    throw new Error('Target website returned an empty response body.')
  }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let bytesReceived = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      bytesReceived += value.length
      if (bytesReceived > MAX_RESPONSE_BYTES) {
        // Safe truncate: cancel remaining stream without running out of memory
        await reader.cancel()
        break
      }
    }
  }

  const combined = new Uint8Array(bytesReceived)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  const decoder = new TextDecoder('utf-8')
  const html = decoder.decode(combined)
  const pageSizeKb = Math.round(bytesReceived / 1024)
  const hasSsl = currentUrl.startsWith('https://')

  return {
    html,
    finalUrl: currentUrl,
    responseTimeMs,
    pageSizeKb,
    hasSsl,
  }
}

export async function analyzeWebsite(targetUrl: string): Promise<AuditAnalysisResult> {
  const normalized = normalizeUrl(targetUrl)

  // 1. Fetch HTML safely with complete SSRF, redirect, and payload guards
  const { html, finalUrl, responseTimeMs, pageSizeKb, hasSsl } = await safeFetchHtml(normalized)

  // 2. Parse HTML structure & metadata
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : null
  const titleLength = title ? title.length : 0

  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null
  const metaDescLength = metaDescription ? metaDescription.length : 0

  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html)
  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html)
  const hasOpenGraph =
    /<meta[^>]*property=["']og:title["']/i.test(html) ||
    /<meta[^>]*property=["']og:image["']/i.test(html)
  const hasRobotsNoIndex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)

  // Headings
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  const h1Count = h1Matches.length
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h2Count = h2Matches.length

  // Schema & Structured Data
  const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["']/i.test(html)

  // Images & Alt Attributes
  const imgTags = html.match(/<img[^>]*>/gi) || []
  const imgTotal = imgTags.length
  let imgWithoutAlt = 0
  for (const img of imgTags) {
    if (!/alt=["'][^"']+["']/i.test(img)) {
      imgWithoutAlt++
    }
  }

  // Conversion Hooks & Contact Channels
  const hasTelLink = /href=["']tel:[^"']+["']/i.test(html)
  const hasMailto = /href=["']mailto:[^"']+["']/i.test(html)
  const hasWhatsApp = /(?:wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/i.test(html)
  const hasForm = /<form[^>]*>/i.test(html)
  const hasTracking =
    /(?:googletagmanager\.com|google-analytics\.com|gtag\(|fbq\(|connect\.facebook\.net)/i.test(html)

  // Commercial Call-To-Action Triggers
  const ctaWordsRegex =
    /(?:contact|enquire|get in touch|book a call|schedule|free audit|consultation|buy now|start free|talk to us)/i
  const hasCtaButtons = ctaWordsRegex.test(html)

  // 3. Category Score Calculations (0 to 100)
  // A. Performance Score
  let perfScore = 100
  if (responseTimeMs > 2500) perfScore -= 40
  else if (responseTimeMs > 1500) perfScore -= 25
  else if (responseTimeMs > 800) perfScore -= 12

  if (pageSizeKb > 3500) perfScore -= 25
  else if (pageSizeKb > 2000) perfScore -= 15
  else if (pageSizeKb > 1000) perfScore -= 8

  if (!hasSsl) perfScore -= 30
  perfScore = Math.max(10, Math.min(100, perfScore))

  // B. SEO Score
  let seoScore = 100
  if (!title) seoScore -= 25
  else if (titleLength < 25 || titleLength > 70) seoScore -= 10

  if (!metaDescription) seoScore -= 25
  else if (metaDescLength < 60 || metaDescLength > 165) seoScore -= 10

  if (h1Count === 0) seoScore -= 20
  else if (h1Count > 1) seoScore -= 8

  if (!hasCanonical) seoScore -= 10
  if (!hasOpenGraph) seoScore -= 10
  if (!hasJsonLd) seoScore -= 10

  if (imgTotal > 0 && imgWithoutAlt / imgTotal > 0.4) seoScore -= 15
  if (hasRobotsNoIndex) seoScore -= 40
  seoScore = Math.max(10, Math.min(100, seoScore))

  // C. Mobile UX Score
  let mobileScore = 100
  if (!hasViewport) mobileScore -= 50
  if (!hasTelLink && !hasWhatsApp) mobileScore -= 20
  if (pageSizeKb > 2500) mobileScore -= 15
  if (responseTimeMs > 1800) mobileScore -= 15
  mobileScore = Math.max(10, Math.min(100, mobileScore))

  // D. Conversion Score
  let conversionScore = 100
  if (!hasForm && !hasWhatsApp && !hasTelLink) conversionScore -= 45
  if (!hasWhatsApp) conversionScore -= 15
  if (!hasTracking) conversionScore -= 25
  if (!hasCtaButtons) conversionScore -= 15
  conversionScore = Math.max(10, Math.min(100, conversionScore))

  // Overall Score (Weighted)
  const overallScore = Math.round(
    perfScore * 0.25 + seoScore * 0.3 + mobileScore * 0.2 + conversionScore * 0.25
  )

  // 4. Detailed Issues Generation
  // Explicitly tagging every item with its nature:
  // - 'measured': Real numerical test (TTFB latency, page payload, character count)
  // - 'detected': Binary DOM element or script detection (SSL, Viewport, Meta tag, WhatsApp link)
  // - 'manual_review': Advisory items requiring human qualitative analysis
  const issues: AuditIssue[] = []

  // Performance Issues
  if (responseTimeMs > 1200) {
    issues.push({
      id: 'perf-latency',
      category: 'performance',
      severity: responseTimeMs > 2200 ? 'critical' : 'warning',
      type: 'measured',
      title: `Server response time is ${responseTimeMs}ms`,
      description: 'Slow server response (TTFB) directly increases bounce rates before visitors even see the headline.',
      recommendation: 'Optimize server hosting, enable edge caching, or upgrade backend infrastructure to reduce TTFB below 600ms.',
    })
  } else {
    issues.push({
      id: 'perf-latency-good',
      category: 'performance',
      severity: 'good',
      type: 'measured',
      title: `Fast server response (${responseTimeMs}ms)`,
      description: 'The server responds quickly to initial connection requests.',
      recommendation: 'Maintain your current caching and CDN configuration.',
    })
  }

  if (!hasSsl) {
    issues.push({
      id: 'perf-ssl',
      category: 'performance',
      severity: 'critical',
      type: 'detected',
      title: 'HTTPS / SSL encryption missing',
      description: 'Browsers warn users that the site is Not Secure, drastically lowering customer trust.',
      recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
    })
  }

  // SEO Issues
  if (!title) {
    issues.push({
      id: 'seo-title-missing',
      category: 'seo',
      severity: 'critical',
      type: 'detected',
      title: 'Missing <title> tag',
      description: 'Search engines have no primary page title to display in Google search results.',
      recommendation: 'Add a distinct, keyword-focused title tag between 40 and 65 characters.',
    })
  } else if (titleLength < 25 || titleLength > 70) {
    issues.push({
      id: 'seo-title-len',
      category: 'seo',
      severity: 'warning',
      type: 'measured',
      title: `Title tag length (${titleLength} characters) is outside optimal range`,
      description: 'Optimal title length is 40–60 characters to avoid truncation in Google search results.',
      recommendation: 'Revise title to include your core service and brand within 55 characters.',
    })
  }

  if (!metaDescription) {
    issues.push({
      id: 'seo-desc-missing',
      category: 'seo',
      severity: 'critical',
      type: 'detected',
      title: 'Missing meta description',
      description: 'Without a meta description, Google extracts random snippet text, resulting in lower click-through rates.',
      recommendation: 'Craft a compelling 140–160 character meta description summarizing your value proposition.',
    })
  } else if (metaDescLength < 60 || metaDescLength > 165) {
    issues.push({
      id: 'seo-desc-len',
      category: 'seo',
      severity: 'warning',
      type: 'measured',
      title: `Meta description length (${metaDescLength} characters) should be optimized`,
      description: 'Target description length is 130–160 characters for complete display in search cards.',
      recommendation: 'Refine your description to deliver a concise value summary with a clear call to action.',
    })
  }

  if (h1Count === 0) {
    issues.push({
      id: 'seo-h1-missing',
      category: 'seo',
      severity: 'critical',
      type: 'detected',
      title: 'No H1 primary heading found',
      description: 'Search crawlers use the H1 to determine the primary topic and commercial intent of your page.',
      recommendation: 'Add a single, clear H1 heading communicating your core offering.',
    })
  } else if (h1Count > 1) {
    issues.push({
      id: 'seo-h1-multiple',
      category: 'seo',
      severity: 'warning',
      type: 'detected',
      title: `Multiple H1 headings found (${h1Count} H1 tags)`,
      description: 'Having multiple H1 tags diffuses keyword relevance for search algorithms.',
      recommendation: 'Keep one primary H1 for the page title and structure sub-sections using H2 and H3 tags.',
    })
  }

  if (!hasOpenGraph) {
    issues.push({
      id: 'seo-og-missing',
      category: 'seo',
      severity: 'warning',
      type: 'detected',
      title: 'Open Graph social preview tags missing',
      description: 'When someone shares your website link on WhatsApp, LinkedIn, or Twitter, no image preview or rich card appears.',
      recommendation: 'Add og:title, og:description, and a high-resolution og:image (1200x630px).',
    })
  }

  if (!hasJsonLd) {
    issues.push({
      id: 'seo-schema-missing',
      category: 'seo',
      severity: 'warning',
      type: 'detected',
      title: 'No Schema.org structured data detected',
      description: 'Structured data (Organization, LocalBusiness, Service) helps Google understand business entity data.',
      recommendation: 'Embed JSON-LD structured data for your organization, services, and breadcrumbs.',
    })
  }

  if (imgWithoutAlt > 0) {
    issues.push({
      id: 'seo-img-alt',
      category: 'seo',
      severity: 'warning',
      type: 'detected',
      title: `${imgWithoutAlt} of ${imgTotal} images missing alt text`,
      description: 'Missing image alt text hurts accessibility and causes loss of Google Image search visibility.',
      recommendation: 'Add descriptive alt text for all content images on the website.',
    })
  }

  // Mobile UX Issues
  if (!hasViewport) {
    issues.push({
      id: 'mobile-viewport',
      category: 'mobile',
      severity: 'critical',
      type: 'detected',
      title: 'Mobile viewport meta tag missing',
      description: 'The page will not scale correctly on mobile devices and will appear zoomed out.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    })
  } else {
    issues.push({
      id: 'mobile-viewport-good',
      category: 'mobile',
      severity: 'good',
      type: 'detected',
      title: 'Mobile responsive viewport configured',
      description: 'The website declares responsive scaling for mobile screens.',
      recommendation: 'Maintain responsive layouts across all breakpoint sizes.',
    })
  }

  // Conversion & Revenue Issues
  if (!hasWhatsApp) {
    issues.push({
      id: 'conv-whatsapp-missing',
      category: 'conversion',
      severity: 'critical',
      type: 'detected',
      title: 'No direct WhatsApp enquiry channel detected',
      description: 'Over 70% of business visitors in India and growing global markets prefer instant WhatsApp engagement over email forms.',
      recommendation: 'Add a persistent WhatsApp Business CTA with pre-filled message intent.',
    })
  } else {
    issues.push({
      id: 'conv-whatsapp-good',
      category: 'conversion',
      severity: 'good',
      type: 'detected',
      title: 'WhatsApp contact channel detected',
      description: 'Visitors have a direct mobile conversation channel.',
      recommendation: 'Ensure incoming WhatsApp chats are connected to an automated CRM or immediate reply workflow.',
    })
  }

  if (!hasTracking) {
    issues.push({
      id: 'conv-tracking-missing',
      category: 'conversion',
      severity: 'critical',
      type: 'detected',
      title: 'No analytics or conversion tracking detected',
      description: 'Google Analytics 4 or Meta Pixel were not detected. You cannot identify where leads come from or which marketing spend converts.',
      recommendation: 'Install Google Tag Manager with GA4 and conversion event listeners.',
    })
  } else {
    issues.push({
      id: 'conv-tracking-good',
      category: 'conversion',
      severity: 'good',
      type: 'detected',
      title: 'Marketing & conversion tracking detected',
      description: 'Analytics or pixel scripts are active on the site.',
      recommendation: 'Ensure custom goal conversion events (form submissions, button clicks) are configured.',
    })
  }

  if (!hasForm && !hasTelLink && !hasWhatsApp) {
    issues.push({
      id: 'conv-lead-leak',
      category: 'conversion',
      severity: 'critical',
      type: 'detected',
      title: 'High enquiry friction: No direct lead capture method found',
      description: 'No forms or direct phone links were detected on the page. Visitors have no clear way to convert into customers.',
      recommendation: 'Implement an enquiry form and prominent contact triggers across all pages.',
    })
  }

  // Manual Review Advisory Items (Qualitative Teardown)
  issues.push({
    id: 'manual-copy-review',
    category: 'conversion',
    severity: 'warning',
    type: 'manual_review',
    title: 'Value proposition & decision-trigger teardown (Manual Review)',
    description: 'Automated scans inspect technical tags; a human CRO strategist must evaluate copy clarity, headline urgency, and trust proof.',
    recommendation: 'Schedule a founder teardown session with Chazon to review customer journey friction and messaging.',
  })

  issues.push({
    id: 'manual-local-intent',
    category: 'seo',
    severity: 'warning',
    type: 'manual_review',
    title: 'Local commercial intent & Google Map authority (Manual Review)',
    description: 'Ranking for local commercial keywords requires verifying Google Business Profile citations and NAP consistency.',
    recommendation: 'Request an in-depth Local SEO review to identify competitive local ranking gaps.',
  })

  return {
    id: generateReference('AUD'),
    url: targetUrl,
    normalizedUrl: finalUrl,
    overallScore,
    scores: {
      performance: perfScore,
      seo: seoScore,
      mobile: mobileScore,
      conversion: conversionScore,
    },
    metrics: {
      responseTimeMs,
      pageSizeKb,
      hasSsl,
      hasViewport,
      title,
      titleLength,
      metaDescription,
      metaDescLength,
      hasCanonical,
      hasOpenGraph,
      h1Count,
      h2Count,
      imgTotal,
      imgWithoutAlt,
      hasTelLink,
      hasMailto,
      hasWhatsApp,
      hasForm,
      hasTracking,
    },
    issues,
    analyzedAt: new Date().toISOString(),
  }
}
