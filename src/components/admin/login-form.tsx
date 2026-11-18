'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { pendingTwoStep, signInWithPassword, verifyTwoStepCode } from '@/lib/admin/auth-actions'
import { isDbConfigured } from '@/lib/env'
import { adminInput } from './controls'

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'mfa'>('password')
  const [error, setError] = useState<string | null>(notice ?? null)
  const [busy, setBusy] = useState(false)

  const go = () => {
    router.replace(next.startsWith('/admin') ? next : '/admin')
    router.refresh()
  }

  // Password already checked but still needs the two-factor code (redirected here with ?mfa=1).
  useEffect(() => {
    if (!isDbConfigured) return
    void pendingTwoStep().then((pending) => pending && setStep('mfa'))
  }, [])

  if (!isDbConfigured) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-[0.92rem] text-taupe">
          The database is not connected yet, so the admin runs in <strong className="text-walnut">demo mode</strong>: you can explore every screen with sample data, but nothing is saved.
        </p>
        <Link href="/admin" className="btn btn-primary btn-block">
          Open the admin preview
        </Link>
      </div>
    )
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signInWithPassword(email, password).catch(() => ({ ok: false as const, message: 'Could not sign in. Please try again.' }))
    setBusy(false)
    if (!res.ok) return setError(res.message)
    if (res.mfa) return setStep('mfa')
    go()
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await verifyTwoStepCode(code.trim()).catch(() => ({ ok: false, message: 'Could not check the code. Please try again.' }))
    setBusy(false)
    if (!res.ok) {
      setError(res.message ?? 'That code did not work.')
      if (res.message?.includes('expired')) setStep('password')
    } else go()
  }

  if (step === 'mfa') {
    return (
      <form onSubmit={verify} className="space-y-5">
        <p className="text-[0.92rem] text-taupe">Enter the 6-digit code from your authenticator app.</p>
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className={`${adminInput} tabular text-center text-[1.4rem] tracking-[0.5em]`}
          aria-label="Authentication code"
        />
        {error && <p className="text-[0.85rem] text-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6} className="btn btn-primary btn-block">
          {busy ? 'Checking…' : 'Verify'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={signIn} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-[0.85rem] text-walnut">Email</span>
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex justify-between text-[0.85rem] text-walnut">
          Password
          <Link href="/admin/forgot-password" className="link-u text-taupe">
            Forgot password?
          </Link>
        </span>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={adminInput} />
      </label>
      {error && <p className="text-[0.85rem] text-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary btn-block">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
