import { useEffect, useState, type CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import { Button, Label } from '../components/Layout'
import { pillars } from '../content'
import { FoundationVisual, GrowthVisual, RevenueVisual, AutomationVisual } from './ServiceVisuals'

const visuals = [FoundationVisual, GrowthVisual, RevenueVisual, AutomationVisual]
const isNarrow = () => window.matchMedia('(max-width: 900px)').matches

// One disclosure pattern for every width: on desktop the pillar buttons sit in a column and the open
// panel fills the stage beside them; on mobile the same markup reads as an accordion.
export function Services() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const open = (e: Event) => setActive((e as CustomEvent<number>).detail)
    // The desktop stage always shows a pillar, even if every accordion item was closed on mobile.
    const narrow = window.matchMedia('(max-width: 900px)')
    const restore = () => { if (!narrow.matches) setActive(i => (i < 0 ? 0 : i)) }
    window.addEventListener('chazon:pillar', open)
    narrow.addEventListener('change', restore)
    return () => { window.removeEventListener('chazon:pillar', open); narrow.removeEventListener('change', restore) }
  }, [])
  const select = (i: number) => setActive(i === active && isNarrow() ? -1 : i)
  return <section id="services" data-nav="services" className="section services">
    <div className="container">
      <div className="section-heading split">
        <div><Label>Services</Label><h2>Four pillars. <span className="muted">One growth objective.</span></h2></div>
        <p>Everything a business needs to grow digitally — connected by strategy, focused on revenue. Select a pillar to explore it.</p>
      </div>
      <div className="pillars">
        {pillars.map(({ title, line, summary, items, enquiry }, i) => {
          const open = active === i
          const Visual = visuals[i]
          return <div className={`pillar ${open ? 'is-open' : ''}`} key={title} style={{ '--row': i + 1 } as CSSProperties}>
            <h3 className="pillar-head">
              <button type="button" id={`pillar-tab-${i}`} aria-expanded={open} aria-controls={`pillar-${i}`} onClick={() => select(i)}>
                <span className="pillar-num" aria-hidden="true">0{i + 1}</span>
                <span className="pillar-text"><span className="pillar-title">{title}</span><span className="pillar-line">{line}</span></span>
                <span className="pillar-icon" aria-hidden="true"><Plus size={20}/></span>
              </button>
            </h3>
            <div id={`pillar-${i}`} role="region" aria-labelledby={`pillar-tab-${i}`} className={`pillar-panel panel-${i + 1}`} hidden={!open}>
              <div className="panel-visual"><Visual/></div>
              <div className="panel-body">
                <p className="panel-kicker"><span>0{i + 1}</span> / 04 · {items.length} services</p>
                <p className="panel-summary">{summary}</p>
                <ul className="panel-list">{items.map(item => <li key={item}>{item}</li>)}</ul>
                <Button secondary service={enquiry} className="panel-cta">Discuss {title}</Button>
              </div>
            </div>
          </div>
        })}
      </div>
    </div>
  </section>
}
