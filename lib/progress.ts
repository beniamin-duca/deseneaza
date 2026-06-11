'use client'

import { openDB, type IDBPDatabase } from 'idb'
import { getStoryByOrder, getAllStories } from './stories'

export type StoryStatus = 'locked' | 'available' | 'in-progress' | 'done'

interface ProgressRecord {
  status: Exclude<StoryStatus, 'locked'>
  updatedAt: number
}

interface RizaSchema {
  progress: { key: string; value: ProgressRecord }
  canvases: { key: string; value: Blob }
}

const DB_NAME = 'riza'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<RizaSchema>> | null = null

function getDb() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('progress is browser-only'))
  }
  if (!dbPromise) {
    dbPromise = openDB<RizaSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress')
        }
        if (!db.objectStoreNames.contains('canvases')) {
          db.createObjectStore('canvases')
        }
      },
    })
  }
  return dbPromise
}

export async function getStatus(id: string): Promise<StoryStatus> {
  const story = getAllStories().find((s) => s.id === id)
  if (!story) return 'locked'

  const db = await getDb()
  const record = await db.get('progress', id)
  if (record) return record.status

  if (story.order === 1) return 'available'
  const prev = getStoryByOrder(story.order - 1)
  if (!prev) return 'available'
  const prevRecord = await db.get('progress', prev.id)
  if (prevRecord?.status === 'done') return 'available'
  return 'locked'
}

export async function loadAllStatuses(): Promise<Map<string, StoryStatus>> {
  const result = new Map<string, StoryStatus>()
  const stories = getAllStories()
  const db = await getDb()
  const records = new Map<string, ProgressRecord>()
  for (const story of stories) {
    const r = await db.get('progress', story.id)
    if (r) records.set(story.id, r)
  }
  for (const story of stories) {
    const explicit = records.get(story.id)
    if (explicit) {
      result.set(story.id, explicit.status)
      continue
    }
    if (story.order === 1) {
      result.set(story.id, 'available')
      continue
    }
    const prev = getStoryByOrder(story.order - 1)
    const prevExplicit = prev ? records.get(prev.id) : undefined
    result.set(
      story.id,
      prevExplicit?.status === 'done' ? 'available' : 'locked'
    )
  }
  return result
}

export async function setStatus(
  id: string,
  status: Exclude<StoryStatus, 'locked'>
): Promise<void> {
  const db = await getDb()
  await db.put('progress', { status, updatedAt: Date.now() }, id)
}

export async function markDone(id: string): Promise<void> {
  await setStatus(id, 'done')
  const story = getAllStories().find((s) => s.id === id)
  if (!story) return
  const next = getStoryByOrder(story.order + 1)
  if (!next) return
  const db = await getDb()
  const existing = await db.get('progress', next.id)
  if (!existing) {
    await setStatus(next.id, 'available')
  }
}

export async function saveCanvas(id: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('canvases', blob, id)
  const existing = await db.get('progress', id)
  if (!existing) {
    await setStatus(id, 'in-progress')
  }
}

export async function loadCanvas(id: string): Promise<Blob | null> {
  const db = await getDb()
  const blob = await db.get('canvases', id)
  return blob ?? null
}

// Free-draw drafts on /desen. Keyed per mode in the same 'canvases' store, but
// deliberately separate from saveCanvas: drafts must NOT touch story progress
// (saveCanvas sets 'in-progress'). Device-only, no server.
const DRAFT_KEY = (mode: string) => `draft-${mode}`

export async function saveDraft(mode: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('canvases', blob, DRAFT_KEY(mode))
}

export async function loadDraft(mode: string): Promise<Blob | null> {
  const db = await getDb()
  const blob = await db.get('canvases', DRAFT_KEY(mode))
  return blob ?? null
}

export async function clearDraft(mode: string): Promise<void> {
  const db = await getDb()
  await db.delete('canvases', DRAFT_KEY(mode))
}
