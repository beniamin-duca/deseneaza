'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface SparkleOverlayRef {
  burst: (clientX: number, clientY: number, opts?: BurstOpts) => void
  confetti: () => void
}

interface BurstOpts {
  count?: number
  colors?: string[]
  speed?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  rotation: number
  vr: number
  shape: 'star' | 'rect'
}

const DEFAULT_COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C780FA',
  '#FF9F45',
]

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number,
  color: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  // 4-point sparkle
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i
    const radius = i % 2 === 0 ? r : r * 0.4
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export const SparkleOverlay = forwardRef<SparkleOverlayRef>(
  function SparkleOverlay(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number | null>(null)
    const lastTsRef = useRef(0)
    const dprRef = useRef(1)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const resize = () => {
        const dpr = window.devicePixelRatio || 1
        dprRef.current = dpr
        canvas.width = window.innerWidth * dpr
        canvas.height = window.innerHeight * dpr
        canvas.style.width = `${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
      }
      resize()
      window.addEventListener('resize', resize)
      return () => {
        window.removeEventListener('resize', resize)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }, [])

    const tick = (ts: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) {
        rafRef.current = null
        return
      }
      const dt = lastTsRef.current ? Math.min(ts - lastTsRef.current, 48) : 16
      lastTsRef.current = ts
      const dpr = dprRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const live: Particle[] = []
      for (const p of particlesRef.current) {
        p.life -= dt
        if (p.life <= 0) continue
        p.vy += p.gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rotation += p.vr * dt
        live.push(p)
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife))
        if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color)
        } else {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1
      particlesRef.current = live
      if (live.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        lastTsRef.current = 0
      }
    }

    const ensureLoop = () => {
      if (rafRef.current == null) {
        lastTsRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    useImperativeHandle(ref, () => ({
      burst: (clientX, clientY, opts) => {
        const count = opts?.count ?? 14
        const colors = opts?.colors ?? DEFAULT_COLORS
        const speed = opts?.speed ?? 0.28
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
          const v = speed * (0.5 + Math.random())
          particlesRef.current.push({
            x: clientX,
            y: clientY,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v,
            life: 600,
            maxLife: 600,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.0008,
            rotation: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.02,
            shape: 'star',
          })
        }
        ensureLoop()
      },
      confetti: () => {
        const w = window.innerWidth
        const count = 90
        for (let i = 0; i < count; i++) {
          const life = 1500 + Math.random() * 900
          particlesRef.current.push({
            x: Math.random() * w,
            y: -20 - Math.random() * 120,
            vx: (Math.random() - 0.5) * 0.16,
            vy: 0.1 + Math.random() * 0.16,
            life,
            maxLife: life,
            size: 8 + Math.random() * 8,
            color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
            gravity: 0.0004,
            rotation: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.03,
            shape: 'rect',
          })
        }
        ensureLoop()
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-20 pointer-events-none"
        aria-hidden="true"
      />
    )
  }
)
