import 'server-only'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY ?? ''

export async function clientIpHash(): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  // Hashed with a daily salt: enough to rate-limit, without storing raw IP addresses.
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}|${day}|${process.env.REVALIDATE_SECRET ?? 'looma'}`).digest('hex').slice(0, 32)
}

/** Cloudflare Turnstile check. Skipped when no secret is configured (local development). */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true
  if (!token) return false
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim()
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

/** Simple in-memory limiter per server instance (a backstop; the database check is the main one). */
const hits = new Map<string, number[]>()
export function memoryRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (list.length >= max) return false
  list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) hits.clear()
  return true
}
