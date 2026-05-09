# Responsive + touch redesign

## Context

Riza's current floating toolbar was tuned for desktop preview. On real devices the kids actually use, three problems compound:

1. **Overflow** — the bottom dock packs colors + tools + brush sizes + undo/clear/save into one row. On a 360 px phone the row exceeds the viewport.
2. **Reach** — bottom-center is an awkward stretch on tablet, where the kid's drawing hand is along the side of the device.
3. **Sidebar covers the dock** — `TemplateSidebar` is `w-80` (320 px) sliding from the left. On phone that's ~89 % of the screen, and the dock at bottom-center is partially obscured.

Stylus support was also flagged as a nice-to-have. Apple Pencil pressure → brush-size variation is a small addition that benefits older kids on iPad without affecting finger drawing.

This spec covers the responsive redesign and the cheap stylus addition. No new modes, no new templates, no new persistence.

## Goals

- Tools are always reachable on phones **and** tablets, in either orientation.
- Sidebars never compete with the toolbar for the same real estate.
- Pressure-sensitive stylus drawing on devices that report it; touch and mouse unaffected.
- No regressions to the existing Romanian copy, accessibility, or reduced-motion support.

## Non-goals

- Palm rejection. Hard problem; not worth the scope here.
- Tilt-based brush effects. Would require a real brush engine.
- Landscape-only or portrait-only optimisation. Both work, neither is hand-tuned.
- Persisting user tool/color preferences across sessions.

## Design

### Two layouts, one breakpoint

The breakpoint is Tailwind's default `md` (768 px). Below `md` we render a phone layout; at or above `md` we render a tablet layout. The split is a single conditional inside `floating-toolbar.tsx` (and parallel logic in the sidebars), so the two layouts share state and behavior — only presentation diverges.

#### Phone (< 768 px) — bottom dock with popovers

Single horizontal row, fixed bottom-center, ~`max-w-[min(96vw,520px)]`. Buttons (52 px tap target each):

```
[ picker? ] | [ brush ] [ eraser ] [ fill ] | [ color ] [ size ] | [ undo ] [ clear ] [ save ]
```

- `picker` only appears in `colorat` / `surpriza` / `stampile` modes.
- `color` is a single swatch button showing the current color. Tap → Radix `Popover` opens upward with the full 14-swatch palette in a 4-wide grid.
- `size` is a single button showing the current brush diameter. Tap → Popover with the four size presets.
- Dividers (`w-px h-8 bg-border`) collapse to thin gaps on widths under 380 px so the row never overflows. If width still exceeds the viewport, allow horizontal scroll inside the dock as a final fallback.

#### Tablet (≥ 768 px) — vertical right-edge rail

Fixed to the right edge, vertical, full-height-minus-top-bar, ~80 px wide. Layout top to bottom:

```
[ picker? ]
[ brush ] [ eraser ] [ fill ]
─────
14 colors stacked (always visible, no popover)
─────
4 sizes stacked
─────
[ undo ] [ clear ] [ save ]
```

- Right edge mirrors the natural drawing hand for right-handed users (the majority); a future preference toggle could mirror to left.
- Colors and sizes are always visible — there is room — so we save the kid one tap.
- Same `tool-btn` styling and animations as today.

### Sidebar coexistence

The sidebar pattern flips with the same `md` breakpoint:

- **Phone**: `TemplateSidebar` and `StampSidebar` become bottom-sheet drawers using `vaul` (already a dependency, already used by `save-share-sheet.tsx`). The drawer occupies up to ~85 % of viewport height with a drag handle. While the drawer is open the dock fades out (`opacity-0 pointer-events-none`, `transition` 200 ms) so it can't accidentally receive taps and so the kid's focus is on picking.
- **Tablet**: keep the existing `w-80` left-sliding panel. The dock lives on the right edge, so they don't overlap. The dock stays interactive (kid can keep coloring on the visible canvas slice if they want, though the picker is the primary intent).

The two sidebars (`TemplateSidebar`, `StampSidebar`) share enough structure that we extract a small `Sidebar` shell that switches between vaul Drawer and the existing panel. Each picker still owns its filters / grid content.

### Stylus pressure

In `kid-canvas.tsx`, both `handlePointerDown` and `handlePointerMove` derive an effective brush size:

```ts
const isPen = e.pointerType === 'pen'
const pressure = isPen ? Math.max(0.05, e.pressure || 0.5) : 1
const effectiveSize = brushSize * (isPen ? 0.4 + pressure * 1.2 : 1)
```

Notes:
- Default `pressure` for stylus that doesn't report it is 0.5 (browser default), so `effectiveSize === brushSize`. Behaviour is identical for those devices.
- Floor at 0.05 prevents zero-width strokes from soft taps.
- Touch and mouse are untouched — we don't read pressure for them.
- The stroke between two points uses the destination point's pressure (we update `lineWidth` on every move). For initial dot, we use the down-event pressure.

