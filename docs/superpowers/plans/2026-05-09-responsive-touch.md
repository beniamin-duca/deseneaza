# Responsive + Touch Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Riza fully usable on phones and tablets — tools always reachable, sidebars never cover the toolbar, and Apple-Pencil-style pressure scales the brush.

**Architecture:** One Tailwind breakpoint (`md` = 768 px) splits the toolbar into a phone *bottom dock* (with color/size popovers) and a tablet *side rail* (always-visible colors and sizes). Sidebars switch between vaul bottom-sheet on phone and the existing left side-panel on tablet via a shared `SidebarShell`. Stylus pressure is read from `PointerEvent.pressure` inside the canvas only; finger and mouse are unchanged.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, Radix UI Popover (already a dep), `vaul` Drawer (already a dep, already wrapped in `components/ui/drawer.tsx`), `@radix-ui/react-popover` (already wrapped in `components/ui/popover.tsx`).

**Spec:** `docs/superpowers/specs/2026-05-09-responsive-touch-design.md`

**Note on testing:** This codebase has no automated test runner. Each task's verification is `pnpm exec tsc --noEmit` (fast) plus a manual smoke check in `pnpm dev`. The final task includes the broader DevTools breakpoint walkthrough and a local-network (LAN) testing recipe so the user can drive a phone or tablet against the dev server.

---

## File Map

**New files:**
- `components/color-popover.tsx` — single-swatch trigger + Radix popover with the 14-color grid (used by phone dock)
- `components/size-popover.tsx` — single-size trigger + Radix popover with the four brush sizes (used by phone dock)
- `components/sidebar-shell.tsx` — picks vaul Drawer (mobile) or fixed-side panel (tablet); receives `title` + `children`

**Modified files:**
- `components/floating-toolbar.tsx` — split into `BottomDock` (mobile) + `SideRail` (tablet), both rendered with `md:` Tailwind classes; gains `hidden` prop to fade out on phone when a sheet is open
- `components/template-sidebar.tsx` — wrap content in `SidebarShell`, drop the bespoke fixed panel
- `components/stamp-sidebar.tsx` — same
- `components/kid-canvas.tsx` — pressure-derived stroke width for `pointerType === 'pen'`; new `disabled?: boolean` prop that no-ops pointer handlers
- `app/desen/page.tsx` — pass `disabled` to canvas in stamps mode when no stamp is selected; pass `hidden` to toolbar when any sidebar is open
- `app/globals.css` — add safe-area padding utility for the bottom dock and tighten `.touch-canvas` to block iOS long-press

---

## Task 1: ColorPopover component

**Files:**
- Create: `components/color-popover.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DRAWING_COLORS } from '@/lib/templates'
import { cn } from '@/lib/utils'

interface ColorPopoverProps {
  activeColor: string
  onColorChange: (color: string) => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function ColorPopover({
  activeColor,
  onColorChange,
  side = 'top',
  align = 'center',
}: ColorPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="tool-btn relative bg-white border-2 border-foreground/20 hover:border-foreground/40"
          aria-label="Alege culoarea"
          title="Culoare"
        >
          <span
            className="block w-7 h-7 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: activeColor }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={12}
        className="w-auto p-3 rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur"
      >
        <div className="grid grid-cols-7 gap-2">
          {DRAWING_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.value)}
              className={cn('color-swatch', activeColor === color.value && 'active')}
              style={{ backgroundColor: color.value }}
              aria-label={color.name}
              title={color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add components/color-popover.tsx
git commit -m "Add ColorPopover for compact color picking on phone dock"
```

---

## Task 2: SizePopover component

