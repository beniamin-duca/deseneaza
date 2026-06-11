# Magic Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add playful recorded sounds (randomized pitch), canvas sparkle/confetti effects, and light haptics for fill / stamp / save in the kids' drawing app, and fix the iPad side-rail overflow.

**Architecture:** A singleton Web Audio engine (`lib/feedback.ts`) plays category-based clips with random pitch + exposes a persisted mute flag. A transient full-screen `<canvas>` overlay (`components/sparkle-overlay.tsx`) renders non-persistent particle bursts and confetti via `requestAnimationFrame`. `KidCanvas` emits one `onCelebrate(type, clientX, clientY)` callback; the page wires it to sound + haptics + sparkles, and fires confetti + fanfare on Save. The iPad rail swaps its inline palette/size column for the existing left-side popovers.

**Tech Stack:** Next.js (App Router) + React + TypeScript, Tailwind, Radix popovers, Web Audio API, Canvas 2D, Vibration API. No test framework in repo — verification is `npx tsc --noEmit`, `pnpm lint`, and manual browser checks.

---

## File structure

- **Create** `lib/feedback.ts` — Web Audio singleton: preload/decode clips, `playSound`, `vibrate`, persisted enabled flag, `useSoundEnabled` hook.
- **Create** `components/sparkle-overlay.tsx` — transient particle/confetti `<canvas>` overlay with imperative `burst`/`confetti`.
- **Create** `public/sounds/*.mp3` + `public/sounds/CREDITS.md` — curated Pixabay royalty-free clips.
- **Modify** `components/kid-canvas.tsx` — add `onCelebrate` prop, fire it on fill + stamp.
- **Modify** `app/desen/page.tsx` — render overlay, wire celebrate + Save confetti, pass `showSound`.
- **Modify** `components/floating-top-bar.tsx` — add `showSound` mute toggle.
- **Modify** `components/floating-toolbar.tsx` — compact `SideRail` using left popovers.

---

## Task 1: Sound assets

**Files:**
- Create: `public/sounds/fill-1.mp3`, `public/sounds/fill-2.mp3`, `public/sounds/fill-3.mp3`
- Create: `public/sounds/stamp-1.mp3`, `public/sounds/stamp-2.mp3`, `public/sounds/stamp-3.mp3`
- Create: `public/sounds/complete-1.mp3`
- Create: `public/sounds/CREDITS.md`

- [ ] **Step 1: Create the sounds directory**

```bash
mkdir -p public/sounds
```

- [ ] **Step 2: Fetch candidate clips (Pixabay royalty-free; fall back to CC0 if gated)**

Goal: 3 short "sparkle/chime" clips for `fill`, 3 short "pop/click/bell" clips for `stamp`, 1 short "fanfare/tada" for `complete`. Each clip should be < ~150 KB and < ~2 s (fill/stamp) / < ~3 s (complete).

Attempt direct download from a fetchable royalty-free CDN, e.g.:

```bash
# Pixabay CDN audio URLs (form: https://cdn.pixabay.com/audio/<yyyy>/<mm>/<dd>/audio_<hash>.mp3)
# These exact URLs change over time — find current ones via the Pixabay sound pages
# (https://pixabay.com/sound-effects/search/sparkle/ , /pop/ , /success/) and copy the
# <audio src> CDN link. Then:
curl -fSL -o public/sounds/fill-1.mp3 "<sparkle-clip-url-1>"
curl -fSL -o public/sounds/fill-2.mp3 "<sparkle-clip-url-2>"
curl -fSL -o public/sounds/fill-3.mp3 "<chime-clip-url-3>"
curl -fSL -o public/sounds/stamp-1.mp3 "<pop-clip-url-1>"
curl -fSL -o public/sounds/stamp-2.mp3 "<pop-clip-url-2>"
curl -fSL -o public/sounds/stamp-3.mp3 "<click-clip-url-3>"
curl -fSL -o public/sounds/complete-1.mp3 "<success-fanfare-url>"
```