This is purely a `kid-canvas.tsx` change — no UI surface changes.

### Other touch hardening

- Add `select-none touch-none` to the canvas container.
- Add `-webkit-touch-callout: none; -webkit-user-select: none` via the existing `.touch-canvas` class in `globals.css` (verify it's already there; tighten if not).
- In stamps mode, `KidCanvas` already places a stamp on pointer-down when `stampSrc` is set. Add an early return on pointer-down when `mode==='stampile'` *and* `stampSrc` is `null`, so a kid who closes the stamp sheet without picking can't accidentally draw freehand strokes. Pass a `disabled` flag from the desen page in that case (cleaner than threading mode awareness into the canvas).

### Components

| File | Change |
| --- | --- |
| `components/floating-toolbar.tsx` | Refactor to detect viewport via Tailwind classes (`hidden md:flex` / `flex md:hidden`) and render two siblings — `BottomDock` (phone) and `SideRail` (tablet). Both delegate to the same prop callbacks. |
| `components/color-popover.tsx` (new) | Wraps a single swatch button in a Radix `Popover` showing the full palette. Phone-only. |
| `components/size-popover.tsx` (new) | Same pattern for brush sizes. Phone-only. |
| `components/sidebar-shell.tsx` (new) | Tiny shell that picks vaul `Drawer` (phone) or the existing fixed panel (tablet). Receives `title`, `children`, `isOpen`, `onClose`. |
| `components/template-sidebar.tsx` | Wrap content in `SidebarShell`. Filters and grid unchanged. |
| `components/stamp-sidebar.tsx` | Same. |
| `components/kid-canvas.tsx` | Pressure-derived brush width; `disabled` prop that no-ops pointer events. |
| `app/desen/page.tsx` | Pass `disabled` to canvas in stamps mode when no stamp is selected. Fade dock when sidebar `isOpen` (phone only — `useMediaQuery('(max-width: 767px)')` or pure CSS). |
| `app/globals.css` | Add `.dock-hidden` utility (`opacity-0 pointer-events-none transition-opacity duration-200`). Tighten `.touch-canvas` if needed. |

### Data flow

No new state. The toolbar already lifts color / brush size / tool to the desen page. Popovers are local UI state inside `color-popover` / `size-popover`. Sidebar `isOpen` already lives in the desen page. Pressure is derived per-event inside the canvas. No persistence layer added.

## Verification

### Build / typecheck

- `pnpm exec tsc --noEmit` passes cleanly.
- `pnpm build` succeeds, all routes prerender.

### DevTools simulation

1. **Phone breakpoint** — open `/desen?mode=colorat` in Chrome DevTools at 360 × 740. Confirm:
   - Dock fits within viewport, all 9 buttons tappable, no horizontal scrollbar.
   - Tap color swatch → popover with 14 colors opens upward.
   - Tap size button → popover with 4 sizes opens upward.
   - Tap picker → bottom sheet rises, dock fades, tapping a template closes the sheet and the dock reappears.
2. **Tablet breakpoint** — at 1024 × 768, confirm:
   - Right-edge vertical rail visible. Colors stacked, no popover used.
   - Picker opens left-side panel; rail stays interactive on the right.
3. **Pressure** — DevTools' `Sensors → Pen` simulation. Vary pressure; confirm stroke width changes. With finger pointer type, stroke width matches the picked size exactly.
4. **Stamps no-op** — enter stamps mode, close the sheet without picking → tapping the canvas does nothing. Pick a stamp → tapping places it.
5. **Reduced motion** — set `prefers-reduced-motion: reduce`. Drawer slide and dock fade should collapse to ~0 ms (already handled in `globals.css`).

### Local testing on real phone / tablet

To test on the actual devices the kids will use, while iterating:

```bash
# In one terminal:
pnpm dev -- --hostname 0.0.0.0
# (or: HOST=0.0.0.0 pnpm dev)

# In another terminal, find the LAN IP:
ipconfig getifaddr en0   # macOS Wi-Fi
# e.g. 192.168.1.42
```

On the phone or tablet (same Wi-Fi network), open `http://192.168.1.42:3000/`. No HTTPS required — `PointerEvent.pressure` and `touch-action` work on plain HTTP over LAN.

Things to verify on real hardware that DevTools can't simulate:

- No browser scroll/zoom while drawing inside the canvas.
- No long-press context menu on canvas (iOS Safari is the strict one).
- Apple Pencil pressure produces visibly varying stroke width.
- Bottom sheet drawer dismisses with a downward swipe, not just tap-on-backdrop.
- Address-bar collapse on scroll doesn't shift the dock awkwardly.

If iOS Safari shows the URL bar overlapping the dock, add `env(safe-area-inset-bottom)` padding to the dock — only do this if the issue actually appears.
