# Plaiu Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Plaiu" folk/meadow homepage and a scoped Plaiu design system in the existing Next.js app, replacing the current "Riza" homepage, **without changing the draw app (`/desen`), `/povesti`, or `/admin`**.

**Architecture:** Plaiu is an *additive, scoped* design layer — new Baloo 2 + Nunito fonts and `--plai-*` tokens added alongside the existing Riza tokens, with all Plaiu component CSS nested under a single `.plaiu` root class so nothing leaks into the draw app. The homepage is decomposed into focused presentational components under `components/plaiu/`; large decorative SVGs are ported verbatim from the committed design source (`docs/plaiu-design/Plaiu Home.html`) via `dangerouslySetInnerHTML` to avoid transcription errors, while all logic/links are written as real JSX/TS.

**Tech Stack:** Next.js 16 (App Router, RSC), React 18, TypeScript, Tailwind v4 (`@theme inline` in `app/globals.css`), `next/font/google`. No test framework in the repo — verification is `npx tsc --noEmit`, `pnpm build`, and manual browser checks (incl. confirming `/desen` is visually unchanged).

**Design source of truth:** `docs/plaiu-design/Plaiu Home.html` (committed). Line ranges below refer to it. Screenshots in `docs/plaiu-design/screenshots/` for visual reference.

---

## Porting conventions (apply in every component task)

1. **Decorative/static SVG blocks** (mascot, meadow scene, gallery artworks, icons): copy the exact inner HTML from the referenced design lines into a template-literal string and render with `<div dangerouslySetInnerHTML={{ __html: SVG }} />` (or on the semantic element where noted). Do **not** hand-convert SVG attributes to camelCase — keeping the raw string avoids errors and renders identically.
2. **Structure, text, links, buttons, interactivity**: write as real JSX. `class`→`className`. Rewrite every `href="Plaiu Draw.html…"` to the Next route per the link map below. Internal anchors (`#moduri`, `#verticale`, `#parinti`) stay as `href="#…"`.
3. **Scope:** every Plaiu component renders inside the `.plaiu` root (added on the homepage wrapper). Components themselves use the design's class names (`.hero`, `.mode`, `.vcard`, …); the CSS in Task 1 scopes them under `.plaiu`.
4. **Drop**: the `tweaks-panel.jsx`, the React/Babel CDN `<script>`s, and the `data-screen-label` attributes. Bake the static config: `data-folk="1"`, cream background, mascot shown, doodle on.

**Link map:**
- `Plaiu Draw.html` → `/desen`
- `Plaiu Draw.html?mode=liber` → `/desen?mode=blank`
- `Plaiu Draw.html?mode=colorat` → `/desen?mode=colorat`
- `Plaiu Draw.html?mode=stickere` → `/desen?mode=blank`
- `Plaiu Draw.html?mode=surpriza` → handled by a client randomizer (Task 5)
- `#parinti` / Termeni / Confidențialitate → `/parinti`, `/termeni`, `/confidentialitate`

---

## File structure

- **Modify** `app/layout.tsx` — add Baloo 2 + Nunito fonts; Plaiu metadata + themeColor.
- **Modify** `app/globals.css` — add `--plai-*` tokens, `@theme` color mappings, and the `.plaiu`-scoped component CSS + keyframes.
- **Create** `components/plaiu/reveal.tsx` — scroll-in wrapper (client).
- **Create** `components/plaiu/plaiu-nav.tsx`, `plaiu-footer.tsx`, `plaiu-mascot.tsx`.
- **Create** `components/plaiu/hero.tsx` + `components/plaiu/hero-doodle.tsx` (client).
- **Create** `components/plaiu/play-modes.tsx` (client — Surpriză randomizer).
- **Create** `components/plaiu/gallery.tsx` + `components/plaiu/gallery-data.ts`.
- **Create** `components/plaiu/verticals.tsx`, `trust.tsx`, `story-band.tsx`, `final-cta.tsx`.
- **Modify** `app/page.tsx` — compose the Plaiu homepage under `.plaiu`.
- **Modify** `app/parinti/page.tsx`, `app/termeni/page.tsx`, `app/confidentialitate/page.tsx` — wrap in Plaiu nav/footer + `.plaiu` (content unchanged).

`/desen`, `/povesti`, `/admin`, and all draw components are **not** in this list and must not be touched.

---

## Task 1: Plaiu design tokens, fonts, and scoped CSS

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add fonts in `app/layout.tsx`**

Replace the font imports/instantiation. Keep the existing Fredoka/Quicksand (the draw app uses them); add Baloo 2 + Nunito:

```tsx
import { Fredoka, Quicksand, Baloo_2, Nunito } from 'next/font/google'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap' })
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand', display: 'swap' })
const baloo = Baloo_2({ subsets: ['latin'], variable: '--font-baloo', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' })
```

Add both new variables to the `<html>` className:

```tsx
<html lang="ro" className={`${fredoka.variable} ${quicksand.variable} ${baloo.variable} ${nunito.variable} bg-background`}>
```

- [ ] **Step 2: Update metadata + themeColor in `app/layout.tsx`**

