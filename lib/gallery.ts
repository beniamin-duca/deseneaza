import { kv } from '@vercel/kv'
import { GALLERY_SEED } from '@/components/plaiu/gallery-data'

export interface GallerySubmission {
  id: string
  firstName: string
  age: number
  image: string // downscaled jpeg data URL
  status: 'pending' | 'approved'
  createdAt: number
  approvedAt?: number
}

/** Shape the homepage strip renders. Real items carry `image`; seed carries `art`. */
export interface FeedItem {
  id: string
  who: string
  image?: string
  art?: string
}

const ITEM_KEY = (id: string) => `gallery:item:${id}`
const PENDING_KEY = 'gallery:pending'
const APPROVED_KEY = 'gallery:approved'
const RL_KEY = (ip: string) => `gallery:rl:${ip}`

export function isKvConfigured(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
}

// ---------- validation (shared with the submit route) ----------
const NAME_RE = /^[\p{L} \-]{1,20}$/u
export function validFirstName(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length >= 1 && NAME_RE.test(v.trim())
}
export function validAge(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 14
}
export const MAX_IMAGE_CHARS = 400_000
export function validImage(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^data:image\/(jpeg|png);base64,/.test(v) &&
    v.length <= MAX_IMAGE_CHARS
  )
}

// ---------- rate limit ----------
const RL_MAX = 10
const RL_WINDOW_SECONDS = 60 * 60
/** True = allowed, false = over the per-IP hourly limit. Open (true) if KV down. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  if (!isKvConfigured()) return true
  try {
    const n = await kv.incr(RL_KEY(ip))
    if (n === 1) await kv.expire(RL_KEY(ip), RL_WINDOW_SECONDS)
    return n <= RL_MAX
  } catch {
    return true
  }
}

// ---------- mutations ----------
export async function submitDrawing(input: {
  firstName: string
  age: number
  image: string
}): Promise<string> {
  if (!isKvConfigured()) throw new Error('KV not configured')
  const id = crypto.randomUUID()
  const item: GallerySubmission = {
    id,
    firstName: input.firstName.trim(),
    age: input.age,
    image: input.image,
    status: 'pending',
    createdAt: Date.now(),
  }
  await kv.set(ITEM_KEY(id), item)
  await kv.lpush(PENDING_KEY, id)
  return id
}

async function getItems(ids: string[]): Promise<GallerySubmission[]> {
  if (ids.length === 0) return []
  const items = await kv.mget<(GallerySubmission | null)[]>(...ids.map(ITEM_KEY))
  return items.filter((x): x is GallerySubmission => !!x)
}

export async function listPending(): Promise<GallerySubmission[]> {
  if (!isKvConfigured()) return []
  try {
    return await getItems(await kv.lrange<string>(PENDING_KEY, 0, 99))
  } catch {
    return []
  }
}

export async function listApproved(limit = 50): Promise<GallerySubmission[]> {
  if (!isKvConfigured()) return []
  try {
    return await getItems(await kv.lrange<string>(APPROVED_KEY, 0, limit - 1))
  } catch {
    return []
  }
}

export async function approve(id: string): Promise<void> {
  if (!isKvConfigured()) throw new Error('KV not configured')
  const item = await kv.get<GallerySubmission>(ITEM_KEY(id))
  if (!item) return
  if (item.status === 'approved') return // idempotent: don't double-add to the list
  await kv.set(ITEM_KEY(id), { ...item, status: 'approved', approvedAt: Date.now() })
  await kv.lrem(PENDING_KEY, 0, id)
  await kv.lrem(APPROVED_KEY, 0, id) // defensive: ensure a single entry
  await kv.lpush(APPROVED_KEY, id)
}

export async function reject(id: string): Promise<void> {
  if (!isKvConfigured()) throw new Error('KV not configured')
  await kv.del(ITEM_KEY(id))
  await kv.lrem(PENDING_KEY, 0, id)
}

export async function remove(id: string): Promise<void> {
  if (!isKvConfigured()) throw new Error('KV not configured')
  await kv.del(ITEM_KEY(id))
  await kv.lrem(APPROVED_KEY, 0, id)
}

// ---------- public feed (approved, with seed fallback) ----------
export async function getPublicFeed(limit = 6): Promise<FeedItem[]> {
  const approved = await listApproved(limit)
  if (approved.length > 0) {
    return approved.map((it) => ({
      id: it.id,
      who: `${it.firstName}, ${it.age} ani`,
      image: it.image,
    }))
  }
  // No approved items yet (or KV unconfigured in dev) → show the curated seed
  // so the homepage strip is never empty.
  return GALLERY_SEED.slice(0, limit).map((s) => ({ id: s.id, who: s.who, art: s.art }))
}
