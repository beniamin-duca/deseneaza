'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  delay?: 1 | 2 | 3
  className?: string
}

export function Reveal({ children, as, delay, className }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    const r = el.getBoundingClientRect()
    if (r.top < (window.innerHeight || 800) * 0.95) {
      el.classList.add('in')
      io.unobserve(el)
    }
    return () => io.disconnect()
  }, [])
  return (
    <Tag
      ref={ref}
      className={['reveal', delay ? `d${delay}` : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  )
}
