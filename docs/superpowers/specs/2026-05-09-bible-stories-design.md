# Povesti din Biblie — design

## Context

Riza today has two coloring modes: blank canvas and locked-template coloring. The user wants a third surface — a Bible-stories progression for kids — that turns each major story into a coloring/drawing checkpoint along a magical scrollable timeline. Kids unlock one story at a time by completing the previous one. While drawing, a side panel shows the kid-friendly retelling of the story.

The intent is **immersive and magical** rather than utilitarian. The landing should feel like a treasure-map journey through the Bible. Drawing each story leaves a colored thumbnail on its checkpoint, so the kid can see their own art accumulating along the path.

This spec covers the technical system + the canonical list of 50 stories with sample texts. Real bible-themed coloring templates are explicitly out of scope for v1 — kids draw freehand on a white canvas while reading the story.

## Goals

- A scrollable, parchment-feeling landing page at `/povesti` showing the 50 stories as checkpoints along a winding path.
- Strict linear unlock: story N+1 only opens when N is marked "Gata!".
- Each story page shows the retelling alongside a drawing canvas reusing all existing tools (brush/eraser/fill/stamp, color popovers, sidebars).
- In-progress drawings auto-save and resume — including on different sessions on the same device.
- Finished drawings show as thumbnails on the landing checkpoint.
- All 50 retellings written in kid-friendly Romanian for v1.

## Non-goals

- Cross-device sync. localStorage / IndexedDB are device-bound. Adding accounts is a v2 question.
- Bible-themed coloring templates per story. Tracked as a follow-up content task; v1 ships with blank canvases.
- Doctrinal commentary, multiple translations, audio narration, parental dashboards. Pure read + draw.
- A "parents can unlock all" override. Strict linear progression for v1; override is easy to add later if requested.
- Multi-user profiles on one device.

## Design

### Routes

- `GET /povesti` — landing with the magic timeline
- `GET /povesti/[storyId]` — story detail (canvas + story panel)
- `GET /` — gains a third card "Povesti din Biblie"

The existing `/desen?mode=blank|colorat` is untouched.

### Data model — `lib/stories.ts`

```ts
export type Testament = 'vechi' | 'nou'

export interface Story {
  id: string                  // 'creatie', 'noe', ...
  order: number               // 1..50, drives unlock + landing position
  testament: Testament
  titleRo: string             // 'Creatia lumii'
  scriptureRef: string        // 'Geneza 1'
  summary: string             // one short line, shown on landing checkpoint
  paragraphs: string[]        // 3–5 short paragraphs, story panel
  templateSrc: string | null  // null in v1; bible-themed art is content task
  accentColor: string         // hex, used for checkpoint glow + panel header
}

export const STORIES: Story[] = [ /* 50 entries */ ]
export function getStoryById(id: string): Story | undefined
export function getNextStory(id: string): Story | undefined
```

Stories are statically authored in this single file — same admin-friendly pattern as `lib/templates.ts`. Order is explicit (`order` field), not array index, so reordering is a one-line edit per affected story.

### Persistence — `lib/progress.ts` (IndexedDB via `idb`)

`idb` is a 1 KB gzipped promise wrapper for IndexedDB. Two object stores:

- `progress`: keyed by storyId. Value: `{ status, updatedAt }`. Status is `'available' | 'in-progress' | 'done'`. Locked stories are *absent* from the store and computed on read.
- `canvases`: keyed by storyId. Value: PNG `Blob`. Holds in-progress drawings + finished snapshots.

Public API:

```ts
getStatus(id: string): Promise<StoryStatus>             // resolves with computed status, including 'locked'
setStatus(id, status): Promise<void>
markDone(id): Promise<void>                             // sets done + unlocks next
saveCanvas(id, blob): Promise<void>
loadCanvas(id): Promise<Blob | null>
loadAllStatuses(): Promise<Map<string, StoryStatus>>    // for the landing
clearAll(): Promise<void>                               // for parent reset (out of scope v1, but trivial to wire)
```

`getStatus` rule: a story is `'locked'` unless it's the first OR the previous story (by `order`) is `'done'`.

`markDone(id)` writes done for `id`, then writes `'available'` for the next story. (No-op if next is already `'available'` or `'done'`.)

Auto-save: in `KidCanvas`, when running on a story page, call a debounced `onCanvasIdle(blob)` callback 1 second after the last stroke. Debounce reset on every new stroke. The story page wires that callback to `saveCanvas(storyId, blob)`. Story status flips from `'available'` to `'in-progress'` on the first save.

