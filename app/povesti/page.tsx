'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { FloatingTopBar } from '@/components/floating-top-bar'
import { StoryCheckpoint } from '@/components/story-checkpoint'
import { getAllStories } from '@/lib/stories'
import {
  loadAllStatuses,
  loadCanvas,
  type StoryStatus,
} from '@/lib/progress'

function PovestiContent() {
  const stories = getAllStories()
  const router = useRouter()
  const searchParams = useSearchParams()
  const completedId = searchParams.get('completed')

  const [statuses, setStatuses] = useState<Map<string, StoryStatus>>(new Map())
  const [thumbs, setThumbs] = useState<Map<string, Blob>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadAllStatuses().then(async (map) => {
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
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #FFF4D6 0%, #F5E6BC 60%, #E8D69E 100%)',
      }}
    >
      <FloatingTopBar title="Povesti din Biblie" />

      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-yellow-light/70"
            style={{
              left: `${(i * 37) % 90 + 5}%`,
              top: `${(i * 91) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 flex flex-col gap-12 relative">
        {!loaded && (
          <div className="flex justify-center py-12">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {loaded && stories.map((story, idx) => (
          <div key={story.id} id={`checkpoint-${story.id}`}>
            {idx === 30 && (
              <div className="text-center py-6">
                <h2 className="font-display text-2xl text-foreground/80">
                  Noul Testament
                </h2>
                <div
                  aria-hidden
                  className="mx-auto mt-2 h-px w-32 bg-foreground/20"
                />
              </div>
            )}
            <StoryCheckpoint
              story={story}
              status={statuses.get(story.id) ?? 'locked'}
              canvasBlob={thumbs.get(story.id) ?? null}
              isCurrent={currentId === story.id}
              onLockedTap={handleLockedTap}
            />
          </div>
        ))}
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
