# Plaiu homepage + design system

**Date:** 2026-06-12
**Status:** Proposed (Phase 1 of the Plaiu rebrand)

## Background

The app is currently branded **"Riza"** (`app/page.tsx` homepage, `mascot.jpg`,
coral/mint/yellow palette, Fredoka/Quicksand fonts). A new design — **"Plaiu"** —
was produced in Claude Design and exported to `/tmp/plaiu-home/` (`Plaiu Home.html`
+ screenshots). Plaiu is a folk/meadow rebrand rooted in the Miorița poem: Baloo 2 +
Nunito fonts; a meadow-green / sun-yellow / folk-red palette; playful "hard-shadow"
cards; nine homepage sections including an interactive drawable hero.

This spec covers **Phase 1: the Plaiu design system + the homepage**, plus global
branding (metadata, fonts). It deliberately does **not** restyle or alter the draw
app or the existing bible-stories hub.

## Hard constraints (from brainstorming)

1. **Do not modify the draw app.** `/desen` (canvas, tools, top bar, sounds, zoom,
   drafts) stays functionally and visually identical. The homepage only **links**
   into it. No new query params or behaviors are added to `/desen` in this phase.
2. **`/povesti` (bible stories) stays exactly as-is.** Bible content is parked: it
   will later live as a *thread* woven through other verticals (folk "povești de
   demult", the Noah's-Ark→animals gateway, Crăciun/Paște, a seasonal saints/
   name-day mini-feature) — **not** a standalone vertical, and **not** in this phase.
3. **Full content hubs for verticals are a later, per-vertical effort.** On the
   homepage they appear only as "în curând" **teaser cards**.

## Decisions

- **Additive, scoped theme.** Because `/desen` depends on the existing Riza tokens
  and fonts, Plaiu is added *alongside* them (new `--plai-*` tokens, new fonts) and
  all Plaiu component styles are scoped under a `.plaiu` root class. Changing the
  global tokens is explicitly rejected (it would restyle the draw app).
- **Verticals shown:** Povești · Sărbători · Animale (all "în curând"). "Biblie" is
  intentionally absent (parked as a thread). Three cards.
- **Mode cards (4), app untouched:**
  - Pagină goală → `/desen?mode=blank`
  - Colorat → `/desen?mode=colorat`
  - Stickere → `/desen?mode=blank` (stamps reachable in-app via the existing stamp
    tool; cannot pre-open without an app change — accepted limitation for now)
  - Surpriză → client-side random pick among `{blank, colorat}` (+ a random colorat
    template id) then deep-link; no app change.
- **Drawable hero** is ported as a delightful, self-contained client component, but
  its CTA navigates to `/desen` only — **no** cross-app canvas seeding (would need
  the app to read a seed). The `localStorage` "plaiu-doodle-seed" handoff from the
  mockup is dropped.
- **Gallery "De pe Plaiu"** ships in Phase 1 as a **feed-shaped component seeded with
  the design's sample SVG artworks** (Maria 6 ani, Andrei 5 ani, …) — i.e. it renders
  from a typed list so it can later be swapped to a real API feed with no markup
  change. The "human-verified" note is kept as copy. The **real gallery pipeline**
  (submission, storage, moderation admin, public feed) is **Phase 2** (see below).
- **Tweaks dropped.** The Claude Design `tweaks-panel.jsx` + React/Babel CDN scripts
  are editor tooling, not shipped. One static configuration is baked: balanced folk
  detail, cream background, mascot shown, doodle on.
- **Mascot:** the design's inline "copil" SVG is ported as a component
  (`PlaiuMascot`) — no raster asset needed. `mascot.jpg` (Riza) is left in place for
  `/desen`-adjacent use but not referenced by the homepage.

## Architecture

### Theme layer

- `app/layout.tsx`: add `Baloo_2` and `Nunito` via `next/font/google` as CSS
  variables (`--font-baloo`, `--font-nunito`) on `<html>`, alongside the existing
  Fredoka/Quicksand variables. Update `metadata` (title, description, keywords, OG)
  and `themeColor` to Plaiu. The default body font is unchanged so `/desen` is
  unaffected; Plaiu fonts apply only under the `.plaiu` scope.
- `app/globals.css`: add `--plai-*` color tokens; map them in `@theme inline` as
  `--color-plai-meadow`, `--color-plai-sun`, `--color-plai-folk`, `--color-plai-cream`,
  `--color-plai-sky`, `--color-plai-earth`, `--color-plai-ink`, `--color-plai-ink-soft`,
  `--color-plai-meadow-soft`. Add a `.plaiu { … }` scope that sets the Plaiu
  background, body font (Nunito) and display font (Baloo 2), plus the ported
  component styles (`.btn`/`.btn-primary`/`.btn-sun`/`.btn-ghost`, nav, cards, the
  reveal/bob/spinsun keyframes). All selectors live under `.plaiu` so they never
  affect `/desen`.

