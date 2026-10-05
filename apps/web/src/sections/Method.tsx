import type { CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button, Label } from '../components/Layout'
import { businessFirst, channelFirst, principles, steps } from '../content'
import { useScrollProgress } from '../hooks'

// Small line drawings: target, direction, connection, plan-to-build, rising data, three engagement sizes.
function PrincipleGlyph({ index }: { index: number }) {
  const shapes = [
    <><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="9"/><circle className="fill" cx="24" cy="24" r="3"/></>,
    <><circle className="fill" cx="9" cy="37" r="3"/><path d="M9 37 L37 11"/><path d="M26 11h11v11"/></>,
    <><path d="M24 9 L9 36 H39 Z"/><circle className="fill" cx="24" cy="9" r="3.5"/><circle className="fill" cx="9" cy="36" r="3.5"/><circle className="fill" cx="39" cy="36" r="3.5"/></>,
    <><rect x="5" y="14" width="16" height="20" strokeDasharray="3 3"/><path d="M23 24h5"/><rect className="fill" x="29" y="14" width="14" height="20"/></>,
    <><path d="M6 41h36"/><path d="M11 41v-8M19 41v-13M27 41v-18"/><path className="accent" d="M35 41v-27"/></>,
    <><circle cx="14" cy="30" r="5"/><circle cx="26" cy="26" r="9"/><circle className="accent" cx="36" cy="21" r="12"/></>,
  ]
  return <svg className="glyph" viewBox="0 0 48 48" aria-hidden="true">{shapes[index]}</svg>
}

// One section for "why Chazon": the difference in approach (visual), then the six principles behind it.
export function WhyChazon() {
  return <section id="why" data-nav="services" className="section why" aria-labelledby="why-title">
    <div className="container">
      <Label>Why Chazon</Label>
      <h2 id="why-title">We don’t start with the channel. <br className="wide-only"/>We start with the <em>business objective.</em></h2>
      <figure className="lanes">
        <div className="lane lane-old">
          <p className="lane-label">The usual approach<small>Starts with a tool. Hopes for a result.</small></p>
          <ol>{channelFirst.map((step, i) => <li key={step} className={i === channelFirst.length - 1 ? 'dead-end' : undefined}>{step}</li>)}</ol>
        </div>
        <div className="lane lane-chazon">
          <p className="lane-label">The Chazon approach<small>Starts with the result. Chooses the tools to match.</small></p>
          <ol>{businessFirst.map(([title, question], i) => <li key={title}>
            <span className="ln" aria-hidden="true">0{i + 1}</span><strong>{title}</strong><span className="lq">{question}</span>
          </li>)}</ol>
        </div>
        <figcaption><span>Fig. 03</span>Two ways to begin a digital project. Only one is built to reach revenue.</figcaption>
      </figure>
      <div className="why-principles">
        <p className="why-statement">Your business doesn’t need more digital activity. <em>It needs the right digital activity.</em></p>
        <ol className="manifesto">{principles.map(([title, statement, support], i) => <li key={title}>
          <span className="p-num" aria-hidden="true">0{i + 1}</span>
          <div><h3>{title}</h3><p className="p-statement">{statement}</p><p className="p-support">{support}</p></div>
          <PrincipleGlyph index={i}/>
        </li>)}</ol>
      </div>
      <div className="section-foot">
        <p>A platform is a tool. Growth needs a plan. Every digital decision is connected to what the business actually needs to achieve.</p>
        <Button href="#approach" secondary>Learn how we work</Button>
      </div>
    </div>
  </section>
}

export function Approach() {
  // Scroll only moves the highlight along the line; every stage and its text is always fully visible.
  const [ref, progress] = useScrollProgress<HTMLDivElement>(0.8, 0.45)
  const reached = steps.filter((_, i) => progress >= (i + 0.2) / steps.length).length
  return <section id="approach" data-nav="services" className="section approach">
    <div className="container">
      <div className="section-heading split">
        <div><Label>Our approach</Label><h2>Purpose at every step. <span className="muted">Progress at every stage.</span></h2></div>
        <p>A structured approach to digital growth. No random activity. No disconnected execution.</p>
      </div>
      <div ref={ref} className="journey" style={{ '--p': progress } as CSSProperties}>
        <ol>{steps.map(([title, text], i) => <li key={title} className={i < reached ? `is-reached${i === reached - 1 ? ' is-current' : ''}` : undefined}>
          <span className="j-dot" aria-hidden="true"/>
          <span className="j-num">Stage 0{i + 1}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>)}</ol>
        <div className="journey-foot">
          <p className="journey-loop"><span aria-hidden="true">↺</span> Then back to Discover — with better data every cycle.</p>
          <a className="text-link" href="#work">View selected work <ArrowRight size={18} aria-hidden="true"/></a>
        </div>
      </div>
    </div>
  </section>
}

export function AuditStrip() {
  return <aside className="audit-strip" data-nav="services" aria-labelledby="audit-strip-title">
    <div className="container audit-strip-inner">
      <div>
        <h2 id="audit-strip-title">How hard is your digital presence working for your business?</h2>
        <p>A Digital Growth Audit looks at your website, search, social, advertising, conversion journey and lead handling — and where they could work better together.</p>
      </div>
      <Button mode="audit" service="Digital Growth Audit">Get a Digital Growth Audit</Button>
    </div>
  </aside>
}