If a Pixabay URL 403s (gated), substitute an equivalent **CC0** clip from a
directly-fetchable source (e.g. Kenney audio packs on `kenney.nl`, or
`mixkit.co` free SFX direct CDN links) and note the substitution in CREDITS.md.

- [ ] **Step 3: Verify each file is real, non-empty audio**

Run:
```bash
ls -l public/sounds && for f in public/sounds/*.mp3; do file "$f"; done
```
Expected: 7 files, each non-zero size, `file` reports "Audio file with ID3" / "MPEG ADTS, layer III" (i.e. real MP3, not an HTML error page).

- [ ] **Step 4: Write CREDITS.md with every final source URL**

```markdown
# Sound credits

All clips are royalty-free (Pixabay) or CC0 — no attribution legally required;
listed here for provenance.

| File          | Source URL                | License        |
| ------------- | ------------------------- | -------------- |
| fill-1.mp3    | <url>                     | Pixabay / CC0  |
| fill-2.mp3    | <url>                     | Pixabay / CC0  |
| fill-3.mp3    | <url>                     | Pixabay / CC0  |
| stamp-1.mp3   | <url>                     | Pixabay / CC0  |
| stamp-2.mp3   | <url>                     | Pixabay / CC0  |
| stamp-3.mp3   | <url>                     | Pixabay / CC0  |
| complete-1.mp3| <url>                     | Pixabay / CC0  |
```

- [ ] **Step 5: Commit**

```bash
git add public/sounds
git commit -m "Add royalty-free magic feedback sound clips"
```

---

## Task 2: Feedback engine (`lib/feedback.ts`)

**Files:**
- Create: `lib/feedback.ts`

- [ ] **Step 1: Write the engine**

```ts
'use client'

import { useEffect, useState } from 'react'

export type FeedbackCategory = 'fill' | 'stamp' | 'complete'

const SOUND_FILES: Record<FeedbackCategory, string[]> = {
  fill: ['/sounds/fill-1.mp3', '/sounds/fill-2.mp3', '/sounds/fill-3.mp3'],
  stamp: ['/sounds/stamp-1.mp3', '/sounds/stamp-2.mp3', '/sounds/stamp-3.mp3'],
  complete: ['/sounds/complete-1.mp3'],
}

const VIBRATE_PATTERNS: Record<FeedbackCategory, number | number[]> = {
  fill: [12, 30, 12],
  stamp: 15,
  complete: [20, 40, 20, 40, 40],
}

const STORAGE_KEY = 'riza:sound-enabled'

let audioCtx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const loading = new Map<string, Promise<AudioBuffer | null>>()
const listeners = new Set<(enabled: boolean) => void>()

let enabled = true
let initialized = false

function ensureInit() {
  if (initialized) return
  initialized = true
  if (typeof window === 'undefined') return
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    enabled = true
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url)
  if (cached) return Promise.resolve(cached)
  const inflight = loading.get(url)
  if (inflight) return inflight
  const ctx = getCtx()
  if (!ctx) return Promise.resolve(null)
  const p = (async () => {
    try {
      const res = await fetch(url)
      const arr = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(arr)
      buffers.set(url, buf)
      return buf
    } catch {
      return null
    } finally {
      loading.delete(url)
    }
  })()
  loading.set(url, p)
  return p
}

/** Decode all clips up-front. Call from a user gesture so the context unlocks. */
export function preloadSounds() {
  ensureInit()
  if (!getCtx()) return
  for (const list of Object.values(SOUND_FILES)) {
    for (const url of list) void loadBuffer(url)
  }
}

export function playSound(category: FeedbackCategory) {
  ensureInit()
  if (!enabled) return
  const ctx = getCtx()
  if (!ctx) return
  const list = SOUND_FILES[category]
  const url = list[Math.floor(Math.random() * list.length)]
  void loadBuffer(url).then((buf) => {
    if (!buf || !audioCtx || !enabled) return
    const src = audioCtx.createBufferSource()
    src.buffer = buf
    const range = category === 'complete' ? 0.04 : 0.08
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * range
    const gain = audioCtx.createGain()
    gain.gain.value = category === 'complete' ? 0.7 : 0.5
    src.connect(gain).connect(audioCtx.destination)
    src.start()
  })
}

export function vibrate(category: FeedbackCategory) {
  ensureInit()
  if (!enabled) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
    return
  try {
    navigator.vibrate(VIBRATE_PATTERNS[category])
  } catch {
    // ignore
  }
}

export function isSoundEnabled(): boolean {
  ensureInit()
  return enabled
}

export function setSoundEnabled(value: boolean) {
  ensureInit()
  enabled = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(value))
}

/** React hook for the mute toggle; stays in sync with the persisted flag. */
export function useSoundEnabled() {
  const [value, setValue] = useState(true)
  useEffect(() => {
    setValue(isSoundEnabled())
    const listener = (v: boolean) => setValue(v)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return { enabled: value, toggle: () => setSoundEnabled(!isSoundEnabled()) }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/feedback.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/feedback.ts
git commit -m "Add Web Audio feedback engine with randomized pitch + haptics"
```

