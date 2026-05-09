import { NextResponse } from 'next/server'
import { getMergedStories } from '@/lib/story-overrides'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stories = await getMergedStories()
  return NextResponse.json(stories, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
