import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

/** Handles links from Supabase emails (password reset, invitations): exchanges the code for a session. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next') ?? '/admin'
  const next = nextParam.startsWith('/admin') ? nextParam : '/admin'
  if (code) {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/admin/login?error=link', url.origin))
}
