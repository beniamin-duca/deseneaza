import { kv } from '@vercel/kv'
import { STORIES, type Story } from './stories'

export interface StoryOverride {
  titleRo?: string
  scriptureRef?: string
  summary?: string
  paragraphs?: string[]
  accentColor?: string
  templateSrc?: string | null
  updatedAt?: number
}

const OVERRIDE_KEY = (id: string) => `stories:override:${id}`

function isKvConfigured(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
}

export async function getOverride(id: string): Promise<StoryOverride | null> {
  if (!isKvConfigured()) return null
  try {
    return (await kv.get<StoryOverride>(OVERRIDE_KEY(id))) ?? null
  } catch {
    return null
  }
}

export async function getAllOverrides(): Promise<Map<string, StoryOverride>> {
  const result = new Map<string, StoryOverride>()
  if (!isKvConfigured()) return result
  try {
    const keys = STORIES.map((s) => OVERRIDE_KEY(s.id))
    const values = await kv.mget<(StoryOverride | null)[]>(...keys)
    STORIES.forEach((s, i) => {
      const v = values[i]
      if (v) result.set(s.id, v)
    })
  } catch {
    // swallow; return empty map → public site uses seed only
  }
  return result
}

export async function putOverride(
  id: string,
  override: StoryOverride,
): Promise<void> {
  if (!isKvConfigured()) {
    throw new Error('KV not configured')
  }
  await kv.set(OVERRIDE_KEY(id), {
    ...override,
    updatedAt: Date.now(),
  })
}

export async function deleteOverride(id: string): Promise<void> {
  if (!isKvConfigured()) {
    throw new Error('KV not configured')
  }
  await kv.del(OVERRIDE_KEY(id))
}

export function mergeStory(seed: Story, override: StoryOverride | null): Story {
  if (!override) return seed
  return {
    ...seed,
    titleRo: override.titleRo ?? seed.titleRo,
    scriptureRef: override.scriptureRef ?? seed.scriptureRef,
    summary: override.summary ?? seed.summary,
    paragraphs: override.paragraphs ?? seed.paragraphs,
    accentColor: override.accentColor ?? seed.accentColor,
    templateSrc:
      override.templateSrc !== undefined ? override.templateSrc : seed.templateSrc,
  }
}

export async function getMergedStories(): Promise<Story[]> {
  const overrides = await getAllOverrides()
  return STORIES.map((s) => mergeStory(s, overrides.get(s.id) ?? null)).sort(
    (a, b) => a.order - b.order,
  )
}

export async function getMergedStory(id: string): Promise<Story | null> {
  const seed = STORIES.find((s) => s.id === id)
  if (!seed) return null
  const override = await getOverride(id)
  return mergeStory(seed, override)
}
