'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Minimize2 } from 'lucide-react'
import type { Tool } from './floating-toolbar'

interface Point {
  x: number
  y: number
}

interface KidCanvasProps {
  tool: Tool
  color: string
  brushSize: number
  templateSrc?: string | null
  stampSrc?: string | null
  onStampPlaced?: () => void
  disabled?: boolean
  initialImageBlob?: Blob | null
  onCanvasIdle?: (blob: Blob) => void
  onStrokeStart?: () => void
  onStrokeEnd?: () => void
}

export interface KidCanvasRef {
  undo: () => void
  clear: () => void
  canUndo: () => boolean
  getImageDataUrl: () => string | null
}

const MAX_UNDO_STACK = 20
const TEMPLATE_BARRIER_THRESHOLD = 80
// How close (per RGB channel) a pixel must be to the seed color to be flooded.
const FILL_TOLERANCE = 32

// Inline SVG cursors per tool. Hotspot is the natural "active tip"
// of each tool. Brush + fill use the active color so the kid sees
// what they're about to paint with.
function buildToolCursor(tool: Tool, color: string, disabled: boolean): string {
  if (disabled) return 'not-allowed'

  const cursor = (svg: string, hotX: number, hotY: number) =>
    `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${hotX} ${hotY}, auto`

  switch (tool) {
    case 'brush': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M22 4 L28 10 L13 25 L7 25 L7 19 Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/><circle cx="5" cy="27" r="4" fill="${color}" stroke="black" stroke-width="2"/></svg>`
      return cursor(svg, 5, 27)
    }
    case 'eraser': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="12" width="22" height="12" rx="3" fill="white" stroke="black" stroke-width="2"/><line x1="4" y1="20" x2="26" y2="20" stroke="black" stroke-width="1.5"/></svg>`
      return cursor(svg, 15, 20)
    }
    case 'fill': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M8 4 L20 16 L8 28 L4 24 Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/><path d="M20 16 L24 20 L24 26 L18 26 Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/><circle cx="27" cy="26" r="3" fill="${color}" stroke="black" stroke-width="1.5"/></svg>`
      return cursor(svg, 4, 26)
    }
    case 'stamp': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="22" width="24" height="6" rx="1" fill="white" stroke="black" stroke-width="2"/><path d="M10 22 L10 14 L8 4 L24 4 L22 14 L22 22 Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/></svg>`
      return cursor(svg, 16, 26)
    }
  }
}

