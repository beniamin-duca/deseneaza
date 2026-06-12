import { NextResponse } from 'next/server'
import { listPending, listApproved, approve, reject, remove } from '@/lib/gallery'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [pending, approved] = await Promise.all([listPending(), listApproved(50)])
  return NextResponse.json(
    { pending, approved },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: Request) {
  let body: { id?: unknown; action?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const id = typeof body.id === 'string' ? body.id : ''
  const action = body.action
  if (!id || (action !== 'approve' && action !== 'reject' && action !== 'remove')) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (action === 'approve') await approve(id)
  else if (action === 'reject') await reject(id)
  else await remove(id)
  return NextResponse.json({ ok: true })
}
