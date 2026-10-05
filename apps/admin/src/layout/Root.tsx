import { Outlet } from 'react-router'
import { AuthProvider } from '../auth'
import { ConfirmProvider } from '../ui/Dialog'
import { ToastProvider } from '../ui/Toast'

// Providers sit inside the router so dialogs (e.g. the unsaved-changes prompt) can use routing hooks.
export function Root() {
  return <ToastProvider><ConfirmProvider><AuthProvider><Outlet/></AuthProvider></ConfirmProvider></ToastProvider>
}
