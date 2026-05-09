'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { TopHeader } from '@/components/top-header'
import { StoryCheckpoint } from '@/components/story-checkpoint'
import { type Story } from '@/lib/stories'
import { useAllStories } from '@/lib/use-stories'
import {
  loadAllStatuses,
  loadCanvas,
  type StoryStatus,
} from '@/lib/progress'

const CHECKPOINT_SPACING = 200
const NT_DIVIDER_HEIGHT = 100
const LEFT_X_PCT = 28
const RIGHT_X_PCT = 72

function checkpointTop(orderIndex: number): number {
  // Add the divider gap once we cross from order 30 → 31
  return orderIndex * CHECKPOINT_SPACING + (orderIndex >= 30 ? NT_DIVIDER_HEIGHT : 0)
}

function checkpointLeftPct(orderIndex: number): number {
  return orderIndex % 2 === 0 ? LEFT_X_PCT : RIGHT_X_PCT
}

function Twinkles() {
  // Layered twinkles — varied size, opacity, drift speed for richer texture.
  const twinkles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const seed = i * 1103515245 + 12345
      const left = ((seed >>> 0) % 9000) / 100 + 4 // 4..94
      const top = (((seed >>> 8) >>> 0) % 9700) / 100 + 1 // 1..98
      const size = (i % 4) === 0 ? 4 : (i % 3) === 0 ? 2.5 : 1.5
      const opacity = 0.35 + ((seed >>> 16) % 50) / 100
      const dur = 2.5 + (i % 4)
      const delay = (i % 7) * 0.3
      return { left, top, size, opacity, dur, delay }
    })
  }, [])

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {twinkles.map((t, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-yellow-light"
          style={{
            left: `${t.left}%`,
            top: `${t.top}%`,
            width: t.size,
            height: t.size,
            opacity: t.opacity,
            boxShadow: `0 0 ${t.size * 3}px rgba(255, 230, 109, 0.7)`,
            animation: `float ${t.dur}s ease-in-out ${t.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

interface TimelineColumnProps {
  stories: Story[]
  statuses: Map<string, StoryStatus>
  thumbs: Map<string, Blob>
  currentId: string | null
  onLockedTap: () => void
}

function TimelineColumn({
  stories,
  statuses,
  thumbs,
  currentId,
  onLockedTap,
}: TimelineColumnProps) {
  const totalHeight =
    stories.length * CHECKPOINT_SPACING + NT_DIVIDER_HEIGHT + 80

  // Build a smooth winding SVG path through every checkpoint.
  // SVG viewBox is 100 wide × totalHeight tall, so x-coords are percentages.
  const pathD = useMemo(() => {
    const parts: string[] = []
    stories.forEach((_, idx) => {
      const x = checkpointLeftPct(idx)
      const y = checkpointTop(idx) + 56 // center of 80px checkpoint + 16px label area
      if (idx === 0) {
        parts.push(`M ${x} ${y}`)
        return
      }
      const prevX = checkpointLeftPct(idx - 1)
      const prevY = checkpointTop(idx - 1) + 56
      // Cubic bezier: control points at midpoint Y, alternating X to create snake.
      const c1x = prevX
      const c1y = (prevY + y) / 2
      const c2x = x
      const c2y = (prevY + y) / 2
      parts.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`)
    })
    return parts.join(' ')
  }, [stories])

  return (
    <div className="relative" style={{ height: totalHeight }}>
      {/* Winding path */}
      <svg
        aria-hidden
        viewBox={`0 0 100 ${totalHeight}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="#C9A24E"
          strokeWidth="0.6"
          strokeDasharray="1.6 1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>

      {/* OT/NT divider */}
      <div
        className="absolute inset-x-0 text-center"
        style={{ top: 30 * CHECKPOINT_SPACING + 20 }}
      >
        <h2 className="font-display text-2xl text-foreground/80">
          Noul Testament
        </h2>
        <div
          aria-hidden
          className="mx-auto mt-2 h-px w-32 bg-foreground/25"
        />
      </div>

      {/* Checkpoints */}
      {stories.map((story, idx) => (
        <div
          key={story.id}
          id={`checkpoint-${story.id}`}
          className="absolute"
          style={{
            top: checkpointTop(idx),
            left: `${checkpointLeftPct(idx)}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <StoryCheckpoint
            story={story}
            status={statuses.get(story.id) ?? 'locked'}
            canvasBlob={thumbs.get(story.id) ?? null}
            isCurrent={currentId === story.id}
            onLockedTap={onLockedTap}
          />
        </div>
      ))}
    </div>
  )
}

function PovestiContent() {
  const stories = useAllStories()
  const router = useRouter()
  const searchParams = useSearchParams()
  const completedId = searchParams.get('completed')

  const [statuses, setStatuses] = useState<Map<string, StoryStatus>>(new Map())
  const [thumbs, setThumbs] = useState<Map<string, Blob>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadAllStatuses()
      .then(async (map) => {
        if (cancelled) return
        setStatuses(map)
        const blobs = new Map<string, Blob>()
        for (const story of stories) {
          const s = map.get(story.id)
          if (s === 'in-progress' || s === 'done') {
            const blob = await loadCanvas(story.id)
            if (blob) blobs.set(story.id, blob)
          }
        }
        if (!cancelled) {
          setThumbs(blobs)
          setLoaded(true)
        }
      })
      .catch((err) => {
        console.error('Failed to load story progress', err)
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [stories])

  const currentId =
    stories.find((s) => statuses.get(s.id) === 'available')?.id ?? null

  useEffect(() => {
    if (!completedId) return
    const el = document.getElementById(`checkpoint-${completedId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const timer = setTimeout(() => {
      router.replace('/povesti')
    }, 1800)
    return () => clearTimeout(timer)
  }, [completedId, router])

  const handleLockedTap = () => {
    toast('Termina povestea anterioara mai intai!', { duration: 2000 })
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <TopHeader title="Povesti din Biblie" />

      <div
        className="flex-1 relative overflow-x-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top, #FFF4D6 0%, #F5E6BC 60%, #E8D69E 100%)',
        }}
      >
        <Twinkles />

        <div className="relative max-w-3xl mx-auto pt-12 pb-24 px-4">
          {!loaded && (
            <div className="flex justify-center py-12">
              <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {loaded && (
            <TimelineColumn
              stories={stories}
              statuses={statuses}
              thumbs={thumbs}
              currentId={currentId}
              onLockedTap={handleLockedTap}
            />
          )}
        </div>
      </div>
      <Toaster position="top-center" />
    </main>
  )
}

export default function PovestiPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PovestiContent />
    </Suspense>
  )
}
