import { useState } from 'react'
import { ArrowUpRight, ArrowLeft, ArrowRight, Plus, ShoppingBag, Target, MousePointer2, MessageCircle, Workflow } from 'lucide-react'
import { Label } from '../components/Layout'
import { caseFormat, caseMetrics, founder, industries, insights, testimonials } from '../content'
import { openEnquiry } from '../actions'

const caseFields = ['Client / project', 'Business challenge', 'Chazon’s role', 'Strategy', 'Execution & deliverables', 'Outcome / current status']

function CommerceArt() {
  return <div className="work-art commerce" aria-hidden="true">
    <div className="mock-browser"><div className="browser-dots">••• <span>COMMERCE / CONNECTED</span></div><div className="mock-store"><div><small>DISCOVER. CONNECT. CONVERT.</small><strong>A better<br/>way to buy.</strong><span className="mock-btn">Explore collection ↗</span></div><div className="product-shape"/></div><div className="mock-products"><span/><span/><span/></div></div>
    <div className="floating-tag"><ShoppingBag size={16}/> Storefront → journey → repeat</div>
  </div>
}
function LeadsArt() {
  return <div className="work-art leads" aria-hidden="true">
    <div className="journey-block"><Target size={23}/><span>Attract</span></div><span className="journey-dash"/>
    <div className="journey-block active"><MousePointer2 size={23}/><span>Convert</span></div><span className="journey-dash"/>
    <div className="journey-block"><MessageCircle size={23}/><span>Follow up</span></div>
    <div className="floating-tag"><Workflow size={16}/> Click → enquiry → conversation</div>
  </div>
}

export function Work() {
  const projects = [['Digital commerce', 'From storefront to customer journey.', CommerceArt], ['Lead generation', 'From first click to meaningful enquiry.', LeadsArt]] as const
  return <section id="work" data-nav="work" className="section work">
    <div className="container">
      <div className="section-heading split">
        <div><Label>Selected work</Label><h2>Business challenges. <span className="muted">Connected solutions.</span></h2></div>
        <p>Detailed project stories will be published here as client work is approved for release.</p>
      </div>
      <div className="work-grid">
        {projects.map(([category, title, Art]) => <article className="work-block" key={title}>
          <div className="work-visual"><Art/><span className="placeholder-badge">Case study in preparation</span></div>
          <div className="work-body">
            <p className="eyebrow-text">{category} · Illustrative framework</p>
            <h3>{title}</h3>
            <details><summary>What this case study will cover <Plus size={17} aria-hidden="true"/></summary>
              <p>This is a framework, not a client project or a claim of results. Verified details will be added on publication.</p>
              <ul className="case-fields">{caseFields.map(field => <li key={field}>{field}</li>)}</ul>
            </details>
          </div>
        </article>)}
      </div>
      <div className="case-format">
        <p className="case-format-title">Every Chazon case study answers four questions</p>
        <ol>{caseFormat.map(([title, q]) => <li key={title}><strong>{title}</strong><span>{q}</span></li>)}</ol>
        <p className="case-metrics"><span>Measured and reported once verified:</span>{caseMetrics.map(m => <em key={m}>{m}</em>)}</p>
      </div>
    </div>
  </section>
}

export function Industries() {
  const [selected, setSelected] = useState(0)
  const [name, description] = industries[selected]
  return <section id="industries" data-nav="work" className="section industries">
    <div className="container industry-grid">
      <div>
        <Label>Industries</Label>
        <h2>Different industries. <em>The same ambition.</em></h2>
        <div className="industry-readout" aria-live="polite"><span>{String(selected + 1).padStart(2, '0')} / {String(industries.length).padStart(2, '0')}</span><strong>{name}</strong><p>{description}</p></div>
      </div>
      <div className="industry-chips" role="group" aria-label="Choose an industry">
        {industries.map(([industry], i) => <button type="button" key={industry} aria-pressed={selected === i} onClick={() => setSelected(i)}>{industry}<ArrowUpRight size={14} aria-hidden="true"/></button>)}
      </div>
    </div>
  </section>
}

export function Testimonials() {
  const [index, setIndex] = useState(0)
  if (!testimonials.length) return null
  const { quote, name, role, company } = testimonials[index]
  const total = testimonials.length
  const pad = (n: number) => String(n).padStart(2, '0')
  return <section data-nav="work" className="section testimonials" aria-labelledby="testimonials-title" aria-roledescription="carousel">
    <div className="container">
      <Label>Client perspective</Label>
      <h2 id="testimonials-title" className="visually-hidden">What clients say</h2>
      <figure className="testimonial" aria-live="polite"><blockquote><p>“{quote}”</p></blockquote><figcaption><strong>{name}</strong>{role}, {company}</figcaption></figure>
      {total > 1 && <div className="testimonial-nav"><span>{pad(index + 1)} / {pad(total)}</span>
        <button type="button" aria-label="Previous testimonial" onClick={() => setIndex((index - 1 + total) % total)}><ArrowLeft size={18}/></button>
        <button type="button" aria-label="Next testimonial" onClick={() => setIndex((index + 1) % total)}><ArrowRight size={18}/></button>
      </div>}
    </div>
  </section>
}

export function Founder() {
  return <section id="founder" data-nav="about" className="section founder" aria-labelledby="founder-title">
    <div className="container founder-grid">
      {founder.photo
        ? <img className="founder-photo" src={founder.photo} alt={`Portrait of ${founder.name}, ${founder.role}`} width="800" height="1000" loading="lazy" decoding="async"/>
        : <div className="founder-placeholder" role="img" aria-label={`Placeholder for a portrait of ${founder.name}`}><span className="portrait-label">Portrait placeholder</span><div className="monogram" aria-hidden="true">br<span>↗</span></div><span className="portrait-name">{founder.name}</span><small>Replace with an approved professional photo</small></div>}
      <div className="founder-copy">
        <Label>About Chazon</Label>
        <h2 id="founder-title">Digital expertise with a <em>business-growth mindset.</em></h2>
        <p className="lead">Chazon Digital Ventures is led by {founder.name}. The approach is consultative and practical: understand the business, connect the right digital capabilities, and keep improving the path to revenue.</p>
        <p className="founder-sign"><strong>{founder.name}</strong>{founder.role}</p>
        <div className="experience"><p>Experience across</p><ul>{founder.experience.map(x => <li key={x}>{x}</li>)}</ul></div>
        <a className="text-link" href="#contact" onClick={() => openEnquiry('talk')}>Know Chazon — start a conversation <ArrowUpRight size={18} aria-hidden="true"/></a>
      </div>
    </div>
  </section>
}

export function Insights() {
  return <section id="insights" data-nav="" className="section insights">
    <div className="container">
      <div className="section-heading split">
        <div><Label>Insights</Label><h2>Clear thinking. <span className="muted">Practical digital insight.</span></h2></div>
        <p>Perspectives for business owners on digital revenue, marketing, commerce and automation. Our editorial collection is in preparation.</p>
      </div>
      <ol className="insight-list">{insights.map(([category, title, text], i) => <li key={title}>
        <span className="i-num" aria-hidden="true">0{i + 1}</span>
        <span className="i-cat">{category}</span>
        <div><h3>{title}</h3><p>{text}</p></div>
        <span className="i-status">In preparation</span>
      </li>)}</ol>
      <p className="editorial-note">Also in development <span>Entrepreneur’s Digital Playbook — practical articles for SMEs and founders</span></p>
    </div>
  </section>
}
