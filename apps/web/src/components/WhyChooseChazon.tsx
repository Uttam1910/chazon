import {
  BarChart2,
  BarChart3,
  CreditCard,
  Database,
  Layers,
  LineChart,
  RefreshCw,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { WhatsAppIcon } from './Layout'

export function WhyChooseChazon() {
  const whyPoints = [
    {
      title: 'Revenue-led thinking',
      desc: 'Focus on business outcomes, not just deliverables.',
      icon: BarChart2,
    },
    {
      title: 'Connected solutions',
      desc: 'Website, marketing, CRM and automation work together.',
      icon: Layers,
    },
    {
      title: 'Data-informed decisions',
      desc: 'Use analytics to understand what is working.',
      icon: LineChart,
    },
    {
      title: 'Continuous improvement',
      desc: 'Optimise the customer journey as your business grows.',
      icon: RefreshCw,
    },
  ]

  const integrations = [
    {
      name: 'WhatsApp Business',
      icon: WhatsAppIcon,
      color: '#25D366',
      bg: 'rgba(37, 211, 102, 0.12)',
    },
    {
      name: 'CRM Systems',
      icon: Database,
      color: '#FF6A3D',
      bg: 'rgba(255, 106, 61, 0.12)',
    },
    {
      name: 'Payment Gateways',
      icon: CreditCard,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      name: 'Marketing Automation',
      icon: Zap,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      name: 'Analytics & Reporting',
      icon: BarChart3,
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.12)',
    },
    {
      name: 'E-commerce Platforms',
      icon: ShoppingBag,
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.12)',
    },
  ]

  return (
    <section
      className="why-and-tech-section surface-cream"
      id="why-choose"
      aria-labelledby="why-choose-heading"
    >
      <div className="container">
        <div className="why-and-tech-grid">
          {/* Left Column: Why Choose Chazon */}
          <div className="why-choose-column">
            <span className="why-eyebrow-orange">WHY CHOOSE CHAZON</span>
            <h2 id="why-choose-heading" className="why-main-heading">
              A Growth Partner, Not Just a Service Provider
            </h2>

            <div className="why-points-grid" role="list" aria-label="Why Choose Chazon Key Advantages">
              {whyPoints.map((pt) => {
                const Icon = pt.icon
                return (
                  <div key={pt.title} className="why-point-item" role="listitem">
                    <div className="wpi-icon-box" aria-hidden="true">
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="wpi-text">
                      <h3 className="wpi-title">{pt.title}</h3>
                      <p className="wpi-desc">{pt.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Technology & Integrations Dark Box */}
          <div className="tech-integrations-card" aria-labelledby="tech-integrations-title">
            <span className="tic-eyebrow">TECHNOLOGY & INTEGRATIONS</span>
            <h2 id="tech-integrations-title" className="tic-heading">
              Connect. Automate. Grow.
            </h2>
            <p className="tic-subtitle">
              We integrate the right tools to streamline your marketing, sales and customer experiences.
            </p>

            <div className="tic-apps-grid" role="list" aria-label="Integrated Platforms and Capabilities">
              {integrations.map((app) => {
                const Icon = app.icon
                return (
                  <div key={app.name} className="tic-app-card" role="listitem">
                    <div
                      className="tic-app-icon-wrap"
                      style={{ backgroundColor: app.bg, color: app.color }}
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </div>
                    <span className="tic-app-name">{app.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
