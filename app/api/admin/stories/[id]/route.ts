import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { STORIES } from '@/lib/stories'
import {
  deleteOverride,
  putOverride,
  type StoryOverride,
} from '@/lib/story-overrides'

export const dynamic = 'force-dynamic'

const EDITABLE_FIELDS = [
  'titleRo',
  'scriptureRef',
  'summary',
  'paragraphs',
  'accentColor',
  'templateSrc',
] as const

function pickEditable(input: unknown): StoryOverride {
  if (!input || typeof input !== 'object') return {}
  const obj = input as Record<string, unknown>
  const out: StoryOverride = {}
  for (const k of EDITABLE_FIELDS) {
    if (!(k in obj)) continue
    const v = obj[k]
    if (k === 'paragraphs') {
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        out.paragraphs = v as string[]
      }
    } else if (k === 'templateSrc') {
      if (v === null || typeof v === 'string') {
        out.templateSrc = v as string | null
      }
    } else {
      if (typeof v === 'string') (out as Record<string, unknown>)[k] = v
    }
  }
  return out
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!STORIES.find((s) => s.id === id)) {
    return NextResponse.json({ error: 'unknown story' }, { status: 404 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const override = pickEditable(raw)
  try {
    await putOverride(id, override)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'kv error' },
      { status: 503 },
    )
  }

  revalidatePath('/povesti')
  revalidatePath(`/povesti/${id}`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!STORIES.find((s) => s.id === id)) {
    return NextResponse.json({ error: 'unknown story' }, { status: 404 })
  }

  try {
    await deleteOverride(id)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'kv error' },
      { status: 503 },
    )
  }

  revalidatePath('/povesti')
  revalidatePath(`/povesti/${id}`)
  return NextResponse.json({ ok: true })
}