Restore: on entering `/povesti/[id]`, `loadCanvas(id)` returns a Blob if any. The story page passes it to `KidCanvas` via a new `initialImageBlob?: Blob` prop. The canvas paints that blob into its drawing layer on mount, before allowing pointer input.

### Landing page — `/povesti`

Vertical scrollable column of viewport width. Background: parchment radial gradient (cream → soft amber) + 5–7 CSS-animated `<div>` twinkles drifting upward. The path: a single SVG element spanning the full document height, with a smooth Bezier path winding left/right left/right (alternating per checkpoint). Stroke is a dashed warm-amber color. The path is purely decorative — checkpoints are positioned independently in the DOM, not strictly bound to the SVG path coordinates (simpler maintenance).

Each checkpoint is a positioned `<button>`:
- Vertical spacing: 180 px between checkpoints. Total scroll height ~9000 px for 50.
- Alternating x-offset: odd-indexed center-left (~30 % from left), even-indexed center-right.
- Visual states:
  - **`locked`**: grayscale icon + chain overlay, opacity 0.45, no pulsing. `aria-disabled`.
  - **`available`**: full color, accent-colored glow ring (CSS `box-shadow` pulse animation). The very first available story (lowest order with status `'available'`) gets a stronger "you are here" arrow above it.
  - **`in-progress`**: 80 px circle showing the cropped canvas thumbnail (loaded from `canvases` store, converted via `URL.createObjectURL`), accent ring, no pulse.
  - **`done`**: same thumbnail, with a small star/sparkle SVG in the corner.
- Below each checkpoint: title (1 line, ellipsis) + scripture ref (smaller).

A subtle chapter divider after order 30 — "Noul Testament" header in serif/display font with a small flourish.

Tap behavior:
- locked → 250 ms wiggle + sonner toast: "Termina povestea anterioara mai intai!"
- available / in-progress / done → `router.push('/povesti/' + id)`

### Story detail — `/povesti/[storyId]`

Layout depends on viewport width, like the FloatingToolbar:

**Mobile (< 768 px)**:
- Canvas full-width, full-height under the existing FloatingTopBar.
- Bottom dock toolbar (existing, with stamps + colors).
- A small parchment "Citeste povestea" pill button bottom-left of the top bar that opens a vaul `Drawer` (bottom sheet) with the story panel.

