'use client'

import { useEffect, useState } from 'react'
import {
  getAllStories,
  getStoryById,
  type Story,
} from './stories'

// Render the seed immediately so the UI never waits, then swap in
// the merged version if the API returns something different.
export function useAllStories(): Story[] {
  const [stories, setStories] = useState<Story[]>(() => getAllStories())

  useEffect(() => {
    let cancelled = false
    fetch('/api/stories')
      .then((r) => (r.ok ? (r.json() as Promise<Story[]>) : null))
      .then((merged) => {
        if (!cancelled && merged && Array.isArray(merged) && merged.length > 0) {
          setStories(merged)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return stories
}

export function useStory(id: string | undefined): Story | undefined {
  const [story, setStory] = useState<Story | undefined>(() =>
    id ? getStoryById(id) : undefined,
  )

  useEffect(() => {
    if (!id) {
      setStory(undefined)
      return
    }
    setStory(getStoryById(id))
    let cancelled = false
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Story>) : null))
      .then((merged) => {
        if (!cancelled && merged) setStory(merged)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  return story
}
