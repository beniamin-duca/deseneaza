'use client'

import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface CustomColorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialColor: string
  onConfirm: (hex: string) => void
}

export function CustomColorDialog({
  open,
  onOpenChange,
  initialColor,
  onConfirm,
}: CustomColorDialogProps) {
  const [color, setColor] = useState(initialColor)

  // Re-seed the picker from the active color each time it opens.
  useEffect(() => {
    if (open) setColor(initialColor)
  }, [open, initialColor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Alege o culoare
          </DialogTitle>
          <DialogDescription className="sr-only">
            Trage de selector ca sa creezi culoarea ta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <HexColorPicker color={color} onChange={setColor} />
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-sm uppercase text-muted-foreground">
              {color}
            </span>
          </div>
          <button
            onClick={() => {
              onConfirm(color)
              onOpenChange(false)
            }}
            className="h-12 w-full rounded-full font-display text-base bg-mint text-white hover:bg-mint-dark"
          >
            Gata
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