---

## Task 3: Sparkle overlay (`components/sparkle-overlay.tsx`)

**Files:**
- Create: `components/sparkle-overlay.tsx`

- [ ] **Step 1: Write the overlay component**

```tsx
'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface SparkleOverlayRef {
  burst: (clientX: number, clientY: number, opts?: BurstOpts) => void
  confetti: () => void
}

interface BurstOpts {
  count?: number
  colors?: string[]
  speed?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  rotation: number
  vr: number
  shape: 'star' | 'rect'
}

const DEFAULT_COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C780FA',
  '#FF9F45',
]

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number,
  color: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  // 4-point sparkle
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i
    const radius = i % 2 === 0 ? r : r * 0.4
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export const SparkleOverlay = forwardRef<SparkleOverlayRef>(
  function SparkleOverlay(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number | null>(null)
    const lastTsRef = useRef(0)
    const dprRef = useRef(1)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const resize = () => {
        const dpr = window.devicePixelRatio || 1
        dprRef.current = dpr
        canvas.width = window.innerWidth * dpr
        canvas.height = window.innerHeight * dpr
        canvas.style.width = `${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
      }
      resize()
      window.addEventListener('resize', resize)
      return () => {
        window.removeEventListener('resize', resize)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }, [])

    const tick = (ts: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) {
        rafRef.current = null
        return
      }
      const dt = lastTsRef.current ? Math.min(ts - lastTsRef.current, 48) : 16
      lastTsRef.current = ts
      const dpr = dprRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const live: Particle[] = []
      for (const p of particlesRef.current) {
        p.life -= dt
        if (p.life <= 0) continue
        p.vy += p.gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rotation += p.vr * dt
        live.push(p)
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife))
        if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color)
        } else {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1
      particlesRef.current = live
      if (live.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        lastTsRef.current = 0
      }
    }

    const ensureLoop = () => {
      if (rafRef.current == null) {
        lastTsRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    useImperativeHandle(ref, () => ({
      burst: (clientX, clientY, opts) => {
        const count = opts?.count ?? 14
        const colors = opts?.colors ?? DEFAULT_COLORS
        const speed = opts?.speed ?? 0.28
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
          const v = speed * (0.5 + Math.random())
          particlesRef.current.push({
            x: clientX,
            y: clientY,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v,
            life: 600,
            maxLife: 600,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.0008,
            rotation: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.02,
            shape: 'star',
          })
        }
        ensureLoop()
      },
      confetti: () => {
        const w = window.innerWidth
        const count = 90
        for (let i = 0; i < count; i++) {
          const life = 1500 + Math.random() * 900
          particlesRef.current.push({
            x: Math.random() * w,
            y: -20 - Math.random() * 120,
            vx: (Math.random() - 0.5) * 0.16,
            vy: 0.1 + Math.random() * 0.16,
            life,
            maxLife: life,
            size: 8 + Math.random() * 8,
            color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
            gravity: 0.0004,
            rotation: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.03,
            shape: 'rect',
          })
        }
        ensureLoop()
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-20 pointer-events-none"
        aria-hidden="true"
      />
    )
  }
)
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/sparkle-overlay.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/sparkle-overlay.tsx
git commit -m "Add transient sparkle/confetti canvas overlay"
```

---

## Task 4: Emit `onCelebrate` from KidCanvas (`components/kid-canvas.tsx`)

**Files:**
- Modify: `components/kid-canvas.tsx` (props interface near line 20-26; `placeStamp` ~586-599; `handlePointerDown` fill branch ~622-629)

- [ ] **Step 1: Add the prop to the interface**

Find the props interface containing `onStampPlaced?: () => void` and add below it:

```ts
  onCelebrate?: (
    type: 'fill' | 'stamp',
    clientX: number,
    clientY: number
  ) => void
```

- [ ] **Step 2: Destructure the prop**

In the component's destructured props (the block containing `onStampPlaced,`), add:

```ts
      onCelebrate,
```

- [ ] **Step 3: Fire it on fill**

In `handlePointerDown`, the `if (tool === 'fill') { ... }` branch currently reads:

```ts
      if (tool === 'fill') {
        hasDrawnRef.current = true
        saveToUndoStack()
        floodFill(pos.x, pos.y, color)
        scheduleIdleSave()
        onStrokeEnd?.()
        return
      }
```

Change it to add the celebrate call after `floodFill`:

```ts
      if (tool === 'fill') {
        hasDrawnRef.current = true
        saveToUndoStack()
        floodFill(pos.x, pos.y, color)
        onCelebrate?.('fill', e.clientX, e.clientY)
        scheduleIdleSave()
        onStrokeEnd?.()
        return
      }
```

- [ ] **Step 4: Fire it on stamp**

In `handlePointerDown`, the stamp branch currently reads:

```ts
      if (stampSrc && stampImageRef.current) {
        placeStamp(pos)
        return
      }
```

Change it to:

```ts
      if (stampSrc && stampImageRef.current) {
        placeStamp(pos)
        onCelebrate?.('stamp', e.clientX, e.clientY)
        return
      }
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/kid-canvas.tsx
git commit -m "Emit onCelebrate from KidCanvas on fill and stamp"
```

---

## Task 5: Wire feedback into the drawing page (`app/desen/page.tsx`)

**Files:**
- Modify: `app/desen/page.tsx`

- [ ] **Step 1: Add imports**

Below the existing component imports (after the `KidCanvas` import line), add:

```ts
import { SparkleOverlay, type SparkleOverlayRef } from '@/components/sparkle-overlay'
import { playSound, vibrate, preloadSounds } from '@/lib/feedback'
```

- [ ] **Step 2: Add the overlay ref**

Next to `const canvasRef = useRef<KidCanvasRef>(null)`, add:

```ts
  const sparkleRef = useRef<SparkleOverlayRef>(null)
```

- [ ] **Step 3: Preload sounds on first gesture**

In `handleStrokeStart`, add `preloadSounds()` as the first line (it is idempotent and runs inside a user gesture, which unlocks the AudioContext):

```ts
  const handleStrokeStart = () => {
    preloadSounds()
    setShowUndoHint(false)
    if (undoHintTimerRef.current) clearTimeout(undoHintTimerRef.current)
  }
```

- [ ] **Step 4: Add the celebrate handler**

Add this handler near `handleUndo` / `handleClear`:

```ts
  const handleCelebrate = (
    type: 'fill' | 'stamp',
    x: number,
    y: number
  ) => {
    playSound(type)
    vibrate(type)
    if (type === 'fill') {
      sparkleRef.current?.burst(x, y, { count: 18, colors: [color], speed: 0.32 })
    } else {
      sparkleRef.current?.burst(x, y, { count: 10 })
    }
  }
```

- [ ] **Step 5: Fire confetti + fanfare on Save**

Change `handleSave` to celebrate when there is something to save:

```ts
  const handleSave = () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      playSound('complete')
      vibrate('complete')
      sparkleRef.current?.confetti()
      setImageDataUrl(dataUrl)
      setShowSaveSheet(true)
    }
  }
