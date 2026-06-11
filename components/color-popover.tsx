'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ColorPalette } from './color-palette'

interface ColorPopoverProps {
  activeColor: string
  onColorChange: (color: string) => void
  customColors: string[]
  onRemoveCustom: (hex: string) => void
  onRequestCustom: () => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function ColorPopover({
  activeColor,
  onColorChange,
  customColors,
  onRemoveCustom,
  onRequestCustom,
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
        <ColorPalette
          activeColor={activeColor}
          onColorChange={onColorChange}
          customColors={customColors}
          onRemoveCustom={onRemoveCustom}
          onRequestCustom={onRequestCustom}
          variant="grid"
        />
      </PopoverContent>
    </Popover>
  )
}
