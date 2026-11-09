import { useState } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { Link } from '../router'

interface WorkProject {
  id: string
  slug: string
  title: string
  category: 'Website' | 'E-commerce' | 'Marketing' | 'SEO'
  subCategory: string
  highlightStat: string
  description: string
  challenge: string
  solution: string
  deliverables: string[]
  themeColor: string
}

const WORK_PROJECTS: WorkProject[] = [
  {
    id: 'jewellery',
    slug: 'handmade-jewellery-ecommerce',
    title: 'Handmade Jewellery Brand',
    category: 'E-commerce',
    subCategory: 'Direct-to-Consumer Store',
    highlightStat: '↑ 3.2× Revenue in 6 Months',
    description: 'Transitioned an artisanal jewellery brand to an independent digital storefront with automated WhatsApp cart recovery.',
    challenge: 'Relied exclusively on sporadic exhibitions and manual Instagram DMs with high drop-off and zero repeat purchase tracking.',
    solution: 'Designed a high-speed Shopify experience, set up Meta Ads catalog sales, and automated post-purchase care sequences.',
    deliverables: ['Custom Shopify Store', 'WhatsApp Checkout Assistance', 'Meta Ads Catalog Funnel', 'GA4 E-commerce Tracking'],
    themeColor: '#E84B0B',
  },
  {
    id: 'hospitality',
    slug: 'hospitality-booking-platform',
    title: 'Hospitality Platform',
    category: 'Website',
    subCategory: 'Direct Booking Engine',
    highlightStat: '↑ 55% More Bookings',
    description: 'Engineered a direct guest booking portal with local SEO authority, cutting external OTA commission fees by 38%.',
    challenge: 'High reliance on third-party OTA platforms eating 18–25% commission fees per booking with poor direct brand recall.',
    solution: 'Built a sub-second mobile booking flow, integrated Google Business Profile local search, and streamlined WhatsApp inquiry triage.',
    deliverables: ['Direct Reservation Flow', 'Google Local SEO & GBP', 'Google Ads Search Engine', 'WhatsApp Concierge Automation'],
    themeColor: '#351A12',
  },
  {
    id: 'manufacturing',
    slug: 'manufacturing-b2b-corporate',
    title: 'Manufacturing Business',
    category: 'Marketing',
    subCategory: 'Corporate Website & RFQ Portal',
    highlightStat: '↑ 78% Lead Generation',
    description: 'Engineered an enterprise B2B product catalog and structured RFQ inquiry funnel for domestic and export expansion.',
    challenge: 'Legacy brochure site was invisible in search results and generated zero qualified B2B quotes outside domestic Maharashtra.',
    solution: 'Restructured technical component catalog, implemented industrial SEO for 120+ keywords, and routed RFQ submissions directly to sales CRM.',
    deliverables: ['Corporate Catalog Architecture', 'Industrial SEO Strategy', 'B2B RFQ Smart Form', 'CRM Lead Automation'],
    themeColor: '#D94308',
  },
  {
    id: 'wellness',
    slug: 'health-wellness-clinic-growth',
    title: 'Health & Wellness Brand',
    category: 'SEO',
    subCategory: 'Digital Growth & Clinic Booking',
    highlightStat: '↑ 2.8× Website Traffic',
    description: 'Integrated local search authority, appointment booking optimization, and paid acquisition across 4 regional clinics.',
    challenge: 'Disjointed social posts failed to convert into clinic consultations, while competitors dominated regional Google search rankings.',
    solution: 'Created localized clinical service landing pages, structured medical schema markup, and streamlined WhatsApp consultation triage.',
    deliverables: ['Local Search & Maps Authority', 'Appointment Booking CRO', 'Meta & Google Ads Engine', 'Automated Clinic Reminders'],
    themeColor: '#2B1710',
  },
]