```

- [ ] **Step 6: Pass `onCelebrate` to KidCanvas**

On the `<KidCanvas ...>` element, add the prop (alongside `onStrokeStart`/`onStrokeEnd`):

```tsx
        onCelebrate={handleCelebrate}
```

- [ ] **Step 7: Render the overlay**

Immediately after the closing `/>` of `<KidCanvas ... />`, add:

```tsx
      <SparkleOverlay ref={sparkleRef} />
```

- [ ] **Step 8: Enable the mute toggle in the top bar**

Change `<FloatingTopBar title={MODE_TITLES[mode]} />` to:

```tsx
      <FloatingTopBar title={MODE_TITLES[mode]} showSound />
```

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the `showSound` prop is added in Task 6 — if running tasks out of order, do Task 6 first or expect a transient prop error here).

- [ ] **Step 10: Commit**

```bash
git add app/desen/page.tsx
git commit -m "Wire sounds, haptics, sparkles and Save confetti into drawing page"
```

---

## Task 6: Mute toggle in the top bar (`components/floating-top-bar.tsx`)

**Files:**
- Modify: `components/floating-top-bar.tsx`

- [ ] **Step 1: Update imports**

Change the lucide import to include the speaker icons, and import the hook:

```ts
import { ArrowLeft, HelpCircle, Home, Volume2, VolumeX } from 'lucide-react'
import { useSoundEnabled } from '@/lib/feedback'
```

- [ ] **Step 2: Add the prop**

Add `showSound?: boolean` to `FloatingTopBarProps`:

```ts
interface FloatingTopBarProps {
  title?: string
  showBack?: boolean
  showHome?: boolean
  showHelp?: boolean
  showSound?: boolean
  onHelp?: () => void
  backHref?: string
}
```

- [ ] **Step 3: Accept the prop + read the hook**

Add `showSound = false,` to the destructured params, and call the hook at the top of the component body:

```ts
  const { enabled: soundOn, toggle: toggleSound } = useSoundEnabled()
