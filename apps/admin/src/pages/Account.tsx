import { useState, type FormEvent } from 'react'
import { api, errorMessage, fieldErrors } from '../api'
import { Card, PageHeader } from '../ui/Common'
import { TextInput } from '../ui/Form'
import { useAuth } from '../auth-context'
import { useToast } from '../ui/toast-context'

export function Account() {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return setErrors({ confirm: 'Passwords do not match' })
    setBusy(true); setErrors({})
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success('Password changed. Other devices have been signed out.')
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <>
    <PageHeader title="Your account" description={`${user?.name} · ${user?.email}`}/>
    {user?.managed ? <Card title="Password" className="narrow">
      <p className="muted">This sign-in is configured in the server’s <code>.env</code> file. To change the password, update <code>ADMIN_PASSWORD</code> there and restart the API — every session is then signed out.</p>
    </Card> : <Card title="Change password" className="narrow">
      <form onSubmit={submit} className="stack">
        <TextInput label="Current password" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={v => setForm({ ...form, currentPassword: v })} error={errors.currentPassword}/>
        <TextInput label="New password" type="password" autoComplete="new-password" required minLength={12} value={form.newPassword} onChange={v => setForm({ ...form, newPassword: v })} error={errors.newPassword} hint="At least 12 characters. A short phrase is easier to remember."/>
        <TextInput label="Confirm new password" type="password" autoComplete="new-password" required value={form.confirm} onChange={v => setForm({ ...form, confirm: v })} error={errors.confirm}/>
        <div><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></div>
      </form>
    </Card>}
  </>
}