**Files:**
- Create: `components/size-popover.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BRUSH_SIZES } from '@/lib/templates'
import { cn } from '@/lib/utils'

interface SizePopoverProps {
  brushSize: number
  onBrushSizeChange: (size: number) => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function SizePopover({
  brushSize,
  onBrushSizeChange,
  side = 'top',
  align = 'center',
}: SizePopoverProps) {
  const previewDiameter = Math.max(8, Math.min(24, brushSize * 0.7))
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="tool-btn bg-muted/50 hover:bg-muted text-foreground"
          aria-label="Alege marimea pensulei"
          title="Marime"
        >
          <span
            className="rounded-full bg-foreground"
            style={{ width: previewDiameter, height: previewDiameter }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={12}
        className="w-auto p-3 rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          {BRUSH_SIZES.map((size) => {
            const dot = Math.max(8, size.value * 0.5)
            return (
              <button
                key={size.id}
                onClick={() => onBrushSizeChange(size.value)}
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  brushSize === size.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                )}
                style={{ width: 56, height: 56 }}
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
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add components/size-popover.tsx
git commit -m "Add SizePopover for compact brush-size picking on phone dock"
```

---

## Task 3: SidebarShell (responsive sheet/panel switcher)

**Files:**
- Create: `components/sidebar-shell.tsx`

This component owns the responsive shell only. Filters and grids stay in `template-sidebar.tsx` and `stamp-sidebar.tsx`.

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { ReactNode } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function SidebarShell({
  isOpen,
  onClose,
  title,
  children,
}: SidebarShellProps) {
  return (
    <>
      {/* Mobile bottom sheet (vaul) — visible below md */}
      <div className="md:hidden">
        <Drawer
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose()
          }}
        >
          <DrawerContent className="max-h-[85vh] rounded-t-3xl bg-white">
            <DrawerTitle className="sr-only">{title}</DrawerTitle>
            <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-border/50">
              <h2 className="font-display text-lg font-bold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Inchide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Tablet/desktop side panel — visible at md and up */}
      <div className={cn('hidden md:block', !isOpen && 'md:pointer-events-none')}>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 glass-panel z-50 sidebar-slide flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="Inchide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add components/sidebar-shell.tsx
git commit -m "Add SidebarShell — vaul drawer on phone, side panel on tablet"
```

---

## Task 4: Refactor TemplateSidebar to use SidebarShell

**Files:**
- Modify: `components/template-sidebar.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  TEMPLATES,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type Template,
  type TemplateCategory,
  type TemplateDifficulty,
} from '@/lib/templates'
import { Star, Shuffle } from 'lucide-react'
import { SidebarShell } from './sidebar-shell'

interface TemplateSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: Template) => void
  currentTemplateId?: string
}

