'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { adminInput } from './controls'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-taupe">If that email belongs to an admin, a reset link is on its way. Check your inbox (and spam folder).</p>
        <Link href="/admin/login" className="btn btn-secondary">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!isSupabaseConfigured) return setError('Supabase is not connected (demo mode).')
        setBusy(true)
        const { error: err } = await getSupabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
        })
        setBusy(false)
        if (err) setError(err.message)
        else setSent(true)
      }}
    >
      <p className="text-[0.9rem] text-taupe">Enter your admin email and we will send you a link to choose a new password.</p>
      <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} aria-label="Email" placeholder="you@example.com" />
      {error && <p className="text-[0.85rem] text-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary btn-block">
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
      <Link href="/admin/login" className="link-u block text-center text-[0.85rem] text-taupe">
        Back to sign in
      </Link>
    </form>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (password.length < 10) return setError('Use at least 10 characters.')
        if (password !== confirm) return setError('The passwords do not match.')
        setBusy(true)
        const supabase = getSupabaseBrowser()
        const { error: err } = await supabase.auth.updateUser({ password })
        setBusy(false)
        if (err) return setError(err.message.includes('session') ? 'This link has expired. Request a new one.' : err.message)
        router.replace('/admin')
        router.refresh()
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[0.85rem] text-walnut">New password</span>
        <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={adminInput} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.85rem] text-walnut">Confirm password</span>
        <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={adminInput} />
      </label>
      {error && <p className="text-[0.85rem] text-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary btn-block">
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  )
}
