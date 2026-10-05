import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import { DEMO_MODE, errorMessage } from '../api'
import { DEMO_LOGIN } from '@chazon/shared/demo'
import { usePageTitle } from '../layout/title'
import { FullPageState, Spinner } from '../ui/States'
import { useAuth } from '../auth-context'

export function Login() {
  usePageTitle('Sign in')
  const { user, status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(DEMO_MODE ? DEMO_LOGIN.email : '')
  const [password, setPassword] = useState(DEMO_MODE ? DEMO_LOGIN.password : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from || '/'
  if (status === 'loading') return <FullPageState title="Loading…" loading/>
  if (user) return <Navigate to={from} replace/>

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(email, password); navigate(from, { replace: true }) } catch (err) { setError(errorMessage(err)); setPassword('') } finally { setBusy(false) }
  }
  return <div className="login">
    <div className="login-panel">
      <div className="login-brand"><span className="brand-mark" aria-hidden="true">c<span>↗</span></span><span>CHAZON<small>DIGITAL VENTURES</small></span></div>
      <h1>Sign in to Chazon Admin</h1>
      <p className="muted">Leads, audits and website content in one place.</p>
      <form onSubmit={submit} noValidate={false}>
        {DEMO_MODE && <div className="demo-hint"><strong>Demo mode</strong> — sample data, no database. Sign in with <code>{DEMO_LOGIN.email}</code> / <code>{DEMO_LOGIN.password}</code> (pre-filled).</div>}
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="field"><div className="field-label"><label htmlFor="email">Email</label></div>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} autoFocus/></div>
        <div className="field"><div className="field-label"><label htmlFor="password">Password</label></div>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></div>
        <button className="btn primary block" disabled={busy}>{busy ? <Spinner label="Signing in…"/> : <><LogIn size={17} aria-hidden="true"/>Sign in</>}</button>
      </form>
      <p className="login-foot">Access is limited to authorised Chazon team members. Ask an administrator if you need an account.</p>
    </div>
    <div className="login-art" aria-hidden="true">
      <p>Build <span>→</span> Grow <span>→</span> Convert <span>→</span> Automate</p>
      <strong>Don’t just build a digital presence. <em>Build a digital revenue engine.</em></strong>
    </div>
  </div>
}
