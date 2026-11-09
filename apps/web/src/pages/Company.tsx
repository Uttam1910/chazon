import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Infinity as InfinityIcon,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { engagements, founder, industries } from '../content'
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
              <Link to="/website-audit" className="button button-secondary">
                Audit Your Current Assets
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

export function About() {
  usePageMeta({
    title: 'About Chazon Digital Ventures | Digital Growth Partner, Mumbai',
    description:
      'Chazon Digital Ventures is a digital revenue and growth partner based in Mumbai, India. We bring strategy, technology, marketing and automation together.',
    path: '/about',
    schema: breadcrumbSchema([['About', '/about']]),
  })

  const values = [
    {
      title: 'Results Focused',
      desc: 'We judge all digital activities by commercial metrics and qualified revenue, not vanity clicks.',
      icon: Target,
    },
    {
      title: 'Client First',
      desc: 'We prioritize our clients’ actual bottom-line success over selling pre-packaged agency hours.',
      icon: Heart,
    },
    {
      title: 'Innovation Driven',
      desc: 'Constantly deploying modern web architectures, automated triage, and intelligent workflows.',
      icon: Lightbulb,
    },
    {
      title: 'Transparency & Trust',
      desc: 'Transparent reporting, honest attribution, and clear next steps without technical jargon.',
      icon: ShieldCheck,
    },
    {
      title: 'Long-Term Partnerships',
      desc: 'Building compounding revenue foundations that scale with our clients over multiple years.',
      icon: InfinityIcon,
    },
  ]

  return (
    <PageShell>
      {/* Hero matching Screen 4 */}
      <section className="page-hero-banner surface-cream">
        <div className="container phb-grid">
          <div className="phb-copy">
            <nav className="phb-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="curr">About</span>
            </nav>
            <h1 className="phb-title">About Chazon</h1>
            <p className="phb-lead">
              A digital growth partner for modern businesses.
            </p>
            <div className="button-row">
              <Link to="/contact" className="button button-primary">
                Start a Conversation <ArrowRight size={18} />
              </Link>
              <Link to="/approach" className="button button-secondary">
                How We Work
              </Link>
            </div>
          </div>

          <div className="phb-visual">
            {/* Visual representing the modern office architecture from Screen 4 */}
            <svg viewBox="0 0 320 220" className="about-hero-svg" aria-hidden="true">
              <defs>
                <linearGradient id="warmOfficeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF9F3" />
                  <stop offset="100%" stopColor="#FCE9DA" />
                </linearGradient>
              </defs>
              <rect width="320" height="220" rx="16" fill="url(#warmOfficeGrad)" />
              {/* Warm modern architectural building */}
              <g transform="translate(60, 30)">
                <polygon points="100,10 180,50 180,170 100,130" fill="#E84B0B" />
                <polygon points="100,10 20,50 20,170 100,130" fill="#DF8D5B" />
                {/* Windows grid on facade */}
                <line x1="100" y1="10" x2="100" y2="130" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="40" y1="65" x2="40" y2="155" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="60" y1="75" x2="60" y2="145" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="80" y1="85" x2="80" y2="135" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="120" y1="85" x2="120" y2="135" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="140" y1="75" x2="140" y2="145" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="160" y1="65" x2="160" y2="155" stroke="#FFF9F3" strokeWidth="1.5" strokeDasharray="4 6" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Who We Are & Mission / Vision matching Screen 4 */}
      <section className="section who-we-are-section" aria-labelledby="who-heading">
        <div className="container">
          <div className="who-we-are-layout">
            <div className="who-copy-box">
              <span className="pill-tag-peach">IDENTITY</span>
              <h2 id="who-heading" className="who-title">
                Who We Are
              </h2>
              <p className="who-main-desc">
                Chazon Digital Ventures is a digital growth company that helps businesses build a strong online presence, attract the right audience, convert opportunities and grow revenue through technology, marketing and automation.
              </p>
              <p className="who-sub-desc">
                Based in Mumbai, Maharashtra, we bridge the gap between creative marketing agencies and deep technical engineering. Rather than treating a website, an ad campaign, or a WhatsApp triage system as isolated projects, we orchestrate them into one unified, compounding customer journey.
              </p>
            </div>

            {/* Mission & Vision Cards matching Screen 4 */}
            <div className="mission-vision-cards">
              <div className="mv-card">
                <div className="mv-head">
                  <div className="mv-icon-wrap"><Target size={22} /></div>
                  <h3>Our Mission</h3>
                </div>
                <p>
                  To help businesses create meaningful digital presence that drives real, measurable business growth.
                </p>
              </div>

              <div className="mv-card">
                <div className="mv-head">
                  <div className="mv-icon-wrap"><Sparkles size={22} /></div>
                  <h3>Our Vision</h3>
                </div>
                <p>
                  To be a trusted digital growth partner for ambitious brands across industries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section (5 Cards) matching Screen 4 */}
      <section className="section surface-cream values-section" aria-labelledby="values-heading">
        <div className="container">
          <SectionHead
            eyebrow="Core Values"
            id="values-heading"
            title={
              <>
                The Principles That Guide <em>Our Work</em>
              </>
            }
            intro="Everything we design, engineer and deploy is governed by five foundational values."
          />

          <div className="values-five-grid">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div key={v.title} className="value-card">
                  <div className="val-icon-box">
                    <Icon size={24} />
                  </div>
                  <h4 className="val-title">{v.title}</h4>
                  <p className="val-desc">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Founder & Leadership Section */}
      <section className="section founder-leadership-section" aria-labelledby="leadership-heading">
        <div className="container">
          <div className="founder-card-box">
            <div className="founder-grid-inner">
              <div className="founder-visual-col">
                <div className="founder-portrait-frame">
                  {/* Portrait Monogram / Professional Avatar */}
                  <svg viewBox="0 0 240 240" className="founder-svg" aria-hidden="true">
                    <rect width="240" height="240" rx="16" fill="#FCE9DA" />
                    <circle cx="120" cy="100" r="48" fill="#E84B0B" />
                    <path
                      d="M60 210 C60 160 180 160 180 210"
                      fill="#351A12"
                    />
                    <text
                      x="120"
                      y="114"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="sans-serif"
                      fontSize="36"
                      fontWeight="bold"
                    >
                      UT
                    </text>
                  </svg>
                  <div className="founder-badge-pill">
                    <span className="fbp-dot" /> Founder & Strategic Advisor
                  </div>
                </div>
              </div>

              <div className="founder-bio-col">
                <span className="pill-tag-orange">LEADERSHIP & ADVISORY</span>
                <h2 id="leadership-heading" className="founder-name">
                  {founder.name}
                </h2>
                <p className="founder-role">{founder.role}</p>

                <p className="founder-bio-p">
                  Chazon Digital Ventures was founded to eliminate the fragmented, low-ROI results generated by traditional agencies. Our founder’s cross-disciplinary experience connects strategy, platform engineering, and performance marketing directly into customer revenue.
                </p>

                <div className="founder-experience-grid">
                  <span className="feg-title">Core Disciplines & Expertise:</span>
                  <ul className="feg-list">
                    {founder.experience.map((exp) => (
                      <li key={exp}>
                        <CheckCircle2 size={15} className="feg-check" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="founder-quote-callout">
                  <blockquote>
                    “Don’t start with a marketing channel. Start with your business objective, understand where your customers make decisions, and build the revenue journey backwards.”
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="section surface-cream" aria-labelledby="about-industries-heading">
        <div className="container">
          <SectionHead
            eyebrow="Industries"
            id="about-industries-heading"
            title={
              <>
                Who We <em>Partner With</em>
              </>
            }
            intro="We serve SMEs, growing D2C brands, B2B distributors, healthcare clinics and hospitality operators."
          />
          <ul className="industries-warm-grid">
            {industries.map(([name, desc]) => (
              <li key={name} className="industry-warm-card">
                <div className="iwc-head">
                  <span className="iwc-bullet" />
                  <h4>{name}</h4>
                </div>
                <p>{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </PageShell>
  )
}
