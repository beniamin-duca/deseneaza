'use client'

import { useEffect, useState } from 'react'

export type FeedbackCategory = 'fill' | 'stamp' | 'complete'

const SOUND_FILES: Record<FeedbackCategory, string[]> = {
  fill: ['/sounds/fill-1.mp3', '/sounds/fill-2.mp3', '/sounds/fill-3.mp3'],
  stamp: ['/sounds/stamp-1.mp3', '/sounds/stamp-2.mp3', '/sounds/stamp-3.mp3'],
  complete: ['/sounds/complete-1.mp3'],
}

const VIBRATE_PATTERNS: Record<FeedbackCategory, number | number[]> = {
  fill: [12, 30, 12],
  stamp: 15,
  complete: [20, 40, 20, 40, 40],
}

const STORAGE_KEY = 'riza:sound-enabled'

let audioCtx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const loading = new Map<string, Promise<AudioBuffer | null>>()
const listeners = new Set<(enabled: boolean) => void>()

let enabled = true
let initialized = false

function ensureInit() {
  if (initialized) return
  initialized = true
  if (typeof window === 'undefined') return
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    enabled = true
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url)
  if (cached) return Promise.resolve(cached)
  const inflight = loading.get(url)
  if (inflight) return inflight
  const ctx = getCtx()
  if (!ctx) return Promise.resolve(null)
  const p = (async () => {
    try {
      const res = await fetch(url)
      const arr = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(arr)
      buffers.set(url, buf)
      return buf
    } catch {
      return null
    } finally {
      loading.delete(url)
    }
  })()
  loading.set(url, p)
  return p
}

/** Decode all clips up-front. Call from a user gesture so the context unlocks. */
export function preloadSounds() {
  ensureInit()
  if (!getCtx()) return
  for (const list of Object.values(SOUND_FILES)) {
    for (const url of list) void loadBuffer(url)
  }
}

export function playSound(category: FeedbackCategory) {
  ensureInit()
  if (!enabled) return
  const ctx = getCtx()
  if (!ctx) return
  const list = SOUND_FILES[category]
  const url = list[Math.floor(Math.random() * list.length)]
  void loadBuffer(url).then((buf) => {
    if (!buf || !audioCtx || !enabled) return
    const src = audioCtx.createBufferSource()
    src.buffer = buf
    const range = category === 'complete' ? 0.04 : 0.08
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * range
    const gain = audioCtx.createGain()
    gain.gain.value = category === 'complete' ? 0.7 : 0.5
    src.connect(gain).connect(audioCtx.destination)
    src.start()
  })
}

export function vibrate(category: FeedbackCategory) {
  ensureInit()
  if (!enabled) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
    return
  try {
    navigator.vibrate(VIBRATE_PATTERNS[category])
  } catch {
    // ignore
  }
}

export function isSoundEnabled(): boolean {
  ensureInit()
  return enabled
}

export function setSoundEnabled(value: boolean) {
  ensureInit()
  enabled = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(value))
}

/** React hook for the mute toggle; stays in sync with the persisted flag. */
export function useSoundEnabled() {
  const [value, setValue] = useState(true)
  useEffect(() => {
    setValue(isSoundEnabled())
    const listener = (v: boolean) => setValue(v)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return { enabled: value, toggle: () => setSoundEnabled(!isSoundEnabled()) }
}
