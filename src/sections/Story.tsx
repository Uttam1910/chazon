import { useState } from 'react'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { Label } from '../components/Layout'
import { ecosystem, problems, type EcosystemKey } from '../content'

// Positions (percent of the square stage). The hub is the business objective; every capability connects to it and to its neighbours.
const nodes: [EcosystemKey, number, number][] = [['strategy', 50, 11], ['technology', 15, 50], ['marketing', 85, 50], ['automation', 50, 89]]

function Ecosystem({ selected, onSelect }: { selected: EcosystemKey; onSelect: (key: EcosystemKey) => void }) {
  return <div className="eco" data-selected={selected}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle className="eco-ring" cx="50" cy="50" r="37"/>
      {nodes.map(([key, x, y]) => <g key={key} className={`eco-spoke ${selected === key ? 'on' : ''}`}>
        <line x1={x} y1={y} x2="50" y2="50"/>
        <line className="eco-flow" x1={x} y1={y} x2="50" y2="50"/>
      </g>)}
    </svg>
    {nodes.map(([key, x, y], i) => <button key={key} type="button" className="eco-node" style={{ left: `${x}%`, top: `${y}%` }} aria-pressed={selected === key} onClick={() => onSelect(key)} onMouseEnter={() => onSelect(key)} onFocus={() => onSelect(key)}>
      <span aria-hidden="true">0{i + 1}</span>{ecosystem[key].label}
    </button>)}
    <button type="button" className="eco-hub" aria-pressed={selected === 'revenue'} onClick={() => onSelect('revenue')} onMouseEnter={() => onSelect('revenue')} onFocus={() => onSelect('revenue')}>
      <small>Business objective</small><strong>Revenue</strong>
    </button>
  </div>
}

export function WhoWeAre() {
  const [selected, setSelected] = useState<EcosystemKey>('revenue')
  return <section id="about" data-nav="about" className="section who">
    <div className="container who-grid">
      <div className="who-copy">
        <Label>Who we are</Label>
        <h2>We don’t just build digital channels. <em>We connect them.</em></h2>
        <p className="lead">Chazon Digital Ventures is a digital revenue and growth partner. We bring strategy, technology, marketing and automation together around one thing: what your business needs to achieve.</p>
      </div>
      <figure className="who-figure">
        <Ecosystem selected={selected} onSelect={setSelected}/>
        <figcaption><span>Fig. 02</span>Select a capability to see its role in the system.</figcaption>
      </figure>
      <div className="eco-readout" aria-live="polite">
        <span>{selected === 'revenue' ? 'At the centre' : 'Connected capability'}</span>
        <strong>{ecosystem[selected].label}</strong>
        <p>{ecosystem[selected].text}</p>
      </div>
      <p className="triad"><span>Strategy</span><b>+</b><span>Execution</span><b>+</b><span>Optimisation</span></p>
    </div>
  </section>
}

export function Problem() {
  const [connected, setConnected] = useState<boolean[]>(() => problems.map(() => false))
  const all = connected.every(Boolean)
  const toggle = (i: number) => setConnected(c => c.map((v, j) => (j === i ? !v : v)))
  return <section data-nav="about" className="section problem" aria-labelledby="problem-title">
    <div className="container problem-grid">
      <div className="problem-intro">
        <Label>The disconnect</Label>
        <h2 id="problem-title">Having a digital presence is not the same as having a digital <em>growth engine.</em></h2>
        <p>You have the pieces. They’re just not working together. Select one to see how it connects.</p>
      </div>
      <div className="problem-map">
        <ol>
          {problems.map(({ channel, symptom, fix }, i) => <li key={channel} className={connected[i] ? 'is-connected' : undefined}>
            <button type="button" aria-expanded={connected[i]} aria-controls={`fix-${i}`} onClick={() => toggle(i)}>
              <span className="pm-channel">{channel}</span>
              <span className="pm-link" aria-hidden="true"><i/><em/><i/></span>
              <span className="pm-symptom">{symptom}</span>
            </button>
            <p id={`fix-${i}`} className="pm-fix" hidden={!connected[i]}><ArrowRight size={16} aria-hidden="true"/>{fix}</p>
          </li>)}
        </ol>
        <div className="problem-end">
          <p className="problem-turn">That’s where <em>Chazon</em> comes in.</p>
          <div className="problem-actions">
            <button type="button" className="text-button" aria-pressed={all} onClick={() => setConnected(problems.map(() => !all))}>{all ? 'Reset the map' : 'Connect every piece'}</button>
            <a className="text-link" href="#services">See what we do <ArrowDown size={18} aria-hidden="true"/></a>
          </div>
        </div>
      </div>
    </div>
  </section>
}
