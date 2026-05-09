'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, Home } from 'lucide-react'

interface FloatingTopBarProps {
  title?: string
  showBack?: boolean
  showHome?: boolean
  showHelp?: boolean
  onHelp?: () => void
  backHref?: string
}

export function FloatingTopBar({
  title,
  showBack = true,
  showHome = false,
  showHelp = false,
  onHelp,
  backHref = '/',
}: FloatingTopBarProps) {
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
        {showHelp && onHelp && (
          <button
            onClick={onHelp}
            className="floating-toolbar w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Ajutor"
          >
            <HelpCircle className="w-6 h-6 text-foreground" />
          </button>
        )}
        {/* Placeholder for symmetry if no help button */}
        {!showHelp && <div className="w-12 h-12" />}
      </div>
    </div>
  )
}
