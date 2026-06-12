# Plaiu moderated home gallery (Phase 2)

**Date:** 2026-06-12
**Status:** Approved

## Background

Phase 1 shipped the Plaiu homepage with a "De pe Plaiu" gallery rendered from a
static seed (`components/plaiu/gallery-data.ts`). Phase 2 turns it into a **real,
moderated feed** of kids' drawings: a child submits a drawing from the draw app, it
enters a **pending** queue, and **nothing is shown publicly until a human approves
it**. Reuses the existing `@vercel/kv` storage and HMAC-cookie admin auth — no new
infrastructure or env vars.

## Hard requirements

- **Only `approved` drawings are ever served publicly.** Submissions default to
  `pending`. The public feed returns approved only.
- **Privacy:** capture **first name + age only** — never surname, email, or any other
  personal data (matches the on-page promise).
- **One draw-app touch:** submission is added to the existing
  `components/save-share-sheet.tsx` (a "publish to gallery" flow). The drawing
  canvas/tools/behavior stay otherwise frozen.

## Decisions (from brainstorming)

- **No likes/hearts in v1** — drop the mockup's heart counts; not core to moderation.
- **Homepage strip only** — show the latest ~6 approved in the existing "De pe Plaiu"
  strip. A dedicated `/galerie` page is deferred.
- **Image = downscaled thumbnail in KV** — client downscales the drawing to ~700px
  JPEG (~30–80 KB) and stores the data URL in the KV record. No `@vercel/blob`.
- **Reuse patterns:** KV access mirrors `lib/story-overrides.ts` (incl. the
  `isKvConfigured()` graceful fallback); moderation pages/APIs live under
  `/admin/*` + `/api/admin/*`, already auth-gated by `middleware.ts`.

## Architecture

### Data model (KV)

- `gallery:item:<id>` → `GallerySubmission`:
  `{ id: string; firstName: string; age: number; image: string /* data URL */;
     status: 'pending' | 'approved'; createdAt: number; approvedAt?: number }`
  (`id` = `crypto.randomUUID()`).
- `gallery:pending` → KV list of ids, newest first (moderation queue).
- `gallery:approved` → KV list of ids, newest first (public feed).
- Transitions:
  - **Submit** → write item (`pending`), `lpush gallery:pending`.
  - **Approve** → set `status:'approved'` + `approvedAt`, `lrem` from pending,
    `lpush` to approved.
  - **Reject** → `del` item, `lrem` from pending.
  - **Remove** (un-publish an approved one) → `del` item, `lrem` from approved.

### Data layer — `lib/gallery.ts`

Pure server module wrapping KV. Functions: `submitDrawing({firstName, age, image})`,
`listPending()`, `listApproved(limit?)`, `getPublicFeed(limit)`, `approve(id)`,
`reject(id)`, `remove(id)`, and a local `isKvConfigured()`. `getPublicFeed`:
returns approved items (up to `limit`, newest first); **if zero approved (or KV
unconfigured), returns the static seed** so the homepage strip is never empty.

### Submission — `components/save-share-sheet.tsx` (the one app touch)

Add a **"Trimite în galerie"** button. Tapping reveals a small inline form: **first
name** (text, trimmed, 1–20 chars, letters/spaces/hyphen incl. RO diacritics) +
**age** (integer 1–14). On submit: downscale the drawing (`lib/downscale.ts`) and
`POST /api/gallery/submit` with `{ image, firstName, age }`. Show a friendly success
state: *"Mulțumim! Desenul tău apare după ce îl verifică un om."* and disable
re-submit. Validation errors shown inline. The sheet already receives
`imageDataUrl`; no canvas/tool changes.

### Client util — `lib/downscale.ts`

`downscaleDataUrl(srcDataUrl, maxSide=700, quality=0.82): Promise<string>` — draws the
source onto an offscreen canvas scaled so the longest side ≤ `maxSide`, on a white
background, exports `image/jpeg`. Keeps payload small for KV.

### Public APIs (no auth)

- `POST /api/gallery/submit` — validates: `image` is a `data:image/jpeg|png` string
  under a size cap (~400 KB); `firstName` matches the name rule; `age` is 1–14.
  Soft **per-IP rate limit** via `kv.incr` + `expire` on `gallery:rl:<ip>` (e.g. max
  ~10/hour) to prevent queue flooding. Creates a pending item. Returns `{ ok: true }`.
- `GET /api/gallery` — returns `getPublicFeed(6)` (approved, newest first; seed
  fallback). `Cache-Control: no-store`.

### Moderation (auth-gated by existing middleware)

- `GET /api/admin/gallery` → `{ pending: GallerySubmission[], approved:
  GallerySubmission[] }` (approved capped, e.g. 50).
- `POST /api/admin/gallery` → body `{ id, action: 'approve' | 'reject' | 'remove' }`.
- `app/admin/galerie/page.tsx` — moderation UI mirroring `/admin/povesti`: a
  **pending queue** (drawing thumbnail + first name + age + **Aprobă / Respinge**),
  and an **approved list** with **Scoate**. Client component calling the admin API;
  optimistic refresh after each action.

### Public display — `components/plaiu/gallery.tsx`

Becomes a `'use client'` component: initial state = imported `GALLERY_SEED` (instant
paint, keeps `/` statically prerenderable), then `useEffect` fetches `/api/gallery`
and replaces with the approved feed. Each item renders `image ? <img src=image> :
<div dangerouslySetInnerHTML={art}>` (real submissions carry `image`; seed carries
`art`). Caption = `${firstName}, ${age} ani`. Heart count removed.
`gallery-data.ts` stays as the fallback seed; `GalleryItem` gains optional
`image?: string` (and `art?` becomes optional).

## Safety / abuse

- Moderation is the safety gate: unapproved content is never public.
- Submit endpoint: payload-size cap + per-IP rate limit; basic input validation.
- Pending queue growth is bounded by the rate limit; the moderator clears it via
  Reject. (A hard queue cap is possible later if needed — not in v1.)

## Out of scope (v1)

- Likes/hearts; a dedicated `/galerie` page; notifications on new submissions;
  blob/object storage; editing a submission's name/age in moderation (Reject +
  resubmit covers it); any change to the drawing canvas/tools.

## Verification

- `npx tsc --noEmit` + `pnpm build` pass.
- Submit from the share sheet → item appears in `/admin/galerie` pending, **not** on
  the homepage.
- Approve → appears in the homepage strip (newest first); Reject/Remove → gone.
- Public `GET /api/gallery` never returns pending items.
- Moderation routes return 401 without the admin cookie (middleware).
- KV-unconfigured (local dev): homepage strip shows the seed; submit/moderation
  degrade gracefully (clear "not configured" behavior, no crash).
- Privacy: stored record contains only first name + age + image + status/timestamps.
