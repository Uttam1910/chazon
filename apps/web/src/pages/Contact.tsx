import {
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react'
import { useRouter } from '../location'
import { Link } from '../router'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'
import { SmartEnquiryForm, normalizeCategory } from '../components/SmartEnquiryForm'

export function Contact() {
  const { search } = useRouter()
  const params = new URLSearchParams(search)

  const rawType = params.get('type') || params.get('category')
  const initialCategory = normalizeCategory(rawType) || undefined
  const initialService = params.get('service') ?? undefined
  const initialUrl = params.get('url') ?? undefined
  const auditRef = params.get('ref') ?? undefined
  const auditScore = params.get('score') ?? undefined

  usePageMeta({
    title: 'Contact Us | Let’s Talk About Your Growth | Chazon Digital Ventures',
    description:
      'Have a project in mind, a question about our services or want to explore how we can work together? Let’s talk about your digital growth.',
    path: '/contact',
    schema: breadcrumbSchema([['Contact', '/contact']]),
  })

  return (
    <PageShell hideFooterCta>
      <div className="contact-page-wrapper surface-cream">
        <div className="container contact-page-container">
          {/* Breadcrumb Navigation */}
          <nav className="contact-page-breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb-diamond" aria-hidden="true">❖</span>
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">&gt;</span>
            <span className="breadcrumb-current">Contact</span>
          </nav>

          <div className="contact-layout-grid">
            {/* Left Column: Heading & 3 Supporting Points */}
            <div className="contact-left-col">
              <span className="contact-eyebrow">GET IN TOUCH</span>
              <h1 className="contact-headline">
                Let’s talk about{' '}
                <span className="serif-italic-accent">your growth.</span>
              </h1>
              <p className="contact-intro">
                Have a project in mind, a question about our services or want to explore how we can work together?
                We’d love to hear from you.
              </p>

              {/* 3 Supporting Points */}
              <div className="contact-points-list">
                {/* Point 1 */}
                <div className="contact-point-item">
                  <div className="cpi-icon-wrap" aria-hidden="true">
                    <BarChart3 size={20} />
                  </div>
                  <div className="cpi-text-wrap">
                    <h2 className="cpi-title">Discuss your goals</h2>
                    <p className="cpi-desc">
                      Tell us where you are and where you want to go.
                    </p>
                  </div>
                </div>

                {/* Point 2 */}
                <div className="contact-point-item">
                  <div className="cpi-icon-wrap" aria-hidden="true">
                    <Layers size={20} />
                  </div>
                  <div className="cpi-text-wrap">
                    <h2 className="cpi-title">Get the right guidance</h2>
                    <p className="cpi-desc">
                      We’ll suggest a practical way forward for your business.
                    </p>
                  </div>
                </div>

                {/* Point 3 */}
                <div className="contact-point-item">
                  <div className="cpi-icon-wrap" aria-hidden="true">
                    <Zap size={20} />
                  </div>
                  <div className="cpi-text-wrap">
                    <h2 className="cpi-title">Explore a collaboration</h2>
                    <p className="cpi-desc">
                      From a single service to an end-to-end growth solution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Central Dynamic Enquiry System */}
            <div className="contact-right-col">
              <div className="contact-form-card">
                <SmartEnquiryForm
                  initialCategory={initialCategory}
                  initialService={initialService}
                  auditUrl={initialUrl}
                  auditRef={auditRef}
                  auditScore={auditScore}
                  location="contact_page"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
