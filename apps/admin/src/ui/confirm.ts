import { createContext, useContext, type ReactNode } from 'react'

export type ConfirmOptions = { title: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean }
export const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/** Returns confirm(options) → Promise<boolean>, rendered as an accessible dialog (never window.confirm). */
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider')
  return context
}
