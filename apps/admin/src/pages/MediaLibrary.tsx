import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { api, errorMessage, mediaUrl, qs, useApi } from '../api'
import { PageHeader, Pagination } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { TextInput } from '../ui/Form'
import { UploadZone } from '../ui/Media'
import { EmptyState, ErrorState, LoadingRows } from '../ui/States'
import { SearchBox, Toolbar } from './list'
import { formatDate } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { type MediaItem } from '../ui/media-api'
import { useToast } from '../ui/toast-context'
import { useListParams } from './list-utils'

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

export function MediaLibrary() {
  const { values, page, set } = useListParams({ q: '' })
  const { data, meta, error, loading, reload, setData } = useApi<MediaItem[]>(`/media${qs({ ...values, page, pageSize: 30 })}`)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  return <>
    <PageHeader title="Media" description="Images for services, case studies, articles and testimonials."/>
    <UploadZone onUploaded={item => { setData(list => [item, ...(list ?? [])]) }}/>
    <Toolbar><SearchBox value={values.q} onChange={v => set('q', v)} placeholder="Search by file name or alt text"/></Toolbar>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : !data?.length
      ? <EmptyState title={values.q ? 'No matching images' : 'No images yet'} message={values.q ? 'Try another search.' : 'Upload images above. They are optimised automatically.'}/>
      : <ul className="media-grid">{data.map(item => <li key={item.id}>
        <button type="button" className="media-tile" onClick={() => setSelected(item)}>
          <img src={mediaUrl(item.url)} alt={item.alt} loading="lazy"/>
          <span>{item.originalName}</span>
          {!item.alt && <em className="alt-missing">No alt text</em>}
        </button>
      </li>)}</ul>}
    <Pagination meta={meta} onPage={p => set('page', p)}/>
    {selected && <MediaDetail item={selected} onClose={() => setSelected(null)}
      onSaved={saved => { setData(list => (list ?? []).map(m => (m.id === saved.id ? saved : m))); setSelected(saved) }}
      onDeleted={id => { setData(list => (list ?? []).filter(m => m.id !== id)); setSelected(null) }}/>}
  </>
}

function MediaDetail({ item, onClose, onSaved, onDeleted }: { item: MediaItem; onClose: () => void; onSaved: (m: MediaItem) => void; onDeleted: (id: string) => void }) {
  const [alt, setAlt] = useState(item.alt)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const absolute = mediaUrl(item.url)
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`) } catch { toast.error('Copy failed — select and copy the text manually.') }
  }
  const save = async () => {
    setBusy(true)
    try { onSaved(await api.patch<MediaItem>(`/media/${item.id}`, { alt })); toast.success('Alt text saved') } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!(await confirm({ title: 'Delete this image?', message: 'Any page still using it will show a broken image. Make sure it is no longer referenced before deleting.', confirmLabel: 'Delete image', danger: true }))) return
    try { await api.delete(`/media/${item.id}`); toast.success('Image deleted'); onDeleted(item.id) } catch (err) { toast.error(errorMessage(err)) }
  }
  return <Modal open onClose={onClose} title={item.originalName} size="lg" footer={<>
    <button className="btn ghost danger-text" onClick={remove}><Trash2 size={15} aria-hidden="true"/>Delete</button>
    <span className="spacer"/>
    <button className="btn" onClick={onClose}>Close</button>
    <button className="btn primary" onClick={save} disabled={busy || alt === item.alt}>{busy ? 'Saving…' : 'Save alt text'}</button>
  </>}>
    <div className="media-detail">
      <div className="media-preview"><img src={absolute} alt={item.alt}/></div>
      <div className="stack">
        <TextInput label="Alt text" value={alt} onChange={setAlt} maxLength={300} hint="Describe the image for people using screen readers. Leave empty only for decorative images."/>
        <dl className="details compact">
          <div><dt>Dimensions</dt><dd>{item.width && item.height ? `${item.width} × ${item.height}` : '—'}</dd></div>
          <div><dt>Size</dt><dd>{size(item.size)} · WebP</dd></div>
          <div><dt>Uploaded</dt><dd>{formatDate(item.createdAt, true)}{item.uploadedBy ? ` by ${item.uploadedBy.name}` : ''}</dd></div>
        </dl>
        <div className="copy-field"><code>{item.url}</code><button className="btn" onClick={() => copy(item.url, 'Path')}><Copy size={15} aria-hidden="true"/>Copy path</button></div>
        <div className="copy-field"><code>{absolute}</code><button className="btn" onClick={() => copy(absolute, 'URL')}><Copy size={15} aria-hidden="true"/>Copy URL</button></div>
        <button className="btn" onClick={() => copy(`![${alt || 'Image description'}](${item.url})`, 'Markdown')}>Copy as Markdown image</button>
      </div>
    </div>
  </Modal>
}
