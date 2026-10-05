import { useId, useRef, useState } from 'react'
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react'
import { Markdown } from '@chazon/shared/markdown'
import { mediaUrl } from '../api'
import { MediaPicker } from './Media'

type Action = { label: string; icon: typeof Bold; apply: (selected: string) => { text: string; select?: [number, number] } }
const wrap = (mark: string, fallback: string) => (s: string) => { const body = s || fallback; return { text: `${mark}${body}${mark}`, select: [mark.length, mark.length + body.length] as [number, number] } }
const prefix = (mark: string | ((i: number) => string), fallback: string) => (s: string) => ({ text: (s || fallback).split('\n').map((line, i) => `${typeof mark === 'string' ? mark : mark(i)}${line}`).join('\n') })
const actions: Action[] = [
  { label: 'Heading', icon: Heading2, apply: prefix('## ', 'Heading') },
  { label: 'Subheading', icon: Heading3, apply: prefix('### ', 'Subheading') },
  { label: 'Bold', icon: Bold, apply: wrap('**', 'bold text') },
  { label: 'Italic', icon: Italic, apply: wrap('*', 'italic text') },
  { label: 'Link', icon: Link2, apply: s => ({ text: `[${s || 'link text'}](https://)`, select: [(s || 'link text').length + 3, (s || 'link text').length + 11] }) },
  { label: 'Bulleted list', icon: List, apply: prefix('- ', 'List item') },
  { label: 'Numbered list', icon: ListOrdered, apply: prefix(i => `${i + 1}. `, 'List item') },
  { label: 'Quote', icon: Quote, apply: prefix('> ', 'Quote') },
]

/** Markdown editor with a formatting toolbar, image insertion from the media library, and a live preview. */
export function MarkdownEditor({ label, value, onChange, rows = 18, error, hint }: { label: string; value: string; onChange: (value: string) => void; rows?: number; error?: string; hint?: string }) {
  const id = useId()
  const area = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [picker, setPicker] = useState(false)
  const insert = (fn: Action['apply']) => {
    const el = area.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const { text, select } = fn(value.slice(start, end))
    const needsBreak = /^(#|-|\d+\.|>)/.test(text) && start > 0 && value[start - 1] !== '\n'
    const insertText = (needsBreak ? '\n\n' : '') + text
    onChange(value.slice(0, start) + insertText + value.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const base = start + (needsBreak ? 2 : 0)
      el.setSelectionRange(select ? base + select[0] : base + text.length, select ? base + select[1] : base + text.length)
    })
  }
  return <div className={`field md-editor ${error ? 'has-error' : ''}`}>
    <div className="field-label"><label htmlFor={id}>{label}</label>
      <div className="seg" role="tablist" aria-label="Editor mode">
        <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>Write</button>
        <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
      </div>
    </div>
    {tab === 'write' ? <>
      <div className="md-toolbar" role="toolbar" aria-label="Formatting">
        {actions.map(a => <button key={a.label} type="button" className="icon-btn" title={a.label} aria-label={a.label} onClick={() => insert(a.apply)}><a.icon size={16}/></button>)}
        <button type="button" className="icon-btn" title="Insert image" aria-label="Insert image" onClick={() => setPicker(true)}><ImagePlus size={16}/></button>
      </div>
      <textarea id={id} ref={area} className="md-input" rows={rows} value={value} onChange={e => onChange(e.target.value)} spellCheck/>
    </> : <div className="md-preview prose">{value.trim() ? <Markdown source={value} resolveUrl={mediaUrl}/> : <p className="muted">Nothing to preview yet.</p>}</div>}
    {hint && !error && <p className="field-hint">{hint}</p>}
    {error && <p className="field-error">{error}</p>}
    <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={item => insert(() => ({ text: `![${item.alt || 'Image description'}](${item.url})` }))}/>
  </div>
}
