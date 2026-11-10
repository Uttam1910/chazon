import { ArrowRight } from 'lucide-react'
import { engagements } from '../content'
import { Link } from '../router'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'
import { ProcessTimeline } from '../components/ProcessTimeline'
import { GrowthFramework } from '../components/GrowthFramework'
import { Compare, FinalCta, Principles } from '../components/Sections'
import { SectionHead } from '../components/ui'

export function Approach() {
  usePageMeta({
    title: 'Our Approach: Results-Driven Digital Growth Process | Chazon',
    description:
      'A proven, results-driven 6-stage process that turns your business goals into measurable digital growth: Discover, Strategise, Build, Execute, Measure, and Optimise.',
    path: '/approach',
    schema: breadcrumbSchema([['Our Approach', '/approach']]),
  })

  return (
    <PageShell>
      {/* Hero matching Screen 3 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">Our Approach</span>
            </nav>
            <h1 className="phb-title">Our Approach</h1>
            <p className="phb-lead">
              A proven, results-driven process that turns your business goals into measurable digital growth.
            </p>
            <div className="button-row">
              <Link to="/contact" className="button button-primary">
                Discuss Your Objectives <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="button button-secondary">
                Start a Conversation
              </Link>
            </div>
          </div>

          <div className="phb-visual">
            {/* Visual representing the Zen stones / balance from Screen 3 */}
            <svg viewBox="0 0 320 220" className="approach-hero-svg" aria-hidden="true">
              <defs>
                <linearGradient id="warmStoneGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF9F3" />
                  <stop offset="100%" stopColor="#FCE9DA" />
                </linearGradient>
                <linearGradient id="stone3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DFC3B0" />
                  <stop offset="100%" stopColor="#B69782" />
                </linearGradient>
                <linearGradient id="stone2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E2A27F" />
                  <stop offset="100%" stopColor="#C9754C" />
                </linearGradient>
                <linearGradient id="stone1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E84B0B" />
                  <stop offset="100%" stopColor="#BF3C08" />
                </linearGradient>
              </defs>
              <rect width="320" height="220" rx="16" fill="url(#warmStoneGrad)" />
              {/* Stacked balancing stones representing methodical equilibrium */}
              <g transform="translate(160, 185)">
                {/* Base stone */}
                <ellipse cx="0" cy="0" rx="72" ry="24" fill="url(#stone3)" />
                {/* Second stone */}
                <ellipse cx="0" cy="-30" rx="55" ry="19" fill="url(#stone2)" />
                {/* Third stone */}
                <ellipse cx="0" cy="-56" rx="40" ry="15" fill="url(#stone3)" />
                {/* Top stone */}
                <ellipse cx="0" cy="-78" rx="26" ry="11" fill="url(#stone1)" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* The Chazon Growth Framework (Five Stages) */}
      <GrowthFramework />

      {/* The 6-Stage Process and Our Focus matching Screen 3 */}
      <section className="section approach-timeline-section" aria-labelledby="process-heading">
        <div className="container">
          <ProcessTimeline />
        </div>
      </section>

      {/* Traditional vs Chazon Difference */}
      <section className="section surface-cream" aria-labelledby="compare-title">
        <div className="container">
          <SectionHead
            eyebrow="The Difference"
            id="compare-title"
            title={
              <>
                Two Ways to Begin. <em>Only One is Built for Revenue.</em>
              </>
            }
            intro="Most agencies start with their favorite channel (Instagram ads, website redesign). We start with what your business needs to achieve financially, then select the channels that will get you there."
          />
          <Compare />
        </div>
      </section>

      {/* Engagement Models */}
      <section className="section" aria-labelledby="engage-title">
        <div className="container">
          <SectionHead
            eyebrow="Working Together"
            id="engage-title"
            title={
              <>
                Engagement Models Tailored to <em>Your Scale</em>
              </>
            }
            intro="Start with a clearly scoped project, hand over monthly execution, or partner with Chazon as an extended digital growth team."
          />
          <ol className="engagements-grid">
            {engagements.map(([title, text], i) => (
              <li key={title} className="engagement-card">
                <span className="eng-num">0{i + 1}</span>
                <h4>{title}</h4>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="section surface-warm-dark text-white" aria-labelledby="principles-title">
        <div className="container">
          <SectionHead
            eyebrow="Guiding Philosophy"
            id="principles-title"
            title={
              <>
                Six Principles Behind <em>Every Engagement</em>
              </>
            }
          />
          <Principles />
        </div>
      </section>

      <FinalCta />
    </PageShell>
  )
}

export { About } from './About'