```tsx
export const metadata: Metadata = {
  title: 'Plaiu — Desenează online, gratuit, pentru copii',
  description:
    'Plaiu — locul unde copiii desenează și colorează gratuit. Pagini libere, povești, sărbători. Fără cont, fără reclame agresive.',
  keywords: ['desene copii', 'colorat online', 'desenat gratuit', 'pagini de colorat', 'copii', 'Plaiu'],
  authors: [{ name: 'Plaiu' }],
  openGraph: {
    title: 'Plaiu — Desenează online, gratuit, pentru copii',
    description:
      'Locul unde copiii desenează și colorează gratuit. Fără cont, fără reclame agresive.',
    locale: 'ro_RO',
    type: 'website',
  },
}
```

In `viewport`, change `themeColor: '#FF6B6B'` → `themeColor: '#7CB342'`.

- [ ] **Step 3: Add Plaiu tokens to `:root` in `app/globals.css`**

Inside the existing `:root { … }` block (after the Riza brand colors), add:

```css
  /* Plaiu brand colors */
  --plai-meadow:#7CB342;
  --plai-meadow-soft:#8FCB54;
  --plai-sun:#FFD93D;
  --plai-folk:#E63946;
  --plai-cream:#FFF8E7;
  --plai-sky:#6BB6E8;
  --plai-earth:#B08968;
  --plai-ink:#2D3047;
  --plai-ink-soft:#5b5f78;
  --plai-radius-card:28px;
  --plai-radius-pill:999px;
```

- [ ] **Step 4: Map Plaiu colors + fonts in `@theme inline`**

Inside the existing `@theme inline { … }` block, after the existing brand color mappings, add:

```css
  --font-baloo: var(--font-baloo), 'Baloo 2', system-ui, sans-serif;
  --font-nunito: var(--font-nunito), 'Nunito', system-ui, sans-serif;
  --color-plai-meadow: var(--plai-meadow);
  --color-plai-meadow-soft: var(--plai-meadow-soft);
  --color-plai-sun: var(--plai-sun);
  --color-plai-folk: var(--plai-folk);
  --color-plai-cream: var(--plai-cream);
  --color-plai-sky: var(--plai-sky);
  --color-plai-earth: var(--plai-earth);
  --color-plai-ink: var(--plai-ink);
  --color-plai-ink-soft: var(--plai-ink-soft);
```

- [ ] **Step 5: Add the `.plaiu`-scoped component CSS**

Append to the end of `app/globals.css`. Port the design's `<style>` rules (`docs/plaiu-design/Plaiu Home.html` lines 63–291: buttons, nav, hero, doodle, sections, modes, verticals, gallery, trust, story, cta, footer, responsive) into a **single nested `.plaiu { … }` block**, relying on CSS nesting (Lightning CSS, used by Tailwind v4, supports a bare `.child {}` nested inside `.plaiu {}` meaning `.plaiu .child`). Apply these adjustments:

  - **Do NOT port** the global resets at lines 35–58 (`*`, `html,body`, `h1..`, `p`, `a`, `img,svg`, `section`) — the app already has equivalents and they must not become global. Instead, set Plaiu's own base inside the scope:
    ```css
    .plaiu{
      font-family:var(--font-nunito), system-ui, sans-serif;
      color:var(--plai-ink);
      background:var(--plai-cream);
      line-height:1.5;
      --maxw:1120px;
    }
    .plaiu :is(h1,h2,h3,.display){font-family:var(--font-baloo), system-ui, sans-serif;font-weight:600;letter-spacing:-0.01em;margin:0;}
    .plaiu p{margin:0;}
    .plaiu a{color:inherit;text-decoration:none;}
    .plaiu svg,.plaiu img{display:block;}
    .plaiu section{position:relative;}
    .plaiu .wrap{width:100%;max-width:var(--maxw);margin:0 auto;padding:0 22px;}
    ```
  - Then nest the **component rules** (lines 63–259) under `.plaiu` (e.g. `.btn{…}` → nested → `.plaiu .btn`). Replace every `var(--plai-…)` reference as-is (the tokens exist from Steps 3–4); the design already uses `--plai-*` names so they map directly.
  - **Keyframes are top-level** (cannot nest): place `@keyframes rise`, `@keyframes bob`, `@keyframes spinsun` (lines 270–274) at file top-level, not inside `.plaiu`.
  - **Reveal/animation gating:** the design gates animation on `body.anim`. Replace with always-on (base state already visible; `.in` is added by the observer):
    ```css
    @media (prefers-reduced-motion: no-preference){
      .plaiu .reveal.in{animation:rise .6s cubic-bezier(.2,.7,.2,1) forwards;}
      .plaiu .reveal.in.d1{animation-delay:.07s;}
      .plaiu .reveal.in.d2{animation-delay:.14s;}
      .plaiu .reveal.in.d3{animation-delay:.21s;}
      .plaiu .mascot svg{animation:bob 4.5s ease-in-out infinite;transform-origin:center bottom;}
      .plaiu .sun .rays{animation:spinsun 60s linear infinite;transform-origin:center;}
    }
    ```
  - **`data-folk`/`data-bg`/`data-mascot`/`data-doodle` selectors** (lines 106, 127–131, 137): the design keys these off `html[data-*]`. Bake the static config instead — drop the `data-bg` background variants and `data-mascot="fara"` rule; keep folk detail visible (equivalent to `data-folk="1"`), keep the doodle. Concretely: do not port lines 45–53, 106–107, 127–131, 137; keep `.stitch{display:none}` (folk=2 stitch stays hidden).
  - **Media queries** (lines 151–159, 265–291) nest fine inside `.plaiu` — port them nested, except move the keyframes noted above to top-level.

