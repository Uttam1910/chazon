import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { ConfirmContext, type ConfirmOptions } from './confirm'

/** Accessible modal built on <dialog>: focus is trapped, Escape closes, the page behind is inert. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className={`modal modal-${size}`} onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === ref.current) onClose() }} aria-labelledby={titleId}>
    {open && <div className="modal-inner">
      <header className="modal-head"><h2 id={titleId}>{title}</h2><button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={18}/></button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-foot">{footer}</footer>}
    </div>}
  </dialog>
}


export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => setPending({ ...options, resolve })), [])
  const close = (ok: boolean) => { pending?.resolve(ok); setPending(null) }
  return <ConfirmContext.Provider value={confirm}>
    {children}
    <Modal open={!!pending} onClose={() => close(false)} title={pending?.title ?? ''} size="sm" footer={<>
      <button type="button" className="btn" onClick={() => close(false)}>{pending?.cancelLabel ?? 'Cancel'}</button>
      <button type="button" className={`btn ${pending?.danger ? 'danger' : 'primary'}`} onClick={() => close(true)} autoFocus>{pending?.confirmLabel ?? 'Confirm'}</button>
    </>}>
      <div className="confirm-message">{pending?.message}</div>
    </Modal>
  </ConfirmContext.Provider>
}