export function TemplateSidebar({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId,
}: TemplateSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<TemplateDifficulty | 'all'>('all')

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (activeDifficulty !== 'all' && t.difficulty !== activeDifficulty) return false
    return true
  }).sort((a, b) => a.order - b.order)

  const handleRandomTemplate = () => {
    if (filteredTemplates.length === 0) return
    const idx = Math.floor(Math.random() * filteredTemplates.length)
    onSelectTemplate(filteredTemplates[idx])
  }

  return (
    <SidebarShell isOpen={isOpen} onClose={onClose} title="Alege un desen">
      <div className="p-4 space-y-3 border-b border-border/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveDifficulty('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeDifficulty === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            Toate
          </button>
          {(['easy', 'medium', 'hard'] as TemplateDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1',
                activeDifficulty === diff
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              )}
            >
              {Array.from({ length: DIFFICULTY_LABELS[diff].stars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeCategory === 'all'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            Toate
          </button>
          {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                activeCategory === cat
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-border/50">
        <button
          onClick={handleRandomTemplate}
          className="w-full py-3 px-4 rounded-2xl bg-accent hover:bg-accent/80 text-accent-foreground font-display font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Shuffle className="w-5 h-5" />
          Surprinde-ma!
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={cn(
                'group relative aspect-square rounded-2xl overflow-hidden transition-all playful-card',
                currentTemplateId === template.id && 'ring-4 ring-primary ring-offset-2'
              )}
            >
              <Image
                src={template.src}
                alt={template.nameRo}
                fill
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-sm font-medium">{template.nameRo}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: DIFFICULTY_LABELS[template.difficulty].stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow text-yellow" />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SidebarShell>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Smoke test**

Run: `pnpm dev` (if not already running). In a browser, navigate to `/desen?mode=colorat`. The template sheet should still appear; pick a template; the sheet should close and the template should load on the canvas.

- [ ] **Step 4: Commit**

```bash
git add components/template-sidebar.tsx
git commit -m "TemplateSidebar uses SidebarShell for responsive sheet/panel"
```

---

## Task 5: Refactor StampSidebar to use SidebarShell

**Files:**
- Modify: `components/stamp-sidebar.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { STAMPS, type Stamp } from '@/lib/templates'
import { SidebarShell } from './sidebar-shell'

interface StampSidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedStampId?: string | null
  onSelectStamp: (stamp: Stamp | null) => void
}

export function StampSidebar({
  isOpen,
  onClose,
  selectedStampId,
  onSelectStamp,
}: StampSidebarProps) {
  return (
    <SidebarShell isOpen={isOpen} onClose={onClose} title="Alege o stampila">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {STAMPS.map((stamp) => (
            <button
              key={stamp.id}
              onClick={() =>
                onSelectStamp(selectedStampId === stamp.id ? null : stamp)
              }
              className={cn(
                'relative aspect-square rounded-2xl overflow-hidden bg-white playful-card',
                selectedStampId === stamp.id &&
                  'ring-4 ring-primary ring-offset-2'
              )}
              aria-label={stamp.name}
              title={stamp.name}
            >
              <Image
                src={stamp.src}
                alt={stamp.name}
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </div>
    </SidebarShell>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Smoke test**

In `/desen?mode=stampile`, the stamp sheet should appear; selecting a stamp should close it.

- [ ] **Step 4: Commit**

```bash
git add components/stamp-sidebar.tsx
git commit -m "StampSidebar uses SidebarShell for responsive sheet/panel"
```

---

## Task 6: Refactor FloatingToolbar (BottomDock + SideRail)

**Files:**
- Modify: `components/floating-toolbar.tsx`

This is the largest task. It splits the toolbar into two presentations sharing one prop API. Phone (`md:hidden`) renders `BottomDock` with popovers; tablet (`hidden md:flex`) renders `SideRail` with always-visible colors and sizes.

- [ ] **Step 1: Replace the file contents**

```tsx
'use client'

import { cn } from '@/lib/utils'
import { DRAWING_COLORS, BRUSH_SIZES } from '@/lib/templates'
import {
  Paintbrush,
  Eraser,
  Sparkles,
  Undo2,
  Trash2,
  Save,
  Images,
} from 'lucide-react'
import { ColorPopover } from './color-popover'
import { SizePopover } from './size-popover'

export type Tool = 'brush' | 'eraser' | 'fill'

interface FloatingToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
  activeColor: string
  onColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  onUndo: () => void
  onClear: () => void
  onSave: () => void
  onShowTemplates?: () => void
  canUndo: boolean
  showTemplateButton?: boolean
  hidden?: boolean
}

const TOOLS = [
  { id: 'brush' as Tool, icon: Paintbrush, label: 'Pensula' },
  { id: 'eraser' as Tool, icon: Eraser, label: 'Radiera' },
  { id: 'fill' as Tool, icon: Sparkles, label: 'Umple' },
]

export function FloatingToolbar(props: FloatingToolbarProps) {
  return (
    <>
      <BottomDock {...props} />
      <SideRail {...props} />
    </>
  )
}

function BottomDock({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onClear,
  onSave,
  onShowTemplates,
  canUndo,
  showTemplateButton,
  hidden,
}: FloatingToolbarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden',
        'transition-opacity duration-200',
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="floating-toolbar px-3 py-2 pop-in">
        <div className="floating-toolbar-inner flex items-center gap-1.5 overflow-x-auto max-w-[96vw]">
          {showTemplateButton && onShowTemplates && (
            <>
              <button
                onClick={onShowTemplates}
                className="tool-btn bg-mint/10 hover:bg-mint/20 text-mint-dark"
                aria-label="Alege desen"
              >
                <Images className="w-6 h-6" />
              </button>
              <div className="w-px h-8 bg-border" />
            </>
          )}

          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              className={cn(
                'tool-btn',
                activeTool === t.id ? 'active' : 'bg-muted/50 hover:bg-muted'
              )}
              aria-label={t.label}
            >
              <t.icon className="w-6 h-6" />
            </button>
          ))}

          <div className="w-px h-8 bg-border" />

          <ColorPopover
            activeColor={activeColor}
            onColorChange={onColorChange}
            side="top"
          />
          <SizePopover
            brushSize={brushSize}
            onBrushSizeChange={onBrushSizeChange}
            side="top"
          />

          <div className="w-px h-8 bg-border" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'tool-btn',
              canUndo
                ? 'bg-muted/50 hover:bg-muted'
                : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
            )}
            aria-label="Inapoi"
          >
            <Undo2 className="w-6 h-6" />
          </button>
          <button
            onClick={onClear}
            className="tool-btn bg-coral/10 hover:bg-coral/20 text-coral-dark"
            aria-label="Sterge tot"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          <button
            onClick={onSave}
            className="tool-btn bg-mint text-white hover:bg-mint-dark"
            aria-label="Salveaza"
          >
            <Save className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SideRail({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onClear,
  onSave,
  onShowTemplates,
  canUndo,
  showTemplateButton,
}: FloatingToolbarProps) {
  return (
    <div className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 max-h-[calc(100vh-2rem)]">
      <div className="floating-toolbar px-2 py-3 pop-in flex flex-col items-center gap-2 max-h-[calc(100vh-2rem)] overflow-y-auto">
        {showTemplateButton && onShowTemplates && (
          <>
            <button
              onClick={onShowTemplates}
              className="tool-btn bg-mint/10 hover:bg-mint/20 text-mint-dark"
              aria-label="Alege desen"
              title="Alege desen"
            >
              <Images className="w-6 h-6" />
            </button>
            <div className="h-px w-8 bg-border my-1" />
          </>
        )}

        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={cn(
              'tool-btn',
              activeTool === t.id ? 'active' : 'bg-muted/50 hover:bg-muted'
            )}
            aria-label={t.label}
            title={t.label}
          >
            <t.icon className="w-6 h-6" />
          </button>
        ))}

        <div className="h-px w-8 bg-border my-1" />

        <div className="grid grid-cols-2 gap-1.5">
          {DRAWING_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.value)}
              className={cn(
                'color-swatch',
                activeColor === color.value && 'active'
              )}
              style={{ backgroundColor: color.value, width: 32, height: 32 }}
              aria-label={color.name}
              title={color.name}
            />
          ))}
        </div>

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

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'tool-btn',
            canUndo
              ? 'bg-muted/50 hover:bg-muted'
              : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
          )}
          aria-label="Inapoi"
          title="Inapoi"
        >
          <Undo2 className="w-6 h-6" />
        </button>
        <button
          onClick={onClear}
          className="tool-btn bg-coral/10 hover:bg-coral/20 text-coral-dark"
          aria-label="Sterge tot"
          title="Sterge tot"
        >
          <Trash2 className="w-6 h-6" />
        </button>
        <button
          onClick={onSave}
          className="tool-btn bg-mint text-white hover:bg-mint-dark"
          aria-label="Salveaza"
          title="Salveaza"
        >
          <Save className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Smoke test (phone width)**

