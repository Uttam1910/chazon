import { useCallback, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { ToastContext, type ToastApi } from './toast-context'

type Toast = { id: number; tone: 'success' | 'error'; message: string }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), [])
  const push = useCallback((tone: Toast['tone'], message: string) => {
    const id = nextId.current++
    setToasts(t => [...t.slice(-3), { id, tone, message }])
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 3500)
  }, [dismiss])
  const [toastApi] = useState<ToastApi>(() => ({ success: m => push('success', m), error: m => push('error', m) }))
  return <ToastContext.Provider value={toastApi}>
    {children}
    <div className="toasts" aria-live="polite">
      {toasts.map(t => <div key={t.id} className={`toast ${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
        {t.tone === 'success' ? <CheckCircle2 size={18} aria-hidden="true"/> : <AlertCircle size={18} aria-hidden="true"/>}
        <span>{t.message}</span>
        <button className="icon-btn" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={15}/></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}
