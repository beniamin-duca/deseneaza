'use client'

import { Paintbrush, Eraser, Droplet, Undo2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Tool = 'brush' | 'eraser' | 'fill'

interface ToolbarProps {
  currentTool: Tool
  currentColor: string
  brushSize: number
  onToolChange: (tool: Tool) => void
  onColorChange: (color: string) => void
  onBrushSizeChange: (size: number) => void
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
}

const COLORS = [
  '#FF6B6B', // coral
  '#4ECDC4', // mint
  '#FFE66D', // yellow
  '#FF8A5B', // orange
  '#95E1D3', // light mint
  '#F38181', // pink
  '#AA96DA', // lavender
  '#6C5CE7', // purple
  '#00B894', // green
  '#0984E3', // blue
  '#2D3436', // dark gray
  '#FFFFFF', // white
]

const BRUSH_SIZES = [8, 16, 24, 32]

export function Toolbar({
  currentTool,
  currentColor,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onClear,
  canUndo,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-card border-t border-border">
      {/* Color palette */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-select">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              'size-10 rounded-full flex-shrink-0 border-2 transition-transform btn-bounce',
              currentColor === color 
                ? 'border-foreground scale-110' 
                : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            aria-label={`Culoare ${color}`}
          />
        ))}
      </div>
      
      {/* Brush sizes */}
      <div className="flex items-center justify-center gap-2 no-select">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onBrushSizeChange(size)}
            className={cn(
              'size-12 rounded-full flex items-center justify-center bg-muted transition-all btn-bounce',
              brushSize === size && 'ring-2 ring-primary'
            )}
            aria-label={`Marime pensula ${size}`}
          >
            <div
              className="rounded-full bg-foreground"
              style={{ width: size / 2, height: size / 2 }}
            />
          </button>
        ))}
      </div>
      
      {/* Tools */}
      <div className="flex items-center justify-center gap-2 no-select">
        <Button
          variant={currentTool === 'brush' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('brush')}
          className="size-12 rounded-full btn-bounce"
          aria-label="Pensula"
        >
          <Paintbrush className="size-6" />
        </Button>
        
        <Button
          variant={currentTool === 'eraser' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('eraser')}
          className="size-12 rounded-full btn-bounce"
          aria-label="Radiera"
        >
          <Eraser className="size-6" />
        </Button>
        
        <Button
          variant={currentTool === 'fill' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('fill')}
          className="size-12 rounded-full btn-bounce"
          aria-label="Umple cu culoare"
        >
          <Droplet className="size-6" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-2" />
        
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="size-12 rounded-full btn-bounce"
          aria-label="Anuleaza"
        >
          <Undo2 className="size-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          className="size-12 rounded-full btn-bounce text-destructive hover:text-destructive"
          aria-label="Sterge tot"
        >
          <Trash2 className="size-6" />
        </Button>
      </div>
    </div>
  )
}
