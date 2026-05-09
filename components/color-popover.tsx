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
