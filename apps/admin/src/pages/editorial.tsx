import type { ReactNode } from 'react'
import { CONTENT_STATUS_LABELS, type ContentStatus } from '@chazon/shared'
import { Badge, Card } from '../ui/Common'
import { TextArea, TextInput } from '../ui/Form'
import { ImageField } from '../ui/Media'
import { formatDate } from '../ui/utils'

// Pieces shared by the Case Study and Insight editors.

export type SeoValues = { seoTitle: string; metaDescription: string; ogImage: string }

export function SeoCard({ values, onChange, errors, fallbackTitle, fallbackDescription }: { values: SeoValues; onChange: (patch: Partial<SeoValues>) => void; errors: Record<string, string>; fallbackTitle: string; fallbackDescription: string }) {
  const title = values.seoTitle || fallbackTitle || 'Page title'
  const description = values.metaDescription || fallbackDescription || 'Add a meta description to control how this page appears in search results.'
  return <Card title="SEO">
    <div className="stack">
      <div className="serp" aria-label="Search result preview"><span className="serp-title">{title}</span><span className="serp-desc">{description}</span></div>
      <TextInput label="SEO title" value={values.seoTitle} onChange={v => onChange({ seoTitle: v })} error={errors.seoTitle} counter={{ max: 120, ideal: 60 }} hint="Leave empty to use the title."/>
      <TextArea label="Meta description" value={values.metaDescription} onChange={v => onChange({ metaDescription: v })} error={errors.metaDescription} rows={3} counter={{ max: 320, ideal: 160 }} hint="Leave empty to use the summary / excerpt."/>
      <ImageField label="Social share image (OG)" value={values.ogImage} onChange={v => onChange({ ogImage: v })} error={errors.ogImage} hint="Leave empty to use the cover image. 1200 × 630 works best."/>
    </div>
  </Card>
}

export function PublishCard({ status, publishedAt, isNew, busy, dirty, onSave, publicUrl, children }: { status: ContentStatus; publishedAt: string | null; isNew: boolean; busy: boolean; dirty: boolean; onSave: (status?: ContentStatus) => void; publicUrl?: string; children?: ReactNode }) {
  return <Card title="Publishing">
    <div className="stack">
      <p className="publish-status"><Badge value={status} label={CONTENT_STATUS_LABELS[status]}/>{status === 'PUBLISHED' && publishedAt && <small>since {formatDate(publishedAt)}</small>}{dirty && !isNew && <small className="unsaved">Unsaved changes</small>}</p>
      {children}
      <div className="publish-actions">
        {status === 'PUBLISHED'
          ? <><button type="button" className="btn primary" disabled={busy || (!dirty && !isNew)} onClick={() => onSave()}>Update</button><button type="button" className="btn" disabled={busy} onClick={() => onSave('DRAFT')}>Unpublish</button></>
          : <><button type="button" className="btn" disabled={busy || (!dirty && !isNew)} onClick={() => onSave(status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT')}>{status === 'ARCHIVED' ? 'Save' : 'Save draft'}</button><button type="button" className="btn primary" disabled={busy} onClick={() => onSave('PUBLISHED')}>Publish</button></>}
        {!isNew && status !== 'ARCHIVED' && <button type="button" className="btn ghost" disabled={busy} onClick={() => onSave('ARCHIVED')}>Archive</button>}
      </div>
      {publicUrl && status === 'PUBLISHED' && <a className="link small" href={publicUrl} target="_blank" rel="noopener noreferrer">View on website ↗</a>}
    </div>
  </Card>
}

// The public website's origin (the same VITE_SITE_URL the website uses), for "View on website" links.
export const PUBLIC_SITE = (import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')).replace(/\/$/, '')

export function ModeSwitch({ mode, onChange }: { mode: 'edit' | 'preview'; onChange: (mode: 'edit' | 'preview') => void }) {
  return <div className="seg" role="tablist" aria-label="Mode">
    <button type="button" role="tab" aria-selected={mode === 'edit'} onClick={() => onChange('edit')}>Edit</button>
    <button type="button" role="tab" aria-selected={mode === 'preview'} onClick={() => onChange('preview')}>Preview</button>
  </div>
}
