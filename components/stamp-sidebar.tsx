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
