'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Paintbrush,
  Eraser,
  Sparkles,
  Undo2,
  Trash2,
  Save,
  Images,
  Stamp,
} from 'lucide-react'
import { ColorPopover } from './color-popover'
import { CustomColorDialog } from './custom-color-dialog'
import { SizePopover } from './size-popover'

export type Tool = 'brush' | 'eraser' | 'fill' | 'stamp'

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
  onShowStamps?: () => void
  canUndo: boolean
  showTemplateButton?: boolean
  hidden?: boolean
  customColors: string[]
  onAddCustom: (hex: string) => void
  onRemoveCustom: (hex: string) => void
}

type DockProps = FloatingToolbarProps & { onRequestCustom: () => void }

const TOOLS = [
  { id: 'brush' as Tool, icon: Paintbrush, label: 'Pensula' },
  { id: 'eraser' as Tool, icon: Eraser, label: 'Radiera' },
  { id: 'fill' as Tool, icon: Sparkles, label: 'Umple' },
]

export function FloatingToolbar(props: FloatingToolbarProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const requestCustom = () => setCustomOpen(true)
  return (
    <>
      <BottomDock {...props} onRequestCustom={requestCustom} />
      <SideRail {...props} onRequestCustom={requestCustom} />
      <CustomColorDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        initialColor={props.activeColor}
        onConfirm={(hex) => {
          props.onColorChange(hex)
          props.onAddCustom(hex)
        }}
      />
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
  onShowStamps,
  canUndo,
  showTemplateButton,
  hidden,
  customColors,
  onRemoveCustom,
  onRequestCustom,
}: DockProps) {
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

          {onShowStamps && (
            <button
              onClick={() => {
                onToolChange('stamp')
                onShowStamps()
              }}
              className={cn(
                'tool-btn',
                activeTool === 'stamp'
                  ? 'active'
                  : 'bg-yellow/30 hover:bg-yellow/50 text-foreground'
              )}
              aria-label="Stampile"
              title="Stampile"
            >
              <Stamp className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'tool-btn tool-btn--labeled',
              canUndo
                ? 'bg-muted/50 hover:bg-muted'
                : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
            )}
            aria-label="Inapoi"
          >
            <Undo2 className="w-6 h-6" />
            <span className="font-display text-[10px] leading-none">Inapoi</span>
          </button>

          <div className="w-px h-8 bg-border" />

          <ColorPopover
            activeColor={activeColor}
            onColorChange={onColorChange}
            customColors={customColors}
            onRemoveCustom={onRemoveCustom}
            onRequestCustom={onRequestCustom}
            side="top"
          />
          <SizePopover
            brushSize={brushSize}
            onBrushSizeChange={onBrushSizeChange}
            side="top"
          />

          <div className="w-px h-8 bg-border" />

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
  onShowStamps,
  canUndo,
  showTemplateButton,
  customColors,
  onRemoveCustom,
  onRequestCustom,
}: DockProps) {
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

        {onShowStamps && (
          <button
            onClick={() => {
              onToolChange('stamp')
              onShowStamps()
            }}
            className={cn(
              'tool-btn',
              activeTool === 'stamp'
                ? 'active'
                : 'bg-yellow/30 hover:bg-yellow/50 text-foreground'
            )}
            aria-label="Stampile"
            title="Stampile"
          >
            <Stamp className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'tool-btn tool-btn--labeled',
            canUndo
              ? 'bg-muted/50 hover:bg-muted'
              : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
          )}
          aria-label="Inapoi"
          title="Inapoi"
        >
          <Undo2 className="w-6 h-6" />
          <span className="font-display text-[10px] leading-none">Inapoi</span>
        </button>

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
