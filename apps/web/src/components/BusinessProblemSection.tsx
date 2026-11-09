import { EyeOff, Unlink, Target } from 'lucide-react'

export function BusinessProblemSection() {
  const challenges = [
    {
      title: 'Invisible',
      desc: 'Customers cannot easily discover your business.',
      icon: EyeOff,
    },
    {
      title: 'Disconnected',
      desc: 'Your website, marketing and customer journey aren’t working together.',
      icon: Unlink,
    },
    {
      title: 'Unconverted',
      desc: 'Visitors arrive but don’t become customers.',
      icon: Target,
    },
  ]

  return (
    <section
      className="challenge-section surface-cream"
      id="challenge"
      aria-labelledby="challenge-heading"
    >
      <div className="container">
        <div className="challenge-row-grid">
          {/* Left Column: Heading */}
          <div className="challenge-head-col">
            <span className="challenge-eyebrow">THE CHALLENGE</span>
            <h2 id="challenge-heading" className="challenge-main-heading">
              Your business is online.<br />
              <span className="challenge-underline-wrap">
                But is it growing?
                <span className="challenge-accent-line" aria-hidden="true" />
              </span>
            </h2>
          </div>

          {/* Right Column: 3 Diagnostic Cards */}
          <div className="challenge-cards-col" role="list" aria-label="Core Business Challenges">
            {challenges.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} className="challenge-card" role="listitem">
                  <div className="challenge-card-icon-wrap" aria-hidden="true">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="challenge-card-title">{c.title}</h3>
                  <p className="challenge-card-copy">{c.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
