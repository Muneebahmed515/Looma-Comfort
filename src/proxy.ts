import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

/**
 * Admin only: refreshes the Supabase session cookie and sends signed-out visitors to the
 * login page. This is a convenience check; the admin layout, every server action and
 * Row Level Security each verify access again.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next() // demo mode: admin runs read-only without Supabase

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') && !signedIn && !PUBLIC_ADMIN.some((p) => path.startsWith(p))) {
    const login = request.nextUrl.clone()
    login.pathname = '/admin/login'
    login.search = path === '/admin' ? '' : `?next=${encodeURIComponent(path)}`
    return NextResponse.redirect(login)
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
