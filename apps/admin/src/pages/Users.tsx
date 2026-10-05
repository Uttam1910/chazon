import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { AdminRole } from '@chazon/shared'
import { api, errorMessage, fieldErrors, useApi } from '../api'
import { Badge, PageHeader } from '../ui/Common'
import { Modal } from '../ui/Dialog'
import { Select, Switch, TextInput } from '../ui/Form'
import { ErrorState, LoadingRows } from '../ui/States'
import { useAuth } from '../auth-context'
import { formatDate } from '../ui/utils'
import { useConfirm } from '../ui/confirm'
import { useToast } from '../ui/toast-context'

type User = { id: string; email: string; name: string; role: AdminRole; active: boolean; lastLoginAt: string | null; createdAt: string; managed?: boolean }
const roles = [{ value: 'ADMIN', label: 'Admin — everything, including users and settings' }, { value: 'EDITOR', label: 'Editor — leads, audits, content and media' }]

export function Users() {
  const { user: me } = useAuth()
  const { data, error, loading, reload, setData } = useApi<User[]>('/users')
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const remove = async (u: User) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, message: 'They will lose access immediately. Their notes stay on leads. To pause access instead, deactivate the account.', confirmLabel: 'Delete user', danger: true }))) return
    try { await api.delete(`/users/${u.id}`); setData((data ?? []).filter(x => x.id !== u.id)); toast.success('User deleted') } catch (err) { toast.error(errorMessage(err)) }
  }
  return <>
    <PageHeader title="Admin Users" description="People who can sign in to Chazon Admin. The main Admin login is set in the server’s .env file (ADMIN_EMAIL / ADMIN_PASSWORD); add team members here." actions={<button className="btn primary" onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true"/>Add user</button>}/>
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : <div className="table-wrap"><table className="table">
      <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last sign-in</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
      <tbody>{(data ?? []).map(u => <tr key={u.id}>
        <td data-label="Name"><strong>{u.name}{u.id === me?.id && ' (you)'}</strong><small>{u.email}</small></td>
        <td data-label="Role"><Badge value={u.role} label={u.role === 'ADMIN' ? 'Admin' : 'Editor'}/></td>
        <td data-label="Status">{u.active ? <Badge label="Active" tone="green"/> : <Badge label="Deactivated" tone="grey"/>}{u.managed && <Badge label="Managed in .env" tone="orange"/>}</td>
        <td data-label="Last sign-in">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : 'Never'}</td>
        <td className="cell-actions">{!u.managed && <button className="icon-btn" aria-label={`Edit ${u.name}`} onClick={() => setEditing(u)}><Pencil size={15}/></button>}
          {u.id !== me?.id && !u.managed && <button className="icon-btn danger-text" aria-label={`Delete ${u.name}`} onClick={() => remove(u)}><Trash2 size={15}/></button>}</td>
      </tr>)}</tbody>
    </table></div>}
    {editing && <UserDialog user={editing === 'new' ? undefined : editing} isSelf={editing !== 'new' && editing.id === me?.id} onClose={() => setEditing(null)}
      onSaved={saved => { setData(editing === 'new' ? [...(data ?? []), saved] : (data ?? []).map(u => (u.id === saved.id ? saved : u))); setEditing(null) }}/>}
  </>
}

function UserDialog({ user, isSelf, onClose, onSaved }: { user?: User; isSelf: boolean; onClose: () => void; onSaved: (u: User) => void }) {
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'EDITOR', active: user?.active ?? true, password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const saved = user
        ? await api.patch<User>(`/users/${user.id}`, { name: form.name, role: form.role, active: form.active, ...(form.password ? { password: form.password } : {}) })
        : await api.post<User>('/users', form)
      toast.success(user ? 'User updated' : `${saved.name} can now sign in`)
      onSaved(saved)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Modal open onClose={onClose} title={user ? `Edit ${user.name}` : 'Add user'}>
    <form onSubmit={submit} className="stack">
      <TextInput label="Name" required value={form.name} onChange={v => setForm({ ...form, name: v })} error={errors.name}/>
      <TextInput label="Email" type="email" required value={form.email} onChange={v => setForm({ ...form, email: v })} error={errors.email} disabled={!!user} hint={user ? 'Email can’t be changed.' : undefined}/>
      <Select label="Role" value={form.role} onChange={v => setForm({ ...form, role: v as AdminRole })} options={roles} disabled={isSelf} hint={isSelf ? 'You can’t change your own role.' : undefined}/>
      <TextInput label={user ? 'Set a new password' : 'Password'} type="password" autoComplete="new-password" required={!user} minLength={12} value={form.password} onChange={v => setForm({ ...form, password: v })} error={errors.password}
        hint={user ? 'Leave empty to keep the current password. Setting one signs them out everywhere.' : 'At least 12 characters. Share it securely; they can change it after signing in.'}/>
      {user && !isSelf && <Switch checked={form.active} onChange={v => setForm({ ...form, active: v })} label={form.active ? 'Active' : 'Deactivated'} description="Deactivated users can’t sign in and are signed out immediately."/>}
      <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : user ? 'Save' : 'Add user'}</button></div>
    </form>
  </Modal>
}
