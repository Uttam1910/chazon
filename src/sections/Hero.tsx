import { useEffect, useState, type CSSProperties } from 'react'
import { Button, Label } from '../components/Layout'
import { heroStages } from '../content'
import { prefersReducedMotion } from '../hooks'

// Fig. 01 — each stage adds to the one before it; the bars compound into growth. The whole figure is
// readable at once; the highlight walks through the stages a single time, then rests on Grow.
function RevenueEngine() {
  const last = heroStages.length - 1
  const [active, setActive] = useState(() => (prefersReducedMotion() ? last : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = window.setInterval(() => setActive(i => { if (i + 1 >= last) window.clearInterval(timer); return Math.min(i + 1, last) }), 420)
    return () => window.clearInterval(timer)
  }, [last])
  return <figure className="engine" aria-labelledby="engine-caption">
    <div className="engine-head" aria-hidden="true"><span>The revenue engine</span><span>Fig. 01</span></div>
    <ol className="engine-stages">
      {heroStages.map(([name, note], i) => <li key={name} className={i === active ? 'is-active' : undefined} style={{ '--i': i, '--w': `${((i + 1) / heroStages.length) * 100}%` } as CSSProperties}>
        <span className="engine-num" aria-hidden="true">0{i + 1}</span>
        <span className="engine-name">{name}</span>
        <span className="engine-track" aria-hidden="true"><span/></span>
        <span className="engine-note">{note}</span>
      </li>)}
    </ol>
    <figcaption id="engine-caption"><span>Fig. 01</span>Strategy, build, market, convert, automate, grow — each stage builds on the last.</figcaption>
  </figure>
}

export function Hero() {
  return <section id="home" data-nav="home" className="hero">
    <div className="container hero-grid">
      <div className="hero-copy">
        <Label>Revenue-Led Digital Transformation</Label>
        <h1>Turn your digital presence into a <em>revenue engine.</em></h1>
        <p>Chazon helps businesses build, optimise and scale digital revenue channels through strategy, technology, marketing and automation.</p>
        <div className="button-row"><Button>Let’s Talk</Button><Button href="#services" secondary>Explore Services</Button></div>
      </div>
      <RevenueEngine/>
    </div>
    <div className="container">
      <p className="equation">
        <span className="visually-hidden">Strategy plus digital platforms, marketing, automation, analytics and optimisation leads to revenue growth.</span>
        {['Strategy', 'Digital platforms', 'Marketing', 'Automation', 'Analytics', 'Optimisation'].map((x, i) => <span key={x} aria-hidden="true">{i > 0 && <b>+</b>}{x}</span>)}
        <span aria-hidden="true"><b>→</b><strong>Revenue growth</strong></span>
      </p>
    </div>
  </section>
}
