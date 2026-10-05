import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Search, Trash2, Upload } from 'lucide-react'
import { errorMessage, mediaUrl, qs, useApi } from '../api'
import { ACCEPT, uploadImage, type MediaItem } from './media-api'
import { Modal } from './Dialog'
import { ErrorState, EmptyState, LoadingRows, Spinner } from './States'
import { useDebounced } from './utils'
import { useToast } from './toast-context'


/** Upload button + drop zone. Calls onUploaded for each successfully stored image. */
export function UploadZone({ onUploaded, compact }: { onUploaded: (item: MediaItem) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const toast = useToast()
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is larger than 10 MB.`); continue }
      try { onUploaded(await uploadImage(file)); toast.success(`${file.name} uploaded`) } catch (e) { toast.error(`${file.name}: ${errorMessage(e)}`) }
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void upload(e.dataTransfer.files) }
  return <div className={`upload-zone ${over ? 'over' : ''} ${compact ? 'compact' : ''}`} onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
    <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={e => void upload(e.target.files)}/>
    {busy ? <Spinner label="Uploading and optimising…"/> : <>
      <Upload size={20} aria-hidden="true"/>
      <span>{compact ? 'Drop images here or' : 'Drag images here, or'}</span>
      <button type="button" className="btn" onClick={() => input.current?.click()}>Choose files</button>
      {!compact && <small>JPEG, PNG, WebP, AVIF or GIF up to 10 MB. Images are resized to max 2400px and converted to WebP.</small>}
    </>}
  </div>
}

/** Choose an existing image from the library or upload a new one. */
export function MediaPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (item: MediaItem) => void }) {
  const [q, setQ] = useState('')
  const search = useDebounced(q)
  const { data, error, loading, reload } = useApi<MediaItem[]>(open ? `/media${qs({ q: search, pageSize: 60 })}` : null)
  return <Modal open={open} onClose={onClose} title="Media library" size="lg">
    <div className="picker">
      <UploadZone compact onUploaded={item => { onSelect(item); onClose() }}/>
      <label className="search-input"><Search size={16} aria-hidden="true"/><input type="search" placeholder="Search by file name or alt text" value={q} onChange={e => setQ(e.target.value)} aria-label="Search media"/></label>
      {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows rows={3}/> : !data?.length
        ? <EmptyState title={search ? 'No matching images' : 'No images yet'} message="Upload an image above to use it here."/>
        : <ul className="media-grid small">{data.map(item => <li key={item.id}>
          <button type="button" className="media-tile" onClick={() => { onSelect(item); onClose() }}>
            <img src={mediaUrl(item.url)} alt="" loading="lazy"/><span>{item.alt || item.originalName}</span>
          </button>
        </li>)}</ul>}
    </div>
  </Modal>
}

/** A single image value (stored as /uploads/… or an https URL) with preview, choose, and remove. */
export function ImageField({ label, value, onChange, hint, error }: { label: string; value: string; onChange: (url: string) => void; hint?: string; error?: string }) {
  const [open, setOpen] = useState(false)
  return <div className={`field ${error ? 'has-error' : ''}`}>
    <div className="field-label"><span className="label-text">{label}</span></div>
    {value
      ? <div className="image-field"><img src={mediaUrl(value)} alt=""/><div><code title={value}>{value}</code><div className="row-actions">
        <button type="button" className="btn" onClick={() => setOpen(true)}>Replace</button>
        <button type="button" className="btn ghost" onClick={() => onChange('')}><Trash2 size={15} aria-hidden="true"/>Remove</button>
      </div></div></div>
      : <button type="button" className="image-empty" onClick={() => setOpen(true)}><ImagePlus size={20} aria-hidden="true"/>Choose image</button>}
    {hint && !error && <p className="field-hint">{hint}</p>}
    {error && <p className="field-error">{error}</p>}
    <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={item => onChange(item.url)}/>
  </div>
}
