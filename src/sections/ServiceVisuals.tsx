import type { CSSProperties } from 'react'
import { Search, MousePointerClick, Megaphone, Share2, PenLine, CalendarRange, User, Zap, Database, Send, RefreshCw, MapPin, ShoppingCart, MousePointer2 } from 'lucide-react'
import { WhatsAppIcon } from '../components/Layout'

// Four different visual languages for four parts of one system. Every visual is complete at first paint;
// motion only settles, flows or travels through what is already on screen. All are decorative (aria-hidden):
// the pillar's statement and service list next to each visual carry the same information as text.
const v = (i: number) => ({ '--i': i }) as CSSProperties

/** 01 BUILD — mini product frames (site, shop, landing page, local presence) resting on one foundation. */
export function FoundationVisual() {
  return <div className="fv" aria-hidden="true">
    <div className="fv-grid">
      <div className="fv-frame fv-site" style={v(0)}>
        <div className="fv-bar"><i/><i/><i/><span>Website</span></div>
        <div className="fv-body"><b className="w70"/><b className="w90 thin"/><b className="w50 thin"/><em/></div>
      </div>
      <div className="fv-frame fv-shop" style={v(1)}>
        <div className="fv-bar"><i/><i/><i/><span>Commerce</span></div>
        <div className="fv-body fv-products"><span/><span className="on"/><span/><ShoppingCart size={14}/></div>
      </div>
      <div className="fv-frame fv-landing" style={v(2)}>
        <div className="fv-bar"><i/><i/><i/><span>Landing page</span></div>
        <div className="fv-body"><b className="w80"/><b className="w60 thin"/><em className="cta"/><MousePointer2 className="fv-cursor" size={15}/></div>
      </div>
      <div className="fv-frame fv-local" style={v(3)}>
        <div className="fv-bar"><i/><i/><i/><span>Google presence</span></div>
        <div className="fv-body fv-map"><MapPin className="fv-pin" size={20}/></div>
      </div>
    </div>
    <div className="fv-base" style={v(4)}><span>Digital foundation</span><small>Platform setup · UX & conversion</small></div>
  </div>
}

/** 02 GROW — six channels feed one funnel; a signal drops from reach to leads. */
export function GrowthVisual() {
  const channels = [['SEO', Search], ['Google Ads', MousePointerClick], ['Meta Ads', Megaphone], ['Social', Share2], ['Content', PenLine], ['Campaigns', CalendarRange]] as const
  return <div className="gv" aria-hidden="true">
    <ul className="gv-channels">{channels.map(([name, Icon], i) => <li key={name} style={v(i)}><Icon size={14}/>{name}</li>)}</ul>
    <svg className="gv-links" viewBox="0 0 100 100" preserveAspectRatio="none">
      {channels.map(([name], i) => { const y = ((i + .5) / channels.length) * 100; const d = `M0 ${y} C55 ${y} 45 50 100 50`; return <g key={name}><path className="gv-link" d={d}/><path className="gv-pulse" d={d} style={v(i)}/></g> })}
    </svg>
    <div className="gv-funnel">
      <ol>{['Reach', 'Traffic', 'Engagement', 'Leads'].map((stage, i) => <li key={stage} style={v(i)}>{stage}</li>)}</ol>
      <span className="gv-signal"/>
    </div>
  </div>
}

/** 03 CONVERT — a rising customer journey; a visitor walks it and repeat customers loop back in. */
export function RevenueVisual() {
  const stages = [['Visitor', 7, 80], ['Discover', 28, 66], ['Consider', 50, 50], ['Purchase', 72, 34], ['Repeat', 93, 20]] as const
  const tags = ['Traffic arrives', 'Marketplace · E-commerce', 'Journey · Pricing', 'Conversion · Merchandising', 'Retention strategy']
  return <div className="rv" aria-hidden="true">
    <div className="rv-plot">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect className="rv-zone" x="17" y="4" width="83" height="92" rx="1.5"/>
        <path className="rv-path" d="M7 80 C16 78 20 68 28 66 S42 52 50 50 S64 36 72 34 S86 21 93 20"/>
        <path className="rv-loop" d="M93 20 C99 62 66 92 52 56"/>
      </svg>
      <span className="rv-zone-label">Where Chazon works</span>
      {stages.map(([name, x, y], i) => <span key={name} className={`rv-stage ${i === 3 ? 'key' : ''} ${i === 0 ? 'start' : i === 4 ? 'end' : 'mid'}`} style={{ left: `${x}%`, top: `${y}%` }}>
        <i/><b>{name}</b><small>{tags[i]}</small>
      </span>)}
      <span className="rv-visitor"/>
      <span className="rv-loop-label"><RefreshCw size={12}/>Customers return</span>
    </div>
  </div>
}

/** 04 AUTOMATE — a closed workflow: message in, WhatsApp, automation, CRM, follow-up, retention, and back again. */
export function AutomationVisual() {
  const nodes = [['Customer', 'Message in', User], ['WhatsApp', 'AI-assisted replies', WhatsAppIcon], ['Automation', 'Rules & triggers', Zap], ['CRM', 'Every lead logged', Database], ['Follow-up', 'On time, every time', Send], ['Retention', 'Repeat purchase', RefreshCw]] as const
  return <div className="av" aria-hidden="true">
    <ol className="av-flow">{nodes.map(([name, note, Icon], i) => <li key={name} className={`av-node n${i + 1}`} style={v(i)}>
      <span className="av-icon"><Icon size={16}/></span><b>{name}</b><small>{note}</small><span className="av-wire"><i/></span>
    </li>)}</ol>
    <p className="av-caption"><span/>One connected system, from first message to repeat purchase</p>
  </div>
}
