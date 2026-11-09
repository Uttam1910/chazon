import {
  ArrowRight,
  Laptop,
  Megaphone,
  RefreshCw,
  Target,
} from 'lucide-react'
import { Link } from '../router'

const FOUR_SERVICE_CATEGORIES = [
  {
    title: 'Digital Foundation',
    desc: 'Website development, UI/UX design and a strong digital presence.',
    path: '/services/website-development',
    icon: Laptop,
  },
  {
    title: 'Digital Growth',
    desc: 'SEO, content marketing, social media and complete digital marketing.',
    path: '/services/digital-marketing',
    icon: Megaphone,
  },
  {
    title: 'Paid Acquisition',
    desc: 'PPC advertising, Google Ads and affiliate & influencer marketing.',
    path: '/services/ppc-advertising',
    icon: Target,
  },
  {
    title: 'Automation & Retention',
    desc: 'Email marketing, CRM and marketing automation to keep customers engaged.',
    path: '/services/business-automation',
    icon: RefreshCw,
  },
]

export function ServicesGrid() {
  return (
    <section
      className="services-suite-section surface-cream"
      id="services-overview"
      aria-labelledby="services-suite-title"
    >
      <div className="container">
        {/* Section Header */}
        <div className="services-head-block">
          <span className="services-eyebrow-orange">OUR SERVICES</span>
          <h2 id="services-suite-title" className="services-suite-title">
            Everything You Need to Build, Market and Grow Online
          </h2>
          <p className="services-suite-desc">
            A complete suite of digital services that work together to generate real business results.
          </p>
        </div>

        {/* 4 Strategic Category Cards Row */}
        <div className="services-category-cards-row" role="list" aria-label="Four Core Digital Growth Service Categories">
          {FOUR_SERVICE_CATEGORIES.map((srv) => {
            const Icon = srv.icon
            return (
              <div
                key={srv.title}
                className="service-category-card"
                role="listitem"
              >
                <div className="scc-icon-wrap" aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="scc-title">{srv.title}</h3>
                <p className="scc-desc">{srv.desc}</p>
                <Link
                  to={srv.path}
                  className="scc-arrow-btn"
                  aria-label={`Explore ${srv.title} services`}
                >
                  <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
