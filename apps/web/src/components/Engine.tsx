import { arcPath, quadrant } from '../geometry'

// The revenue engine: Build → Grow → Convert → Automate as one closed loop around the business objective.
// It is fully drawn at first paint. Arcs highlight with the pillar the visitor points at or focuses; the intro sequence
// and the orbiting marker run once, for under five seconds, and not at all with reduced motion.

const C = 260
const R = 178
const verbs = ['Build', 'Grow', 'Convert', 'Automate']
const ticks = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180
  const inner = i % 6 === 0 ? 118 : 124
  const f = (r: number, t: (x: number) => number) => (C + r * t(a)).toFixed(2)
  return `M${f(inner, Math.cos)} ${f(inner, Math.sin)}L${f(130, Math.cos)} ${f(130, Math.sin)}`
}).join('')

export function Engine({ active }: { active: number | null }) {
  return <figure className="engine" data-active={active ?? 'all'}>
    <svg viewBox="0 0 520 520" role="img" aria-labelledby="engine-title engine-desc">
      <title id="engine-title">The Chazon growth system</title>
      <desc id="engine-desc">Four connected pillars in a loop around revenue: Build, then Grow, then Convert, then Automate, and back to Build.</desc>
      <circle className="engine-orbit-track" cx={C} cy={C} r={R + 44}/>
      <path className="engine-ticks" d={ticks}/>
      {verbs.map((verb, i) => {
        const [from, to] = quadrant(i, 3.2)
        // The bottom arc's label runs right-to-left along the circle, so its text path is drawn the other way round.
        const label = i === 2 ? arcPath(C, R, to, from, 0) : arcPath(C, R, from, to)
        return <g key={verb} className={`engine-arc p${i} ${active === null || active === i ? 'is-on' : ''}`}>
          <path className="engine-arc-band" d={arcPath(C, R, from, to)}/>
          <path id={`engine-label-${i}`} d={label} fill="none" stroke="none"/>
          <text className="engine-arc-label"><textPath href={`#engine-label-${i}`} startOffset="50%" textAnchor="middle">{`0${i + 1} · ${verb.toUpperCase()}`}</textPath></text>
        </g>
      })}
      {[-45, 45, 135, 225].map(a => {
        const x = C + R * Math.cos((a * Math.PI) / 180), y = C + R * Math.sin((a * Math.PI) / 180)
        return <path key={a} className="engine-flow" d="M-5 -8 L6 0 L-5 8" transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${a + 90})`}/>
      })}
      <circle className="engine-core" cx={C} cy={C} r="98"/>
      <text className="engine-core-label" x={C} y={C - 30} textAnchor="middle">BUSINESS OBJECTIVE</text>
      <text className="engine-core-word" x={C} y={C + 18} textAnchor="middle">Revenue</text>
      <text className="engine-core-label" x={C} y={C + 50} textAnchor="middle">MEASURED EVERY CYCLE</text>
      <g className="engine-orbit"><circle cx={C} cy={C - R - 44} r="7"/></g>
    </svg>
  </figure>
}
