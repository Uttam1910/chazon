import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Mail,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  FileText,
  RotateCcw,
  RefreshCw,
  Building2,
  Globe,
} from 'lucide-react'
import { auditAuthApi, type AuditUser } from '../lib/audit-auth-api'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with'
              shape?: 'rectangular' | 'pill' | 'circle'
              width?: number
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleJwtPayload {
  email: string
  name?: string
  picture?: string
  sub: string
}

function parseGoogleJwt(token: string): GoogleJwtPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as GoogleJwtPayload
  } catch {
    return null
  }
}

export interface AuditAuthModalProps {
  isOpen: boolean
  initialDomain?: string
  onClose: () => void
  onSuccess: (user: AuditUser) => void
}

export function AuditAuthModal({
  isOpen,
  initialDomain = '',
  onClose,
  onSuccess,
}: AuditAuthModalProps) {
  // Steps: 'auth' (choose Google or OTP) | 'otp_verify' (enter 6 digits) | 'google_details' (ask company name & domain) | 'limit_finished' (block second audit)
  const [step, setStep] = useState<'auth' | 'otp_verify' | 'google_details' | 'limit_finished'>('auth')

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [domain, setDomain] = useState(initialDomain)
  const [code, setCode] = useState('')

  // Existing user with finished limit state
  const [existingAuditedUser, setExistingAuditedUser] = useState<AuditUser | null>(null)

  // Google State
  const [googleCredential, setGoogleCredential] = useState<string | null>(null)
  const [googleUser, setGoogleUser] = useState<GoogleJwtPayload | null>(null)
  const [googleHelp, setGoogleHelp] = useState(false)
  const [alreadyAuditedNotice, setAlreadyAuditedNotice] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''

  useEffect(() => {
    if (initialDomain) {
      setDomain(initialDomain)
    }
  }, [initialDomain])

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setStep('auth')
      setCode('')
      setExistingAuditedUser(null)
      setGoogleCredential(null)
      setGoogleUser(null)
      setGoogleHelp(false)
      setLoading(false)
      setGoogleLoading(false)
    }
  }, [isOpen])

  // Cooldown countdown for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Load and initialize Google Identity Services script
  useEffect(() => {
    if (!isOpen || !googleClientId || step !== 'auth') return

    const existingScript = document.getElementById('google-gsi-client')
    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) return
            setError(null)
            setGoogleLoading(true)
            setLoading(true)

            try {
              const targetDomain = domain.trim() || initialDomain.trim() || undefined
              const res = await auditAuthApi.googleAuth({
                credential: response.credential,
                domain: targetDomain,
              })

              // If user has already completed their 1-time free audit:
              // RESTRICT user immediately and display the dedicated limit message!
              if (res.user.hasAudited) {
                setExistingAuditedUser(res.user)
                setStep('limit_finished')
                return
              }

              // If returning user already has their company details:
              if (res.user.companyName) {
                onSuccess(res.user)
                onClose()
                return
              }

              // Otherwise (brand new user without company details), prompt for company name
              setGoogleCredential(response.credential)
              const parsed = parseGoogleJwt(response.credential)
              if (parsed) {
                setGoogleUser(parsed)
                setName(parsed.name || '')
                setEmail(parsed.email)
              }
              setStep('google_details')
            } catch (err) {
              setError((err as Error).message || 'Google sign-in failed. Please try again.')
            } finally {
              setLoading(false)
              setGoogleLoading(false)
            }
          },
        })

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
          })
        }
      } catch (err) {
        console.warn('Google sign-in initialization failed:', err)
      }
    }

    if (window.google?.accounts?.id) {
      const timer = setTimeout(initGoogle, 0)
      return () => clearTimeout(timer)
    } else if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        setTimeout(initGoogle, 0)
      }
      document.head.appendChild(script)
    }
  }, [isOpen, googleClientId, step, domain, initialDomain])

  if (!isOpen) return null

  // Handle Send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    let cleanName = name.trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid business email address.')
      return
    }

    if (!cleanName) {
      cleanName = cleanEmail.split('@')[0]
    }

    setLoading(true)
    setError(null)

    try {
      const res = await auditAuthApi.sendOtp({
        name: cleanName,
        email: cleanEmail,
        companyName: companyName.trim() || undefined,
        domain: domain.trim() || undefined,
      })
      if ((res as { alreadyAudited?: boolean }).alreadyAudited) {
        setAlreadyAuditedNotice(true)
      } else {
        setAlreadyAuditedNotice(false)
      }
      setStep('otp_verify')
      setResendCooldown(60)
    } catch (err) {
      setError((err as Error).message || 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim()
    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await auditAuthApi.verifyOtp({
        email: email.trim().toLowerCase(),
        code: cleanCode,
        name: name.trim() || undefined,
        companyName: companyName.trim() || undefined,
        domain: domain.trim() || undefined,
      })
      if (res.user.hasAudited) {
        setExistingAuditedUser(res.user)
        setStep('limit_finished')
        return
      }
      onSuccess(res.user)
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Post-Google Submission (with Company Name and Domain)
  const handleGoogleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!googleCredential) {
      setError('Google authentication expired. Please sign in again.')
      setStep('auth')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await auditAuthApi.googleAuth({
        credential: googleCredential,
        companyName: companyName.trim() || undefined,
        domain: domain.trim() || undefined,
      })
      if (res.user.hasAudited) {
        setExistingAuditedUser(res.user)
        setStep('limit_finished')
        return
      }
      onSuccess(res.user)
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Google registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-auth-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(12, 13, 12, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          color: '#181918',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #f1f2ed',
            position: 'relative',
            background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 100%)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#686a65',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#feebe6', padding: '4px 10px', borderRadius: '20px', marginBottom: '12px' }}>
            <Sparkles size={14} style={{ color: '#d44720' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d44720', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {step === 'limit_finished' ? '1 Free Audit Completed' : 'Free Diagnostic Scan'}
            </span>
          </div>

          <h2 id="audit-auth-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#181918', letterSpacing: '-0.02em' }}>
            {step === 'limit_finished'
              ? 'Free Audit Already Completed'
              : step === 'google_details'
                ? 'Almost Done! Confirm Business Details'
                : 'Unlock Your Website Health Audit'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#686a65', margin: 0, lineHeight: 1.5 }}>
            {step === 'limit_finished'
              ? 'Each account is limited to 1 complimentary diagnostic scan.'
              : step === 'google_details'
                ? 'Tell us your company and website domain to generate your diagnostic audit.'
                : 'Sign up to launch your 0–100 performance, SEO & mobile audit. 1 free audit per account.'}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '18px',
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* STEP 1: AUTH SELECTION (Google Button + Email OTP Form) */}
          {step === 'auth' && (
            <div>
              {/* Option A: Google Sign-In */}
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                {googleLoading && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      border: '1.5px solid #fdba74',
                      borderRadius: '10px',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(212, 71, 32, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ color: '#d44720' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#181918' }}>
                        Authenticating with Google...
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#686a65' }}>
                      Verifying account credentials & preparing website audit...
                    </span>
                  </div>
                )}

                {googleClientId ? (
                  <div style={{ display: googleLoading ? 'none' : 'block' }}>
                    <div
                      ref={googleBtnContainerRef}
                      style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: googleLoading ? 'none' : 'block' }}>
                    <button
                      type="button"
                      disabled={loading || googleLoading}
                      onClick={() => setGoogleHelp(!googleHelp)}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: '#374151',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        opacity: loading || googleLoading ? 0.7 : 1,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.547 0 9s.347 2.827.957 4.039l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                      </svg>
                      Continue with Google
                    </button>

                    {googleHelp && (
                      <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78125rem', color: '#64748b', textAlign: 'left', lineHeight: 1.45 }}>
                        To enable 1-click Google Sign-In, add your Google OAuth Client ID to <code style={{ color: '#d44720' }}>.env</code> as <code style={{ color: '#d44720' }}>VITE_GOOGLE_CLIENT_ID</code>. You can also sign up immediately using the Email OTP form below!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span>Or continue with Email</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              {/* Option B: Email OTP Form */}
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                    Full Name <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8c8e88' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={loading || googleLoading}
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                    Work Email <span style={{ color: '#d44720' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={loading || googleLoading}
                    placeholder="sarah@yourbusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                      Company Name <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8c8e88' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      disabled={loading || googleLoading}
                      placeholder="Acme Growth"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                      Domain to Audit
                    </label>
                    <input
                      type="text"
                      disabled={loading || googleLoading}
                      placeholder="yourbrand.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        background: '#fafaf8',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    background: '#d44720',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading || googleLoading ? 0.75 : 1,
                  }}
                >
                  {loading && !googleLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Verification Code
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '16px', color: '#686a65', fontSize: '0.75rem' }}>
                  <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                  <span>Zero spam. No password required. Single free diagnostic audit.</span>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2A: POST-GOOGLE CONFIRMATION (Ask Company & Domain) */}
          {step === 'google_details' && (
            <form onSubmit={handleGoogleDetailsSubmit}>
              {googleUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  {googleUser.picture ? (
                    <img src={googleUser.picture} alt={googleUser.name || 'User'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d44720', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {(googleUser.name || 'U').charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#181918' }}>
                      {googleUser.name || 'Google User'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#686a65', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {googleUser.email}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Verified
                  </span>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                  <Building2 size={15} style={{ color: '#d44720' }} />
                  Company / Business Name <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8c8e88' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Digital"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '6px' }}>
                  <Globe size={15} style={{ color: '#d44720' }} />
                  Website Domain to Audit <span style={{ color: '#d44720' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="yourbrand.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: '#fafaf8',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: '#d44720',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Launching Audit...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Complete & Run Free Audit
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoading(false)
                  setGoogleLoading(false)
                  setError(null)
                  setStep('auth')
                }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  marginTop: '12px',
                  color: '#686a65',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Sign in with a different account
              </button>
            </form>
          )}

          {/* STEP 2B: OTP VERIFICATION */}
          {step === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#feebe6', color: '#d44720', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Mail size={22} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 6px', color: '#181918' }}>
                  Check your inbox
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#686a65', margin: 0 }}>
                  We sent a 6-digit code to <strong style={{ color: '#181918' }}>{email}</strong>
                </p>
              </div>

              {alreadyAuditedNotice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#fff9f5', border: '1px solid #fed7aa', borderRadius: '10px', color: '#c2410c', fontSize: '0.8125rem', marginBottom: '16px', lineHeight: 1.45 }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#d44720' }} />
                  <span>Welcome back! Your 1-time free audit was completed. Enter the verification code to view your diagnostic report.</span>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#333533', marginBottom: '8px', textAlign: 'center' }}>
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #d44720',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#181918',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: '#d44720',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: loading || code.trim().length !== 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading || code.trim().length !== 6 ? 0.65 : 1,
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Verify & Launch Audit
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(false)
                    setGoogleLoading(false)
                    setError(null)
                    setStep('auth')
                  }}
                  style={{ background: 'none', border: 'none', color: '#686a65', fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}
                >
                  Change email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#9ca3af' : '#d44720',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: LIMIT FINISHED RESTRICTION SCREEN */}
          {step === 'limit_finished' && existingAuditedUser && (
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fff1ec',
                  border: '2px solid #fed7aa',
                  color: '#d44720',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <ShieldAlert size={28} />
              </div>

              <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 14px' }}>
                Account <strong style={{ color: '#181918' }}>{existingAuditedUser.email}</strong> has already completed its single free audit for:
              </p>

              {/* Box showing the URL that was actually audited! */}
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  marginBottom: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  maxWidth: '100%',
                }}
              >
                <Globe size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#9a3412', wordBreak: 'break-all', fontSize: '0.9375rem' }}>
                  {existingAuditedUser.domain || 'previously audited website'}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600, lineHeight: 1.55, maxWidth: '400px', margin: '0 auto 20px' }}>
                Each account is restricted to 1 free diagnostic. To audit a new website, please sign in with a different Gmail or work email.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
                <button
                  type="button"
                  onClick={async () => {
                    await auditAuthApi.logout().catch(() => {})
                    setExistingAuditedUser(null)
                    setGoogleCredential(null)
                    setGoogleUser(null)
                    setEmail('')
                    setName('')
                    setCode('')
                    setLoading(false)
                    setGoogleLoading(false)
                    setError(null)
                    setStep('auth')
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    background: '#d44720',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(212, 71, 32, 0.25)',
                  }}
                >
                  <RotateCcw size={16} /> Sign in with a Different Account
                </button>

                {existingAuditedUser.domain && (
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess(existingAuditedUser)
                      onClose()
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 18px',
                      background: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileText size={15} /> View Saved Report for {existingAuditedUser.domain}
                  </button>
                )}

                <a
                  href="/contact"
                  onClick={onClose}
                  style={{
                    color: '#686a65',
                    fontSize: '0.8125rem',
                    textDecoration: 'underline',
                    marginTop: '4px',
                  }}
                >
                  Need periodic monitoring? Contact engineering team
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
