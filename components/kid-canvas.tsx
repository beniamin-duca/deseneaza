'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
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
}

export interface KidCanvasRef {
  undo: () => void
  clear: () => void
  canUndo: () => boolean
  getImageDataUrl: () => string | null
}

const MAX_UNDO_STACK = 20
const TEMPLATE_BARRIER_THRESHOLD = 80

export const KidCanvas = forwardRef<KidCanvasRef, KidCanvasProps>(
  function KidCanvas(
    { tool, color, brushSize, templateSrc, stampSrc, onStampPlaced },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const dprRef = useRef<number>(1)
    const templateImgRef = useRef<HTMLImageElement | null>(null)
    const templateBarrierRef = useRef<Uint8ClampedArray | null>(null)
    const stampImageRef = useRef<HTMLImageElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [undoStack, setUndoStack] = useState<ImageData[]>([])
    const lastPointRef = useRef<Point | null>(null)

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
        const canvas = canvasRef.current
        if (ctx && canvas) {
          const rect = canvas.getBoundingClientRect()
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, rect.width, rect.height)
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
        const canvas = canvasRef.current
        if (ctx && canvas) {
          const rect = canvas.getBoundingClientRect()
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, rect.width, rect.height)
          setUndoStack([])
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

    const saveToUndoStack = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setUndoStack((prev) => {
        const newStack = [...prev, imageData]
        if (newStack.length > MAX_UNDO_STACK) return newStack.slice(-MAX_UNDO_STACK)
        return newStack
      })
    }, [])

    const getPointerPos = (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const drawStroke = (from: Point, to: Point) => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
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

      const tolerance = 32
      const visited = new Uint8Array(width * height)
      const stack: number[] = [py * width + px]

      while (stack.length > 0) {
        const pos = stack.pop()!
        if (visited[pos]) continue
        if (barrier && barrier[pos] === 1) continue

        const idx = pos * 4
        if (
          Math.abs(data[idx] - startR) > tolerance ||
          Math.abs(data[idx + 1] - startG) > tolerance ||
          Math.abs(data[idx + 2] - startB) > tolerance
        ) {
          continue
        }

        visited[pos] = 1
        data[idx] = fillR
        data[idx + 1] = fillG
        data[idx + 2] = fillB
        data[idx + 3] = 255

        const x = pos % width
        const y = (pos - x) / width
        if (x + 1 < width) stack.push(pos + 1)
        if (x - 1 >= 0) stack.push(pos - 1)
        if (y + 1 < height) stack.push(pos + width)
        if (y - 1 >= 0) stack.push(pos - width)
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
      saveToUndoStack()
      onStampPlaced?.()
    }

    const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault()
      const pos = getPointerPos(e)
      const ctx = ctxRef.current
      if (!ctx) return

      if (stampSrc && stampImageRef.current) {
        placeStamp(pos)
        return
      }

      if (tool === 'fill') {
        saveToUndoStack()
        floodFill(pos.x, pos.y, color)
        return
      }

      saveToUndoStack()
      setIsDrawing(true)
      lastPointRef.current = pos

      if (tool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = brushSize * 2
      } else {
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
      }

      ctx.beginPath()
      ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
    }

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDrawing || !lastPointRef.current) return
      e.preventDefault()
      const pos = getPointerPos(e)
      drawStroke(lastPointRef.current, pos)
      lastPointRef.current = pos
    }

    const handlePointerUp = () => {
      if (isDrawing) {
        setIsDrawing(false)
        lastPointRef.current = null
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
      },
      clear: () => {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        if (!ctx || !canvas) return
        saveToUndoStack()
        const rect = canvas.getBoundingClientRect()
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, rect.width, rect.height)
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

    return (
      <div
        ref={containerRef}
        className="flex-1 w-full bg-white touch-canvas overflow-hidden relative"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair block"
          style={{ touchAction: 'none' }}
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
    )
  }
)
