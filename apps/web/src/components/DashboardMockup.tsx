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
          width={2064}
          height={1152}
          loading="eager"
        />
      </picture>
    </div>
  )
}

