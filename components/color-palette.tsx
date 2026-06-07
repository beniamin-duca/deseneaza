'use client'

import { Plus, X } from 'lucide-react'
import { DRAWING_COLORS } from '@/lib/templates'
import { cn } from '@/lib/utils'

interface ColorPaletteProps {
  activeColor: string
  onColorChange: (color: string) => void
  customColors: string[]
  onRemoveCustom: (hex: string) => void
  onRequestCustom: () => void
  // 'grid' = wide popover (mobile), 'rail' = narrow side rail (desktop).
  variant?: 'grid' | 'rail'
}

const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function ColorPalette({
  activeColor,
  onColorChange,
  customColors,
  onRemoveCustom,
  onRequestCustom,
  variant = 'grid',
}: ColorPaletteProps) {
  const gridCols = variant === 'rail' ? 'grid-cols-2' : 'grid-cols-7'

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('grid gap-2', gridCols)}>
        {DRAWING_COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorChange(color.value)}
            className={cn('color-swatch', sameColor(activeColor, color.value) && 'active')}
            style={{ backgroundColor: color.value }}
            aria-label={color.name}
            title={color.name}
          />
        ))}

        <button
          onClick={onRequestCustom}
          className="color-swatch flex items-center justify-center border-2 border-dashed border-foreground/30 bg-white text-foreground/50 hover:border-foreground/50"
          aria-label="Culoare noua"
          title="Culoare noua"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {customColors.length > 0 && (
        <>
          <div className="text-[10px] font-display text-muted-foreground px-1">
            Culorile mele
          </div>
          <div className={cn('grid gap-2', gridCols)}>
            {customColors.map((hex) => (
              <div key={hex} className="relative">
                <button
                  onClick={() => onColorChange(hex)}
                  className={cn('color-swatch', sameColor(activeColor, hex) && 'active')}
                  style={{ backgroundColor: hex }}
                  aria-label={`Culoarea ${hex}`}
                  title={hex}
                />
                <button
                  onClick={() => onRemoveCustom(hex)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center shadow"
                  aria-label="Sterge culoarea"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
