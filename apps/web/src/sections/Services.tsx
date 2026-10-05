import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Label } from '../components/Layout'
import { pillars as pillarStructure } from '../content'
import { useSite } from '../site-data'
import { useMedia } from '../hooks'
import { FoundationVisual, GrowthVisual, RevenueVisual, AutomationVisual } from './ServiceVisuals'

const visuals = [FoundationVisual, GrowthVisual, RevenueVisual, AutomationVisual]
const count = pillarStructure.length // the four pillars are fixed; their service lists come from the CMS
const pad = (n: number) => String(n).padStart(2, '0')

// Desktop: a four-step system bar (Build → Grow → Convert → Automate) drives one large stage.
// Mobile: a compact stepper — one pillar at a time, changed only by the visitor (steps, previous/next, swipe, arrow keys).
// Both are ARIA tabs over the same four panels, so every pillar and service stays reachable.
export function Services() {
  const { pillars } = useSite()
  const [active, setActive] = useState(0)
  const stepper = useMedia('(max-width: 900px)')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const swipe = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const open = (e: Event) => setActive((e as CustomEvent<number>).detail)
    window.addEventListener('chazon:pillar', open)
    return () => window.removeEventListener('chazon:pillar', open)
  }, [])
  const go = (i: number) => setActive((i + count) % count)
  const onKey = (e: KeyboardEvent, i: number) => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: count - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = (next + count) % count
    setActive(target)
    tabs.current[target]?.focus()
  }
  // Horizontal swipe on the mobile panel; vertical scrolling is left to the browser (touch-action: pan-y).
  const onDown = (e: PointerEvent) => { if (stepper && e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY } }
  const onUp = (e: PointerEvent) => {
    const start = swipe.current; swipe.current = null
    if (!start) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(active + (dx < 0 ? 1 : -1))
  }
  const tab = (p: (typeof pillars)[number], i: number, children: ReactNode) => <button key={p.title} ref={el => { tabs.current[i] = el }} type="button" role="tab" id={`pillar-tab-${i}`} aria-selected={active === i} aria-controls={`pillar-${i}`} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={e => onKey(e, i)}>{children}</button>
  return <section id="services" data-nav="services" className="section services">
    <div className="container">
      <div className="section-heading split">
        <div><Label>Services</Label><h2>Four pillars. <span className="muted">One growth system.</span></h2></div>
        <p>Build the foundation, grow demand, convert it into revenue and automate what keeps customers coming back.</p>
      </div>
      {stepper
        ? <div className="svc-steps" role="tablist" aria-label="Service pillars">
          {pillars.map((p, i) => tab(p, i, <><span className="svc-step-num" aria-hidden="true">{pad(i + 1)}</span>{p.verb}<span className="visually-hidden"> — {p.title}</span></>))}
        </div>
        : <div className="svc-tabs" role="tablist" aria-label="Service pillars">
          {pillars.map((p, i) => tab(p, i, <>
            <span className="svc-tab-verb">0{i + 1} · {p.verb}</span>
            <span className="svc-tab-title">{p.title}</span>
            <span className="svc-tab-line">{p.line}</span>
          </>))}
        </div>}
      <div className="svc-panels">
        {pillars.map((p, i) => {
          const Visual = visuals[i]
          return <div key={p.title} id={`pillar-${i}`} role="tabpanel" aria-labelledby={`pillar-tab-${i}`} tabIndex={0} className={`svc-panel svc-${i + 1}`} hidden={active !== i} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current = null }}>
            <header className="svc-head">
              <p className="svc-kicker"><span>0{i + 1}</span>{p.verb}{stepper && <em className="svc-count" aria-hidden="true"><b>{pad(i + 1)}</b> / {pad(count)}</em>}</p>
              <h3>{p.title}</h3>
            </header>
            <div className="svc-visual"><Visual/></div>
            <div className="svc-body">
              <p className="svc-statement">{p.statement}</p>
              <ul className="svc-chips" aria-label={`${p.title} services`}>{p.items.map(item => <li key={item}>{item}</li>)}</ul>
              <div className="svc-actions">
                <Button service={p.title} className="svc-cta">Let’s Talk<span className="visually-hidden"> about {p.title}</span></Button>
                {stepper && <>
                  <button type="button" className="svc-arrow" onClick={() => go(i - 1)} aria-label={`Previous pillar: ${pillars[(i - 1 + count) % count].title}`}><ArrowLeft size={20} aria-hidden="true"/></button>
                  <button type="button" className="svc-arrow" onClick={() => go(i + 1)} aria-label={`Next pillar: ${pillars[(i + 1) % count].title}`}><ArrowRight size={20} aria-hidden="true"/></button>
                </>}
              </div>
            </div>
          </div>
        })}
      </div>
      {stepper && <p className="visually-hidden" aria-live="polite">Pillar {active + 1} of {count}: {pillars[active].title}</p>}
    </div>
  </section>
}
