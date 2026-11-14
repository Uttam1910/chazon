import { useState } from 'react'
import { ArrowRight, Search, Target, Users, Workflow } from 'lucide-react'
import { Link } from '../router'

const growthOptions = [
  {
    label: 'Get found online',
    icon: Search,
    title: 'Build your visibility',
    description: 'Reach more of the right people through search and digital marketing.',
    href: '/services/seo-services',
    cta: 'Explore SEO',
  },
  {
    label: 'Get more leads',
    icon: Users,
    title: 'Attract more customers',
    description: 'Create campaigns that bring qualified prospects to your business.',
    href: '/services/digital-marketing',
    cta: 'Explore digital marketing',
  },
  {
    label: 'Convert more visitors',
    icon: Target,
    title: 'Turn visits into enquiries',
    description: 'Make it easier for website visitors to take the next step.',
    href: '/services/website-development',
    cta: 'Explore website development',
  },
  {
    label: 'Save time',
    icon: Workflow,
    title: 'Automate everyday work',
    description: 'Connect your tools and simplify repetitive business processes.',
    href: '/services/business-automation',
    cta: 'Explore business automation',
  },
]

export function HeroGrowthPicker() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = growthOptions[selectedIndex]

  return (
    <section className="hero-growth-picker" aria-label="Choose your business growth goal">
      <div className="hero-growth-choice">
        <div className="hero-growth-prompt">
          <span className="hero-growth-eyebrow">YOUR NEXT STEP</span>
          <h2>What would help your business grow?</h2>
        </div>
        <div className="hero-growth-options" role="group" aria-label="Business growth goals">
          {growthOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
              >
                <Icon size={15} aria-hidden="true" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="hero-growth-next" aria-live="polite">
        <div className="hero-growth-recommendation">
          <strong>{selected.title}</strong>
          <p>{selected.description}</p>
        </div>
        <Link to={selected.href} className="hero-growth-cta">
          {selected.cta} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
