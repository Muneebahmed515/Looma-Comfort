'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { changePassword } from '@/lib/admin/actions'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { adminInput } from './controls'

function PasswordCard() {
  const [password, setPassword] = useState('')
  const [pending, start] = useTransition()
  return (
    <form
      className="rounded-[2px] border border-line bg-surface p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await changePassword(password)
          if (res.ok) {
            toast.success(res.message ?? 'Updated')
            setPassword('')
          } else toast.error(res.message)
        })
      }}
    >
      <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Change password</h2>
      <p className="mt-1 text-[0.85rem] text-taupe">At least 10 characters. A short sentence is easy to remember and hard to guess.</p>
      <input type="password" autoComplete="new-password" className={`${adminInput} mt-4`} value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" />
      <button type="submit" disabled={pending || password.length < 10} className="btn btn-primary btn-sm mt-4">
        Update password
      </button>
    </form>
  )
}

type Factor = { id: string; friendly_name?: string; status: string }

async function fetchFactors(): Promise<Factor[]> {
  const { data } = await getSupabaseBrowser().auth.mfa.listFactors()
  return (data?.totp ?? []).map((f: Factor) => ({ id: f.id, friendly_name: f.friendly_name, status: f.status }))
}

function TwoFactorCard() {
  const [factors, setFactors] = useState<Factor[] | null>(null)
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => fetchFactors().then(setFactors)
  useEffect(() => {
    if (isSupabaseConfigured) void fetchFactors().then(setFactors)
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Two-step sign in</h2>
        <p className="mt-1 text-[0.85rem] text-taupe">Available once Supabase is connected.</p>
      </div>
    )
  }

  const verified = factors?.filter((f) => f.status === 'verified') ?? []

  return (
    <div className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Two-step sign in</h2>
      <p className="mt-1 text-[0.85rem] text-taupe">Adds a 6-digit code from an app like Google Authenticator when you sign in. Strongly recommended for the owner.</p>
      {verified.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[2px] bg-beige-soft px-4 py-3">
          <span className="text-[0.9rem] text-walnut">Two-step sign in is on.</span>
          <button
            type="button"
            className="text-[0.85rem] text-error"
            onClick={async () => {
              if (!window.confirm('Turn off two-step sign in?')) return
              const { error } = await getSupabaseBrowser().auth.mfa.unenroll({ factorId: verified[0]!.id })
              if (error) toast.error(error.message)
              else {
                toast.success('Two-step sign in turned off')
                void load()
              }
            }}
          >
            Turn off
          </button>
        </div>
      ) : enroll ? (
        <div className="mt-4 space-y-4">
          <p className="text-[0.88rem] text-walnut">1. Scan this code with your authenticator app.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="QR code for your authenticator app" className="size-44 rounded-[2px] border border-line bg-white p-2" />
          <p className="text-[0.78rem] break-all text-taupe">Or enter this key: {enroll.secret}</p>
          <p className="text-[0.88rem] text-walnut">2. Enter the 6-digit code it shows.</p>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${adminInput} tabular w-40 text-center tracking-[0.3em]`}
              aria-label="Code"
            />
            <button
              type="button"
              disabled={busy || code.length !== 6}
              className="btn btn-primary btn-sm"
              onClick={async () => {
                setBusy(true)
                const { error } = await getSupabaseBrowser().auth.mfa.challengeAndVerify({ factorId: enroll.id, code })
                setBusy(false)
                if (error) toast.error('That code did not work. Try again.')
                else {
                  toast.success('Two-step sign in is on')
                  setEnroll(null)
                  setCode('')
                  void load()
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-4"
          onClick={async () => {
            const supabase = getSupabaseBrowser()
            // Clear any half-finished setup first.
            for (const f of factors ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Looma admin ${Date.now()}` })
            if (error || !data) toast.error(error?.message ?? 'Could not start setup')
            else setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
          }}
        >
          Set up two-step sign in
        </button>
      )}
    </div>
  )
}

export function Account() {
  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <PasswordCard />
      <TwoFactorCard />
    </div>
  )
}
