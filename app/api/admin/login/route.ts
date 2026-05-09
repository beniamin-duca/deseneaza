import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE_SECONDS,
  constantTimeEqual,
  signCookie,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SECRET
  if (!password || !secret) {
    return NextResponse.json(
      { error: 'admin not configured' },
      { status: 503 },
    )
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.password || !constantTimeEqual(body.password, password)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const value = await signCookie(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_MAX_AGE_SECONDS,
  })
  return res
}
