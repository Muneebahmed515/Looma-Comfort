'use server'

import { cookies } from 'next/headers'
import { verifyPassword, verifyTotp } from '../auth/crypto'
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from '../auth/session'
import { query, queryOne } from '../db'
import { isDbConfigured } from '../env'
import { clientIpHash, memoryRateLimit } from '../server/spam'
import type { AdminRow } from './auth'

type SignInResult = { ok: true; mfa: boolean } | { ok: false; message: string }

async function setSession(row: Pick<AdminRow, 'user_id' | 'session_version'>, mfa: boolean, maxAge = SESSION_MAX_AGE) {
  ;(await cookies()).set(SESSION_COOKIE, createSessionToken({ sub: row.user_id, v: row.session_version, mfa }, maxAge), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  if (!isDbConfigured) return { ok: false, message: 'The database is not connected (demo mode).' }
  const clean = String(email ?? '').trim().toLowerCase()
  const ip = await clientIpHash()
  if (!memoryRateLimit(`login:${ip}`, 10, 15 * 60 * 1000) || !memoryRateLimit(`login:${clean}`, 8, 15 * 60 * 1000)) {
    return { ok: false, message: 'Too many attempts. Please wait 15 minutes and try again.' }
  }
  const row = await queryOne<AdminRow>(
    'select user_id, email, password_hash, totp_secret, session_version from public.admin_users where email = $1',
    [clean],
  )
  const valid = await verifyPassword(String(password ?? ''), row?.password_hash)
  if (!row || !valid) return { ok: false, message: 'That email and password do not match.' }
  if (row.totp_secret) {
    // Half-signed-in for 10 minutes: only good for entering the two-step code.
    await setSession(row, false, 10 * 60)
    return { ok: true, mfa: true }
  }
  await setSession(row, true)
  await query('update public.admin_users set last_sign_in_at = now() where user_id = $1', [row.user_id])
  return { ok: true, mfa: false }
}

export async function verifyTwoStepCode(code: string): Promise<{ ok: boolean; message?: string }> {
  if (!isDbConfigured) return { ok: false, message: 'The database is not connected (demo mode).' }
  const session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) return { ok: false, message: 'Your sign in expired. Please enter your password again.' }
  if (!memoryRateLimit(`mfa:${session.sub}`, 8, 10 * 60 * 1000)) return { ok: false, message: 'Too many attempts. Please wait a few minutes.' }
  const row = await queryOne<AdminRow>('select user_id, totp_secret, session_version from public.admin_users where user_id = $1', [session.sub])
  if (!row || row.session_version !== session.v) return { ok: false, message: 'Your sign in expired. Please enter your password again.' }
  if (row.totp_secret && !verifyTotp(row.totp_secret, code)) {
    return { ok: false, message: 'That code did not work. Check your authenticator app and try again.' }
  }
  await setSession(row, true)
  await query('update public.admin_users set last_sign_in_at = now() where user_id = $1', [row.user_id])
  return { ok: true }
}

/** True when the browser holds a password-checked session that still needs the two-step code. */
export async function pendingTwoStep(): Promise<boolean> {
  if (!isDbConfigured) return false
  const session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
  return Boolean(session && !session.mfa)
}
