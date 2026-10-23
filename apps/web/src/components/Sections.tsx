import type { ReactNode } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { auditScope, businessFirst, channelFirst, founder, principles, steps } from '../content'
import { track } from '../config'
import { Link } from '../router'
import { useSite } from '../site-data'
import { ChannelIcon, ChannelLink } from './Layout'
import { Cta, Eyebrow, SectionHead, TextLink } from './ui'

// Sections shared by the homepage and the inner pages, so each idea is designed (and worded) once.

/** The usual channel-first approach against Chazon's business-first sequence. */
export function Compare() {
  return <div className="compare">
    <div className="compare-old">
      <p className="mono compare-label">The usual approach</p>
      <ul>{channelFirst.map(q => <li key={q}><s>{q}</s></li>)}</ul>
      <p className="compare-note">Starts with a tool. Hopes for a result.</p>
    </div>
    <div className="compare-new">
      <p className="mono compare-label">The Chazon approach</p>
      <ol>{businessFirst.map(([title, question], i) => <li key={title}><span className="mono">0{i + 1}</span><strong>{title}</strong><span>{question}</span></li>)}</ol>
      <p className="compare-note">Starts with the result. Chooses the tools to match.</p>
    </div>
  </div>
}

export function ProcessList({ detailed = false }: { detailed?: boolean }) {
  return <>
    <ol className={`process ${detailed ? 'is-detailed' : ''}`}>
      {steps.map(([title, text, output], i) => <li key={title}>
        <span className="process-num mono">Stage 0{i + 1}</span>
        <h3>{title}</h3>
        <p>{text}</p>
        <p className="process-out"><span className="mono">Outcome</span>{output}</p>
      </li>)}
    </ol>
    <p className="process-loop"><RotateCcw size={18} aria-hidden="true"/>Then back to Discover — with better data every cycle.</p>
  </>
}

export function Principles() {
  return <ol className="principles">
    {principles.map(([title, text], i) => <li key={title}><span className="mono">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}
  </ol>
}

/** The founder: an approved photograph when one is set in content.ts, otherwise a typographic monogram. */
export function FounderCard() {
  const initials = founder.name.split(' ').map(n => n[0]).join('')
  return <figure className="founder">
    {founder.photo
      ? <img className="founder-photo" src={founder.photo} alt={`Portrait of ${founder.name}, ${founder.role}`} width="640" height="800" loading="lazy" decoding="async"/>
      : <div className="founder-monogram" aria-hidden="true"><span>{initials}</span></div>}
    <figcaption><strong>{founder.name}</strong>{founder.role}</figcaption>
    <div className="founder-experience">
      <p className="mono">Experience across</p>
      <ul>{founder.experience.map(x => <li key={x}>{x}</li>)}</ul>
    </div>
  </figure>
}

export function IndustryList() {
  const { industries } = useSite()
  return <dl className="industries">
    {industries.map(([name, description], i) => <div key={name}>
      <dt><span className="mono">{String(i + 1).padStart(2, '0')}</span>{name}</dt>
      {description && <dd>{description}</dd>}
    </div>)}
  </dl>
}

export function AuditBand({ index }: { index?: string }) {
  const { settings } = useSite()
  return <section className="audit-band surface-signal" aria-labelledby="audit-band-title">
    <div className="container audit-band-grid">
      <div>
        <Eyebrow index={index}>Digital Growth Audit</Eyebrow>
        <h2 id="audit-band-title">How hard is your digital presence <em>really</em> working?</h2>
        <p>A structured review of your website, search, social, advertising, conversion journey and lead handling — and where they could work better together.</p>
        <Cta to="/growth-audit" location="audit_band">{settings.ctaAuditLabel}</Cta>
      </div>
      <ul className="audit-band-list" aria-label="What the audit looks at">{auditScope.map(([name]) => <li key={name}>{name}</li>)}</ul>
    </div>
  </section>
}

/** A large, card-sized route to one of the two primary next steps. */
function PathCard({ to, index, title, text, location }: { to: string; index: string; title: string; text: string; location: string }) {
  return <Link to={to} className="path-card" onClick={() => track('cta_click', { location, destination: to })}>
    <span className="mono">{index}</span><strong>{title}</strong><span>{text}</span><ArrowRight className="path-card-arrow" size={22} aria-hidden="true"/>
  </Link>
}

/** The closing invitation used at the end of most pages. */
export function FinalCta({ title, intro, talkTo = '/contact' }: { title?: ReactNode; intro?: string; talkTo?: string }) {
  const { settings, directChannels } = useSite()
  return <section id="contact" className="final-cta surface-ink" aria-labelledby="final-cta-title" data-no-mobile-bar>
    <div className="container final-cta-grid">
      <div>
        <Eyebrow>Next step</Eyebrow>
        <h2 id="final-cta-title">{title ?? <>Let’s build your next <em>digital growth engine.</em></>}</h2>
        <p className="lead">{intro ?? 'Tell us where your business is today, what you’re trying to achieve and where you’re stuck. We’ll recommend a practical next step.'}</p>
        {settings.location && <p className="final-location mono">Based in {settings.location}</p>}
      </div>
      <div className="final-paths">
        <PathCard to={talkTo} index="01" title={settings.ctaTalkLabel} text="A conversation about your goals and where digital can help." location="final_cta_talk"/>
        <PathCard to="/growth-audit" index="02" title={settings.ctaAuditLabel} text="A structured review of how hard your digital presence is working." location="final_cta_audit"/>
        {directChannels.length > 0 && <ul className="final-direct">{directChannels.map(c => <li key={c.key}>
          <ChannelLink channel={c} location="final_cta" className="inline-channel"><ChannelIcon channel={c} size={18}/>{c.detail}</ChannelLink>
        </li>)}</ul>}
      </div>
    </div>
  </section>
}

export function DifferenceSection({ index }: { index?: string }) {
  return <section className="section difference surface-ink" aria-labelledby="difference-title">
    <div className="container">
      <SectionHead index={index} eyebrow="The Chazon difference" id="difference-title" title={<>We don’t start with the channel. We start with the <em>business objective.</em></>}/>
      <Compare/>
      <div className="difference-foot">
        <p>A platform is a tool. Growth needs a plan. Every digital decision we make is connected to what your business actually needs to achieve.</p>
        <TextLink to="/approach">How we work, in detail</TextLink>
      </div>
    </div>
  </section>
}