**Tablet/desktop (≥ 768 px)**:
- Two-pane layout: canvas on the left filling viewport-minus-panel, story panel ~340 px on the right.
- Existing SideRail floating-toolbar lives inside the canvas area, anchored to its right edge (visually adjacent to the panel's left edge).

Story panel content:
- Accent-colored header strip with title + scripture ref.
- Body: paragraphs rendered as `<p>` elements.
- **"Gata!"** primary button (mint green, large) — marks done + navigates to `/povesti` with a `?completed=<id>` query param so the landing can play the celebration animation on mount.
- "Salveaza" lives in the toolbar (download as PNG, same as today).

The Suspense fallback shows the same spinner as `/desen`.

If the storyId is unknown or its computed status is `'locked'`, redirect server-side to `/povesti`. The 404 fallback handles arbitrary garbage ids.

### Completion flow

1. Kid taps "Gata!".
2. Canvas snapshots itself (`canvas.toDataURL('image/png')` then converted to Blob); written to `canvases` store.
3. `markDone(id)` writes `done` for current, `available` for next.
4. Navigate to `/povesti?completed=<id>`.
5. Landing reads `?completed=<id>` once, plays a 1.5 s sequence: just-completed checkpoint pulses brighter, then the newly-available checkpoint's chain icon dissolves and its glow ignites. After the animation, replace history (drop the query string).

### Home page integration

The `app/page.tsx` ModeCard grid grows from 2 to 3:
- "Deseneaza" (existing)
- "Coloreaza" (existing)
- "Povesti din Biblie" — gradient `from-yellow to-yellow-dark` (warm amber), description "Coloreaza si invata"

Layout: at `min-[420px]` switch from 1 col to 2 cols. With 3 cards on 2 cols, the third card spans full width below. That looks reasonable; can be revisited.

### KidCanvas changes (small)

Two additive props, no breaking changes:

```ts
interface KidCanvasProps {
  // ... existing props ...
  initialImageBlob?: Blob | null   // restore drawing on mount
  onCanvasIdle?: (blob: Blob) => void  // debounced 1s after last stroke
}
```

Implementation notes:
- `initialImageBlob` is consumed once on mount (after canvas size is set). Convert to `<img>`, draw onto the canvas, then null the prop usage.
- `onCanvasIdle` is debounced inside the canvas; uses `canvas.toBlob('image/png')`. Skipped when `disabled` is true.

### Romanian content — the 50 stories

The canonical v1 list, in order. Old Testament ×30 + New Testament ×20.

**Old Testament**

| # | id | titleRo | scriptureRef |
|---|---|---|---|
| 1 | creatie | Creatia lumii | Geneza 1 |
| 2 | adam-si-eva | Adam si Eva | Geneza 2-3 |
| 3 | cain-si-abel | Cain si Abel | Geneza 4 |
| 4 | arca-noe | Arca lui Noe | Geneza 6-9 |
| 5 | turnul-babel | Turnul Babel | Geneza 11 |
| 6 | avraam-chemat | Avraam, prietenul lui Dumnezeu | Geneza 12 |
| 7 | isaac-promis | Isaac, copilul promis | Geneza 21 |
| 8 | iacov-si-esau | Iacov si Esau | Geneza 25-27 |
| 9 | iosif-haina | Iosif si haina colorata | Geneza 37 |
| 10 | iosif-egipt | Iosif in Egipt | Geneza 41-45 |
| 11 | moise-cosulet | Moise in cosulet | Exod 2 |
| 12 | rugul-aprins | Rugul aprins | Exod 3 |
| 13 | zece-plagi | Cele zece plagi | Exod 7-12 |
| 14 | marea-rosie | Trecerea Marii Rosii | Exod 14 |
| 15 | mana-din-cer | Mana din cer | Exod 16 |
| 16 | zece-porunci | Cele zece porunci | Exod 20 |
| 17 | ierihon | Iosua la Ierihon | Iosua 6 |
| 18 | ghedeon | Ghedeon si trambitele | Judecatori 7 |
| 19 | samson | Samson cel puternic | Judecatori 16 |
| 20 | rut-si-boaz | Rut si Boaz | Rut 1-4 |
| 21 | samuel-chemat | Samuel chemat de Dumnezeu | 1 Samuel 3 |
| 22 | david-goliat | David si Goliat | 1 Samuel 17 |
| 23 | david-ionatan | David si Ionatan | 1 Samuel 18-20 |
| 24 | solomon-intelept | Intelepciunea lui Solomon | 1 Imparati 3 |
| 25 | ilie-corbii | Ilie si corbii | 1 Imparati 17 |
| 26 | ilie-carmel | Ilie pe muntele Carmel | 1 Imparati 18 |
| 27 | daniel-leii | Daniel in groapa cu lei | Daniel 6 |
| 28 | trei-tineri-cuptor | Cei trei tineri in cuptor | Daniel 3 |
| 29 | iona-pestele | Iona si pestele cel mare | Iona 1-2 |
| 30 | estera | Estera, regina curajoasa | Estera |

**New Testament**

| # | id | titleRo | scriptureRef |
|---|---|---|---|
| 31 | vestea-ingerului | Vestea ingerului | Luca 1 |
| 32 | nasterea | Nasterea lui Iisus | Luca 2 |
| 33 | magii | Magii din Rasarit | Matei 2 |
| 34 | iisus-12-ani | Iisus la 12 ani in Templu | Luca 2 |
| 35 | botezul | Botezul lui Iisus | Matei 3 |
| 36 | ispitirea | Ispitirea in pustie | Matei 4 |
| 37 | chemarea-ucenicilor | Chemarea ucenicilor | Matei 4 |
| 38 | nunta-cana | Nunta din Cana | Ioan 2 |
| 39 | predica-munte | Predica de pe munte | Matei 5-7 |
| 40 | furtuna-potolita | Iisus potoleste furtuna | Matei 8 |
| 41 | inmultirea-painilor | Inmultirea painilor | Ioan 6 |
| 42 | umbla-pe-apa | Iisus umbla pe apa | Matei 14 |
| 43 | pilda-semanator | Pilda semanatorului | Matei 13 |
| 44 | samariteanul | Pilda samariteanului milostiv | Luca 10 |
| 45 | fiul-risipitor | Pilda fiului risipitor | Luca 15 |
| 46 | iisus-copiii | Iisus si copiii | Marcu 10 |
| 47 | intrarea-ierusalim | Intrarea in Ierusalim | Matei 21 |
| 48 | cina-de-taina | Cina cea de Taina | Matei 26 |
| 49 | rastignirea | Rastignirea | Ioan 19 |
| 50 | invierea | Invierea Domnului | Matei 28 |

### Sample texts (3 of 50) — tone validation

These three stories are written out fully so we lock the voice before I draft the remaining 47. Each retelling is 3–5 short paragraphs, simple sentences, present-tense for narrative immediacy where it helps.

**1. Creatia lumii** (`creatie`, Geneza 1)

> La inceput, totul era intuneric si gol. Atunci Dumnezeu a vorbit, si lumina s-a aratat. "Sa fie lumina!" a spus El, si dintr-o data totul a stralucit.
>
> In sase zile, Dumnezeu a facut cerul si pamantul. A facut soarele, luna si stelele care clipesc noaptea. A umplut marile cu pesti si cerul cu pasari care zboara.
>
> A facut munti si flori, copaci grei de fructe si animale de toate felurile — leul, iepurasul, fluturele, elefantul. La urma, a facut omul, dupa chipul Sau.
>
> Si Dumnezeu a privit tot ce a facut si a vazut ca era foarte bun. In ziua a saptea, S-a odihnit.

**4. Arca lui Noe** (`arca-noe`, Geneza 6-9)

> Demult, oamenii uitasera de Dumnezeu si faceau numai rele. Doar Noe il iubea pe Dumnezeu. Asa ca Dumnezeu i-a spus: "Construieste o corabie mare, o arca, ca sa scapi de potop."
>
> Noe a muncit ani de zile. Cand arca a fost gata, a urcat in ea cu familia lui si cu cate doua animale din fiecare fel — leul si leoaica, elefantul si elefantica, soricelul si soricica.
>
> Apoi a inceput sa ploua. A plouat patruzeci de zile si patruzeci de nopti. Apa a acoperit tot pamantul, dar arca lui Noe plutea linistita.
>
> Cand ploaia s-a oprit, Noe a trimis un porumbel. Porumbelul s-a intors cu o frunza de maslin in cioc — semn ca pamantul se uscase. Atunci au coborat toti din arca, iar Dumnezeu a pus pe cer un curcubeu, ca o promisiune ca nu va mai trimite niciodata un asemenea potop.

**50. Invierea Domnului** (`invierea`, Matei 28)

> Era duminica dimineata, devreme. Doua femei au mers la mormantul lui Iisus, cu inima trista. Au adus mirodenii ca sa Il cinsteasca.
>
> Cand au ajuns, au vazut ceva uimitor: piatra cea mare de la intrarea mormantului fusese rostogolita la o parte. Un inger stralucitor sedea acolo. "Nu va temeti!" le-a spus. "Iisus nu este aici. A inviat, asa cum a spus!"
>
> Femeile au fugit acasa pline de bucurie sa le spuna ucenicilor. Pe drum, Iisus insusi le-a iesit in fata. "Bucurati-va!" le-a zis. Era viu, cu adevarat viu!
>
> Mai tarziu, ucenicii L-au vazut si ei. Iisus i-a trimis sa duca vestea cea buna in toata lumea. Si le-a fagaduit: "Iata, Eu sunt cu voi in toate zilele, pana la sfarsitul veacului."

The remaining 47 will follow the same shape: 3–5 short paragraphs, simple sentences, no doctrinal nuance, gentle present/past mix, occasional dialogue to keep the kid engaged. Names use Romanian Orthodox tradition (Iisus, Sfantul, Iacov, etc.) since the audience is in Romania.

### Accent colors

A simple palette so each checkpoint glow feels distinct without needing per-story art:
- Creation/early: teal / mint
- Patriarchs: amber / gold
- Exodus / Moses: red / coral
- Conquest / judges: brown / earth
- Kingdom: deep blue
- Prophets: violet
- New Testament birth/childhood: gold
- Miracles / parables: green
- Passion / resurrection: deep red → bright gold

These map to existing `--coral / --mint / --yellow` tokens plus a few new hex values, scoped to the stories module.

## Verification

- `pnpm exec tsc --noEmit` and `pnpm build` clean.
- `/` shows three cards; tapping the new one navigates to `/povesti`.
- `/povesti` renders the timeline with story 1 available, all others locked.
- Tap story 1 → opens detail page with story panel + canvas. Draw a stroke; reload after >1 s and confirm the canvas restores.
- Tap "Gata!" → returns to landing with celebration animation; story 2 is now available.
- Tapping a still-locked story shows the wiggle + toast.
- Phone breakpoint (DevTools 360 × 740): bottom-sheet "Citeste povestea" works; toolbar dock visible.
- Tablet breakpoint (1024 × 768): split view with story panel on the right; SideRail toolbar inside the canvas area.
- Clear browser data → all stories return to locked except story 1; canvases empty.
- Real device LAN test (per the previous spec's recipe): drawing latency, scroll smoothness, drawer dismissal.
