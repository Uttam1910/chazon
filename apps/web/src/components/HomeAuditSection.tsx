import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Globe, Sparkles, AlertTriangle, Zap, Search, ShieldCheck } from 'lucide-react'
import { useRouter } from '../location'

const AUDIT_PILLARS = [
  {
    id: 'overall',
    label: 'Overall',
    score: 82,
    color: '#10B981',
    dashoffset: 48,
    status: 'Good Health',
    insight: 'Strong foundation, but 4 high-impact conversion bottlenecks detected.',
    icon: Sparkles,
  },
  {
    id: 'speed',
    label: 'Speed',
    score: 54,
    color: '#EF4444',
    dashoffset: 122,
    status: 'Speed Warning',
    insight: '3.8s mobile LCP load time drops 40%+ of your visitors before they see your CTA.',
    icon: Zap,
  },
  {
    id: 'seo',
    label: 'SEO Leaks',
    score: 76,
    color: '#F59E0B',
    dashoffset: 64,
    status: 'SEO Opportunity',
    insight: 'Missing rich schema and duplicate title tags hide your pages from Google Search.',
    icon: Search,
  },
  {
    id: 'security',
    label: 'Best Practices',
    score: 88,
    color: '#10B981',
    dashoffset: 32,
    status: 'Compliant',
    insight: 'SSL and HTTP/2 active. Minor accessibility contrast adjustments recommended.',
    icon: ShieldCheck,
  },
] as const

const SAMPLE_DOMAINS = ['mybusiness.com', 'shopfashion.in', 'growthent.co']

export function HomeAuditSection() {
  const [url, setUrl] = useState('')
  const [activePillar, setActivePillar] = useState<typeof AUDIT_PILLARS[number]['id']>('overall')
  const { navigate } = useRouter()

  const current = AUDIT_PILLARS.find((p) => p.id === activePillar) ?? AUDIT_PILLARS[0]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      navigate('/website-audit')
      return
    }
    const clean = trimmed.replace(/^https?:\/\//, '')
    navigate(`/website-audit?url=${encodeURIComponent(clean)}`)
  }

  const handleSampleClick = (sample: string) => {
    setUrl(sample)
  }

  return (
    <section
      className="audit-interactive-section surface-cream"
      id="audit-tool"
      aria-labelledby="audit-promo-title"
    >
      <div className="container">
        <div className="audit-promo-card-wrapper">
          {/* Left: Interactive Score Preview Card */}
          <div className="audit-score-preview-card" role="region" aria-label="Sample Audit Diagnostic Preview">
            <div className="aspc-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="aspc-header-title" style={{ margin: 0 }}>Website health preview</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: current.color === '#10B981' ? '#EBF6EE' : current.color === '#EF4444' ? '#FEE2E2' : '#FEF3C7',
                  color: current.color,
                }}
              >
                {current.status}
              </span>
            </div>

            <p className="audit-preview-caption">Sample report ? Explore the results below</p>

            {/* Pillar Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                background: '#F1EBE4',
                padding: '3px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {AUDIT_PILLARS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePillar(p.id)}
                  aria-pressed={activePillar === p.id}
                  style={{
                    border: 'none',
                    background: activePillar === p.id ? '#FFFFFF' : 'transparent',
                    color: activePillar === p.id ? '#1A1D20' : '#64748B',
                    fontWeight: activePillar === p.id ? 700 : 500,
                    fontSize: '0.75rem',
                    padding: '6px 2px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: activePillar === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Animated Circle Gauge */}
            <div className="aspc-circle-gauge">
              <svg viewBox="0 0 100 100" className="gauge-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#EBF6EE"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={current.color}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={current.dashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div className="gauge-number-wrap">
                <span className="gauge-val" style={{ color: current.color, transition: 'color 0.3s ease' }}>
                  {current.score}
                </span>
                <span className="gauge-lbl">{current.label} Score</span>
              </div>
            </div>

            {/* Dynamic Insight Banner */}
            <div
              style={{
                background: '#FAF6F0',
                border: '1px solid rgba(36, 24, 19, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                lineHeight: 1.45,
                color: '#475569',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={14} style={{ color: current.color, flexShrink: 0, marginTop: '2px' }} />
              <span>{current.insight}</span>
            </div>

            <ul className="aspc-checklist">
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>SEO Indexing</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Speed & LCP</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Mobile UX</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Conversion UX</span>
              </li>
            </ul>
          </div>

          {/* Right: Copy & Form */}
          <div className="audit-promo-content">
            <span className="audit-eyebrow-orange">YOUR NEXT GROWTH OPPORTUNITY</span>
            <h2 id="audit-promo-title" className="audit-promo-heading">
              A healthier website. A stronger business.
            </h2>
            <p className="audit-promo-desc">
              Find what slows your website down and what to improve next. Get a clear picture of your speed, search visibility and customer experience with a free website scan.
            </p>

            <div className="audit-form-container">
              <div className="audit-benefits" aria-label="What your scan covers">
                <span><Zap size={16} /> Performance</span>
                <span><Search size={16} /> Search visibility</span>
                <span><ShieldCheck size={16} /> Best practices</span>
              </div>
              <label className="audit-url-label" htmlFor="home-audit-url">Start with your website address</label>
              <form onSubmit={handleSubmit} className="audit-quick-form" role="search" aria-label="Quick Website Audit Form">
                <div className="audit-input-wrap">
                  <Globe size={18} className="audit-input-icon" aria-hidden="true" />
                  <input
                    id="home-audit-url"
                    type="text"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourbusiness.com"
                    className="audit-url-input"
                    aria-label="Website URL to audit"
                    required
                  />
                </div>
                <button type="submit" className="audit-submit-btn">
                  Scan my website <ArrowRight size={16} />
                </button>
              </form>

              <div className="audit-form-meta">
                <span><Check size={15} /> Free scan</span>
                <span><Check size={15} /> No sign-up needed</span>
              </div>
              <div className="audit-samples">
                <span>Try an example:</span>
                {SAMPLE_DOMAINS.map((sample) => (
                  <button key={sample} type="button" onClick={() => handleSampleClick(sample)}>{sample}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
