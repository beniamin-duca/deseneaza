'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const COLORS = [
  { c: '#E63946', label: 'Roșu' },
  { c: '#FFD93D', label: 'Galben' },
  { c: '#7CB342', label: 'Verde' },
  { c: '#6BB6E8', label: 'Albastru' },
  { c: '#2D3047', label: 'Închis' },
]

export function HeroDoodle() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroElRef = useRef<HTMLElement | null>(null)
  const colorRef = useRef('#E63946')
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const hasStrokeRef = useRef(false)
  const [activeColor, setActiveColor] = useState('#E63946')
  const [hintGone, setHintGone] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [drawOn, setDrawOn] = useState(false)

  useEffect(() => {
    const cv = canvasRef.current
    const hero = cv?.closest('.hero') as HTMLElement | null
    if (!cv || !hero) return
    heroElRef.current = hero
    const ctx = cv.getContext('2d')!

    const fit = () => {
      const w = hero.clientWidth, h = hero.clientHeight
      if (w < 2 || h < 2) { requestAnimationFrame(fit); return }
      const prev = cv.width > 0 && hasStrokeRef.current ? cv.toDataURL() : null
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, w, h); img.src = prev }
    }
    fit()
    let rt: ReturnType<typeof setTimeout>
    const refit = () => { clearTimeout(rt); rt = setTimeout(fit, 150) }
    window.addEventListener('resize', refit)
    if (document.fonts?.ready) document.fonts.ready.then(refit)
    const ro = window.ResizeObserver ? new ResizeObserver(refit) : null
    ro?.observe(hero)

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const firstStroke = () => {
      if (hasStrokeRef.current) return
      hasStrokeRef.current = true
      setHintGone(true); setShowContinue(true)
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      try { cv.setPointerCapture(e.pointerId) } catch {}
      drawingRef.current = true
      const p = pos(e); lastRef.current = p
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colorRef.current
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill()
      firstStroke()
    }
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return
      e.preventDefault()
      const p = pos(e)
      ctx.strokeStyle = colorRef.current; ctx.lineWidth = 7
      ctx.beginPath(); ctx.moveTo(lastRef.current.x, lastRef.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
      lastRef.current = p
    }
    const stop = () => { drawingRef.current = false }
    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerup', stop)
    cv.addEventListener('pointercancel', stop)

    // demo squiggle on fine pointers
    let raf = 0
    const mm = window.matchMedia
    if (mm?.('(prefers-reduced-motion: no-preference)').matches && mm('(pointer:fine)').matches) {
      const t = setTimeout(() => {
        if (hasStrokeRef.current || hero.clientWidth < 900) return
        const w = hero.clientWidth, h = hero.clientHeight
        const x0 = w * 0.09, y0 = h - 128, len = 130
        let i = 1; const N = 44
        ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 7; ctx.lineCap = 'round'
        const step = () => {
          if (hasStrokeRef.current || i > N) return
          const t0 = (i - 1) / N, t1 = i / N
          ctx.beginPath()
          ctx.moveTo(x0 + t0 * len, y0 + Math.sin(t0 * Math.PI * 3) * 13)
          ctx.lineTo(x0 + t1 * len, y0 + Math.sin(t1 * Math.PI * 3) * 13)
          ctx.stroke(); i++; raf = requestAnimationFrame(step)
        }
        step()
      }, 1400)
      return () => {
        clearTimeout(t); cancelAnimationFrame(raf)
        window.removeEventListener('resize', refit); ro?.disconnect()
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove)
        cv.removeEventListener('pointerup', stop); cv.removeEventListener('pointercancel', stop)
      }
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', refit); ro?.disconnect()
      cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerup', stop); cv.removeEventListener('pointercancel', stop)
    }
  }, [])

  const pickColor = (c: string) => { colorRef.current = c; setActiveColor(c) }
  const clear = () => {
    const cv = canvasRef.current; const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore()
  }

  return (
    <>
      <canvas className="hero-canvas" ref={canvasRef} aria-label="Foaie de desen — încearcă aici" />
      <div className={`doodle-hint${hintGone ? ' gone' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 50 40" fill="none" stroke="#5b5f78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4 C 14 20 26 30 42 32" /><path d="M34 28 L 43 32 L 36 38" /></svg>
        încearcă aici!
      </div>
      <div className="doodle-ui" role="toolbar" aria-label="Culori de desen">
        {COLORS.map((c) => (
          <button key={c.c} className={`d${activeColor === c.c ? ' sel' : ''}`} style={{ background: c.c }} aria-label={c.label} onClick={() => pickColor(c.c)} />
        ))}
        <button className="dclear" aria-label="Șterge desenul" onClick={clear}>
          <svg viewBox="0 0 24 24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></svg>
        </button>
      </div>
      <button className={`doodle-continue${showContinue ? ' on' : ''}`} onClick={() => router.push('/desen')}>
        Ia desenul cu tine
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <button className={`doodle-toggle`} aria-label="Desenează pe plai" onClick={() => { setDrawOn((v) => !v); heroElRef.current?.classList.toggle('draw-on') }}>✏️</button>
    </>
  )
}
