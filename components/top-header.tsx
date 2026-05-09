'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopHeaderProps {
  title: string
  backHref?: string
  showAdSlot?: boolean
  className?: string
}

export function TopHeader({
  title,
  backHref = '/',
  showAdSlot = true,
  className,
}: TopHeaderProps) {
  return (
    <header
      className={cn(
        'h-16 shrink-0 bg-white/95 backdrop-blur border-b border-border/50',
        'flex items-center justify-between gap-4 px-4',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={backHref}
          className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
          aria-label="Inapoi"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-lg font-bold text-foreground truncate">
          {title}
        </h1>
      </div>

      {showAdSlot && (
        <div
          aria-label="Spatiu reclama"
          data-ad-slot="header"
          className="hidden md:flex flex-1 max-w-[728px] h-12 rounded-lg bg-muted/30 border border-dashed border-border/60 items-center justify-center text-xs text-muted-foreground/70"
        >
          Spatiu reclama
        </div>
      )}
    </header>
  )
}
