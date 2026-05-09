'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Story } from '@/lib/stories'
import { type StoryStatus } from '@/lib/progress'

interface StoryCheckpointProps {
  story: Story
  status: StoryStatus
  canvasBlob: Blob | null
  isCurrent: boolean
  onLockedTap: () => void
}

export function StoryCheckpoint({
  story,
  status,
  canvasBlob,
  isCurrent,
  onLockedTap,
}: StoryCheckpointProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasBlob) {
      setThumbUrl(null)
      return
    }
    const url = URL.createObjectURL(canvasBlob)
    setThumbUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [canvasBlob])

  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={onLockedTap}
          aria-label={`${story.titleRo} (blocata)`}
          className="relative w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center opacity-55 hover:opacity-70 transition-opacity"
          style={{
            boxShadow: 'inset 0 0 20px rgba(180, 150, 90, 0.18)',
          }}
        >
          <Lock className="w-7 h-7 text-muted-foreground" />
        </button>
        <p className="text-sm text-muted-foreground/70 mt-2 text-center max-w-[160px] truncate">
          {story.titleRo}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {isCurrent && (
        <span
          aria-hidden
          className="font-display text-xs font-bold mb-1 px-2 py-0.5 rounded-full text-white shadow-md"
          style={{ backgroundColor: story.accentColor }}
        >
          Aici!
        </span>
      )}
      <Link
        href={`/povesti/${story.id}`}
        aria-label={story.titleRo}
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 bg-white transition-transform hover:scale-110 active:scale-95',
          status === 'available' && 'animate-[pulse_2.4s_ease-in-out_infinite]'
        )}
        style={{
          borderColor: story.accentColor,
          boxShadow: `0 0 28px ${story.accentColor}66, 0 4px 12px rgba(0,0,0,0.08)`,
        }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-display text-2xl font-bold"
            style={{ color: story.accentColor }}
          >
            {story.order}
          </span>
        )}
        {status === 'done' && (
          <span
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow flex items-center justify-center shadow-md"
            aria-hidden
          >
            <Star className="w-4 h-4 fill-foreground text-foreground" />
          </span>
        )}
      </Link>
      <p className="text-sm font-medium text-foreground mt-2 text-center max-w-[160px] truncate">
        {story.titleRo}
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-[160px] truncate">
        {story.scriptureRef}
      </p>
    </div>
  )
}
