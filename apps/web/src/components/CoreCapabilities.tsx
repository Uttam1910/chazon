import {
  BarChart3,
  CreditCard,
  Database,
  MessageSquare,
  Search,
  Workflow,
  ArrowRight,
} from 'lucide-react'
import { Link } from '../router'

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Business API',
    subtitle: 'Conversational Conversion',
    description:
      'Turn mobile traffic into conversations with automated welcome triggers, catalog browsing, lead triage, and direct WhatsApp sales workflows.',
    tag: 'Instant Follow-Up',
  },
  {
    icon: Database,
    title: 'CRM Integrations',
    subtitle: 'Pipeline Visibility',
    description:
      'Seamless two-way sync with Zoho, HubSpot, Salesforce, and custom databases ensuring every lead is logged, assigned, and tracked to revenue.',
    tag: 'Zero Lead Leaks',
  },
  {
    icon: CreditCard,
    title: 'Payment Gateways',
    subtitle: 'Frictionless Commerce',
    description:
      'Robust UPI, Razorpay, Cashfree, and international card checkouts engineered for sub-second confirmations and high transaction success rates.',
    tag: 'Secure Checkouts',
  },
  {
    icon: Workflow,
    title: 'Marketing Automation',
    subtitle: 'Automated Lifecycle',
    description:
      'Multi-step email nurture journeys, abandoned cart recovery sequences, and behavior-triggered customer retention flows that run 24/7.',
    tag: 'Automated Retention',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    subtitle: 'Revenue Attribution',
    description:
      'Server-side Google Tag Manager, GA4 event tracking, and Meta Conversions API (CAPI) providing transparent ROI reporting on every marketing rupee.',
    tag: 'Real Commercial ROI',
  },
  {
    icon: Search,
    title: 'Commercial Intent SEO',
    subtitle: 'High-Intent Discovery',
    description:
      'Technical Core Web Vitals optimization, Schema.org JSON-LD structured data, and local Google 3-Pack authority that captures buyers when they search.',
    tag: 'Organic Demand',
  },
]

export function CoreCapabilities() {
  return (
    <section className="section core-capabilities-section surface-cream" id="capabilities" aria-labelledby="capabilities-title">
      <div className="container">
        <div className="text-center section-center-head">
          <span className="pill-eyebrow">INTEGRATED DIFFERENTIATORS</span>
          <h2 id="capabilities-title" className="section-title-large">
            Capabilities That Power Your <em>Digital Revenue Engine</em>
          </h2>
          <p className="section-sub-desc">
            We don’t rely on disconnected third-party tools. We integrate automation, CRM, payment, and analytics capabilities directly into your customer journey.
          </p>
        </div>

        <div className="capabilities-grid">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.title} className="capability-card">
                <div className="cap-head">
                  <div className="cap-icon-box">
                    <Icon size={24} className="cap-icon" />
                  </div>
                  <span className="cap-tag">{c.tag}</span>
                </div>
                <h3 className="cap-title">{c.title}</h3>
                <span className="cap-subtitle">{c.subtitle}</span>
                <p className="cap-desc">{c.description}</p>
              </div>
            )
          })}
        </div>

        <div className="capabilities-footer-callout">
          <p>
            Looking to connect WhatsApp, CRM workflows, or payment gateways into your existing platform?
          </p>
          <Link to="/contact" className="button button-outline">
            Discuss Your System Requirements <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
