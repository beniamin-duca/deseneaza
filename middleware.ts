import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifyCookie } from '@/lib/admin-auth'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow the login page and login endpoint without auth.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'admin not configured' },
        { status: 503 },
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'not-configured')
    return NextResponse.redirect(url)
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value
  const ok = cookie ? await verifyCookie(cookie, secret) : false

  if (!ok) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
