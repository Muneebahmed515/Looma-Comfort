import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/auth/session'

const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot-password']

/**
 * Admin only: sends signed-out visitors to the login page. This is a convenience check on the
 * cookie signature; the admin layout and every server action verify the admin again.
 */
export async function proxy(request: NextRequest) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) return NextResponse.next() // demo mode: admin runs read-only

  const path = request.nextUrl.pathname
  const signedIn = Boolean(verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))

  if (path.startsWith('/admin') && !signedIn && !PUBLIC_ADMIN.some((p) => path.startsWith(p))) {
    const login = request.nextUrl.clone()
    login.pathname = '/admin/login'
    login.search = path === '/admin' ? '' : `?next=${encodeURIComponent(path)}`
    return NextResponse.redirect(login)
  }
  const response = NextResponse.next()
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
