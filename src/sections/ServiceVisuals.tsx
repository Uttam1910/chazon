import type { CSSProperties } from 'react'
import { prefersReducedMotion } from '../hooks'

// Each pillar gets its own visual metaphor. Lines are SVG in a fixed-ratio box; labels are HTML
// positioned by percentage, so text stays legible at every width instead of scaling with the SVG.
const at = (x: number, y: number) => ({ left: `${x}%`, top: `${y}%` }) as CSSProperties

/** 01 — Layers stacking into a foundation. */
export function FoundationVisual() {
  const layers = [['Website', 'site'], ['Commerce', 'shop'], ['Landing page', 'landing'], ['Google presence', 'local']] as const
  return <div className="sv sv-foundation" aria-hidden="true">
    {layers.map(([name, kind], i) => <div key={name} className={`fd-layer ${kind}`} style={{ '--i': i } as CSSProperties}>
      <span className="fd-glyph"><i/><i/><i/></span><span>{name}</span>
    </div>)}
    <div className="fd-base" style={{ '--i': 4 } as CSSProperties}>Digital foundation</div>
  </div>
}

/** 02 — Four channels converge into attention, then qualified leads. */
export function GrowthVisual() {
  const sources: [string, number][] = [['Search', 12], ['Social', 37], ['Content', 63], ['Ads', 88]]
  return <div className="sv sv-growth" aria-hidden="true">
    <svg viewBox="0 0 100 75" preserveAspectRatio="none">
      {sources.map(([name, x]) => <g key={name}><path className="sv-line" d={`M${x} 12 C${x} 30 50 24 50 40`}/><path className="sv-flow" d={`M${x} 12 C${x} 30 50 24 50 40`}/></g>)}
      <path className="sv-line strong" d="M50 44 V62"/><path className="sv-flow" d="M50 44 V62"/>
    </svg>
    {sources.map(([name, x]) => <span key={name} className="sv-chip" style={at(x, 12 / 0.75)}>{name}</span>)}
    <span className="sv-node" style={at(50, 44 / 0.75)}>Attention</span>
    <span className="sv-node key" style={at(50, 64 / 0.75)}>Leads</span>
  </div>
}

/** 03 — A customer journey that rises to conversion and loops back as repeat business. */
export function RevenueVisual() {
  const stages: [string, number, number, 'above' | 'below'][] = [['Visitor', 8, 62, 'above'], ['Interest', 29, 50, 'below'], ['Consideration', 50, 40, 'below'], ['Conversion', 71, 26, 'above'], ['Repeat', 92, 18, 'above']]
  const path = 'M8 62 C18 60 22 52 29 50 S43 42 50 40 S64 30 71 26 S86 19 92 18'
  return <div className="sv sv-revenue" aria-hidden="true">
    <svg viewBox="0 0 100 75" preserveAspectRatio="none">
      <path className="sv-line strong" d={path}/>
      <path className="sv-loop" d="M92 18 C96 44 60 70 29 54"/>
      {stages.map(([name, x, y]) => <circle key={name} className={name === 'Conversion' ? 'sv-dot key' : 'sv-dot'} cx={x} cy={y} r="1.3"/>)}
      {!prefersReducedMotion() && <circle className="sv-traveller" r="1.6"><animateMotion dur="3s" repeatCount="indefinite" path={path}/></circle>}
    </svg>
    {stages.map(([name, x, y, place]) => <span key={name} className={`sv-label ${place} ${name === 'Conversion' ? 'key' : ''}`} style={at(x, y / 0.75)}>{name}</span>)}
    <span className="sv-loop-label" style={at(58, 86)}>↺ Customers return</span>
  </div>
}

/** 04 — A retention loop: every customer message moves through automation and follow-up. */
export function AutomationVisual() {
  const steps = ['Customer', 'Message', 'WhatsApp', 'Automation', 'CRM', 'Follow-up', 'Retention']
  const r = 29
  const points = steps.map((name, i) => { const a = -Math.PI / 2 + (i / steps.length) * Math.PI * 2; return { name, a, x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r } })
  return <div className="sv sv-automation" aria-hidden="true">
    <svg viewBox="0 0 100 100">
      <circle className="sv-line" cx="50" cy="50" r={r}/>
      <circle className="sv-arc" cx="50" cy="50" r={r} pathLength="100"/>
      {points.map(p => <circle key={p.name} className={p.name === 'WhatsApp' || p.name === 'Retention' ? 'sv-dot key' : 'sv-dot'} cx={p.x} cy={p.y} r="1.8"/>)}
    </svg>
    {points.map(p => { const lx = 50 + Math.cos(p.a) * (r + 6); const ly = 50 + Math.sin(p.a) * (r + 6); const side = Math.cos(p.a) > 0.25 ? 'right' : Math.cos(p.a) < -0.25 ? 'left' : 'centre'; return <span key={p.name} className={`sv-ring-label ${side} ${p.name === 'WhatsApp' || p.name === 'Retention' ? 'key' : ''}`} style={at(lx, ly)}>{p.name}</span> })}
    <span className="sv-centre" style={at(50, 50)}>Every lead<br/>followed up</span>
  </div>
}