### Homepage components (`components/plaiu/`)

Each file = one section with a clear responsibility. All are presentational; the
page composes them.

- `plaiu-nav.tsx` — sticky top nav: wordmark, anchor links (#moduri, #verticale,
  #parinti), primary CTA → `/desen`.
- `plaiu-mascot.tsx` — the "copil" SVG mascot.
- `hero.tsx` — hero copy/eyebrow/H1/tagline/CTAs/trust-chips + meadow scene
  (sun/cloud/hills SVG). Renders `HeroDoodle` as the drawable layer.
- `hero-doodle.tsx` — `'use client'`. The drawable canvas: pointer drawing, color
  swatches, clear, demo squiggle, reduced-motion aware, DPR-scaled. CTA → `/desen`.
- `play-modes.tsx` — the 4 mode cards. `Surpriză` is a client handler that randomizes
  the destination; the rest are plain links.
- `gallery.tsx` — static "De pe Plaiu" showcase (sample SVG artworks + captions).
- `verticals.tsx` — 3 teaser cards (Povești, Sărbători, Animale) with "în curând".
- `trust.tsx` — 3 parents/trust cards + "Pentru părinți" link.
- `story-band.tsx` — Miorița quote band (meadow background, hills deco).
- `final-cta.tsx` — closing CTA → `/desen`.
- `plaiu-footer.tsx` — footer wordmark, "Făcut cu ♥ în România", legal links.
- `reveal.tsx` — `'use client'`. IntersectionObserver wrapper that adds an `.in`
  class for the one-shot rise animation; **base state is visible** (no-JS safe).

### Page + shell

- `app/page.tsx` — server component that wraps the sections in a `.plaiu` root and
  composes Nav → Hero → PlayModes → Gallery → Verticals → Trust → StoryBand →
  FinalCta → Footer.
- The existing content pages `/parinti`, `/termeni`, `/confidentialitate` get the
  Plaiu nav/footer + `.plaiu` scope applied (wrapper only; their copy is unchanged)
  so the rebrand is visually coherent. `/povesti`, `/desen`, `/admin` are **not**
  touched.

## Responsive

Port the design's breakpoints: ≤860px → 2-col grids; ≤560px → single-col modes,
stacked footer, smaller mascot, nav links hidden. The drawable hero exposes a
toggle button on coarse-pointer devices (as in the mockup) so scrolling still works.

## Out of scope (this phase)

- Any change to `/desen`, `/povesti`, `/admin`.
- Real gallery submissions/moderation.
- Full content hubs for Povești / Sărbători / Animale (each its own later project).
- Bible/saints features (parked thread strategy).
- Cross-app doodle seeding.

## Later phases (captured, not built here)

These came up in brainstorming and are recorded so nothing is lost. Each gets its
own spec.

- **Phase 2 — Gallery pipeline + share-to-gallery.** The home "De pe Plaiu" gallery
  becomes a real, moderated feed of kids' drawings:
  - **Submission:** adapt the design's Plaiu share sheet (`Plaiu Draw.html`) into the
    existing `components/save-share-sheet.tsx` — port the nicer styling and add a
    "publish to gallery" action. This is the **one** scoped touch to the draw app's
    save/share flow (the canvas/tools/behavior stay frozen).
  - **Storage + API:** a data model + endpoint for submitted drawings, reusing the
    existing `/api/stories` + admin patterns. Store only first name + age, never
    personal data (matches the on-page promise).
  - **Moderation:** an admin page (reuse `/admin/povesti` patterns + `admin-auth`) to
    approve/reject before anything is public.
  - **Public feed:** the homepage gallery swaps from the seeded sample list to the
    approved-drawings API.
- **Phase 3+ — Vertical content hubs** (Povești, Sărbători, Animale) and the parked
  **bible-as-thread** strategy (povești de demult, Noah→animals, Crăciun/Paște,
  saints/name-day mini-feature).

## Verification

- `pnpm build` + `npx tsc --noEmit` pass.
- `/` renders the Plaiu homepage; all CTAs/links resolve (`/desen?mode=…`, anchors,
  `/parinti`).
- **`/desen` is byte-for-byte unchanged** in behavior and appearance (spot-check the
  draw page still uses the Riza look — no `.plaiu` bleed).
- Drawable hero works with mouse/touch; reduced-motion respected; no-JS shows all
  content (reveal base state visible).
- Responsive: iPad + phone widths match the mockup's breakpoints.
- Surpriză navigates to a valid random destination each click.
