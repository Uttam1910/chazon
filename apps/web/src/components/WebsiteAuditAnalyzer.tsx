import type { AuditAnalysisResult } from '@chazon/shared'
import { WebsiteAuditView } from './WebsiteAuditView'

export interface WebsiteAuditAnalyzerProps {
  initialUrl?: string
  onFixLeaksWithChazon?: (result: AuditAnalysisResult) => void
  showTitle?: boolean
}

export function WebsiteAuditAnalyzer({
  initialUrl = '',
  onFixLeaksWithChazon,
  showTitle = true,
}: WebsiteAuditAnalyzerProps) {
  void showTitle
  const handleFix = (data: { url: string; score: number; refId?: string }) => {
    if (onFixLeaksWithChazon) {
      onFixLeaksWithChazon({
        id: data.refId || 'scan-ref',
        url: data.url,
        normalizedUrl: data.url,
        overallScore: data.score,
        scores: {
          performance: 75,
          seo: 85,
          mobile: 80,
          conversion: 70,
        },
        metrics: {
          responseTimeMs: 320,
          pageSizeKb: 1200,
          hasSsl: true,
          title: '',
          titleLength: 45,
          metaDescription: '',
          metaDescLength: 140,
          hasCanonical: true,
          hasOpenGraph: true,
          h1Count: 1,
          h2Count: 4,
          imgTotal: 10,
          imgWithoutAlt: 0,
          hasViewport: true,
          hasTelLink: true,
          hasMailto: true,
          hasWhatsApp: true,
          hasForm: true,
          hasTracking: true,
        },
        issues: [],
        analyzedAt: new Date().toISOString(),
      })
    } else {
      window.location.href = `/contact?service=audit&ref=${encodeURIComponent(data.refId || 'live')}&url=${encodeURIComponent(data.url)}&score=${data.score}`
    }
  }

  return (
    <WebsiteAuditView
      initialUrl={initialUrl}
      mode="full"
      asHeroH1={false}
      onFixWithChazon={handleFix}
    />
  )
}
