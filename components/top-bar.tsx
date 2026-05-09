'use client'

import { ArrowLeft, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  title: string
  onHelp?: () => void
  showBack?: boolean
}

export function TopBar({ title, onHelp, showBack = true }: TopBarProps) {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="w-12">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-12 rounded-full btn-bounce"
            aria-label="Inapoi"
          >
            <ArrowLeft className="size-6" />
          </Button>
        )}
      </div>
      
      <h1 className="font-display text-xl font-semibold text-foreground text-center">
        {title}
      </h1>
      
      <div className="w-12">
        {onHelp && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            className="size-12 rounded-full btn-bounce"
            aria-label="Ajutor"
          >
            <HelpCircle className="size-6" />
          </Button>
        )}
      </div>
    </header>
  )
}