```

- [ ] **Step 4: Render the toggle on the right**

Replace the right-side block:

```tsx
      {/* Right side */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {showHelp && onHelp && (
          <button
            onClick={onHelp}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Ajutor"
          >
            <HelpCircle className="w-6 h-6 text-foreground" />
          </button>
        )}
        {/* Placeholder for symmetry if no help button */}
        {!showHelp && <div className="w-12 h-12" />}
      </div>
```

with:

```tsx
      {/* Right side */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {showSound && (
          <button
            onClick={toggleSound}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={soundOn ? 'Oprește sunetul' : 'Pornește sunetul'}
            aria-pressed={soundOn}
            title={soundOn ? 'Sunet pornit' : 'Sunet oprit'}
          >
            {soundOn ? (
              <Volume2 className="w-6 h-6 text-foreground" />
            ) : (
              <VolumeX className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
        )}
        {showHelp && onHelp && (
          <button
            onClick={onHelp}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Ajutor"
          >
            <HelpCircle className="w-6 h-6 text-foreground" />
          </button>
        )}
        {!showHelp && !showSound && <div className="w-12 h-12" />}
      </div>
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/floating-top-bar.tsx
git commit -m "Add persisted sound mute toggle to top bar"
```

---

## Task 7: Compact iPad side rail (`components/floating-toolbar.tsx`)

**Files:**
- Modify: `components/floating-toolbar.tsx` (imports ~4-19; `SideRail` ~285-322)

- [ ] **Step 1: Drop now-unused imports**

`ColorPalette` and `BRUSH_SIZES` are only used by `SideRail` and will no longer be needed there. Remove these two import lines:

```ts
import { BRUSH_SIZES } from '@/lib/templates'
```
```ts
import { ColorPalette } from './color-palette'
```

(Keep `ColorPopover`, `SizePopover`, `CustomColorDialog`.)

- [ ] **Step 2: Replace the inline palette + size column with popovers**

In `SideRail`, replace this block (the palette, both surrounding dividers, and the brush-size column):

```tsx
        <div className="h-px w-8 bg-border my-1" />

        <ColorPalette
          activeColor={activeColor}
          onColorChange={onColorChange}
          customColors={customColors}
          onRemoveCustom={onRemoveCustom}
          onRequestCustom={onRequestCustom}
          variant="rail"
        />

        <div className="h-px w-8 bg-border my-1" />

        <div className="flex flex-col items-center gap-1.5">
          {BRUSH_SIZES.map((size) => {
            const dot = Math.max(6, size.value * 0.45)
            return (
              <button
                key={size.id}
                onClick={() => onBrushSizeChange(size.value)}
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  brushSize === size.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                )}
                style={{ width: 40, height: 40 }}
                aria-label={size.name}
                title={size.name}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: dot, height: dot }}
                />
              </button>
            )
          })}
        </div>

        <div className="h-px w-8 bg-border my-1" />
