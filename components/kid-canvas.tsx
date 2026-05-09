'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import type { Tool } from './toolbar'

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

export const KidCanvas = forwardRef<KidCanvasRef, KidCanvasProps>(
  function KidCanvas(
    { tool, color, brushSize, templateSrc, stampSrc, onStampPlaced },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [undoStack, setUndoStack] = useState<ImageData[]>([])
    const lastPointRef = useRef<Point | null>(null)
    const templateImageRef = useRef<HTMLImageElement | null>(null)
    const stampImageRef = useRef<HTMLImageElement | null>(null)

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const updateCanvasSize = () => {
        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        // Store current image data before resizing
        const ctx = canvas.getContext('2d')
        let imageData: ImageData | null = null
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        if (ctx) {
          ctx.scale(dpr, dpr)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctxRef.current = ctx

          // Fill with white background
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, rect.width, rect.height)

          // Draw template if exists
          if (templateImageRef.current) {
            drawTemplate(ctx, templateImageRef.current, rect.width, rect.height)
          }

          // Restore previous drawing if available
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
        }
      }

      updateCanvasSize()

      const resizeObserver = new ResizeObserver(updateCanvasSize)
      resizeObserver.observe(container)

      return () => resizeObserver.disconnect()
    }, [])

    // Load template image
    useEffect(() => {
      if (!templateSrc) {
        templateImageRef.current = null
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        templateImageRef.current = img
        const canvas = canvasRef.current
        const ctx = ctxRef.current
        if (canvas && ctx) {
          const rect = canvas.getBoundingClientRect()
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, rect.width, rect.height)
          drawTemplate(ctx, img, rect.width, rect.height)
          saveToUndoStack()
        }
      }
      img.src = templateSrc
    }, [templateSrc])

    // Load stamp image
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

    const drawTemplate = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      width: number,
      height: number
    ) => {
      const scale = Math.min(width / img.width, height / img.height) * 0.9
      const x = (width - img.width * scale) / 2
      const y = (height - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    }

    const saveToUndoStack = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      const rect = canvas.getBoundingClientRect()
      const imageData = ctx.getImageData(0, 0, rect.width, rect.height)

      setUndoStack((prev) => {
        const newStack = [...prev, imageData]
        if (newStack.length > MAX_UNDO_STACK) {
          return newStack.slice(-MAX_UNDO_STACK)
        }
        return newStack
      })
    }, [])

    const getPointerPos = (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
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

      const rect = canvas.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4
      const startR = data[startIdx]
      const startG = data[startIdx + 1]
      const startB = data[startIdx + 2]

      // Parse fill color
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

      // Don't fill if clicking on same color
      if (startR === fillR && startG === fillG && startB === fillB) return

      const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]]
      const visited = new Set<string>()
      const tolerance = 32

      const colorMatch = (idx: number) => {
        return (
          Math.abs(data[idx] - startR) <= tolerance &&
          Math.abs(data[idx + 1] - startG) <= tolerance &&
          Math.abs(data[idx + 2] - startB) <= tolerance
        )
      }

      while (stack.length > 0) {
        const [x, y] = stack.pop()!
        const key = `${x},${y}`

        if (visited.has(key)) continue
        if (x < 0 || x >= width || y < 0 || y >= height) continue

        const idx = (y * width + x) * 4
        if (!colorMatch(idx)) continue

        visited.add(key)
        data[idx] = fillR
        data[idx + 1] = fillG
        data[idx + 2] = fillB
        data[idx + 3] = 255

        stack.push([x + 1, y])
        stack.push([x - 1, y])
        stack.push([x, y + 1])
        stack.push([x, y - 1])
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

      // Handle stamp placement
      if (stampSrc && stampImageRef.current) {
        placeStamp(pos)
        return
      }

      // Handle fill tool
      if (tool === 'fill') {
        saveToUndoStack()
        floodFill(pos.x, pos.y, color)
        saveToUndoStack()
        return
      }

      // Start drawing
      saveToUndoStack()
      setIsDrawing(true)
      lastPointRef.current = pos

      // Set up context for drawing
      if (tool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = brushSize * 2
      } else {
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
      }

      // Draw initial dot
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

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      undo: () => {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        if (!ctx || !canvas || undoStack.length === 0) return

        setUndoStack((prev) => {
          const newStack = [...prev]
          const imageData = newStack.pop()
          if (imageData) {
            ctx.putImageData(imageData, 0, 0)
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

        // Redraw template if exists
        if (templateImageRef.current) {
          drawTemplate(ctx, templateImageRef.current, rect.width, rect.height)
        }
      },
      canUndo: () => undoStack.length > 0,
      getImageDataUrl: () => {
        const canvas = canvasRef.current
        if (!canvas) return null
        return canvas.toDataURL('image/png')
      },
    }))

    return (
      <div
        ref={containerRef}
        className="flex-1 w-full bg-white touch-canvas overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>
    )
  }
)
