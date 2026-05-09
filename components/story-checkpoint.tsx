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

  const sideOffset = story.order % 2 === 1 ? 'self-start ml-[8%]' : 'self-end mr-[8%]'

  if (status === 'locked') {
    return (
      <div className={cn('flex flex-col items-center', sideOffset)}>
        <button
          onClick={onLockedTap}
          aria-label={`${story.titleRo} (blocata)`}
          className="relative w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center opacity-50 hover:opacity-60 transition-opacity"
        >
          <Lock className="w-7 h-7 text-muted-foreground" />
        </button>
        <p className="text-sm text-muted-foreground/70 mt-2 text-center max-w-[140px] truncate">
          {story.titleRo}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', sideOffset)}>
      <Link
        href={`/povesti/${story.id}`}
        aria-label={story.titleRo}
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 bg-white transition-transform hover:scale-105 active:scale-95',
          status === 'available' && 'animate-[pulse_2.4s_ease-in-out_infinite]',
          isCurrent && 'ring-4 ring-offset-2 ring-offset-background'
        )}
        style={{
          borderColor: story.accentColor,
          boxShadow: `0 0 24px ${story.accentColor}55`,
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
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow flex items-center justify-center"
            aria-hidden
          >
            <Star className="w-4 h-4 fill-foreground text-foreground" />
          </span>
        )}
      </Link>
      <p className="text-sm font-medium text-foreground mt-2 text-center max-w-[140px] truncate">
        {story.titleRo}
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-[140px] truncate">
        {story.scriptureRef}
      </p>
    </div>
  )
}
