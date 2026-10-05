import { useEffect, useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import type { PublicSettings } from '@chazon/shared'
import { api, errorMessage, fieldErrors, useApi } from '../api'
import { Card, PageHeader } from '../ui/Common'
import { TextArea, TextInput } from '../ui/Form'
import { ErrorState, LoadingRows } from '../ui/States'
import { useAuth } from '../auth-context'
import { isEqual, useUnsavedChanges } from '../ui/utils'
import { useToast } from '../ui/toast-context'

const empty: PublicSettings = { companyName: '', tagline: '', description: '', email: '', phone: '', whatsapp: '', location: '', linkedinUrl: '', instagramUrl: '', facebookUrl: '', ctaTalkLabel: '', ctaAuditLabel: '' }
const pick = (s: PublicSettings) => Object.fromEntries(Object.keys(empty).map(k => [k, s[k as keyof PublicSettings] ?? ''])) as PublicSettings

export function WebsiteSettings() {
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN'
  const { data, error, loading, reload, setData } = useApi<PublicSettings>('/settings')
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  useEffect(() => { if (data) setForm(pick(data)) }, [data])
  const dirty = !!data && !isEqual(form, pick(data))
  useUnsavedChanges(dirty && !busy)
  const field = (key: keyof PublicSettings) => ({ value: form[key], onChange: (v: string) => setForm(f => ({ ...f, [key]: v })), error: errors[key], disabled: !canEdit })

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try { setData(await api.put<PublicSettings>('/settings', form)); toast.success('Settings saved and live on the website.') } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return <form onSubmit={save}>
    <PageHeader title="Website Settings" description="Public company details used across the website. Leave a contact or social field empty to hide it."
      actions={canEdit && <><button type="button" className="btn" disabled={!dirty || busy} onClick={() => data && setForm(pick(data))}>Discard</button><button className="btn primary" disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save settings'}</button></>}/>
    {!canEdit && <p className="notice"><Lock size={16} aria-hidden="true"/>Only Admins can change website settings.</p>}
    {error ? <ErrorState message={error.message} onRetry={reload}/> : loading && !data ? <LoadingRows/> : <div className="settings-grid">
      <Card title="Company">
        <div className="stack">
          <TextInput label="Company name" required {...field('companyName')} maxLength={120}/>
          <TextInput label="Tagline" {...field('tagline')} maxLength={160}/>
          <TextArea label="Description" {...field('description')} rows={4} counter={{ max: 1000 }}/>
        </div>
      </Card>
      <Card title="Contact">
        <div className="stack">
          <TextInput label="Email" type="email" {...field('email')} hint="Shown as a mailto link."/>
          <TextInput label="Phone" type="tel" {...field('phone')}/>
          <TextInput label="WhatsApp number" {...field('whatsapp')} inputMode="numeric" hint="International digits only, e.g. 919876543210 — enables WhatsApp buttons."/>
          <TextInput label="Location" {...field('location')} maxLength={160}/>
        </div>
      </Card>
      <Card title="Social profiles">
        <div className="stack">
          <TextInput label="LinkedIn" type="url" placeholder="https://www.linkedin.com/company/…" {...field('linkedinUrl')}/>
          <TextInput label="Instagram" type="url" placeholder="https://www.instagram.com/…" {...field('instagramUrl')}/>
          <TextInput label="Facebook" type="url" placeholder="https://www.facebook.com/…" {...field('facebookUrl')}/>
          <p className="field-hint">Each must be an https:// link on the platform’s own domain, or it won’t be saved.</p>
        </div>
      </Card>
      <Card title="Calls to action">
        <div className="stack">
          <TextInput label="“Let’s Talk” button label" required {...field('ctaTalkLabel')} maxLength={40}/>
          <TextInput label="Digital Growth Audit button label" required {...field('ctaAuditLabel')} maxLength={60}/>
        </div>
      </Card>
    </div>}
  </form>
}