Run `pnpm dev`. Open DevTools, set viewport to 360 × 740 ("iPhone SE"). Navigate to `/desen?mode=colorat`:
- The dock at the bottom must fit within 360 px without horizontal page scroll. (It may scroll inside the dock; that is acceptable.)
- Tap the color swatch button → popover with the 14-color grid opens above.
- Tap the size button → popover with the 4 sizes opens above.

- [ ] **Step 4: Smoke test (tablet width)**

Resize the viewport to 1024 × 768. The bottom dock disappears; a vertical rail appears anchored to the right edge with all colors and sizes always visible.

- [ ] **Step 5: Commit**

```bash
git add components/floating-toolbar.tsx
git commit -m "Split floating toolbar: phone bottom dock + tablet side rail"
```

---

## Task 7: Stylus pressure + `disabled` prop in KidCanvas

**Files:**
- Modify: `components/kid-canvas.tsx`

This task adds two things: (a) brush size that responds to `PointerEvent.pressure` for `pointerType === 'pen'`, and (b) a `disabled` prop that no-ops pointer-down so the desen page can lock the canvas in stamps mode when no stamp is selected.

- [ ] **Step 1: Add `disabled` to props**

In the props interface and destructure:

```tsx
interface KidCanvasProps {
  tool: Tool
  color: string
  brushSize: number
  templateSrc?: string | null
  stampSrc?: string | null
  onStampPlaced?: () => void
  disabled?: boolean
}
```

