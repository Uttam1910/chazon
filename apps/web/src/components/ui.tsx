import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { track } from '../config'
import { Link } from '../router'
import { arcPath, quadrant } from '../geometry'

type CtaProps = {
  to: string
  children: ReactNode
  /** Where on the site the CTA sits; sent with the cta_click event (never any personal data). */
  location: string
  variant?: 'primary' | 'secondary' | 'quiet'
  size?: 'sm' | 'md'
  className?: string
}

/** A call to action. Internal destinations route client-side; external ones open in a new tab. */
export function Cta({ to, children, location, variant = 'primary', size = 'md', className = '' }: CtaProps) {
  const external = /^https?:\/\//.test(to)
  const classes = `button button-${variant} ${size === 'sm' ? 'button-sm' : ''} ${className}`.trim()
  const onClick = () => track('cta_click', { location, destination: external ? new URL(to).hostname : to.split('?')[0] })
  const icon = external ? <ArrowUpRight size={18} aria-hidden="true"/> : <ArrowRight size={18} aria-hidden="true"/>
  if (external) return <a className={classes} href={to} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}{icon}<span className="visually-hidden"> (opens in a new tab)</span></a>
  return <Link className={classes} to={to} onClick={onClick}>{children}{icon}</Link>
}

/** A text link with an arrow, for secondary actions inside content. */
export function TextLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={`text-link ${className}`}>{children}<ArrowRight size={17} aria-hidden="true"/></Link>
}

/** Mono section label: an optional index, a short rule and the name. */
export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return <p className="eyebrow">{index && <span className="eyebrow-index">{index}</span>}<span className="eyebrow-rule" aria-hidden="true"/>{children}</p>
}

export function SectionHead({ index, eyebrow, title, intro, id, children }: { index?: string; eyebrow: string; title: ReactNode; intro?: ReactNode; id?: string; children?: ReactNode }) {
  return <header className="section-head">
    <div>
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 id={id}>{title}</h2>
    </div>
    {(intro || children) && <div className="section-head-aside">{intro && <p>{intro}</p>}{children}</div>}
  </header>
}

/** Visible breadcrumb trail ([label, path] pairs after Home). Pair it with breadcrumbSchema() (seo.ts) for the same trail. */
export function Breadcrumbs({ trail }: { trail: [string, string][] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true"/></li>
      {trail.map(([label, path], i) => <li key={path}>
        {i === trail.length - 1 ? <span aria-current="page">{label}</span> : <><Link to={path}>{label}</Link><ChevronRight size={14} aria-hidden="true"/></>}
      </li>)}
    </ol>
  </nav>
}

/** The opening of every inner page: breadcrumbs, label, headline and introduction on the dark surface. */
export function PageHero({ trail, eyebrow, title, intro, children, aside }: { trail: [string, string][]; eyebrow: ReactNode; title: ReactNode; intro?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return <section className="page-hero surface-ink">
    <div className="container">
      <Breadcrumbs trail={trail}/>
      <div className={`page-hero-grid ${aside ? 'has-aside' : ''}`}>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{title}</h1>
          {intro && <p className="lead">{intro}</p>}
          {children}
        </div>
        {aside && <div className="page-hero-aside">{aside}</div>}
      </div>
    </div>
    <div className="ruler" aria-hidden="true"/>
  </section>
}

/** Questions and answers as native disclosure widgets: keyboard and screen-reader friendly with no script. */
export function Faq({ items, title = 'Questions businesses ask', id = 'faq' }: { items: [string, string][]; title?: string; id?: string }) {
  return <section className="section faq" aria-labelledby={`${id}-title`}>
    <div className="container faq-grid">
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      <div className="faq-list">
        {items.map(([q, a]) => <details key={q}>
          <summary><span>{q}</span><span className="faq-icon" aria-hidden="true"/></summary>
          <p>{a}</p>
        </details>)}
      </div>
    </div>
  </section>
}

/** The four-part ring in miniature, with one pillar (0–3) highlighted. Decorative. */
export function EngineMark({ active, className = '' }: { active?: number; className?: string }) {
  return <svg className={`engine-mark ${className}`} viewBox="0 0 48 48" aria-hidden="true">
    {[0, 1, 2, 3].map(i => <path key={i} d={arcPath(24, 18, ...quadrant(i, 9))} className={i === active ? 'on' : undefined}/>)}
    <circle cx="24" cy="24" r="4"/>
  </svg>
}