- [ ] **Step 6: Verify the draw app is untouched + it compiles**

Run:
```bash
npx tsc --noEmit && pnpm build 2>&1 | tail -5
grep -c "\.plaiu" app/globals.css
```
Expected: build passes; `.plaiu` appears many times. Manually confirm no Plaiu selector is unscoped (every new component rule is under `.plaiu`).

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "Add scoped Plaiu design system: fonts, tokens, component CSS"
```

---

## Task 2: Reveal wrapper, nav, footer, mascot

**Files:**
- Create: `components/plaiu/reveal.tsx`, `components/plaiu/plaiu-nav.tsx`, `components/plaiu/plaiu-footer.tsx`, `components/plaiu/plaiu-mascot.tsx`

- [ ] **Step 1: `components/plaiu/reveal.tsx`** (client — base visible, adds `.in` when in view)

```tsx
'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  delay?: 1 | 2 | 3
  className?: string
}

export function Reveal({ children, as, delay, className }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    const r = el.getBoundingClientRect()
    if (r.top < (window.innerHeight || 800) * 0.95) {
      el.classList.add('in')
      io.unobserve(el)
    }
    return () => io.disconnect()
  }, [])
  return (
    <Tag
      ref={ref}
      className={['reveal', delay ? `d${delay}` : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: `components/plaiu/plaiu-nav.tsx`** (server) — port nav markup, design lines 296–308

```tsx
import Link from 'next/link'

export function PlaiuNav() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="wordmark" href="/" aria-label="Plaiu — acasă">
          Plaiu<span className="dot" />
        </Link>
        <nav className="nav-links" aria-label="Navigare">
          <a className="nav-link" href="#moduri">Desenează</a>
          <a className="nav-link" href="#verticale">Verticale</a>
          <a className="nav-link" href="#parinti">Pentru părinți</a>
          <div className="nav-cta-wrap">
            <Link className="btn btn-primary" href="/desen">Hai să desenăm</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: `components/plaiu/plaiu-footer.tsx`** (server) — port footer, design lines 647–659; rewrite links

```tsx
import Link from 'next/link'

export function PlaiuFooter() {
  return (
    <footer>
      <div className="foot-in">
        <div className="foot-brand">
          <Link className="wordmark" href="/">Plaiu<span className="dot" /></Link>
          <span className="foot-credit">Făcut cu <span className="heart">♥</span> în România</span>
        </div>
        <nav className="foot-links" aria-label="Legal">
          <Link href="/parinti">Pentru părinți</Link>
          <Link href="/termeni">Termeni</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: `components/plaiu/plaiu-mascot.tsx`** (server) — the "copil" SVG, design lines 318–340

Copy the exact `<svg class="m-copil" …>…</svg>` markup (lines 318–340) into a string and render it. Only the `copil` variant (drop `m-pensula`, lines 342–356):

```tsx
const MASCOT_SVG = `
<svg class="m-copil" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="Mascotă Plaiu — copil pe plai">
  <!-- paste lines 319–339 of docs/plaiu-design/Plaiu Home.html verbatim -->
</svg>`

export function PlaiuMascot() {
  return <div className="mascot reveal" dangerouslySetInnerHTML={{ __html: MASCOT_SVG }} />
}
```

(Keep `class=` inside the raw SVG string — it's injected as HTML, not JSX. The string must contain the real SVG children from the design file, not the comment placeholder.)

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/reveal.tsx components/plaiu/plaiu-nav.tsx components/plaiu/plaiu-footer.tsx components/plaiu/plaiu-mascot.tsx
git commit -m "Add Plaiu reveal wrapper, nav, footer, mascot"
```

---

## Task 3: Hero + drawable doodle

**Files:**
- Create: `components/plaiu/hero.tsx`, `components/plaiu/hero-doodle.tsx`

- [ ] **Step 1: `components/plaiu/hero-doodle.tsx`** (client) — port the canvas logic from design lines 683–780

This is the interactive drawable layer + color toolbar + clear + demo squiggle. Port the vanilla JS into React. CTA navigates to `/desen` (no cross-app seed). Full component:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const COLORS = [
  { c: '#E63946', label: 'Roșu' },
  { c: '#FFD93D', label: 'Galben' },
  { c: '#7CB342', label: 'Verde' },
  { c: '#6BB6E8', label: 'Albastru' },
  { c: '#2D3047', label: 'Închis' },
]

export function HeroDoodle() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroElRef = useRef<HTMLElement | null>(null)
  const colorRef = useRef('#E63946')
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const hasStrokeRef = useRef(false)
  const [activeColor, setActiveColor] = useState('#E63946')
  const [hintGone, setHintGone] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [drawOn, setDrawOn] = useState(false)

  useEffect(() => {
    const cv = canvasRef.current
    const hero = cv?.closest('.hero') as HTMLElement | null
    if (!cv || !hero) return
    heroElRef.current = hero
    const ctx = cv.getContext('2d')!

    const fit = () => {
      const w = hero.clientWidth, h = hero.clientHeight
      if (w < 2 || h < 2) { requestAnimationFrame(fit); return }
      const prev = cv.width > 0 && hasStrokeRef.current ? cv.toDataURL() : null
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, w, h); img.src = prev }
    }
    fit()
    let rt: ReturnType<typeof setTimeout>
    const refit = () => { clearTimeout(rt); rt = setTimeout(fit, 150) }
    window.addEventListener('resize', refit)
    if (document.fonts?.ready) document.fonts.ready.then(refit)
    const ro = window.ResizeObserver ? new ResizeObserver(refit) : null
    ro?.observe(hero)

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const firstStroke = () => {
      if (hasStrokeRef.current) return
      hasStrokeRef.current = true
      setHintGone(true); setShowContinue(true)
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      try { cv.setPointerCapture(e.pointerId) } catch {}
      drawingRef.current = true
      const p = pos(e); lastRef.current = p
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colorRef.current
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill()
      firstStroke()
    }
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return
      e.preventDefault()
      const p = pos(e)
      ctx.strokeStyle = colorRef.current; ctx.lineWidth = 7
      ctx.beginPath(); ctx.moveTo(lastRef.current.x, lastRef.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
      lastRef.current = p
    }
    const stop = () => { drawingRef.current = false }
    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerup', stop)
    cv.addEventListener('pointercancel', stop)

    // demo squiggle on fine pointers
    let raf = 0
    const mm = window.matchMedia
    if (mm?.('(prefers-reduced-motion: no-preference)').matches && mm('(pointer:fine)').matches) {
      const t = setTimeout(() => {
        if (hasStrokeRef.current || hero.clientWidth < 900) return
        const w = hero.clientWidth, h = hero.clientHeight
        const x0 = w * 0.09, y0 = h - 128, len = 130
        let i = 1; const N = 44
        ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 7; ctx.lineCap = 'round'
        const step = () => {
          if (hasStrokeRef.current || i > N) return
          const t0 = (i - 1) / N, t1 = i / N
          ctx.beginPath()
          ctx.moveTo(x0 + t0 * len, y0 + Math.sin(t0 * Math.PI * 3) * 13)
          ctx.lineTo(x0 + t1 * len, y0 + Math.sin(t1 * Math.PI * 3) * 13)
          ctx.stroke(); i++; raf = requestAnimationFrame(step)
        }
        step()
      }, 1400)
      return () => {
        clearTimeout(t); cancelAnimationFrame(raf)
        window.removeEventListener('resize', refit); ro?.disconnect()
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove)
        cv.removeEventListener('pointerup', stop); cv.removeEventListener('pointercancel', stop)
      }
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', refit); ro?.disconnect()
      cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerup', stop); cv.removeEventListener('pointercancel', stop)
    }
  }, [])

  const pickColor = (c: string) => { colorRef.current = c; setActiveColor(c) }
  const clear = () => {
    const cv = canvasRef.current; const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore()
  }

  return (
    <>
      <canvas className="hero-canvas" ref={canvasRef} aria-label="Foaie de desen — încearcă aici" />
      <div className={`doodle-hint${hintGone ? ' gone' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 50 40" fill="none" stroke="#5b5f78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4 C 14 20 26 30 42 32" /><path d="M34 28 L 43 32 L 36 38" /></svg>
        încearcă aici!
      </div>
      <div className="doodle-ui" role="toolbar" aria-label="Culori de desen">
        {COLORS.map((c) => (
          <button key={c.c} className={`d${activeColor === c.c ? ' sel' : ''}`} style={{ background: c.c }} aria-label={c.label} onClick={() => pickColor(c.c)} />
        ))}
        <button className="dclear" aria-label="Șterge desenul" onClick={clear}>
          <svg viewBox="0 0 24 24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></svg>
        </button>
      </div>
      <button className={`doodle-continue${showContinue ? ' on' : ''}`} onClick={() => router.push('/desen')}>
        Ia desenul cu tine
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <button className={`doodle-toggle`} aria-label="Desenează pe plai" onClick={() => { setDrawOn((v) => !v); heroElRef.current?.classList.toggle('draw-on') }}>✏️</button>
    </>
  )
}
```

- [ ] **Step 2: `components/plaiu/hero.tsx`** (server) — hero copy + meadow scene + doodle

Port hero copy/eyebrow/H1/tagline/CTAs/chips (design lines 314–373) as JSX, and the meadow scene (cloud/sun/meadow SVGs, lines 375–395) via `dangerouslySetInnerHTML`. Compose `HeroDoodle` and `PlaiuMascot`. Rewrite the two hero CTAs (`/desen`, `#parinti`). Shape:

```tsx
import { PlaiuMascot } from './plaiu-mascot'
import { HeroDoodle } from './hero-doodle'
import { Reveal } from './reveal'
import Link from 'next/link'

const MEADOW_SCENE = `<!-- paste design lines 376–395: .cloud, .sun, .meadow SVG blocks verbatim -->`

export function Hero() {
  return (
    <section className="hero">
      <HeroDoodle />
      <div className="hero-inner">
        <PlaiuMascot />
        <Reveal as="span" delay={1} className="eyebrow">Desenăm gratis · fără cont</Reveal>
        <Reveal as="h1" delay={1}>
          Ce desenăm azi pe{' '}
          <span className="hl">Plaiu<svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11 Q 60 2 100 8 T 197 6" stroke="#FFD93D" strokeWidth="7" fill="none" strokeLinecap="round" /></svg></span>?
        </Reveal>
        <Reveal as="p" delay={2} className="tagline">Pe-un plai de desene, pe-o gură de joacă.</Reveal>
        <Reveal as="p" delay={2} className="sub">Apasă pe un mod și începe — fără cont, fără așteptare, fără reclame.</Reveal>
        <Reveal delay={3} className="hero-actions">
          <Link className="btn btn-primary" href="/desen">Hai să desenăm!</Link>
          <a className="btn btn-ghost" href="#parinti">Pentru părinți</a>
        </Reveal>
        <Reveal as="ul" delay={3} className="chips">
          {['Fără cont', 'Fără reclame', 'Sigur pentru cei mici'].map((t) => (
            <li key={t}><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>{t}</li>
          ))}
        </Reveal>
      </div>
      <div dangerouslySetInnerHTML={{ __html: MEADOW_SCENE }} />
    </section>
  )
}
```

(Note: `Reveal` renders the `.reveal` element; the design had `reveal d1` etc. — the `delay` prop maps to `d1/d2/d3`.)

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/hero.tsx components/plaiu/hero-doodle.tsx
git commit -m "Add Plaiu hero with drawable doodle canvas"
```

---

## Task 4: Play modes (with Surpriză randomizer)

**Files:**
- Create: `components/plaiu/play-modes.tsx`

- [ ] **Step 1: Write the component** (client — Surpriză randomizes client-side; no app change)

Port the 4 cards from design lines 416–453. Use the design's mode icons (the inner `<svg>` of each `.ic`, lines 426, 433, 440, 447) via raw strings. `liber/colorat/stickere` are `<Link>`s; `surpriza` is a button that randomizes.

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Reveal } from './reveal'

const COLORAT_TEMPLATES = ['bunny','cat','dog','dinosaur','flower','lion','plane','rocket','sun','tree','unicorn','car']

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`
// Paste each mode icon SVG inner markup from design lines 426/433/440/447:
const IC = {
  liber: `<!-- design line 426 svg -->`,
  colorat: `<!-- design line 433 svg -->`,
  stickere: `<!-- design line 440 svg -->`,
  surpriza: `<!-- design line 447 svg -->`,
}

const MODES = [
  { id: 'liber', cls: 'm1', href: '/desen?mode=blank', title: 'Pagină goală', sub: 'Începe de la zero', delay: undefined as 1 | undefined },
  { id: 'colorat', cls: 'm2', href: '/desen?mode=colorat', title: 'Pagini de colorat', sub: 'Alege un desen', delay: 1 as const },
  { id: 'stickere', cls: 'm3', href: '/desen?mode=blank', title: 'Stickere & ștampile', sub: 'Distrează-te cu stickere', delay: undefined },
] as const

export function PlayModes() {
  const router = useRouter()
  const surprise = () => {
    const blank = Math.random() < 0.5
    if (blank) router.push('/desen?mode=blank')
    else {
      const t = COLORAT_TEMPLATES[Math.floor(Math.random() * COLORAT_TEMPLATES.length)]
      router.push(`/desen?mode=colorat&template=${t}`)
    }
  }
  return (
    <section className="sec" id="moduri">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">4 moduri de joacă</span>
          <h2>Cu ce începem azi?</h2>
          <p>Două atingeri și creionul e pe pagină. Alege un mod și gata.</p>
        </Reveal>
        <div className="modes-grid">
          {MODES.map((m) => (
            <Reveal key={m.id} as={Link as never} delay={m.delay} className={`mode ${m.cls}`}>
              {/* if `as={Link}` typing is awkward, wrap a plain <Link> with className instead */}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Note on the card markup:** the `Reveal as={Link}` pattern above is illustrative; if passing `Link` to `Reveal`'s polymorphic `as` is type-awkward, instead render each card as a plain element and add the `reveal`/`d1` classes directly (the IntersectionObserver in `Reveal` is nice-to-have; for cards it's acceptable to use a static `reveal` class with a tiny inline observer OR just add `className="mode m1 reveal"` and rely on the page-level observer). Simplest robust approach — render cards directly without `Reveal`, keeping the `reveal` class for the CSS one-shot (cards are above the fold-ish and the homepage's reveal is cosmetic):

```tsx
        <div className="modes-grid">
          <Link className="mode m1 reveal" href="/desen?mode=blank">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.liber }} />
            <h3>Pagină goală</h3>
            <p className="msub">Începe de la zero</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <Link className="mode m2 reveal d1" href="/desen?mode=colorat">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.colorat }} />
            <h3>Pagini de colorat</h3>
            <p className="msub">Alege un desen</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <Link className="mode m3 reveal" href="/desen?mode=blank">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.stickere }} />
            <h3>Stickere &amp; ștampile</h3>
            <p className="msub">Distrează-te cu stickere</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <button className="mode m4 reveal d1" onClick={surprise} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.surpriza }} />
            <h3>Surpriză!</h3>
            <p className="msub">Lasă Plaiu să aleagă</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </button>
        </div>
```

Use this second (explicit) form. Keep the `MODES`/`surprise`/`COLORAT_TEMPLATES`/`IC`/`ARROW` consts; drop the first illustrative `.map`. Fill `IC.*` with the real SVG strings from the design lines noted. (Template ids are from `lib/templates.ts` — verify they match before relying on `&template=`; if `/desen` ignores an unknown `template` param, that's fine — it just opens colorat.)

- [ ] **Step 2: Confirm `/desen` tolerates the params**

Read `app/desen/page.tsx` to confirm `mode=blank|colorat` are handled and an extra `template` query param is harmless (it is — the page only reads `mode`). Do **not** modify `/desen`. If `template` would cause any error, drop it from `surprise` and just use `mode=colorat`.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/play-modes.tsx
git commit -m "Add Plaiu play-mode cards with client-side Surpriză"
```

---

## Task 5: Gallery (feed-shaped, seeded)

**Files:**
- Create: `components/plaiu/gallery-data.ts`, `components/plaiu/gallery.tsx`

- [ ] **Step 1: `components/plaiu/gallery-data.ts`** — typed seed list (swap-ready for a real feed later)

```ts
export interface GalleryItem {
  id: string
  who: string   // first name + age, e.g. "Maria, 6 ani"
  hearts: number
  art: string   // raw inline SVG markup for the artwork
}

// Seeded from the design's sample artworks. Each `art` is the inner SVG of the
// corresponding <div class="art"> in docs/plaiu-design/Plaiu Home.html.
export const GALLERY_SEED: GalleryItem[] = [
  { id: 'maria',  who: 'Maria, 6 ani',  hearts: 34, art: `<!-- design lines 467–476 -->` },
  { id: 'andrei', who: 'Andrei, 5 ani', hearts: 51, art: `<!-- design lines 484–492 -->` },
  { id: 'sofia',  who: 'Sofia, 7 ani',  hearts: 28, art: `<!-- design lines 501–509 -->` },
  { id: 'luca',   who: 'Luca, 4 ani',   hearts: 40, art: `<!-- design lines 518–523 -->` },
  { id: 'ana',    who: 'Ana, 8 ani',    hearts: 62, art: `<!-- design lines 531–537 -->` },
  { id: 'david',  who: 'David, 6 ani',  hearts: 45, art: `<!-- design lines 545–551 -->` },
]
```

- [ ] **Step 2: `components/plaiu/gallery.tsx`** — render the wall from the seed (design lines 457–562)

```tsx
import Link from 'next/link'
import { Reveal } from './reveal'
import { GALLERY_SEED } from './gallery-data'

const HEART = `<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg>`

export function Gallery() {
  return (
    <section className="sec gallery" id="galerie">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">De pe Plaiu</span>
          <h2>Desenele de azi ale celor mici</h2>
          <p>Mândri de ce-au făcut copiii. O selecție caldă, aleasă cu mâna — pe care o poate vedea oricine.</p>
        </Reveal>
        <div className="wall">
          {GALLERY_SEED.map((g) => (
            <figure className="poly reveal" key={g.id}>
              <div className="art" dangerouslySetInnerHTML={{ __html: g.art }} />
              <figcaption className="cap">
                <span className="who">{g.who}</span>
                <span className="heart"><span dangerouslySetInnerHTML={{ __html: HEART }} />{g.hearts}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <Reveal className="gallery-cta">
          <Link className="btn btn-primary" href="/desen">Desenează și tu</Link>
          <span className="gnote">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            Galeria e verificată de oameni înainte de publicare — doar prenume și vârstă, niciodată date personale.
          </span>
        </Reveal>
      </div>
    </section>
  )
}
```

(The `.heart` SVG in the caption uses `fill:var(--plai-folk)` from the scoped CSS; wrapping it in a span and injecting raw markup keeps the design's path exactly. The `.gnote` icon stroke is set to `var(--plai-meadow)` by the CSS — use `stroke="currentColor"` won't match; instead keep the design's `stroke="#7CB342"`? The design CSS sets `.gnote svg{stroke:var(--plai-meadow)}` via `stroke` attribute on the svg element — set `stroke` to none here and let CSS win, OR hardcode `stroke="#7CB342"`. Use `stroke="#7CB342"` to match the mockup.)

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/gallery-data.ts components/plaiu/gallery.tsx
git commit -m "Add Plaiu De pe Plaiu gallery (seeded, feed-shaped)"
```

---

## Task 6: Verticals, Trust, Story band, Final CTA

**Files:**
- Create: `components/plaiu/verticals.tsx`, `components/plaiu/trust.tsx`, `components/plaiu/story-band.tsx`, `components/plaiu/final-cta.tsx`

- [ ] **Step 1: `components/plaiu/verticals.tsx`** — 3 teaser cards (Povești, Sărbători, Animale)

Port design lines 566–593, but replace the **Biblie** card with **Animale**, and keep Povești + Sărbători. All `href="#"` (no destination yet), all `vbadge` = "în curând".

```tsx
import { Reveal } from './reveal'

const V = [
  { cls: 'tint-povesti',   ic: '📖', title: 'Plaiu Povești',   text: 'Basmele românești — Făt-Frumos, Capra cu trei iezi, Greuceanu.', delay: undefined as 1 | 2 | undefined },
  { cls: 'tint-sarbatori', ic: '🎄', title: 'Plaiu Sărbători', text: 'Mărțișor, Paște, Crăciun — câte un plai pentru fiecare sărbătoare.', delay: 1 as const },
  { cls: 'tint-biblie',    ic: '🦁', title: 'Plaiu Animale',   text: 'O lume întreagă de animale de colorat — de la pisici la lei și balene.', delay: 2 as const },
]

export function Verticals() {
  return (
    <section className="sec verticals" id="verticale">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">Mai multe pe Plaiu</span>
          <h2>Tot mai multe plaiuri de explorat</h2>
          <p>Plaiu crește. Poveștile bunicilor, sărbătorile și o lume de animale — toate, colorate de mâinile celor mici.</p>
        </Reveal>
        <div className="vgrid">
          {V.map((v) => (
            <a className={`vcard ${v.cls} reveal${v.delay ? ` d${v.delay}` : ''}`} href="#" key={v.title} aria-disabled="true">
              <span className="vic">{v.ic}</span>
              <span className="vbadge">în curând</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
```

(Reuse the existing `.tint-biblie` class for the Animale card — it's just a warm yellow tint; no need to add a new tint. The 🦁 emoji replaces the dove.)

- [ ] **Step 2: `components/plaiu/trust.tsx`** — parents/trust, design lines 597–624. Rewrite the final `<a class="btn btn-ghost" href="#">` to `/parinti`. Port the 3 card icon SVGs via raw strings, copy the 3 cards as JSX.

```tsx
import Link from 'next/link'
import { Reveal } from './reveal'

const ICONS = {
  shield: `<!-- design line 606 svg -->`,
  lock:   `<!-- design line 611 svg -->`,
  heart:  `<!-- design line 616 svg -->`,
}

export function Trust() {
  return (
    <section className="sec" id="parinti">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">Pentru părinți</span>
          <h2>Un plai sigur pentru copilul tău</h2>
          <p>Gândit special pentru cei mici: cald, simplu, fără capcane.</p>
        </Reveal>
        <div className="tgrid">
          <Reveal className="tcard"><span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.shield }} /><h3>Fără cont, fără reclame</h3><p>Nici email, nici nume, nici reclame agresive. Desenele rămân la voi.</p></Reveal>
          <Reveal className="tcard" delay={1}><span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.lock }} /><h3>Doar strict necesar</h3><p>Fără urmărire, fără cookie-uri de marketing. „Salvează” descarcă un PNG.</p></Reveal>
          <Reveal className="tcard" delay={2}><span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.heart }} /><h3>Făcut cu drag în România</h3><p>Limba română de la cap la coadă și o poveste folk în fiecare colț.</p></Reveal>
        </div>
        <Reveal className="">
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link className="btn btn-ghost" href="/parinti">Cum funcționează Plaiu →</Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `components/plaiu/story-band.tsx`** — design lines 628–635 (Miorița band). Port copy + hills-deco SVG via raw string.

```tsx
import { Reveal } from './reveal'

const HILLS = `<svg class="hills-deco" viewBox="0 0 1600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 300 10 560 30 880 22 C 1180 14 1400 36 1600 26 L1600 60 L0 60 Z" fill="#ffffff"/></svg>`

export function StoryBand() {
  return (
    <Reveal as="section" className="story">
      <div className="story-in">
        <p className="quote">„Pe-un picior de <span className="em">plai</span>,<br />pe-o gură de rai.”</p>
        <p className="src">— Miorița</p>
        <p className="lede"><em>Plaiu</em> e pajiștea înaltă, locul poveștilor bunicilor noștri. Am construit un plai digital cald și sigur, unde orice copil își poate aduce imaginația la viață. Pentru că orice copil merită un plai al lui.</p>
        <div dangerouslySetInnerHTML={{ __html: HILLS }} />
      </div>
    </Reveal>
  )
}
```

- [ ] **Step 4: `components/plaiu/final-cta.tsx`** — design lines 638–643. CTA → `/desen`.

```tsx
import Link from 'next/link'
import { Reveal } from './reveal'

export function FinalCta() {
  return (
    <Reveal as="section" className="ctaband">
      <h2>Hai pe Plaiu să desenăm!</h2>
      <p>Două atingeri și ești pe pagină. Fără cont, fără grabă.</p>
      <Link className="btn btn-sun" href="/desen">Începe să desenezi</Link>
      <p className="mini">Gratis pentru totdeauna · pentru copii de 3–10 ani</p>
    </Reveal>
  )
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/plaiu/verticals.tsx components/plaiu/trust.tsx components/plaiu/story-band.tsx components/plaiu/final-cta.tsx
git commit -m "Add Plaiu verticals, trust, story band, final CTA"
```

---

## Task 7: Compose homepage + rebrand content pages

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/parinti/page.tsx`, `app/termeni/page.tsx`, `app/confidentialitate/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`** with the Plaiu composition

```tsx
import { PlaiuNav } from '@/components/plaiu/plaiu-nav'
import { Hero } from '@/components/plaiu/hero'
import { PlayModes } from '@/components/plaiu/play-modes'
import { Gallery } from '@/components/plaiu/gallery'
import { Verticals } from '@/components/plaiu/verticals'
import { Trust } from '@/components/plaiu/trust'
import { StoryBand } from '@/components/plaiu/story-band'
import { FinalCta } from '@/components/plaiu/final-cta'
import { PlaiuFooter } from '@/components/plaiu/plaiu-footer'

export default function HomePage() {
  return (
    <div className="plaiu">
      <PlaiuNav />
      <main>
        <Hero />
        <PlayModes />
        <Gallery />
        <Verticals />
        <Trust />
        <StoryBand />
        <FinalCta />
      </main>
      <PlaiuFooter />
    </div>
  )
}
```

- [ ] **Step 2: Wrap the three content pages in Plaiu chrome**

For each of `app/parinti/page.tsx`, `app/termeni/page.tsx`, `app/confidentialitate/page.tsx`: read the file, then wrap its existing returned content in the Plaiu shell **without changing the copy**:

```tsx
import { PlaiuNav } from '@/components/plaiu/plaiu-nav'
import { PlaiuFooter } from '@/components/plaiu/plaiu-footer'
// ...existing imports...

export default function Page() {
  return (
    <div className="plaiu">
      <PlaiuNav />
      <main className="wrap" style={{ padding: '40px 22px 64px' }}>
        {/* existing page content goes here, unchanged */}
      </main>
      <PlaiuFooter />
    </div>
  )
}
```

If a page is currently a client component or has its own layout assumptions, keep them; only add the `.plaiu` wrapper + Nav/Footer. Do not alter the legal/parents text.

- [ ] **Step 3: Build + typecheck**

```bash
npx tsc --noEmit && pnpm build 2>&1 | tail -8
```
Expected: build succeeds; `/` and the three content routes prerender without error.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/parinti/page.tsx app/termeni/page.tsx app/confidentialitate/page.tsx
git commit -m "Compose Plaiu homepage and apply Plaiu chrome to content pages"
```

---

## Task 8: Full verification

- [ ] **Step 1: Build + typecheck**

Run: `npx tsc --noEmit && pnpm build`
Expected: both pass, all routes compile.

- [ ] **Step 2: Manual browser checks (`pnpm dev`)**

- `/` renders the full Plaiu homepage matching `docs/plaiu-design/screenshots/` (hero, modes, gallery, verticals, trust, story, CTA, footer).
- Drawable hero: draw with mouse + touch; color swatches switch; clear works; "Ia desenul cu tine" → `/desen`; coarse-pointer toggle (✏️) shows/hides drawing so scroll still works.
- Mode cards: Pagină goală → `/desen?mode=blank`, Colorat → `/desen?mode=colorat`, Stickere → `/desen?mode=blank`, **Surpriză** → a valid random destination each click.
- Verticals show Povești · Sărbători · Animale, all "în curând".
- Reveal animations play once on scroll; with JS disabled, all content is visible.
- Responsive at iPad + phone widths (matches `mobile.png`): single-col modes, 2-col grids, nav links hidden on phone.
- Links: nav/footer → `/desen`, `/parinti`, `/termeni`, `/confidentialitate`.

- [ ] **Step 3: Confirm the draw app is untouched (critical)**

- Visit `/desen` and `/desen?mode=colorat`: the draw page looks and behaves exactly as before (Riza tokens/fonts, all tools, sounds, zoom, drafts). No Plaiu fonts/colors bleed in.
- `git diff --stat <base>..HEAD` shows **no** changes under `components/` draw files, `app/desen/`, `app/povesti/`, `app/admin/`, `lib/` (draw logic), or the existing Riza token block in `globals.css` (only additions).

- [ ] **Step 4: Final commit (if manual tweaks were needed)**

```bash
git add -A && git commit -m "Polish Plaiu homepage after manual verification"
```

---

## Self-review notes

- **Spec coverage:** scoped design system → Task 1; reveal/nav/footer/mascot → Task 2; hero + drawable doodle (CTA→/desen, no seed) → Task 3; 4 mode cards incl. client Surpriză, Stickere→blank → Task 4; feed-shaped seeded gallery → Task 5; verticals (Povești/Sărbători/Animale, no Biblie) + trust + story + CTA → Task 6; compose page + content-page rebrand + metadata → Tasks 1 & 7; `/desen`/`/povesti`/`/admin` untouched → enforced in every task + Task 8 Step 3. ✅
- **App-frozen invariant:** no task edits `app/desen/**`, `app/povesti/**`, `app/admin/**`, or draw components. Surpriză/Stickere use only existing `/desen` params (Task 4 Step 2 verifies tolerance). ✅
- **Type consistency:** `GalleryItem`/`GALLERY_SEED` (Task 5) consumed in `gallery.tsx`; `Reveal` props (`as`, `delay`, `className`) consistent across Tasks 2–6; component names match the imports in `app/page.tsx` (Task 7). ✅
- **Decorative-SVG placeholders:** every `<!-- design lines X–Y -->` placeholder MUST be replaced with the verbatim SVG from `docs/plaiu-design/Plaiu Home.html` during implementation — they are explicit copy instructions, not shippable content. The implementer must open that file and paste the real markup.
```
