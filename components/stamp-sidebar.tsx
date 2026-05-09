'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { STAMPS, type Stamp } from '@/lib/templates'
import { X } from 'lucide-react'

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
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed left-0 top-0 bottom-0 w-80 glass-panel z-50 sidebar-slide flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="font-display text-xl font-bold text-foreground">
            Alege o stampila
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Inchide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
      </div>
    </>
  )
}
