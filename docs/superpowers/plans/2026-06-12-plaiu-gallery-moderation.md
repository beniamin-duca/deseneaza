# Plaiu Moderated Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage "De pe Plaiu" gallery into a real, **moderated** feed — kids submit a drawing from the share sheet, it sits in a pending queue, and **only admin-approved drawings appear publicly**.

**Architecture:** A KV data layer (`lib/gallery.ts`, mirroring `lib/story-overrides.ts`) stores submissions and two id-lists (`pending`/`approved`). Public endpoints submit (rate-limited, validated) and read the approved feed; admin endpoints (auto-protected by the existing `middleware.ts`) list and approve/reject/remove. The share sheet gains a downscale-and-submit flow (the one allowed draw-app touch); the homepage gallery fetches approved items with a seed fallback.

**Tech Stack:** Next.js 16 route handlers (Node runtime), `@vercel/kv`, existing HMAC-cookie admin auth, Canvas (client downscale). No test framework — verification is `npx tsc --noEmit`, `pnpm build`, and manual checks.

**Spec:** `docs/superpowers/specs/2026-06-12-plaiu-gallery-moderation-design.md`.

---

## File structure

- **Create** `lib/gallery.ts` — KV data layer + validation + rate limit + public feed (seed fallback).
- **Create** `lib/downscale.ts` — client image downscale util.
- **Create** `app/api/gallery/submit/route.ts` — public POST (validate, rate-limit, submit).
- **Create** `app/api/gallery/route.ts` — public GET approved feed.
- **Create** `app/api/admin/gallery/route.ts` — admin GET list + POST action (auth-gated by middleware).
- **Create** `app/admin/galerie/page.tsx` — moderation UI.
- **Modify** `components/save-share-sheet.tsx` — add "Trimite în galerie" flow (the one app touch).
- **Modify** `components/plaiu/gallery.tsx` — fetch approved feed, render image-or-art.
- **Modify** `components/plaiu/gallery-data.ts` — drop `hearts`, add optional `image`/`art`.

`/desen` canvas/tools, `/povesti`, and other admin areas are not touched.

---

## Task 1: KV data layer — `lib/gallery.ts`

**Files:** Create `lib/gallery.ts`

- [ ] **Step 1: Write the module**

```ts
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
  await kv.set(ITEM_KEY(id), { ...item, status: 'approved', approvedAt: Date.now() })
  await kv.lrem(PENDING_KEY, 0, id)
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
```

Note: this imports `GALLERY_SEED` from `gallery-data.ts`, which currently exposes `{ id, who, art }` (plus `hearts`, unused here). Task 7 makes `art`/`image` optional — `s.art` stays valid either way.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `s.art` is flagged as possibly-undefined after Task 7's type change, coalesce: `art: s.art ?? ''`.)

- [ ] **Step 3: Commit**

```bash
git add lib/gallery.ts
git commit -m "Add KV gallery data layer (submissions, moderation lists, public feed)"
```

---

## Task 2: Client downscale util — `lib/downscale.ts`

**Files:** Create `lib/downscale.ts`

- [ ] **Step 1: Write it**

```ts
/**
 * Downscale a data-URL image to a small JPEG suitable for KV storage.
 * Draws on a white background (drawings are on white) so JPEG has no black fill.
 * Client-only (uses DOM); import from client components.
 */
export async function downscaleDataUrl(
  src: string,
  maxSide = 700,
  quality = 0.82
): Promise<string> {
  const img = await loadImage(src)
  const longest = Math.max(img.width, img.height) || 1
  const scale = Math.min(1, maxSide / longest)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add lib/downscale.ts
git commit -m "Add client image downscale util for gallery submissions"
```

---

## Task 3: Public APIs — submit + feed

**Files:** Create `app/api/gallery/submit/route.ts`, `app/api/gallery/route.ts`

- [ ] **Step 1: `app/api/gallery/submit/route.ts`**

```ts
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
```

(After the combined `if (!validFirstName … )` guard returns, TypeScript narrows `body.firstName` to `string`, `body.age` to `number`, `body.image` to `string`, so the `submitDrawing` call typechecks. If TS does not narrow through the `||` chain in this version, split into three separate `if` guards.)