export function WorkShowcase({ isPage = false }: { isPage?: boolean }) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Website' | 'E-commerce' | 'Marketing' | 'SEO'>('All')

  const filtered = activeFilter === 'All' ? WORK_PROJECTS : WORK_PROJECTS.filter(p => p.category === activeFilter)

  return (
    <div className={`work-showcase-component ${isPage ? 'is-page' : ''}`}>
      {/* Category filter pills */}
      <div className="work-filters" role="tablist" aria-label="Filter case studies by category">
        {(['All', 'Website', 'E-commerce', 'Marketing', 'SEO'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeFilter === tab}
            className={`filter-pill ${activeFilter === tab ? 'is-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="work-cards-grid">
        {filtered.map(project => (
          <div key={project.id} className="work-project-card">
            {/* Visual Frame */}
            <div className="project-mockup-frame">
              <div className="mockup-screen-inner">
                {/* SVG Mockup previewing the project UI */}
                <svg viewBox="0 0 360 210" className="mockup-screen-svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <defs>
                    <linearGradient id={`grad-${project.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFF9F3" />
                      <stop offset="100%" stopColor="#FCE9DA" />
                    </linearGradient>
                  </defs>
                  
                  {/* Browser / Laptop Header */}
                  <rect width="360" height="210" fill={`url(#grad-${project.id})`} />
                  <rect x="0" y="0" width="360" height="26" fill="#351A12" />
                  <circle cx="16" cy="13" r="3.5" fill="#FF5F56" />
                  <circle cx="28" cy="13" r="3.5" fill="#FFBD2E" />
                  <circle cx="40" cy="13" r="3.5" fill="#27C93F" />
                  <rect x="60" y="6" width="240" height="14" rx="4" fill="#4A281E" />

                  {/* Mockup content representation */}
                  <g transform="translate(20, 42)">
                    {/* Simulated website header */}
                    <rect x="0" y="0" width="80" height="12" rx="3" fill="#E84B0B" />
                    <rect x="180" y="2" width="140" height="8" rx="2" fill="#D9CDC3" />
                    
                    {/* Simulated hero card */}
                    <rect x="0" y="22" width="200" height="18" rx="4" fill="#351A12" />
                    <rect x="0" y="46" width="160" height="10" rx="3" fill="#A89286" />
                    <rect x="0" y="62" width="90" height="20" rx="10" fill="#E84B0B" />

                    {/* Simulated product/service cards */}
                    <rect x="220" y="22" width="100" height="120" rx="8" fill="#FFFFFF" stroke="#E3D6CC" strokeWidth="1.5" />
                    <rect x="230" y="32" width="80" height="50" rx="4" fill="#F8DFCA" />
                    <rect x="230" y="90" width="60" height="8" rx="2" fill="#351A12" />
                    <rect x="230" y="104" width="40" height="8" rx="2" fill="#E84B0B" />
                  </g>
                </svg>

                {/* Floating highlight tag */}
                <div className="project-stat-pill">
                  <span>{project.highlightStat}</span>
                </div>
              </div>
            </div>

            {/* Project Content */}
            <div className="project-card-body">
              <div className="project-card-header">
                <span className="project-category-badge">{project.subCategory}</span>
                <h3 className="project-title">{project.title}</h3>
              </div>

              <p className="project-desc">{project.description}</p>

              <div className="project-deliverables">
                {project.deliverables.slice(0, 3).map(item => (
                  <span key={item} className="deliverable-tag">
                    <Check size={12} /> {item}
                  </span>
                ))}
              </div>

              <div className="project-card-footer">
                <Link to={`/work/${project.slug}`} className="project-read-link">
                  View Full Case Study <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA banner */}
      <div className="work-cta-banner">
        <div className="wcb-text">
          <span className="wcb-spark"><Sparkles size={18} /></span>
          <div>
            <strong>Want Similar Results for Your Business?</strong>
            <p>Let's discuss your goals and build a revenue-led digital growth plan.</p>
          </div>
        </div>
        <Link to="/contact" className="button button-primary">
          Let's Talk <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
