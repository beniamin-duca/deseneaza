'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, Home, Volume2, VolumeX } from 'lucide-react'
import { useSoundEnabled } from '@/lib/feedback'

interface FloatingTopBarProps {
  title?: string
  showBack?: boolean
  showHome?: boolean
  showHelp?: boolean
  showSound?: boolean
  onHelp?: () => void
  backHref?: string
}

export function FloatingTopBar({
  title,
  showBack = true,
  showHome = false,
  showHelp = false,
  showSound = false,
  onHelp,
  backHref = '/',
}: FloatingTopBarProps) {
  const { enabled: soundOn, toggle: toggleSound } = useSoundEnabled()
  return (
    <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
      {/* Left side */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {showBack && (
          <Link
            href={backHref}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Inapoi"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Link>
        )}
        {showHome && (
          <Link
            href="/"
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Acasa"
          >
            <Home className="w-6 h-6 text-foreground" />
          </Link>
        )}
      </div>

      {/* Center - Title */}
      {title && (
        <div className="floating-toolbar px-6 py-2 pointer-events-auto">
          <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {showSound && (
          <button
            onClick={toggleSound}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={soundOn ? 'Oprește sunetul' : 'Pornește sunetul'}
            aria-pressed={soundOn}
            title={soundOn ? 'Sunet pornit' : 'Sunet oprit'}
          >
            {soundOn ? (
              <Volume2 className="w-6 h-6 text-foreground" />
            ) : (
              <VolumeX className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
        )}
        {showHelp && onHelp && (
          <button
            onClick={onHelp}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Ajutor"
          >
            <HelpCircle className="w-6 h-6 text-foreground" />
          </button>
        )}
        {!showHelp && !showSound && <div className="w-12 h-12" />}
      </div>
    </div>
  )
}
