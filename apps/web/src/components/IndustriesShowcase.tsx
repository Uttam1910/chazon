import { 
  ShoppingBag, 
  Factory, 
  Store, 
  HeartPulse, 
  Hotel, 
  Briefcase, 
  Rocket, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { Link } from '../router'

interface IndustryCard {
  id: string
  name: string
  icon: typeof ShoppingBag
  focus: string
  description: string
  metric: string
}

const INDUSTRIES: IndustryCard[] = [
  {
    id: 'd2c',
    name: 'D2C & E-Commerce',
    icon: ShoppingBag,
    focus: 'Storefronts · Retention · LTV',
    description: 'High-speed bespoke stores, automated WhatsApp checkout recovery, and retention funnels built to maximize customer lifetime value.',
    metric: '3.2× Average Revenue Scaling',
  },
  {
    id: 'b2b',
    name: 'B2B & Manufacturing',
    icon: Factory,
    focus: 'RFQ Pipelines · Trade Leads · Specs',
    description: 'Structured product catalogs, industrial search visibility, and streamlined RFQ quote systems for domestic and export markets.',
    metric: '+78% Qualified Commercial Quotes',
  },
  {
    id: 'retail',
    name: 'Retail & Consumer Brands',
    icon: Store,
    focus: 'Local Search · Footfall · Omnichannel',
    description: 'Connecting Google Maps presence with digital discovery to drive in-store footfall, catalog inquiries, and repeat purchases.',
    metric: '+64% Store Footfall & Leads',
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    icon: HeartPulse,
    focus: 'Patient Trust · Local Maps · Consultations',
    description: 'Trust-first clinical hubs, medical schema architecture, and rapid WhatsApp patient consultation triage.',
    metric: '+62% Appointment Bookings',
  },
  {
    id: 'hospitality',
    name: 'Hospitality & Travel',
    icon: Hotel,
    focus: 'Direct Booking Engine · Zero OTA Fees',
    description: 'Direct guest reservation flows and local authority systems that bypass 18–25% third-party booking commissions.',
    metric: '38% Commission Savings',
  },
  {
    id: 'professional',
    name: 'Professional Services',
    icon: Briefcase,
    focus: 'Advisory Authority · Corporate Retainers',
    description: 'Positioning executive expertise, streamlining consultation intake, and nurturing high-value corporate decision makers.',
    metric: '2.4× Enterprise Lead Velocity',
  },
  {
    id: 'startups',
    name: 'High-Growth Startups',
    icon: Rocket,
    focus: 'Rapid Go-To-Market · Scalable Funnels',
    description: 'Lean, scalable digital infrastructure, rapid conversion validation, and automated customer onboarding systems.',
    metric: 'Sub-2-Week Architecture Setup',
  },
  {
    id: 'commerce',
    name: 'Digital Commerce & Marketplaces',
    icon: TrendingUp,
    focus: 'Multi-Channel Growth · Conversion Architecture',
    description: 'Connecting marketplace discovery with high-margin owned channels, customer journey mapping, and conversion engineering.',
    metric: '+45% Channel Diversification',
  },
]

export function IndustriesShowcase() {
  return (
    <section className="section industries-home-section surface-cream" id="industries" aria-labelledby="industries-home-title">
      <div className="container">
        {/* Section Header */}
        <div className="industries-home-head-split">
          <div className="ihh-left">
            <span className="ihh-eyebrow-orange">SECTORS WE TRANSFORM</span>
            <h2 id="industries-home-title" className="ihh-title">
              Tailored Growth Strategies for Every Business Model
            </h2>
            <p className="ihh-subtitle">
              Every industry has distinct customer decision journeys. We architect custom digital growth systems aligned with the specific commercial realities of your market.
            </p>
          </div>
          <div className="ihh-right">
            <Link to="/contact" className="ihh-view-all-link">
              Discuss Your Sector <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 8 Industry Cards Grid */}
        <div className="industries-home-cards-grid" role="list" aria-label="Industries and Sectors Served">
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon
            return (
              <div key={ind.id} className="industry-home-card" role="listitem">
                <div className="ind-card-top">
                  <div className="ind-icon-wrap" aria-hidden="true">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="ind-metric-pill">{ind.metric}</span>
                </div>

                <h3 className="ind-card-title">{ind.name}</h3>
                <span className="ind-focus-tag">{ind.focus}</span>
                <p className="ind-card-desc">{ind.description}</p>
              </div>
            )
          })}
        </div>

        {/* Bottom Proof & Trust Strip */}
        <div className="industries-trust-footer">
          <div className="ind-trust-points">
            <div className="ind-tp-item">
              <CheckCircle2 size={16} className="ind-tp-check" />
              <span>10+ Business Sectors Supported</span>
            </div>
            <div className="ind-tp-item">
              <ShieldCheck size={16} className="ind-tp-check" />
              <span>100% Custom Digital Architectures</span>
            </div>
            <div className="ind-tp-item">
              <CheckCircle2 size={16} className="ind-tp-check" />
              <span>Zero Cookie-Cutter Templates</span>
            </div>
          </div>
          <Link to="/contact" className="ind-talk-link">
            Explore Solutions for Your Sector <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
