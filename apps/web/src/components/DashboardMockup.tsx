import { BarChart3, Users } from 'lucide-react'

export function DashboardMockup() {
  return (
    <div className="hero-dashboard-scene" aria-label="Chazon Business Growth dashboard demonstration">
      <div className="hero-dashboard-backdrop-glow" aria-hidden="true" />
      <picture className="hero-dashboard-picture">
        <source srcSet="/assets/hero-laptop-desk.webp" type="image/webp" />
        <img
          src="/assets/hero-laptop-desk.png"
          alt="Chazon Business Growth dashboard on laptop showing revenue growth, traffic, leads and conversions"
          className="hero-dashboard-scene-img"
          width={1128}
          height={592}
          loading="eager"
        />
      </picture>

      {/* Floating Badge 1: Top-Right Revenue Metric */}
      <div className="hero-floating-stat-badge stat-badge-revenue" aria-hidden="true">
        <div className="hfsb-icon-wrap hfsb-icon-revenue">
          <BarChart3 size={16} strokeWidth={2.4} />
        </div>
        <div className="hfsb-details">
          <span className="hfsb-label">Revenue</span>
          <span className="hfsb-value">
            <span className="hfsb-arrow">↑</span> +68%
          </span>
        </div>
      </div>

      {/* Floating Badge 2: Bottom-Left Qualified Leads Metric */}
      <div className="hero-floating-stat-badge stat-badge-leads" aria-hidden="true">
        <div className="hfsb-icon-wrap hfsb-icon-leads">
          <Users size={16} strokeWidth={2.4} />
        </div>
        <div className="hfsb-details">
          <span className="hfsb-label">Qualified Leads</span>
          <span className="hfsb-value">
            <span className="hfsb-arrow">↑</span> +42%
          </span>
        </div>
      </div>
    </div>
  )
}
