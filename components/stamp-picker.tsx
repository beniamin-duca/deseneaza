'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Stamp {
  id: string
  name: string
  src: string
}

const STAMPS: Stamp[] = [
  { id: 'star', name: 'Stea', src: '/stamps/star.jpg' },
  { id: 'heart', name: 'Inima', src: '/stamps/heart.jpg' },
  { id: 'rainbow', name: 'Curcubeu', src: '/stamps/rainbow.jpg' },
  { id: 'butterfly', name: 'Fluture', src: '/stamps/butterfly.jpg' },
  { id: 'cloud', name: 'Nor', src: '/stamps/cloud.jpg' },
  { id: 'moon', name: 'Luna', src: '/stamps/moon.jpg' },
  { id: 'fish', name: 'Peste', src: '/stamps/fish.jpg' },
  { id: 'bird', name: 'Pasare', src: '/stamps/bird.jpg' },
  { id: 'apple', name: 'Mar', src: '/stamps/apple.jpg' },
  { id: 'house', name: 'Casa', src: '/stamps/house.jpg' },
  { id: 'balloon', name: 'Balon', src: '/stamps/balloon.jpg' },
  { id: 'cake', name: 'Tort', src: '/stamps/cake.jpg' },
  { id: 'crown', name: 'Coroana', src: '/stamps/crown.jpg' },
  { id: 'paw', name: 'Labuta', src: '/stamps/paw.jpg' },
  { id: 'sparkle', name: 'Sclipici', src: '/stamps/sparkle.jpg' },
  { id: 'flower', name: 'Floare', src: '/stamps/flower.jpg' },
]

interface StampPickerProps {
  selectedStamp: string | null
  onSelectStamp: (stampId: string | null) => void
}

export function StampPicker({ selectedStamp, onSelectStamp }: StampPickerProps) {
  return (
    <div className="w-full bg-card border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-select">
        {STAMPS.map((stamp) => (
          <button
            key={stamp.id}
            onClick={() => onSelectStamp(selectedStamp === stamp.id ? null : stamp.id)}
            className={cn(
              'flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all btn-bounce',
              selectedStamp === stamp.id 
                ? 'bg-primary/20 ring-2 ring-primary' 
                : 'bg-muted hover:bg-muted/80'
            )}
            aria-label={`Selecteaza ${stamp.name}`}
          >
            <div className="relative size-14 rounded-lg overflow-hidden">
              <Image
                src={stamp.src}
                alt={stamp.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <span className="text-xs font-medium text-foreground">
              {stamp.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { STAMPS }