```

with:

```tsx
        <div className="h-px w-8 bg-border my-1" />

        <ColorPopover
          activeColor={activeColor}
          onColorChange={onColorChange}
          customColors={customColors}
          onRemoveCustom={onRemoveCustom}
          onRequestCustom={onRequestCustom}
          side="left"
        />
        <SizePopover
          brushSize={brushSize}
          onBrushSizeChange={onBrushSizeChange}
          side="left"
        />

        <div className="h-px w-8 bg-border my-1" />
```

- [ ] **Step 3: Confirm `SideRail` no longer references removed symbols**

Run:
```bash
grep -n "ColorPalette\|BRUSH_SIZES" components/floating-toolbar.tsx
```
Expected: no matches.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: no errors. (`SideRail` still validly destructures `brushSize`, `onBrushSizeChange`, `customColors`, etc. — now consumed by the popovers.)

- [ ] **Step 5: Commit**

```bash
git add components/floating-toolbar.tsx
git commit -m "Compact iPad side rail: collapse colors/sizes into left popovers"
```

---

## Task 8: Full verification

- [ ] **Step 1: Typecheck + lint + build**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: all pass, no errors.

- [ ] **Step 2: Manual browser checks (`pnpm dev`)**

Verify in the browser (use device toolbar / an iPad viewport where noted):
- **iPad rail:** at an iPad height the right rail fits with no scroll; Save & Clear always visible; color and size buttons open popovers to the **left**.
- **Fill:** selecting fill + tapping plays a sparkle sound and shows a colored star burst **in the fill color** at the tap point; repeated fills vary in pitch.
- **Stamp:** placing a stamp plays a pop/chime + small sparkle puff; pitch varies.
- **Save:** tapping Save plays the fanfare + rains confetti, then the save sheet opens.
- **Effects are non-persistent:** sparkles/confetti never appear in the saved image and are unaffected by Undo.
- **Mute:** the top-bar speaker toggle silences all sounds (and haptics), persists across reload, and shows the muted icon.
- **No-audio resilience:** if a sound file is missing, no console error blocks the app; sparkles + haptics still fire.

- [ ] **Step 3: Final commit (if any manual-fix tweaks were needed)**

```bash
git add -A
git commit -m "Polish magic feedback after manual verification"
```

---

## Self-review notes

- **Spec coverage:** Part A → Task 7; Part B → Task 2; Part C → Task 1; Part D → Task 3; Part E → Tasks 4–6. Mute toggle (default on) → Tasks 2+6. Confetti on Save → Task 5. Haptics → Tasks 2+5. ✅
- **Type consistency:** `FeedbackCategory` / `'fill' | 'stamp' | 'complete'` used consistently; `onCelebrate(type,'fill'|'stamp', clientX, clientY)` matches between Task 4 (emit) and Task 5 (handle); `SparkleOverlayRef.burst/confetti` signatures match call sites; `useSoundEnabled` returns `{ enabled, toggle }` used in Task 6. ✅
- **Cross-task dependency:** Task 5 Step 9 notes the `showSound` prop comes from Task 6 — do Task 6 before/with Task 5 to keep the typecheck green.
```

