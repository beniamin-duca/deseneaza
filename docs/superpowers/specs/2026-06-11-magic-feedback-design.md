# Magic feedback (sounds + sparkles + confetti) & iPad rail fix

**Date:** 2026-06-11
**Status:** Approved

## Problem

Two issues on the drawing page (`app/desen/page.tsx`):

1. **iPad layout:** the desktop/tablet `SideRail` in `floating-toolbar.tsx` lists every
   colour swatch and every brush size inline in a single vertical column. On iPad
   height the column overflows the viewport; the bottom actions (Save, Clear) and
   some sizes fall below the fold and `overflow-y-auto` is an awkward, easy-to-miss
   escape hatch for small kids.
2. **No playful feedback:** for small kids the app would feel more magical with
   short, varied sounds and small visual effects when meaningful things happen
   (fill, stamp, finishing a drawing), plus light haptics on touch devices.

## Decisions (from brainstorming)

- Sound source: **Pixabay royalty-free** clips (no attribution required).
- **Randomized pitch** layer so a small set of clips never sounds identical.
- Feedback moments: **fill** (big celebration), **stamp** (pop + sparkle),
  **completion** (confetti + fanfare on Save), **haptics** on touch. No per-stroke
  brush sound.
- **Mute toggle** in the top bar, **default ON**, persisted.
- iPad rail: **compact** — collapse colours and sizes into popovers.
- Fill sparkle particles use the **active fill colour**.
- "Drawing completed" is detected as the **Save tap** (explicit, intentional);
  no unreliable heuristics.

## Architecture

### Part A — iPad side rail fix (`components/floating-toolbar.tsx`)

In `SideRail` (the `hidden md:flex` rail) replace the inline `<ColorPalette>` and
the inline brush-size column with the existing `<ColorPopover side="left">` and
`<SizePopover side="left">` (already used by the phone `BottomDock`). Final rail,
top → bottom: templates · brush · eraser · fill · stamp · undo · color ▾ · size ▾ ·
clear · save (~10 fixed buttons). Always fits any iPad height; no scroll. Desktop
trades always-visible swatches for a guaranteed fit (accepted).

### Part B — Feedback engine (`lib/feedback.ts`)

A small singleton built on the Web Audio API.

- Lazily create + `resume()` an `AudioContext` on the first `play()` call (must run
  inside a user gesture — fill/stamp/save taps qualify; satisfies iOS Safari which
  starts the context suspended).
- Preload + `decodeAudioData` a small set of clips into `AudioBuffer`s, grouped by
  category: `fill`, `stamp`, `complete`.
- `play(category)`: pick a **random clip** from the group, play it through a
  `BufferSourceNode` with a **random `playbackRate`** in ≈[0.92, 1.08] and a gain
  node for volume. `complete` may use a smaller/zero pitch range (singular moment).
- `enabled` flag persisted to `localStorage` (key e.g. `riza:sound-enabled`),
  **default true**; when false, `play()` is a no-op. Decode/network failures are
  swallowed so a missing file silently no-ops (haptics + visuals still fire).
- `vibrate(pattern)` helper wrapping `navigator.vibrate` (feature-detected):
  fill = double buzz, stamp = short tap, complete = celebratory pattern.
- `useSoundEnabled()` React hook exposing `{ enabled, toggle }` for the mute button,
  kept in sync with the persisted flag.

### Part C — Sound assets (`public/sounds/`)

Curated Pixabay royalty-free clips, renamed by category:
`fill-1.mp3`…, `stamp-1.mp3`…, `complete-1.mp3`… (2–3 fill, 2–3 stamp, 1–2 complete).
Each clip's source URL recorded in `public/sounds/CREDITS.md`. If a specific clip
can't be fetched directly, substitute an equivalent royalty-free / CC0 clip and note
the substitution in CREDITS.md.

### Part D — Visual effects (`components/sparkle-overlay.tsx`)

A transient effects layer rendered as a full-viewport `<canvas>` (absolute,
`inset-0`, `pointer-events-none`), stacked **above** the drawing canvas and **below**
the toolbar. It is independent of the drawing canvas, so effects are never saved,
undone, or persisted. Exposes an imperative ref:

- `burst(clientX, clientY, { count, colors, spread })` — small star/sparkle
  particles that fly outward and fade over ~600ms (fill = larger, colourful, uses
  fill colour; stamp = small puff).
- `confetti()` — many colourful particles raining from the top with gravity over
  ~1.5s for the completion moment.

Particles animate with a single shared `requestAnimationFrame` loop that runs only
while particles are alive (starts on first spawn, stops when none remain). Canvas is
DPR-scaled and resizes with the window.

### Part E — Wiring

- `components/kid-canvas.tsx`: add one optional callback
  `onCelebrate?(type: 'fill' | 'stamp', clientX: number, clientY: number)`. Fire it
  in the `fill` branch of `handlePointerDown` and in `placeStamp`, passing the
  triggering pointer's client coordinates. Keeps all particle/audio logic out of the
  already-large canvas component.
- `app/desen/page.tsx`:
  - hold a `sparkleRef` and render `<SparkleOverlay ref={sparkleRef} />`.
  - `onCelebrate(type, x, y)` → `feedback.play(type)` + `feedback.vibrate(type)` +
    `sparkleRef.burst(x, y, …)` (fill burst uses the current `color`).
  - in `handleSave`, when a data URL exists → `feedback.play('complete')` +
    `feedback.vibrate('complete')` + `sparkleRef.confetti()` alongside opening the
    save sheet.
- `components/floating-top-bar.tsx`: add an optional `showSound` prop; when set,
  render a speaker mute/unmute toggle (using `useSoundEnabled()`) on the right side
  in place of the current symmetry placeholder. The desen page passes `showSound`.

## Files

- **New:** `lib/feedback.ts`, `components/sparkle-overlay.tsx`,
  `public/sounds/*` (+ `CREDITS.md`).
- **Edited:** `components/floating-toolbar.tsx`, `components/kid-canvas.tsx`,
  `app/desen/page.tsx`, `components/floating-top-bar.tsx`.

## Testing / verification

- iPad rail: at iPad viewport heights the rail fits with no scroll; Save & Clear
  always visible; colour and size popovers open to the left.
- Sounds: fill / stamp / save each play a clip; repeated taps vary in pitch; mute
  toggle silences all and persists across reload; missing-file case is silent.
- Visuals: fill burst at tap point in fill colour; stamp puff at stamp; confetti on
  Save. None of the effects appear in the saved image or in undo history.
- Haptics: light vibration on a touch device for fill/stamp/complete (where
  supported); no errors on unsupported devices.

## Out of scope

- Per-stroke / brush sounds.
- Background music.
- Configurable volume slider (single on/off only).
