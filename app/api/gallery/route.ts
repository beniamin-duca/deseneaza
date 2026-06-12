import { NextResponse } from 'next/server'
import { getPublicFeed } from '@/lib/gallery'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await getPublicFeed(6)
  return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } })
}
