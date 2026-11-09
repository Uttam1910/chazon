import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Globe } from 'lucide-react'
import { useRouter } from '../location'

export function HomeAuditSection() {
  const [url, setUrl] = useState('')
  const { navigate } = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      navigate('/website-audit')
      return
    }
    const clean = trimmed.replace(/^https?:\/\//, '')
    navigate(`/growth-audit?url=${encodeURIComponent(clean)}`)
  }

  return (
    <section
      className="audit-interactive-section surface-cream"
      id="audit-tool"
      aria-labelledby="audit-promo-title"
    >
      <div className="container">
        <div className="audit-promo-card-wrapper">
          {/* Left: Preview Score Card */}
          <div className="audit-score-preview-card" aria-hidden="true">
            <span className="aspc-header-title">Website Audit</span>

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
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset="48"
                  strokeLinecap="round"
                />
              </svg>
              <div className="gauge-number-wrap">
                <span className="gauge-val">82</span>
                <span className="gauge-lbl">Overall Score</span>
              </div>
            </div>

            <ul className="aspc-checklist">
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>SEO</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Performance</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Accessibility</span>
              </li>
              <li className="aspc-check-item">
                <span className="aspc-check-dot">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Best Practices</span>
              </li>
            </ul>
          </div>

          {/* Right: Copy & Form */}
          <div className="audit-promo-content">
            <span className="audit-eyebrow-orange">FREE WEBSITE AUDIT</span>
            <h2 id="audit-promo-title" className="audit-promo-heading">
              Is Your Website Helping Your Business Grow?
            </h2>
            <p className="audit-promo-desc">
              Get a complete, real-time analysis of your website’s SEO, performance, accessibility and conversion readiness.
            </p>

            <div className="audit-form-container">
              {/* Handwritten Note Annotation with Curved Arrow */}
              <div className="audit-handwritten-note" aria-hidden="true">
                <span>Get actionable insights in minutes.</span>
                <svg
                  className="handwritten-arrow-svg"
                  width="44"
                  height="34"
                  viewBox="0 0 44 34"
                  fill="none"
                >
                  <path
                    d="M38 4C28 2 12 10 10 24M10 24L4 18M10 24L16 20"
                    stroke="#D84502"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <form onSubmit={handleSubmit} className="audit-quick-form" role="search" aria-label="Quick Website Audit Form">
                <div className="audit-input-wrap">
                  <Globe size={18} className="audit-input-icon" aria-hidden="true" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your website URL (e.g. yourbusiness.com)"
                    className="audit-url-input"
                    aria-label="Website URL to audit"
                    required
                  />
                </div>
                <button type="submit" className="audit-submit-btn">
                  Analyse My Website <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
