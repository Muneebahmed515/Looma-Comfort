import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Admin session cookie: a small HMAC-signed token (no database lookup needed to check the
 * signature). The admin layout and every server action still load the admin row, so access
 * removed or a password changed (session_version bump) takes effect on the next request.
 */
export const SESSION_COOKIE = 'looma_admin'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionPayload {
  /** admin_users.user_id */
  sub: string
  /** admin_users.session_version when the session was created */
  v: number
  /** True once the two-step code was entered (or when two-step sign in is off). */
  mfa: boolean
  /** Expiry, seconds since epoch */
  exp: number
}

function secret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.REVALIDATE_SECRET ?? ''
  if (s.length < 16) throw new Error('AUTH_SECRET is not configured (use a long random string).')
  return s
}

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url')

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url')
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>, maxAge = SESSION_MAX_AGE): string {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAge }))
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  let expected: string
  try {
    expected = sign(body)
  } catch {
    return null
  }
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