- [ ] **Step 2: `app/api/gallery/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPublicFeed } from '@/lib/gallery'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await getPublicFeed(6)
  return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } })
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/api/gallery/submit/route.ts app/api/gallery/route.ts
git commit -m "Add public gallery submit + approved-feed endpoints"
```

---

## Task 4: Admin moderation API — `app/api/admin/gallery/route.ts`

**Files:** Create `app/api/admin/gallery/route.ts` (auto-protected by `middleware.ts`)

- [ ] **Step 1: Write it**

```ts
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
```

- [ ] **Step 2: Confirm middleware protects it**

`middleware.ts` matcher includes `/api/admin/:path*`, so this route returns 401 without the `riza_admin` cookie. No per-route auth code needed. (Read `middleware.ts` to confirm; do not modify it.)

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/api/admin/gallery/route.ts
git commit -m "Add admin gallery moderation API (list + approve/reject/remove)"
```

---

## Task 5: Moderation page — `app/admin/galerie/page.tsx`

**Files:** Create `app/admin/galerie/page.tsx` (auto-protected by middleware)

- [ ] **Step 1: Write it**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Item {
  id: string
  firstName: string
  age: number
  image: string
  status: 'pending' | 'approved'
  createdAt: number
}

export default function GalleryAdminPage() {
  const [pending, setPending] = useState<Item[]>([])
  const [approved, setApproved] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending ?? [])
        setApproved(data.approved ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, action: 'approve' | 'reject' | 'remove') => {
    setBusy(id)
    try {
      await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const Card = ({ it, children }: { it: Item; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={it.image}
        alt={`Desen de ${it.firstName}`}
        className="w-full aspect-square object-contain rounded-xl bg-white"
      />
      <p className="font-display font-semibold mt-2">
        {it.firstName}, {it.age} ani
      </p>
      <div className="flex gap-2 mt-2">{children}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Galerie — moderare</h1>
      {loading ? (
        <p className="text-muted-foreground">Se încarcă…</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-3">
              În așteptare ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-muted-foreground">Nimic de verificat. 🎉</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pending.map((it) => (
                  <Card it={it} key={it.id}>
                    <Button size="sm" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'approve')}>
                      Aprobă
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'reject')}>
                      Respinge
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              Publicate ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <p className="text-muted-foreground">Încă nimic publicat.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {approved.map((it) => (
                  <Card it={it} key={it.id}>
                    <Button size="sm" variant="outline" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'remove')}>
                      Scoate
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/admin/galerie/page.tsx
git commit -m "Add gallery moderation admin page"
```

---

## Task 6: Share-sheet submission flow — `components/save-share-sheet.tsx`

**Files:** Modify `components/save-share-sheet.tsx` (the one allowed draw-app touch)

- [ ] **Step 1: Replace the file with this version** (keeps download/share exactly; adds the publish flow)

```tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share2, ArrowRight, ImageUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { downscaleDataUrl } from '@/lib/downscale'

interface SaveShareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageDataUrl: string | null
  onContinue: () => void
}

type View = 'actions' | 'form' | 'sent'

export function SaveShareSheet({
  open,
  onOpenChange,
  imageDataUrl,
  onContinue,
}: SaveShareSheetProps) {
  const [sharing, setSharing] = useState(false)
  const [view, setView] = useState<View>('actions')
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset the publish flow each time the sheet opens.
  useEffect(() => {
    if (open) {
      setView('actions')
      setFirstName('')
      setAge('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  const handleDownload = () => {
    if (!imageDataUrl) return
    const link = document.createElement('a')
    link.download = `riza-desen-${Date.now()}.png`
    link.href = imageDataUrl
    link.click()
  }

  const handleShare = async () => {
    if (!imageDataUrl) return
    setSharing(true)
    try {
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'desen-riza.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Desenul meu',
          text: 'Uite ce am desenat!',
          files: [file],
        })
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Uite ce am desenat!')}`
        window.open(whatsappUrl, '_blank')
      }
    } catch {
      // user cancelled
    } finally {
      setSharing(false)
    }
  }

  const handlePublish = async () => {
    setError(null)
    const name = firstName.trim()
    const ageNum = Number(age)
    if (!/^[\p{L} \-]{1,20}$/u.test(name)) {
      setError('Scrie un prenume (doar litere).')
      return
    }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 14) {
      setError('Scrie o vârstă între 1 și 14.')
      return
    }
    if (!imageDataUrl) return
    setSubmitting(true)
    try {
      const image = await downscaleDataUrl(imageDataUrl)
      const res = await fetch('/api/gallery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, firstName: name, age: ageNum }),
      })
      if (res.ok) setView('sent')
      else if (res.status === 429)
        setError('Ai trimis deja multe desene. Mai încearcă mai târziu.')
      else setError('Nu am putut trimite desenul. Mai încearcă o dată.')
    } catch {
      setError('Nu am putut trimite desenul. Mai încearcă o dată.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle className="font-display text-2xl">
            {view === 'sent' ? 'Mulțumim!' : 'Bravo!'}
          </SheetTitle>
          <SheetDescription>
            {view === 'sent'
              ? 'Desenul tău apare în galerie după ce îl verifică un om.'
              : 'Ai facut un desen frumos! Ce vrei sa faci acum?'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {imageDataUrl && view !== 'sent' && (
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary shadow-lg">
              <Image src={imageDataUrl} alt="Desenul tau" fill className="object-contain bg-white" />
            </div>
          )}

          {view === 'actions' && (
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button onClick={handleDownload} className="h-14 rounded-full font-display text-lg btn-bounce">
                <Download className="size-5 mr-2" />
                Salveaza
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-secondary hover:bg-secondary/90"
              >
                <Share2 className="size-5 mr-2" />
                {sharing ? 'Se trimite...' : 'Trimite'}
              </Button>
              <Button
                onClick={() => setView('form')}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-mint hover:bg-mint-dark text-white"
              >
                <ImageUp className="size-5 mr-2" />
                Trimite în galerie
              </Button>
              <Button onClick={onContinue} variant="outline" className="h-14 rounded-full font-display text-lg btn-bounce">
                Continua sa desenezi
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          )}

          {view === 'form' && (
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prenume"
                maxLength={20}
                className="selectable h-12 rounded-full border-2 border-border px-5 text-base outline-none focus:border-primary"
              />
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                inputMode="numeric"
                placeholder="Vârsta"
                className="selectable h-12 rounded-full border-2 border-border px-5 text-base outline-none focus:border-primary"
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                onClick={handlePublish}
                disabled={submitting}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-mint hover:bg-mint-dark text-white"
              >
                {submitting ? 'Se trimite...' : 'Trimite desenul'}
              </Button>
              <Button onClick={() => setView('actions')} variant="outline" className="h-12 rounded-full font-display">
                Înapoi
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Cerem doar prenumele și vârsta. Desenul apare după verificare.
              </p>
            </div>
          )}

          {view === 'sent' && (
            <div className="flex flex-col w-full gap-3 max-w-xs items-center">
              <div className="text-5xl">🎉</div>
              <Button onClick={onContinue} className="h-14 rounded-full font-display text-lg btn-bounce w-full">
                Continua sa desenezi
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/save-share-sheet.tsx
git commit -m "Add publish-to-gallery flow to the save/share sheet"
```

---

## Task 7: Homepage gallery fetch — `components/plaiu/gallery.tsx` + `gallery-data.ts`

**Files:** Modify `components/plaiu/gallery-data.ts`, `components/plaiu/gallery.tsx`

- [ ] **Step 1: Update the `GalleryItem` type in `gallery-data.ts`**

Change the interface (drop `hearts`, make `art` optional, add optional `image`) and remove the `hearts` field from every `GALLERY_SEED` entry:

```ts
export interface GalleryItem {
  id: string
  who: string   // first name + age, e.g. "Maria, 6 ani"
  art?: string  // inline SVG markup (seed)
  image?: string // data URL (real approved submission)
}
```

Then edit each of the 6 seed objects to remove `hearts: NN,` (keep `id`, `who`, `art`).

- [ ] **Step 2: Rewrite `components/plaiu/gallery.tsx`** as a client component that fetches the approved feed

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Reveal } from './reveal'
import { GALLERY_SEED, type GalleryItem } from './gallery-data'

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(GALLERY_SEED)

  useEffect(() => {
    let cancelled = false
    fetch('/api/gallery', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setItems(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="sec gallery" id="galerie">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">De pe Plaiu</span>
          <h2>Desenele de azi ale celor mici</h2>
          <p>Mândri de ce-au făcut copiii. O selecție caldă, aleasă cu mâna — pe care o poate vedea oricine.</p>
        </Reveal>
        <div className="wall">
          {items.map((g) => (
            <figure className="poly reveal" key={g.id}>
              {g.image ? (
                <div className="art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image}
                    alt={`Desen de ${g.who}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div className="art" dangerouslySetInnerHTML={{ __html: g.art ?? '' }} />
              )}
              <figcaption className="cap">
                <span className="who">{g.who}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <Reveal className="gallery-cta">
          <Link className="btn btn-primary" href="/desen">Desenează și tu</Link>
          <span className="gnote">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7CB342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            Galeria e verificată de oameni înainte de publicare — doar prenume și vârstă, niciodată date personale.
          </span>
        </Reveal>
      </div>
    </section>
  )
}
```

(The heart count is removed from the caption per the "no likes in v1" decision.)

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/gallery.tsx components/plaiu/gallery-data.ts
git commit -m "Homepage gallery fetches approved feed (seed fallback), drop hearts"
```

---

## Task 8: Verification

- [ ] **Step 1: Build + typecheck**

Run: `npx tsc --noEmit && pnpm build`
Expected: both pass; `/`, `/admin/galerie`, and the API routes compile.

- [ ] **Step 2: Manual checks (`pnpm dev`)**

Without KV configured locally, the layer degrades gracefully — verify:
- `/` still renders the gallery strip (seed fallback).
- `GET /api/gallery` → 200 with the seed items.
- `POST /api/gallery/submit` (no KV) → 503 `gallery not configured` (the share sheet shows the error message, doesn't crash).
- `/admin/galerie` (after admin login) → loads, shows empty queues; `GET /api/admin/gallery` returns `{pending:[],approved:[]}`. Without the admin cookie → 401.

With KV configured (preview/prod), additionally verify:
- Share sheet → "Trimite în galerie" → fill name+age → submit → success message; item appears in `/admin/galerie` **pending**, NOT on the homepage.
- Approve → appears on the homepage strip (newest first) and in admin "Publicate"; `GET /api/gallery` now returns it (with `image`).
- Reject (a pending) and Scoate (an approved) → item gone from queue/feed.
- `GET /api/gallery` never returns a pending item.

- [ ] **Step 3: Confirm draw-app freeze except the share sheet**

`git diff --name-only <base>..HEAD -- components app/desen` should show **only** `components/save-share-sheet.tsx` under the draw-app surface (plus the new `components/plaiu/*` and admin/api files). The canvas, toolbar, and `app/desen/page.tsx` are unchanged.

---

## Self-review notes

- **Spec coverage:** KV data model + transitions → Task 1; only-approved-public (getPublicFeed / feed endpoint) → Tasks 1, 3; submission (first name + age, downscale) → Tasks 2, 6; public APIs + rate limit + size cap → Tasks 1, 3; moderation API + page → Tasks 4, 5; homepage display + seed fallback + drop likes → Tasks 1, 7; privacy (name+age only) → Tasks 1, 6; one app touch (share sheet only) → Task 6 + Task 8 Step 3. ✅
- **Type consistency:** `GallerySubmission` / `FeedItem` (Task 1) used by APIs (Tasks 3–4) and the admin `Item` shape (Task 5) matches `GallerySubmission`; `GalleryItem` (Task 7) `{id, who, art?, image?}` matches what `getPublicFeed` emits (`{id, who, image}`) and the seed (`{id, who, art}`); validation helpers (`validFirstName/validAge/validImage`) defined in Task 1, consumed in Task 3; `downscaleDataUrl` (Task 2) consumed in Task 6. ✅
- **App-freeze:** only `components/save-share-sheet.tsx` is modified under the draw surface (the agreed single touch); `app/desen/**`, canvas, toolbar untouched. ✅
- **Placeholder scan:** no TBD/TODO; every code step is complete. The `eslint-disable-next-line` comments are intentional (raster `<img>` for data URLs). ✅
```
