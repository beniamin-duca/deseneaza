# Povesti din Biblie — Admin Surface (Plan 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A password-gated `/admin/povesti` surface that lets the owner edit any of the 50 stories' editable fields (titleRo, scriptureRef, summary, paragraphs, accentColor, templateSrc) without redeploying. Edits persist in Vercel KV; `lib/stories.ts` remains the seed.

**Architecture:** Public pages keep their seed-first render and asynchronously swap in a merged version fetched from a public `/api/stories` endpoint that combines the seed with KV overrides. Admin pages live under `/admin`, gated by an HMAC-signed cookie (`riza_admin`) issued after a single shared password check (`ADMIN_PASSWORD`). Vercel KV stores per-story overrides at key `stories:override:<id>`. Library gracefully degrades when KV env vars are missing — the public site falls back to seed only. No new framework, no new auth provider.

**Tech Stack:** Next.js 16 (App Router middleware + route handlers), Web Crypto API (HMAC-SHA-256 cookie signing — works in Edge runtime), `@vercel/kv` (1 KB client over Upstash Redis), existing Radix `AlertDialog`.

**Spec:** `docs/superpowers/specs/2026-05-09-bible-stories-design.md` (the "Admin" section).

**Prerequisites for the operator (one-time setup, not a coding task):**
1. In Vercel dashboard → project → Storage → create a KV (Upstash Redis) database and connect it. Vercel auto-injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_URL`.
2. Add two env vars to Vercel project settings:
   - `ADMIN_PASSWORD` — strong, ≥ 16 chars
   - `ADMIN_SECRET` — random 64+ hex chars (`openssl rand -hex 32`)
3. For local dev: `vercel env pull .env.local` after the integration is attached.

**Out of scope:** image uploads, multi-user accounts, audit log, adding/removing/reordering stories.

**Testing note:** No automated test runner. Verify per-task with `pnpm exec tsc --noEmit` and a manual smoke check (curl for API tasks, browser for pages). The final task includes the full DevTools walk plus the local-network recipe.

---

## File map

**New files:**
- `lib/admin-auth.ts` — HMAC sign/verify helpers (Web Crypto). Cookie name + max age constants.
- `lib/story-overrides.ts` — KV read/write + merge into seed. Graceful no-KV fallback.
- `lib/use-stories.ts` — client hooks `useStory(id)` and `useAllStories()` that render seed first then swap in merged.
- `middleware.ts` — guards `/admin/*` and `/api/admin/*` (except login).
- `app/api/stories/route.ts` — public GET, returns merged-with-overrides array.
- `app/api/stories/[id]/route.ts` — public GET, single merged story.
- `app/api/admin/login/route.ts` — POST password check, sets cookie.
- `app/api/admin/logout/route.ts` — POST clears cookie.
- `app/api/admin/stories/[id]/route.ts` — PUT writes override; DELETE removes it.
- `app/admin/login/page.tsx` — password form.
- `app/admin/povesti/page.tsx` — table of all 50 stories with override badge + edit links + logout.
- `app/admin/povesti/[id]/page.tsx` — edit form for one story (titleRo, scriptureRef, summary, paragraphs, accentColor, templateSrc) + Save / Reset to default / Cancel.
- `docs/admin.md` — operator setup notes (env vars, KV integration, password rotation).

**Modified files:**
- `app/povesti/page.tsx` — read stories via `useAllStories()`.
- `app/povesti/[storyId]/page.tsx` — read story via `useStory(id)`.
- `package.json` — add `@vercel/kv`.

---

## Task 1: Install `@vercel/kv`

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

Run: `pnpm add @vercel/kv`
Expected: package added to `dependencies`, lockfile updated.

- [ ] **Step 2: Verify**

Run: `pnpm list @vercel/kv`
Expected: prints `@vercel/kv 3.x.x` (or current).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add @vercel/kv for admin override storage"
```

---

## Task 2: `lib/admin-auth.ts` — HMAC cookie helpers

**Files:** Create `lib/admin-auth.ts`.

- [ ] **Step 1: Create the file**

```ts
// HMAC-SHA-256 signed cookie for admin auth. Web Crypto so it works
// in both the Edge middleware and Node route handlers.

export const ADMIN_COOKIE = 'riza_admin'
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

interface CookiePayload {
  exp: number // ms epoch
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? 0 : 4 - (padded.length % 4)
  const full = padded + '='.repeat(padding)
  const bin = atob(full)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signCookie(secret: string): Promise<string> {
  const payload: CookiePayload = {
    exp: Date.now() + ADMIN_MAX_AGE_SECONDS * 1000,
  }
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const sigB64 = b64urlEncode(new Uint8Array(sig))
  return `${payloadB64}.${sigB64}`
}

export async function verifyCookie(
  cookieValue: string,
  secret: string,
): Promise<boolean> {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  try {
    const key = await getKey(secret)
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      new TextEncoder().encode(payloadB64),
    )
    if (!ok) return false
    const payload: CookiePayload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64)),
    )
    if (typeof payload.exp !== 'number') return false
    return payload.exp > Date.now()
  } catch {
    return false
  }
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/admin-auth.ts
git commit -m "Admin auth: HMAC-signed cookie helpers via Web Crypto"
```

---

## Task 3: `lib/story-overrides.ts` — KV reads/writes + merge

**Files:** Create `lib/story-overrides.ts`.

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/story-overrides.ts
git commit -m "KV story overrides + seed merge with no-KV fallback"
```

---

## Task 4: `middleware.ts` — guard admin routes

**Files:** Create `middleware.ts` at project root.

- [ ] **Step 1: Create the file**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifyCookie } from '@/lib/admin-auth'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow the login page and login endpoint without auth.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'admin not configured' },
        { status: 503 },
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'not-configured')
    return NextResponse.redirect(url)
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value
  const ok = cookie ? await verifyCookie(cookie, secret) : false

  if (!ok) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "Middleware: guard /admin and /api/admin via signed cookie"
```

---

## Task 5: Public `GET /api/stories`

**Files:** Create `app/api/stories/route.ts`.

- [ ] **Step 1: Create the file**

```ts
import { NextResponse } from 'next/server'
import { getMergedStories } from '@/lib/story-overrides'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stories = await getMergedStories()
  return NextResponse.json(stories, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Run `pnpm dev`. In another terminal: `curl http://localhost:3000/api/stories | jq 'length'`
Expected: `50`. Without KV configured, response is the seed.

- [ ] **Step 4: Commit**

```bash
git add app/api/stories/route.ts
git commit -m "Public GET /api/stories returns seed merged with KV overrides"
```

---

## Task 6: Public `GET /api/stories/[id]`

**Files:** Create `app/api/stories/[id]/route.ts`.

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

`curl http://localhost:3000/api/stories/creatie | jq '.titleRo'`
Expected: `"Creatia lumii"`.

`curl -i http://localhost:3000/api/stories/nope`
Expected: `HTTP/... 404`.

- [ ] **Step 4: Commit**

```bash
git add 'app/api/stories/[id]/route.ts'
git commit -m "Public GET /api/stories/[id] returns merged story or 404"
```

---

## Task 7: `lib/use-stories.ts` — client hooks

**Files:** Create `lib/use-stories.ts`.

- [ ] **Step 1: Create the file**

```ts
'use client'

import { useEffect, useState } from 'react'
import {
  getAllStories,
  getStoryById,
  type Story,
} from './stories'

// Render the seed immediately so the UI never waits, then swap in
// the merged version if the API returns something different.
export function useAllStories(): Story[] {
  const [stories, setStories] = useState<Story[]>(() => getAllStories())

  useEffect(() => {
    let cancelled = false
    fetch('/api/stories')
      .then((r) => (r.ok ? (r.json() as Promise<Story[]>) : null))
      .then((merged) => {
        if (!cancelled && merged && Array.isArray(merged) && merged.length > 0) {
          setStories(merged)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return stories
}

export function useStory(id: string | undefined): Story | undefined {
  const [story, setStory] = useState<Story | undefined>(() =>
    id ? getStoryById(id) : undefined,
  )

  useEffect(() => {
    if (!id) {
      setStory(undefined)
      return
    }
    setStory(getStoryById(id))
    let cancelled = false
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Story>) : null))
      .then((merged) => {
        if (!cancelled && merged) setStory(merged)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  return story
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/use-stories.ts
git commit -m "Client hooks: render seed first, swap in merged from API"
```

---

## Task 8: Wire public landing to `useAllStories`

**Files:** Modify `app/povesti/page.tsx`.

- [ ] **Step 1: Replace the import + hook usage**

Find:

```ts
import { getAllStories, type Story } from '@/lib/stories'
```

Replace with:

```ts
import { type Story } from '@/lib/stories'
import { useAllStories } from '@/lib/use-stories'
```

Find:

```ts
const stories = useMemo(() => getAllStories(), [])
```

Replace with:

```ts
const stories = useAllStories()
```

Drop the now-unused `useMemo` from the React import if you want — leaving it imported is harmless.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Visit `/povesti`. Page renders normally with seed content. In Network tab, observe `GET /api/stories 200` is fired on mount.

- [ ] **Step 4: Commit**

```bash
git add app/povesti/page.tsx
git commit -m "Landing fetches merged stories via useAllStories"
```

---

## Task 9: Wire story detail to `useStory`

**Files:** Modify `app/povesti/[storyId]/page.tsx`.

- [ ] **Step 1: Replace import + usage**

Find:

```ts
import { getStoryById, type Story } from '@/lib/stories'
```

Replace with:

```ts
import { type Story } from '@/lib/stories'
import { useStory } from '@/lib/use-stories'
```

Find:

```ts
const story = getStoryById(params.storyId)
```

Replace with:

```ts
const story = useStory(params.storyId)
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Visit `/povesti/creatie`. Splash renders normally with seed content. In Network tab observe `GET /api/stories/creatie 200`.

- [ ] **Step 4: Commit**

```bash
git add 'app/povesti/[storyId]/page.tsx'
git commit -m "Story detail fetches merged story via useStory"
```

---

## Task 10: `POST /api/admin/login`

**Files:** Create `app/api/admin/login/route.ts`.

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

In `.env.local`, set:
```
ADMIN_PASSWORD=test1234567890ab
ADMIN_SECRET=$(openssl rand -hex 32)
```
Restart `pnpm dev`. Then:

```bash
curl -i -X POST http://localhost:3000/api/admin/login \
  -H 'content-type: application/json' \
  -d '{"password":"wrong"}'
```
Expected: `401`.

```bash
curl -i -X POST http://localhost:3000/api/admin/login \
  -H 'content-type: application/json' \
  -d '{"password":"test1234567890ab"}'
```
Expected: `200` with `Set-Cookie: riza_admin=...; HttpOnly; SameSite=Lax`.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/login/route.ts
git commit -m "POST /api/admin/login: password check + signed cookie"
```

---

## Task 11: `POST /api/admin/logout`

**Files:** Create `app/api/admin/logout/route.ts`.

- [ ] **Step 1: Create the file**

```ts
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

```bash
curl -i -X POST http://localhost:3000/api/admin/logout
```
Expected: `200` with `Set-Cookie: riza_admin=; ... Max-Age=0`.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/logout/route.ts
git commit -m "POST /api/admin/logout: clear cookie"
```

---

## Task 12: `PUT` + `DELETE /api/admin/stories/[id]`

**Files:** Create `app/api/admin/stories/[id]/route.ts`.

- [ ] **Step 1: Create the file**

```ts
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
type EditableField = (typeof EDITABLE_FIELDS)[number]

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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test (KV not yet configured locally)**

```bash
curl -i -X PUT http://localhost:3000/api/admin/stories/creatie \
  -H 'content-type: application/json' \
  -b 'riza_admin=invalid' \
  -d '{"titleRo":"Test"}'
```
Expected: `401` (middleware blocks it).

- [ ] **Step 4: Commit**

```bash
git add 'app/api/admin/stories/[id]/route.ts'
git commit -m "Admin PUT/DELETE /api/admin/stories/[id] with KV"
```

---

## Task 13: `app/admin/login/page.tsx`

**Files:** Create `app/admin/login/page.tsx`.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/povesti'
  const configError = params.get('error') === 'not-configured'

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.replace(next)
        return
      }
      if (res.status === 503) {
        setError('Admin nu este configurat. Verifica ADMIN_PASSWORD si ADMIN_SECRET.')
      } else {
        setError('Parola gresita.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-lg p-6 flex flex-col gap-4"
      >
        <header>
          <h1 className="text-xl font-semibold">Admin Riza</h1>
          <p className="text-sm text-muted-foreground">
            Editare povesti din Biblie.
          </p>
        </header>

        {configError && (
          <p className="text-sm text-destructive">
            Variabilele de mediu nu sunt setate inca.
          </p>
        )}

        <label className="text-sm font-medium">
          Parola
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !password}
          className="h-10 rounded-md bg-foreground text-background font-medium disabled:opacity-50"
        >
          {submitting ? 'Se verifica...' : 'Intra'}
        </button>
      </form>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Visit `/admin/login`. Submit wrong password → "Parola gresita." Submit correct password → redirects to `/admin/povesti` (still 404 in this task; next task creates it).

- [ ] **Step 4: Commit**

```bash
git add app/admin/login/page.tsx
git commit -m "Admin login page with password form"
```

---

## Task 14: `app/admin/povesti/page.tsx` — story list

**Files:** Create `app/admin/povesti/page.tsx`.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllStories, type Story, type Testament } from '@/lib/stories'

interface RowState {
  story: Story
  merged: Story
  isOverridden: boolean
}

export default function AdminPovestiPage() {
  const router = useRouter()
  const seedStories = useMemo(() => getAllStories(), [])

  const [rows, setRows] = useState<RowState[]>(() =>
    seedStories.map((s) => ({ story: s, merged: s, isOverridden: false })),
  )
  const [testament, setTestament] = useState<'all' | Testament>('all')
  const [overriddenOnly, setOverriddenOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stories')
      .then((r) => (r.ok ? (r.json() as Promise<Story[]>) : null))
      .then((merged) => {
        if (!merged || cancelled) return
        const byId = new Map(merged.map((s) => [s.id, s]))
        setRows(
          seedStories.map((s) => {
            const m = byId.get(s.id) ?? s
            const isOverridden =
              m.titleRo !== s.titleRo ||
              m.scriptureRef !== s.scriptureRef ||
              m.summary !== s.summary ||
              m.accentColor !== s.accentColor ||
              m.templateSrc !== s.templateSrc ||
              JSON.stringify(m.paragraphs) !== JSON.stringify(s.paragraphs)
            return { story: s, merged: m, isOverridden }
          }),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [seedStories])

  const filtered = rows.filter((r) => {
    if (testament !== 'all' && r.story.testament !== testament) return false
    if (overriddenOnly && !r.isOverridden) return false
    return true
  })

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Povesti din Biblie</h1>
            <span className="text-sm text-muted-foreground">
              {rows.length} povesti
            </span>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Iesi
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 pb-4">
          <select
            value={testament}
            onChange={(e) => setTestament(e.target.value as 'all' | Testament)}
            className="h-9 px-2 rounded-md border border-border bg-white text-sm"
          >
            <option value="all">Toate testamentele</option>
            <option value="vechi">Vechi</option>
            <option value="nou">Nou</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overriddenOnly}
              onChange={(e) => setOverriddenOnly(e.target.checked)}
            />
            Doar editate
          </label>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Titlu</th>
                <th className="px-3 py-2 text-left font-medium">Scriptura</th>
                <th className="px-3 py-2 text-left font-medium w-28">Status</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.story.id} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.story.order}
                  </td>
                  <td className="px-3 py-2">{r.merged.titleRo}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.merged.scriptureRef}
                  </td>
                  <td className="px-3 py-2">
                    {r.isOverridden ? (
                      <span className="text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 text-xs">
                        Editat
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Implicit</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/povesti/${r.story.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editeaza
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

After logging in, visit `/admin/povesti`. Confirm the 50-row table renders with status "Implicit" everywhere (no overrides yet). Test the testament + "doar editate" filters.

- [ ] **Step 4: Commit**

```bash
git add app/admin/povesti/page.tsx
git commit -m "Admin: stories list with override badge + filters"
```

---

## Task 15: `app/admin/povesti/[id]/page.tsx` — edit form

**Files:** Create `app/admin/povesti/[id]/page.tsx`.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getStoryById, type Story } from '@/lib/stories'

interface FormState {
  titleRo: string
  scriptureRef: string
  summary: string
  paragraphs: string[]
  accentColor: string
  templateSrc: string
}

function fromStory(s: Story): FormState {
  return {
    titleRo: s.titleRo,
    scriptureRef: s.scriptureRef,
    summary: s.summary,
    paragraphs: [...s.paragraphs],
    accentColor: s.accentColor,
    templateSrc: s.templateSrc ?? '',
  }
}

function diffFromSeed(seed: Story, form: FormState): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (form.titleRo !== seed.titleRo) out.titleRo = form.titleRo
  if (form.scriptureRef !== seed.scriptureRef) out.scriptureRef = form.scriptureRef
  if (form.summary !== seed.summary) out.summary = form.summary
  if (JSON.stringify(form.paragraphs) !== JSON.stringify(seed.paragraphs)) {
    out.paragraphs = form.paragraphs
  }
  if (form.accentColor !== seed.accentColor) out.accentColor = form.accentColor
  const seedTpl = seed.templateSrc ?? ''
  if (form.templateSrc !== seedTpl) {
    out.templateSrc = form.templateSrc === '' ? null : form.templateSrc
  }
  return out
}

export default function AdminStoryEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const seed = useMemo(() => getStoryById(params.id), [params.id])

  const [form, setForm] = useState<FormState | null>(seed ? fromStory(seed) : null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [isResetting, startResetting] = useTransition()

  useEffect(() => {
    if (!params.id) return
    let cancelled = false
    fetch(`/api/stories/${params.id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Story>) : null))
      .then((merged) => {
        if (cancelled || !merged) return
        setForm(fromStory(merged))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (!seed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Povestea nu exista.</p>
      </main>
    )
  }
  if (!form) return null

  const diff = diffFromSeed(seed, form)
  const isOverridden = Object.keys(diff).length > 0

  const onSave = () => {
    setError(null)
    startSaving(async () => {
      const res = await fetch(`/api/admin/stories/${seed.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(diff),
      })
      if (res.ok) {
        setSavedAt(Date.now())
      } else if (res.status === 401) {
        router.replace('/admin/login')
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Eroare la salvare.')
      }
    })
  }

  const onReset = () => {
    setError(null)
    startResetting(async () => {
      const res = await fetch(`/api/admin/stories/${seed.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setForm(fromStory(seed))
        setShowResetConfirm(false)
        setSavedAt(Date.now())
      } else if (res.status === 401) {
        router.replace('/admin/login')
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Eroare la stergere.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-12">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/povesti"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Povesti
            </Link>
            <h1 className="text-lg font-semibold truncate">
              #{seed.order} {seed.titleRo}
            </h1>
          </div>
          {isOverridden && (
            <span className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-0.5">
              {Object.keys(diff).length} modificari
            </span>
          )}
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-border p-5 space-y-5">
          <Field label="Titlu" diffMark={'titleRo' in diff}>
            <input
              type="text"
              value={form.titleRo}
              onChange={(e) => setForm({ ...form, titleRo: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Referinta scripturistica" diffMark={'scriptureRef' in diff}>
            <input
              type="text"
              value={form.scriptureRef}
              onChange={(e) =>
                setForm({ ...form, scriptureRef: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Rezumat (o linie)" diffMark={'summary' in diff}>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Culoare accent" diffMark={'accentColor' in diff}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) =>
                  setForm({ ...form, accentColor: e.target.value })
                }
                className="h-10 w-14 rounded-md border border-border"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) =>
                  setForm({ ...form, accentColor: e.target.value })
                }
                className="flex-1 h-10 px-3 rounded-md border border-border bg-white font-mono text-sm"
              />
            </div>
          </Field>

          <Field label="URL sablon (optional)" diffMark={'templateSrc' in diff}>
            <input
              type="text"
              value={form.templateSrc}
              onChange={(e) =>
                setForm({ ...form, templateSrc: e.target.value })
              }
              placeholder="/templates/creatie.jpg"
              className="w-full h-10 px-3 rounded-md border border-border bg-white font-mono text-sm"
            />
          </Field>

          <Field label="Paragrafe" diffMark={'paragraphs' in diff}>
            <div className="space-y-2">
              {form.paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    value={p}
                    onChange={(e) => {
                      const next = [...form.paragraphs]
                      next[i] = e.target.value
                      setForm({ ...form, paragraphs: next })
                    }}
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.paragraphs.filter((_, j) => j !== i)
                      setForm({ ...form, paragraphs: next })
                    }}
                    className="h-9 px-2 text-sm text-destructive hover:underline"
                  >
                    Sterge
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, paragraphs: [...form.paragraphs, ''] })
                }
                className="text-sm text-blue-600 hover:underline"
              >
                + Adauga paragraf
              </button>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={!isOverridden || isResetting}
            className="text-sm text-destructive disabled:text-muted-foreground/60 disabled:cursor-not-allowed hover:underline"
          >
            {isResetting ? 'Se sterge...' : 'Reseteaza la valoarea implicita'}
          </button>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="text-xs text-muted-foreground">Salvat</span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!isOverridden || isSaving}
              className="h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </section>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stergi modificarile?</AlertDialogTitle>
            <AlertDialogDescription>
              Povestea revine la valoarea din cod. Aceasta actiune nu poate fi
              anulata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuleaza</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Sterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

function Field({
  label,
  children,
  diffMark,
}: {
  label: string
  children: React.ReactNode
  diffMark?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        {diffMark && (
          <span className="text-[10px] uppercase tracking-wide text-amber-700">
            modificat
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

After login, visit `/admin/povesti/creatie`. Confirm:
- All editable fields prefilled with seed values.
- Editing a field shows the "modificat" badge next to it.
- "Salveaza" button is disabled until something differs from seed.
- Save sends the diff. With KV configured, response is 200; without KV, expect 503 with a clear error message.
- "Reseteaza la valoarea implicita" disabled when no override exists.

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/povesti/[id]/page.tsx'
git commit -m "Admin edit form with per-field diff + Reset to default"
```

---

## Task 16: `docs/admin.md`

**Files:** Create `docs/admin.md`.

- [ ] **Step 1: Create the file**

```markdown
# Admin Riza — operator notes

The admin lives at `/admin/povesti`. It lets the owner edit any of the
50 baked-in story texts (title, scripture ref, summary, paragraphs,
accent color, template URL) without redeploying. Edits persist in
Vercel KV.

## One-time setup

1. **Vercel KV**
   - Vercel dashboard → project → Storage → Create database → KV (Upstash Redis).
   - Connect it to the project. Vercel auto-injects `KV_REST_API_URL`,
     `KV_REST_API_TOKEN`, `KV_URL` into the project's environment.

2. **Admin secrets**
   - Project Settings → Environment Variables → add:
     - `ADMIN_PASSWORD` — strong password, ≥ 16 characters.
     - `ADMIN_SECRET` — generated via `openssl rand -hex 32`.
   - Apply to all environments (Production, Preview, Development).

3. **Local development**
   - After the KV integration is connected, run:
     ```
     vercel env pull .env.local
     ```
   - This pulls every env var (KV creds + ADMIN_*) into `.env.local`.
   - Restart `pnpm dev`.

If `ADMIN_PASSWORD` / `ADMIN_SECRET` are unset, the admin login page
shows "Admin nu este configurat". If KV creds are missing, the public
site still works on the seed values; admin save returns a 503.

## Day-to-day usage

- Visit `/admin/login`, enter the password.
- Cookie lasts 7 days. Click **Iesi** to log out earlier.
- The list at `/admin/povesti` shows all 50 stories with an "Editat"
  badge for ones with overrides.
- Open a story → edit any field → **Salveaza** → public pages fetch
  the new merged version on next visit.
- **Reseteaza la valoarea implicita** removes the override for that
  story; the public site falls back to the seed in `lib/stories.ts`.

## Rotating the password

Change `ADMIN_PASSWORD` in Vercel env vars and redeploy. Existing
admin sessions remain valid until they expire (7 days) — to invalidate
them immediately, also change `ADMIN_SECRET`.

## Things the admin cannot do

- Add, remove, or reorder stories. Structure (id, order, testament)
  is code-controlled.
- Upload images. `templateSrc` accepts a URL or path; uploading
  arbitrary files would need Vercel Blob and stricter security.
- Manage multiple admins. v1 is single shared password.
```

- [ ] **Step 2: Commit**

```bash
git add docs/admin.md
git commit -m "Document admin operator setup + day-to-day usage"
```

---

## Task 17: Final verification

**Files:** none modified.

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: routes include `/admin/login`, `/admin/povesti`, `/admin/povesti/[id]`, `/api/stories`, `/api/stories/[id]`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/stories/[id]`. Middleware compiled.

- [ ] **Step 3: Local end-to-end (without KV configured)**

In `.env.local`:
```
ADMIN_PASSWORD=test1234567890ab
ADMIN_SECRET=<openssl rand -hex 32>
```

Restart `pnpm dev`. Walk through:

- `GET /api/stories` returns 50 seed stories.
- `/povesti` and `/povesti/creatie` render normally.
- Visit `/admin/povesti` without auth → redirects to `/admin/login`.
- Wrong password → 401 + "Parola gresita."
- Correct password → redirects to `/admin/povesti`.
- The list shows "Implicit" everywhere. Filters work.
- Open `/admin/povesti/creatie` → edit the title → click Save.
- Save returns 503 ("KV not configured"). Expected without KV.
- "Iesi" clears the cookie; reload `/admin/povesti` → redirects to login.

- [ ] **Step 4: Local end-to-end (with KV configured via `vercel env pull`)**

After running `vercel env pull .env.local`:

- Edit the title of `creatie` in admin → Save → 200.
- Reload `/povesti` → the new title shows in the timeline.
- Reload `/povesti/creatie` splash → the new title shows.
- "Reseteaza la valoarea implicita" → 200 → public pages revert to seed.
- The API itself: `curl localhost:3000/api/stories/creatie | jq '.titleRo'` reflects the override or seed accordingly.

- [ ] **Step 5: LAN smoke test**

`HOSTNAME=0.0.0.0 pnpm dev`, then on a tablet at `http://<lan-ip>:3000`:
- Public site works exactly as before.
- `/admin/login` works on tablet too (rare use case but should not be broken).

- [ ] **Step 6: Final commit (only if any tweaks were made during testing)**

```bash
git status
# If tweaks:
git commit -am "Admin polish from local testing"
```
