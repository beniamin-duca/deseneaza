'use client'

import { cn } from '@/lib/utils'
import { DRAWING_COLORS } from '@/lib/templates'
import { Paintbrush, Eraser, Sparkles, Undo2, Trash2, Save, Images } from 'lucide-react'

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
}

export function FloatingToolbar({
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
  showTemplateButton = false,
}: FloatingToolbarProps) {
  const tools = [
    { id: 'brush' as Tool, icon: Paintbrush, label: 'Pensula' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Radiera' },
    { id: 'fill' as Tool, icon: Sparkles, label: 'Umple' },
  ]

  const brushSizes = [
    { value: 8, label: 'Mic' },
    { value: 16, label: 'Mediu' },
    { value: 28, label: 'Mare' },
    { value: 44, label: 'Foarte mare' },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      {/* Color picker row */}
      <div className="floating-toolbar px-4 py-3 pop-in">
        <div className="floating-toolbar-inner flex items-center gap-1">
          {DRAWING_COLORS.slice(0, 10).map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.value)}
              className={cn(
                'color-swatch',
                activeColor === color.value && 'active'
              )}
              style={{ backgroundColor: color.value }}
              aria-label={color.name}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Main toolbar row */}
      <div className="floating-toolbar px-3 py-2 pop-in" style={{ animationDelay: '0.05s' }}>
        <div className="floating-toolbar-inner flex items-center gap-2">
          {/* Template button */}
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
              <div className="w-px h-8 bg-border mx-1" />
            </>
          )}

          {/* Drawing tools */}
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn('tool-btn', activeTool === tool.id ? 'active' : 'bg-muted/50 hover:bg-muted')}
              aria-label={tool.label}
              title={tool.label}
            >
              <tool.icon className="w-6 h-6" />
            </button>
          ))}

          <div className="w-px h-8 bg-border mx-1" />

          {/* Brush size selector */}
          <div className="flex items-center gap-1 px-2">
            {brushSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  brushSize === size.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                )}
                style={{
                  width: Math.max(32, size.value * 0.8),
                  height: Math.max(32, size.value * 0.8),
                }}
                aria-label={size.label}
                title={size.label}
              >
                <span
                  className="rounded-full bg-current"
                  style={{
                    width: Math.max(6, size.value * 0.4),
                    height: Math.max(6, size.value * 0.4),
                  }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Action buttons */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'tool-btn',
              canUndo ? 'bg-muted/50 hover:bg-muted' : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
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
    </div>
  )
}
