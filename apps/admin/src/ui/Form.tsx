import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Plus, X } from 'lucide-react'

type FieldProps = { label: string; error?: string; hint?: ReactNode; required?: boolean; counter?: { value: string; max: number; ideal?: number }; className?: string; children: (id: string, describedBy?: string) => ReactNode }

/** Label + control + hint/error, wired up with ids for screen readers. */
export function Field({ label, error, hint, required, counter, className = '', children }: FieldProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const length = counter?.value.length ?? 0
  return <div className={`field ${error ? 'has-error' : ''} ${className}`}>
    <div className="field-label">
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>
      {counter && <span className={`counter ${length > counter.max ? 'over' : counter.ideal && length > counter.ideal ? 'warn' : ''}`}>{length}/{counter.ideal ?? counter.max}</span>}
    </div>
    {children(id, describedBy)}
    {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>
}

type Common = { label: string; error?: string; hint?: ReactNode; required?: boolean; className?: string }

export function TextInput({ label, error, hint, required, className, value, onChange, counter, ...rest }: Common & { value: string; onChange: (value: string) => void; counter?: { max: number; ideal?: number } } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <Field label={label} error={error} hint={hint} required={required} className={className} counter={counter && { value, ...counter }}>
    {(id, describedBy) => <input id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} required={required} value={value} onChange={e => onChange(e.target.value)} {...rest}/>}
  </Field>
}

export function TextArea({ label, error, hint, required, className, value, onChange, counter, rows = 4, ...rest }: Common & { value: string; onChange: (value: string) => void; counter?: { max: number; ideal?: number } } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  return <Field label={label} error={error} hint={hint} required={required} className={className} counter={counter && { value, ...counter }}>
    {(id, describedBy) => <textarea id={id} rows={rows} aria-describedby={describedBy} aria-invalid={!!error || undefined} required={required} value={value} onChange={e => onChange(e.target.value)} {...rest}/>}
  </Field>
}

export function Select({ label, error, hint, required, className, value, onChange, options, placeholder, ...rest }: Common & { value: string; onChange: (value: string) => void; options: readonly (string | { value: string; label: string })[]; placeholder?: string } & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) {
  return <Field label={label} error={error} hint={hint} required={required} className={className}>
    {(id, describedBy) => <select id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} required={required} value={value} onChange={e => onChange(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>}
  </Field>
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId()
  return <div className="switch-row">
    <button type="button" role="switch" id={id} aria-checked={checked} className="switch" onClick={() => onChange(!checked)} disabled={disabled}><span/></button>
    <label htmlFor={id}><strong>{label}</strong>{description && <small>{description}</small>}</label>
  </div>
}

/** Editable list of short strings (deliverables, tags). */
export function ListInput({ label, values, onChange, placeholder, hint, max = 30, error }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string; hint?: ReactNode; max?: number; error?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const items = draft.split(',').map(s => s.trim()).filter(Boolean).filter(s => !values.includes(s))
    if (items.length) onChange([...values, ...items].slice(0, max))
    setDraft('')
  }
  return <Field label={label} hint={hint} error={error}>
    {(id, describedBy) => <div className="list-input">
      {values.length > 0 && <ul className="chips">{values.map(v => <li key={v}>{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter(x => x !== v))}><X size={13}/></button></li>)}</ul>}
      <div className="list-input-row">
        <input id={id} aria-describedby={describedBy} value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} disabled={values.length >= max}/>
        <button type="button" className="btn" onClick={add} disabled={!draft.trim()}><Plus size={15} aria-hidden="true"/>Add</button>
      </div>
    </div>}
  </Field>
}
