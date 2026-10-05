import { useEffect, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { useDebounced } from '../ui/utils'

/** Search box that updates the URL after the user pauses typing. */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState(value)
  const debounced = useDebounced(draft, 350)
  useEffect(() => { if (debounced !== value) onChange(debounced) }, [debounced]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(value) }, [value])
  return <label className="search-input"><Search size={16} aria-hidden="true"/><input type="search" value={draft} placeholder={placeholder} aria-label={placeholder} onChange={e => setDraft(e.target.value)}/></label>
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[] }) {
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>
}
