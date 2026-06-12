import { NextResponse } from 'next/server'
import {
  isKvConfigured,
  validFirstName,
  validAge,
  validImage,
  checkRateLimit,
  submitDrawing,
} from '@/lib/gallery'

export const dynamic = 'force-dynamic'

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return (xff ? xff.split(',')[0] : '').trim() || 'unknown'
}

export async function POST(req: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: 'gallery not configured' }, { status: 503 })
  }
  let body: { image?: unknown; firstName?: unknown; age?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (!validFirstName(body.firstName) || !validAge(body.age) || !validImage(body.image)) {
    return NextResponse.json({ error: 'invalid submission' }, { status: 422 })
  }
  if (!(await checkRateLimit(clientIp(req)))) {
    return NextResponse.json({ error: 'too many submissions' }, { status: 429 })
  }
  await submitDrawing({ firstName: body.firstName, age: body.age, image: body.image })
  return NextResponse.json({ ok: true })
}
