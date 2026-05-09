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
