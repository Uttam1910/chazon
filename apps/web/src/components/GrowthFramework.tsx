import {
  ArrowRight,
  BarChart3,
  RefreshCw,
  Search,
  Target,
  Users,
} from 'lucide-react'

export function GrowthFramework() {
  const steps = [
    {
      title: 'Discover',
      desc: 'Make your business visible through SEO and digital presence.',
      icon: Search,
      iconColor: '#C9781B',
      iconBg: '#FDF1DC',
      cardBg: '#FFF8F1',
      borderColor: 'rgba(201, 120, 27, 0.16)',
    },
    {
      title: 'Attract',
      desc: 'Bring the right audience through content, social media and advertising.',
      icon: Users,
      iconColor: '#D9481C',
      iconBg: '#FDE9D9',
      cardBg: '#FFF4EB',
      borderColor: 'rgba(217, 72, 28, 0.16)',
    },
    {
      title: 'Convert',
      desc: 'Turn interest into enquiries and sales with high-performing websites and campaigns.',
      icon: Target,
      iconColor: '#C93F16',
      iconBg: '#FDDDCB',
      cardBg: '#FFF0E6',
      borderColor: 'rgba(201, 63, 22, 0.16)',
    },
    {
      title: 'Retain',
      desc: 'Build lasting customer relationships using CRM and marketing automation.',
      icon: RefreshCw,
      iconColor: '#D4384B',
      iconBg: '#FDDFE3',
      cardBg: '#FFF0F2',
      borderColor: 'rgba(212, 56, 75, 0.16)',
    },
    {
      title: 'Grow',
      desc: 'Improve business performance through analytics and continuous optimisation.',
      icon: BarChart3,
      iconColor: '#7D3FA8',
      iconBg: '#EEDCF5',
      cardBg: '#F6EEF9',
      borderColor: 'rgba(125, 63, 168, 0.16)',
    },
  ]

  return (
    <section
      className="framework-journey-section surface-cream"
      id="framework"
      aria-labelledby="framework-title"
    >
      <div className="container">
        <div className="framework-journey-head text-center">
          <span className="framework-eyebrow-orange">THE CHAZON GROWTH FRAMEWORK</span>
          <h2 id="framework-title" className="framework-journey-title">
            A Proven 5-Step Journey to Sustainable Business Growth
          </h2>
          <p className="framework-journey-subtitle">
            A connected approach that turns your digital presence into a measurable business advantage.
          </p>
        </div>

        <div className="framework-journey-cards-row" role="list" aria-label="Five Steps of the Chazon Growth Framework">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="framework-step-wrapper">
                <div
                  className="framework-journey-card"
                  style={{
                    backgroundColor: s.cardBg,
                    borderColor: s.borderColor,
                  }}
                  role="listitem"
                >
                  <div
                    className="framework-step-icon-circle"
                    style={{
                      backgroundColor: s.iconBg,
                      color: s.iconColor,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} strokeWidth={2.3} />
                  </div>
                  <h3 className="framework-step-name">{s.title}</h3>
                  <p className="framework-step-copy">{s.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <span className="framework-connector-arrow" aria-hidden="true">
                    <ArrowRight size={16} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