```tsx
export const KidCanvas = forwardRef<KidCanvasRef, KidCanvasProps>(
  function KidCanvas(
    { tool, color, brushSize, templateSrc, stampSrc, onStampPlaced, disabled = false },
    ref
  ) {
```

- [ ] **Step 2: Add a pressure helper**

Place it inside the component body (above `getPointerPos`):

```tsx
const effectiveBrushSize = (e: React.PointerEvent): number => {
  if (e.pointerType === 'pen') {
    const pressure = Math.max(0.05, e.pressure || 0.5)
    return Math.max(2, Math.min(80, brushSize * (0.4 + pressure * 1.2)))
  }
  return brushSize
}
```

- [ ] **Step 3: Use it in `handlePointerDown`**

Replace the existing block that sets `ctx.lineWidth`:

```tsx
const size = effectiveBrushSize(e)
if (tool === 'eraser') {
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = size * 2
} else {
  ctx.strokeStyle = color
  ctx.lineWidth = size
}
```

Also add a guard at the top:

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
  if (disabled) return
  e.preventDefault()
  // ... rest unchanged
}
```

- [ ] **Step 4: Use it in `handlePointerMove`**

Update `lineWidth` per move event so pressure changes mid-stroke are reflected:

```tsx
const handlePointerMove = (e: React.PointerEvent) => {
  if (disabled || !isDrawing || !lastPointRef.current) return
  e.preventDefault()
  const ctx = ctxRef.current
  if (!ctx) return
  if (tool === 'eraser' || tool === 'brush') {
    const size = effectiveBrushSize(e)
    ctx.lineWidth = tool === 'eraser' ? size * 2 : size
  }
  const pos = getPointerPos(e)
  drawStroke(lastPointRef.current, pos)
  lastPointRef.current = pos
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Smoke test**

In `pnpm dev`, draw with a mouse — stroke widths should match the picked size exactly (no change vs. before). In Chrome DevTools, open `Sensors` panel, set `Pointer type` to `Pen`, vary pressure, draw — stroke width should visibly vary.

- [ ] **Step 7: Commit**

```bash
git add components/kid-canvas.tsx
git commit -m "Stylus pressure scaling + disabled prop on canvas"
```

---

## Task 8: Wire desen page — pass `disabled` and `hidden`

**Files:**
- Modify: `app/desen/page.tsx`

- [ ] **Step 1: Compute the new flags**

Inside `DrawingPageContent`, after the existing state declarations, add:

```tsx
const anySidebarOpen = showTemplateSidebar || showStampSidebar
const canvasDisabled = mode === 'stampile' && !selectedStamp
```

- [ ] **Step 2: Pass `disabled` to the canvas**

```tsx
<KidCanvas
  ref={canvasRef}
  tool={tool}
  color={color}
  brushSize={brushSize}
  templateSrc={templateSrc}
  stampSrc={stampSrc}
  onStampPlaced={() => {}}
  disabled={canvasDisabled}
/>
```

- [ ] **Step 3: Pass `hidden` to the toolbar**

```tsx
<FloatingToolbar
  activeTool={tool}
  onToolChange={setTool}
  activeColor={color}
  onColorChange={setColor}
  brushSize={brushSize}
  onBrushSizeChange={setBrushSize}
  onUndo={handleUndo}
  onClear={handleClear}
  onSave={handleSave}
  onShowTemplates={
    showTemplatesButton ? () => setShowTemplateSidebar(true) : undefined
  }
  showTemplateButton={showTemplatesButton}
  canUndo={canUndo}
  hidden={anySidebarOpen}
/>
```

- [ ] **Step 4: Hide the StampsFloatingBar too when sidebar is open**

Update the `StampsFloatingBar` props interface to accept an optional `hidden` and apply it the same way:

```tsx
interface StampsFloatingBarProps {
  selectedStamp: Stamp | null
  onShowStamps: () => void
  onUndo: () => void
  onClear: () => void
  onSave: () => void
  canUndo: boolean
  hidden?: boolean
}

function StampsFloatingBar({
  selectedStamp,
  onShowStamps,
  onUndo,
  onClear,
  onSave,
  canUndo,
  hidden,
}: StampsFloatingBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-200',
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      {/* ... existing inner content ... */}
    </div>
  )
}
```

And pass `hidden={anySidebarOpen}` where it's rendered in `DrawingPageContent`.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Smoke test**

- Phone width: `/desen?mode=colorat` → open the template sheet → bottom dock fades out; close the sheet → dock fades back in.
- Stamps mode without a selected stamp: tapping the canvas does nothing. Pick a stamp from the sheet → tapping the canvas places it.

- [ ] **Step 7: Commit**

```bash
git add app/desen/page.tsx
git commit -m "Hide toolbar when sidebar is open; lock canvas with no stamp"
```

---

## Task 9: Touch-hardening CSS

**Files:**
- Modify: `app/globals.css`

The current `.touch-canvas` already sets `touch-action: none` and `-webkit-touch-callout: none`. We add `-webkit-user-select` and `user-select` so iOS Safari does not show the text-selection bubble during long taps on the canvas.

- [ ] **Step 1: Update `.touch-canvas` rule**

Find the existing rule and replace with:

```css
.touch-canvas {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: contain;
}
```

- [ ] **Step 2: Typecheck (lint)**

Run: `pnpm exec tsc --noEmit`
Expected: exit code 0. (CSS changes don't affect TS, but we run it as a smoke gate.)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Tighten touch-canvas: block iOS text selection + overscroll"
```

---

## Task 10: Final verification

**Files:** none modified

This task runs the full verification list from the spec.

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: all routes (`/`, `/desen`, `/parinti`, `/termeni`, `/confidentialitate`, `/_not-found`) prerender; no errors.

- [ ] **Step 3: DevTools simulation walk-through**

Run `pnpm dev`. In Chrome DevTools, run through both breakpoints:

**Phone (360 × 740):**
- `/desen?mode=blank` — dock fits, brush/eraser/fill/color popover/size popover/undo/clear/save all reachable.
- `/desen?mode=colorat` — picker button visible; opening the sheet fades the dock; selecting a template closes it and the dock returns.
- `/desen?mode=stampile` — sheet auto-opens; closing without picking locks the canvas; opening again and picking unlocks it.

**Tablet (1024 × 768):**
- Right-edge vertical rail visible. All 14 colors and 4 sizes always visible (no popovers).
- Picker opens left side panel; rail stays interactive on the right.

**Pressure simulation:** DevTools → Sensors → Pen → vary pressure with the cursor. Stroke width must change visibly. With pointer type = Touch, stroke matches picked size.

- [ ] **Step 4: Local-network testing on real device**

In a terminal:

```bash
HOSTNAME=0.0.0.0 pnpm dev
# or: pnpm dev -- --hostname 0.0.0.0
```

Find the LAN IP:

```bash
ipconfig getifaddr en0   # macOS Wi-Fi
```

On a phone or tablet on the same Wi-Fi, open `http://<lan-ip>:3000`. Walk through:

- Drawing in canvas: no browser scroll/zoom interference.
- No long-press text-selection bubble on iOS Safari.
- Bottom sheet drawer dismisses with a downward swipe.
- (If Apple Pencil available) pressure produces visibly varying stroke width.
- Address bar collapse on scroll: dock should not jump or disappear off-screen. If it does, the safe-area inset already added in Task 6 should handle it; if not, increase `paddingBottom` to `max(16px, env(safe-area-inset-bottom))`.

- [ ] **Step 5: Final commit (if any tweaks were made during step 4)**

```bash
git status
# If there are tweaks:
git commit -am "Real-device polish from local testing"
```
