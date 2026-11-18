'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { changePassword, confirmTwoStepSetup, disableTwoStep, startTwoStepSetup, twoStepStatus } from '@/lib/admin/actions'
import { isDbConfigured } from '@/lib/env'
import { adminInput } from './controls'

function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [pending, start] = useTransition()
  return (
    <form
      className="rounded-[2px] border border-line bg-surface p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await changePassword(password, current)
          if (res.ok) {
            toast.success(res.message ?? 'Updated')
            setPassword('')
            setCurrent('')
          } else toast.error(res.message)
        })
      }}
    >
      <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Change password</h2>
      <p className="mt-1 text-[0.85rem] text-taupe">At least 10 characters. A short sentence is easy to remember and hard to guess.</p>
      <input type="password" autoComplete="current-password" className={`${adminInput} mt-4`} value={current} onChange={(e) => setCurrent(e.target.value)} aria-label="Current password" placeholder="Current password" />
      <input type="password" autoComplete="new-password" className={`${adminInput} mt-3`} value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" placeholder="New password" />
      <button type="submit" disabled={pending || password.length < 10 || !current} className="btn btn-primary btn-sm mt-4">
        Update password
      </button>
    </form>
  )
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      className={`${adminInput} tabular w-40 text-center tracking-[0.3em]`}
      aria-label="Code"
    />
  )
}

function TwoFactorCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [enroll, setEnroll] = useState<{ qr: string; secret: string } | null>(null)
  const [turningOff, setTurningOff] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => twoStepStatus().then((res) => setEnabled(res.ok ? Boolean(res.data?.enabled) : false))
  useEffect(() => {
    if (isDbConfigured) void load()
  }, [])

  if (!isDbConfigured) {
    return (
      <div className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Two-step sign in</h2>
        <p className="mt-1 text-[0.85rem] text-taupe">Available once the database is connected.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Two-step sign in</h2>
      <p className="mt-1 text-[0.85rem] text-taupe">Adds a 6-digit code from an app like Google Authenticator when you sign in. Strongly recommended for the owner.</p>
      {enabled ? (
        turningOff ? (
          <div className="mt-4 space-y-3">
            <p className="text-[0.88rem] text-walnut">Enter a current code from your app to turn it off.</p>
            <div className="flex gap-2">
              <CodeInput value={code} onChange={setCode} />
              <button
                type="button"
                disabled={busy || code.length !== 6}
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  setBusy(true)
                  const res = await disableTwoStep(code)
                  setBusy(false)
                  if (!res.ok) return toast.error(res.message)
                  toast.success(res.message ?? 'Turned off')
                  setTurningOff(false)
                  setCode('')
                  void load()
                }}
              >
                Turn off
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-[2px] bg-beige-soft px-4 py-3">
            <span className="text-[0.9rem] text-walnut">Two-step sign in is on.</span>
            <button type="button" className="text-[0.85rem] text-error" onClick={() => setTurningOff(true)}>
              Turn off
            </button>
          </div>
        )
      ) : enroll ? (
        <div className="mt-4 space-y-4">
          <p className="text-[0.88rem] text-walnut">1. Scan this code with your authenticator app.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="QR code for your authenticator app" className="size-44 rounded-[2px] border border-line bg-white p-2" />
          <p className="text-[0.78rem] break-all text-taupe">Or enter this key: {enroll.secret}</p>
          <p className="text-[0.88rem] text-walnut">2. Enter the 6-digit code it shows.</p>
          <div className="flex gap-2">
            <CodeInput value={code} onChange={setCode} />
            <button
              type="button"
              disabled={busy || code.length !== 6}
              className="btn btn-primary btn-sm"
              onClick={async () => {
                setBusy(true)
                const res = await confirmTwoStepSetup(code)
                setBusy(false)
                if (!res.ok) return toast.error(res.message)
                toast.success('Two-step sign in is on')
                setEnroll(null)
                setCode('')
                void load()
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={enabled === null}
          className="btn btn-secondary btn-sm mt-4"
          onClick={async () => {
            const res = await startTwoStepSetup()
            if (!res.ok || !res.data) toast.error(res.ok ? 'Could not start setup' : res.message)
            else setEnroll(res.data)
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
