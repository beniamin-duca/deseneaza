import { NextResponse } from 'next/server'
import { getMergedStory } from '@/lib/story-overrides'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const story = await getMergedStory(id)
  if (!story) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json(story, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