export const KidCanvas = forwardRef<KidCanvasRef, KidCanvasProps>(
  function KidCanvas(
    {
      tool,
      color,
      brushSize,
      templateSrc,
      stampSrc,
      onStampPlaced,
      disabled = false,
      initialImageBlob,
      onCanvasIdle,
      onStrokeStart,
      onStrokeEnd,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const dprRef = useRef<number>(1)
    const templateImgRef = useRef<HTMLImageElement | null>(null)
    const templateBarrierRef = useRef<Uint8ClampedArray | null>(null)
    const stampImageRef = useRef<HTMLImageElement | null>(null)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const restoredRef = useRef(false)
    const restoreImgRef = useRef<HTMLImageElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [undoStack, setUndoStack] = useState<ImageData[]>([])
    const lastPointRef = useRef<Point | null>(null)
    // Whether the current stroke has moved (vs. a lone dot), the pre-action
    // snapshot for reverting a dot when a pinch starts, and whether the kid has
    // drawn anything yet (so a late async draft-restore can't clobber real work).
    const strokeMovedRef = useRef(false)
    const lastSnapshotRef = useRef<ImageData | null>(null)
    const hasDrawnRef = useRef(false)

    // Pinch-to-zoom. Zoom/pan are PURELY visual (CSS transform on the inner
    // wrapper); the canvas backing store, dpr and barrier arrays stay untouched.
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
    const frameRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
    const pointersRef = useRef<Map<number, Point>>(new Map())
    const gestureRef = useRef<{
      startDist: number
      startZoom: number
      origin: Point
      anchor: Point
    } | null>(null)
    const zoomPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [showZoomPill, setShowZoomPill] = useState(false)

    const getTemplateRect = (
      imgW: number,
      imgH: number,
      canvasW: number,
      canvasH: number
    ) => {
      const scale = Math.min(canvasW / imgW, canvasH / imgH)
      const w = imgW * scale
      const h = imgH * scale
      const x = (canvasW - w) / 2
      const y = (canvasH - h) / 2
      return { x, y, w, h }
    }

    const buildTemplateBarrier = useCallback(() => {
      const canvas = canvasRef.current
      const img = templateImgRef.current
      if (!canvas || !img) {
        templateBarrierRef.current = null
        return
      }

      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!offCtx) return

      offCtx.fillStyle = '#FFFFFF'
      offCtx.fillRect(0, 0, canvas.width, canvas.height)
      const r = getTemplateRect(img.width, img.height, canvas.width, canvas.height)
      offCtx.drawImage(img, r.x, r.y, r.w, r.h)

      const data = offCtx.getImageData(0, 0, canvas.width, canvas.height).data
      const barrier = new Uint8ClampedArray(canvas.width * canvas.height)
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3
        barrier[j] = luminance < TEMPLATE_BARRIER_THRESHOLD ? 1 : 0
      }
      templateBarrierRef.current = barrier
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const updateCanvasSize = () => {
        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        dprRef.current = dpr
        frameRef.current = { w: rect.width, h: rect.height }

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        let imageData: ImageData | null = null
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.scale(dpr, dpr)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctxRef.current = ctx

          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, rect.width, rect.height)

          if (imageData) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = imageData.width
            tempCanvas.height = imageData.height
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
              tempCtx.putImageData(imageData, 0, 0)
              ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height)
            }
          }

          if (templateImgRef.current) {
            buildTemplateBarrier()
          }
        }
      }

      updateCanvasSize()
      const resizeObserver = new ResizeObserver(updateCanvasSize)
      resizeObserver.observe(container)
      return () => resizeObserver.disconnect()
    }, [buildTemplateBarrier])

    useEffect(() => {
      if (!templateSrc) {
        templateImgRef.current = null
        templateBarrierRef.current = null
        const ctx = ctxRef.current
        if (ctx) {
          const { w, h } = frameRef.current
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, w, h)
          setUndoStack([])
        }
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        templateImgRef.current = img
        buildTemplateBarrier()
        const ctx = ctxRef.current
        if (ctx) {
          const { w, h } = frameRef.current
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, w, h)
          setUndoStack([])
          // The template image and the draft restore load independently. If a
          // draft is being restored for this template, re-apply it over the
          // fresh white fill so the result is the same whichever loads last.
          if (restoreImgRef.current && !hasDrawnRef.current) {
            ctx.drawImage(restoreImgRef.current, 0, 0, w, h)
          }
        }
      }
      img.src = templateSrc
    }, [templateSrc, buildTemplateBarrier])

    useEffect(() => {
      if (!stampSrc) {
        stampImageRef.current = null
        return
      }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        stampImageRef.current = img
      }
      img.src = stampSrc
    }, [stampSrc])

    useEffect(() => {
      if (!initialImageBlob || restoredRef.current) return
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      if (!ctx || !canvas) return

      const img = new Image()
      const url = URL.createObjectURL(initialImageBlob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        // If the canvas was cleared / a new template chosen while this was
        // loading, the restore is stale — drop it.
        if (restoredRef.current) return
        restoredRef.current = true
        // Keep the decoded draft so the template effect can re-apply it if its
        // image loads after this one (colorat mode).
        restoreImgRef.current = img
        // If the kid already started drawing during the (doubly async) load,
        // don't paint the old opaque draft over their fresh work.
        if (hasDrawnRef.current) return
        // Use the logical frame size, not canvas.getBoundingClientRect(), which
        // would be scaled if a pinch-zoom transform is active.
        const { w, h } = frameRef.current
        ctx.drawImage(img, 0, 0, w, h)
      }
      img.src = url
    }, [initialImageBlob])

    useEffect(() => {
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        if (zoomPillTimerRef.current) clearTimeout(zoomPillTimerRef.current)
      }
    }, [])

    const saveToUndoStack = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      lastSnapshotRef.current = imageData
      setUndoStack((prev) => {
        const newStack = [...prev, imageData]
        if (newStack.length > MAX_UNDO_STACK) return newStack.slice(-MAX_UNDO_STACK)
        return newStack
      })
    }, [])

    const getPointerPos = (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      // getBoundingClientRect() already reflects the pinch-zoom CSS transform
      // (translate absorbed into rect.left, scale into rect size), so dividing
      // by zoom recovers logical canvas pixels. No dpr math here — floodFill and
      // strokes apply dpr themselves on this logical coordinate.
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      }
    }

    const effectiveBrushSize = (e: React.PointerEvent): number => {
      if (e.pointerType === 'pen') {
        const pressure = Math.max(0.05, e.pressure || 0.5)
        return Math.max(2, Math.min(80, brushSize * (0.4 + pressure * 1.2)))
      }
      return brushSize
    }

    const scheduleIdleSave = () => {
      if (!onCanvasIdle) return
      // Don't persist before a pending draft has been restored, or we'd clobber
      // the saved draft with a blank/partial canvas. (null = no draft to wait for.)
      if (initialImageBlob != null && !restoredRef.current) return
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.toBlob((blob) => {
          if (blob) onCanvasIdle(blob)
        }, 'image/png')
      }, 1000)
    }

    const drawStroke = (from: Point, to: Point) => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }

    const flashZoomPill = () => {
      setShowZoomPill(true)
      if (zoomPillTimerRef.current) clearTimeout(zoomPillTimerRef.current)
      zoomPillTimerRef.current = setTimeout(() => setShowZoomPill(false), 1600)
    }

    const twoPointers = () => Array.from(pointersRef.current.values())
    const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
    const mid = (a: Point, b: Point) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    })

    const beginPinch = () => {
      const container = containerRef.current
      const pts = twoPointers()
      if (!container || pts.length < 2) return

      // The first finger's pointerdown already ran a draw action before the
      // second finger arrived. If it was only a lone dot (no movement yet),
      // revert it and drop its undo entry so the pinch leaves no stray mark.
      // If it was a real (moved) stroke, complete it properly instead.
      if (lastPointRef.current !== null) {
        const ctx = ctxRef.current
        if (!strokeMovedRef.current && ctx && lastSnapshotRef.current) {
          ctx.save()
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.putImageData(lastSnapshotRef.current, 0, 0)
          ctx.restore()
          setUndoStack((prev) => prev.slice(0, -1))
        } else {
          onStrokeEnd?.()
        }
      }
      setIsDrawing(false)
      lastPointRef.current = null
      strokeMovedRef.current = false

      const rect = container.getBoundingClientRect()
      const origin = { x: rect.left, y: rect.top }
      const centroid = mid(pts[0], pts[1])
      // Wrapper-local point currently under the centroid (transformOrigin 0 0):
      // screen = origin + pan + local * zoom  =>  local = (screen - origin - pan) / zoom
      const anchor = {
        x: (centroid.x - origin.x - pan.x) / zoom,
        y: (centroid.y - origin.y - pan.y) / zoom,
      }
      gestureRef.current = {
        startDist: dist(pts[0], pts[1]),
        startZoom: zoom,
        origin,
        anchor,
      }
    }

    const updatePinch = () => {
      const g = gestureRef.current
      const pts = twoPointers()
      const frame = frameRef.current
      if (!g || pts.length < 2 || g.startDist === 0) return
      const curDist = dist(pts[0], pts[1])
      const centroid = mid(pts[0], pts[1])
      const nextZoom = Math.max(1, Math.min(4, g.startZoom * (curDist / g.startDist)))
      // Keep the anchored local point under the moving centroid.
      let nx = centroid.x - g.origin.x - g.anchor.x * nextZoom
      let ny = centroid.y - g.origin.y - g.anchor.y * nextZoom
      // Clamp so the scaled wrapper always covers the frame (no empty gaps).
      const minX = frame.w * (1 - nextZoom)
      const minY = frame.h * (1 - nextZoom)
      nx = Math.min(0, Math.max(minX, nx))
      ny = Math.min(0, Math.max(minY, ny))
      setZoom(nextZoom)
      setPan(nextZoom === 1 ? { x: 0, y: 0 } : { x: nx, y: ny })
      flashZoomPill()
    }

    const resetZoom = () => {
      gestureRef.current = null
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setShowZoomPill(false)
    }

    const floodFill = (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      const dpr = dprRef.current
      const width = canvas.width
      const height = canvas.height
      const px = Math.floor(startX * dpr)
      const py = Math.floor(startY * dpr)
      if (px < 0 || px >= width || py < 0 || py >= height) return

      const barrier = templateBarrierRef.current
      if (barrier && barrier[py * width + px] === 1) return

      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      const startIdx = (py * width + px) * 4
      const startR = data[startIdx]
      const startG = data[startIdx + 1]
      const startB = data[startIdx + 2]

      const tempDiv = document.createElement('div')
      tempDiv.style.color = fillColor
      document.body.appendChild(tempDiv)
      const computedColor = getComputedStyle(tempDiv).color
      document.body.removeChild(tempDiv)
      const match = computedColor.match(/\d+/g)
      if (!match) return
      const fillR = parseInt(match[0])
      const fillG = parseInt(match[1])
      const fillB = parseInt(match[2])

      if (startR === fillR && startG === fillG && startB === fillB) return

      const filled = new Uint8Array(width * height)
      const boundary: number[] = []

      const matches = (pos: number): boolean => {
        if (barrier && barrier[pos] === 1) return false
        const idx = pos * 4
        return (
          Math.abs(data[idx] - startR) <= FILL_TOLERANCE &&
          Math.abs(data[idx + 1] - startG) <= FILL_TOLERANCE &&
          Math.abs(data[idx + 2] - startB) <= FILL_TOLERANCE
        )
      }

      const paint = (pos: number) => {
        const idx = pos * 4
        data[idx] = fillR
        data[idx + 1] = fillG
        data[idx + 2] = fillB
        data[idx + 3] = 255
      }

      const stack: number[] = []
      // Returns true if neighbour n blocks the flood (non-matching) and so makes
      // `pos` a boundary pixel; fills + enqueues it when it matches. Hoisted out
      // of the loop so the hot per-pixel path allocates no closures.
      const blockedBy = (n: number): boolean => {
        if (filled[n]) return false
        if (matches(n)) {
          filled[n] = 1
          paint(n)
          stack.push(n)
          return false
        }
        return true
      }

      // Flood the contiguous same-color region (4-connected). Pixels are marked
      // `filled` at push time so each is processed once and the stack stays
      // bounded. A pixel touching a non-matching/out-of-bounds neighbour is a
      // boundary pixel and seeds the dilation pass below.
      const start = py * width + px
      filled[start] = 1
      paint(start)
      stack.push(start)

      while (stack.length > 0) {
        const pos = stack.pop()!
        const x = pos % width
        const y = (pos - x) / width
        let isBoundary = false

        if (x + 1 < width) { if (blockedBy(pos + 1)) isBoundary = true } else isBoundary = true
        if (x - 1 >= 0) { if (blockedBy(pos - 1)) isBoundary = true } else isBoundary = true
        if (y + 1 < height) { if (blockedBy(pos + width)) isBoundary = true } else isBoundary = true
        if (y - 1 >= 0) { if (blockedBy(pos - width)) isBoundary = true } else isBoundary = true

        if (isBoundary) boundary.push(pos)
      }

      // Dilation: grow the filled region outward by ~1 CSS px (round(dpr) device
      // px) to cover the anti-aliased seam between the fill edge and the separate,
      // multiply-blended contour overlay (the visible halo). Only runs when a
      // template barrier exists — the barrier both bounds the growth at the dark
      // contour AND is the only safe stop; in barrier-free (blank) mode there is
      // no overlay halo and dilation would erode the kid's own strokes.
      if (barrier) {
        const isBarrier = (p: number) => barrier[p] === 1
        const dilatePasses = Math.max(1, Math.round(dpr))
        let frontier = boundary
        for (let pass = 0; pass < dilatePasses && frontier.length > 0; pass++) {
          const next: number[] = []
          const grow = (np: number) => {
            if (filled[np] || isBarrier(np)) return
            filled[np] = 1
            paint(np)
            next.push(np)
          }
          for (const pos of frontier) {
            const x = pos % width
            const y = (pos - x) / width
            const right = x + 1 < width
            const left = x - 1 >= 0
            const down = y + 1 < height
            const up = y - 1 >= 0
            if (right) grow(pos + 1)
            if (left) grow(pos - 1)
            if (down) grow(pos + width)
            if (up) grow(pos - width)
            // Diagonals only when BOTH shared orthogonal cells are non-barrier,
            // so growth can't squeeze across a 1px-thin diagonal contour.
            if (right && down && !isBarrier(pos + 1) && !isBarrier(pos + width)) grow(pos + width + 1)
            if (left && down && !isBarrier(pos - 1) && !isBarrier(pos + width)) grow(pos + width - 1)
            if (right && up && !isBarrier(pos + 1) && !isBarrier(pos - width)) grow(pos - width + 1)
            if (left && up && !isBarrier(pos - 1) && !isBarrier(pos - width)) grow(pos - width - 1)
          }
          frontier = next
        }
      }

      ctx.putImageData(imageData, 0, 0)
    }

    const placeStamp = (pos: Point) => {
      const ctx = ctxRef.current
      const stampImg = stampImageRef.current
      if (!ctx || !stampImg) return
      const stampSize = 80
      const x = pos.x - stampSize / 2
      const y = pos.y - stampSize / 2
      ctx.drawImage(stampImg, x, y, stampSize, stampSize)
      hasDrawnRef.current = true
      saveToUndoStack()
      onStampPlaced?.()
      scheduleIdleSave()
      onStrokeEnd?.()
    }

    const handlePointerDown = (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (pointersRef.current.size === 2) {
          beginPinch()
          return
        }
        if (pointersRef.current.size > 2) return
      }
      if (disabled) return
      e.preventDefault()
      onStrokeStart?.()
      const pos = getPointerPos(e)
      const ctx = ctxRef.current
      if (!ctx) return

      if (stampSrc && stampImageRef.current) {
        placeStamp(pos)
        return
      }

      if (tool === 'fill') {
        hasDrawnRef.current = true
        saveToUndoStack()
        floodFill(pos.x, pos.y, color)
        scheduleIdleSave()
        onStrokeEnd?.()
        return
      }

      saveToUndoStack()
      setIsDrawing(true)
      strokeMovedRef.current = false
      lastPointRef.current = pos

      const size = effectiveBrushSize(e)
      if (tool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = size * 2
      } else {
        ctx.strokeStyle = color
        ctx.lineWidth = size
      }

      ctx.beginPath()
      ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
    }

    const handlePointerMove = (e: React.PointerEvent) => {
      if (e.pointerType === 'touch' && pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      if (pointersRef.current.size >= 2) {
        e.preventDefault()
        updatePinch()
        return
      }
      if (disabled || !isDrawing || !lastPointRef.current) return
      e.preventDefault()
      const ctx = ctxRef.current
      if (!ctx) return
      if (tool === 'eraser' || tool === 'brush') {
        const size = effectiveBrushSize(e)
        ctx.lineWidth = tool === 'eraser' ? size * 2 : size
      }
      const pos = getPointerPos(e)
      drawStroke(lastPointRef.current, pos)
      lastPointRef.current = pos
      strokeMovedRef.current = true
      hasDrawnRef.current = true
    }

    const handlePointerUp = (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') {
        pointersRef.current.delete(e.pointerId)
        if (pointersRef.current.size < 2) gestureRef.current = null
      }
      if (isDrawing) {
        setIsDrawing(false)
        lastPointRef.current = null
        hasDrawnRef.current = true
        scheduleIdleSave()
        onStrokeEnd?.()
      }
    }

    useImperativeHandle(ref, () => ({
      undo: () => {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        if (!ctx || !canvas || undoStack.length === 0) return
        setUndoStack((prev) => {
          const newStack = [...prev]
          const imageData = newStack.pop()
          if (imageData) {
            ctx.save()
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.putImageData(imageData, 0, 0)
            ctx.restore()
          }
          return newStack
        })
        scheduleIdleSave()
      },
      clear: () => {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        if (!ctx || !canvas) return
        saveToUndoStack()
        const { w, h } = frameRef.current
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        // Clearing is a fresh start: drop any pending/loaded draft restore so a
        // subsequent template load can't re-apply a stale draft over the blank.
        restoredRef.current = true
        restoreImgRef.current = null
        hasDrawnRef.current = false
        scheduleIdleSave()
        resetZoom()
      },
      canUndo: () => undoStack.length > 0,
      getImageDataUrl: () => {
        const canvas = canvasRef.current
        if (!canvas) return null

        const exportCanvas = document.createElement('canvas')
        exportCanvas.width = canvas.width
        exportCanvas.height = canvas.height
        const exportCtx = exportCanvas.getContext('2d')
        if (!exportCtx) return null

        exportCtx.drawImage(canvas, 0, 0)

        const tplImg = templateImgRef.current
        if (tplImg) {
          const r = getTemplateRect(
            tplImg.width,
            tplImg.height,
            canvas.width,
            canvas.height
          )
          exportCtx.globalCompositeOperation = 'multiply'
          exportCtx.drawImage(tplImg, r.x, r.y, r.w, r.h)
          exportCtx.globalCompositeOperation = 'source-over'
        }

        return exportCanvas.toDataURL('image/png')
      },
    }))

    const cursorStyle = buildToolCursor(tool, color, disabled)

    return (
      <div
        ref={containerRef}
        className="flex-1 w-full bg-white touch-canvas overflow-hidden relative"
      >
        {/* Inner transform layer: pinch-zoom scales the canvas AND the template
            overlay together. The container above stays unscaled so the
            ResizeObserver keeps reading the true frame size. */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block"
            style={{ touchAction: 'none', cursor: cursorStyle }}
          />
          {templateSrc && (
            <img
              src={templateSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ mixBlendMode: 'multiply' }}
              draggable={false}
            />
          )}
        </div>

        {zoom > 1 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full bg-foreground/80 text-background text-xs font-display shadow transition-transform duration-200"
              style={{ transform: showZoomPill ? 'scale(1.12)' : 'scale(1)' }}
            >
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={resetZoom}
              className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-foreground/70 hover:text-foreground"
              aria-label="Reseteaza zoom"
              title="Reseteaza zoom"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }
)
