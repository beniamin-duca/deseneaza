'use client'

import { useState, useEffect, useCallback } from 'react'

// Custom "Culorile mele" swatches. A small, global, device-only preference —
// localStorage is the right store here (not the per-story IndexedDB). Capped at
// 6, FIFO, deduped case-insensitively so #FF6B6B and #ff6b6b never coexist.
const STORAGE_KEY = 'riza:myColors'
const MAX_CUSTOM_COLORS = 6

function readStored(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((c): c is string => typeof c === 'string')
      .slice(0, MAX_CUSTOM_COLORS)
  } catch {
    return []
  }
}

function writeStored(colors: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // Quota or privacy mode — keep the in-memory list, ignore persistence.
  }
}

export function useCustomColors() {
  const [customColors, setCustomColors] = useState<string[]>([])

  // Read after mount so server and first client render agree (empty), then
  // hydrate from localStorage.
  useEffect(() => {
    setCustomColors(readStored())
  }, [])

  const addCustom = useCallback((hex: string) => {
    const color = hex.toLowerCase()
    setCustomColors((prev) => {
      const without = prev.filter((c) => c.toLowerCase() !== color)
      const next = [...without, color].slice(-MAX_CUSTOM_COLORS)
      writeStored(next)
      return next
    })
  }, [])

  const removeCustom = useCallback((hex: string) => {
    const color = hex.toLowerCase()
    setCustomColors((prev) => {
      const next = prev.filter((c) => c.toLowerCase() !== color)
      writeStored(next)
      return next
    })
  }, [])

  return { customColors, addCustom, removeCustom }
}
