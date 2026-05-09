'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Paintbrush, Palette, Stamp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModeCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
}

function ModeCard({ href, icon, title, description, bgColor }: ModeCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6 rounded-3xl',
        'transition-all btn-bounce shadow-lg',
        'hover:scale-105 active:scale-95',
        'min-h-[160px]',
        bgColor
      )}
    >
      <div className="p-4 rounded-full bg-white/30">
        {icon}
      </div>
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-white text-balance">
          {title}
        </h2>
        <p className="text-sm text-white/80 mt-1">
          {description}
        </p>
      </div>
    </Link>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header with mascot */}
      <header className="flex flex-col items-center pt-8 pb-4 px-4">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/mascot.jpg"
            alt="Riza mascota"
            fill
            className="object-contain rounded-full"
            priority
          />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground text-center">
          Riza
        </h1>
        <p className="text-muted-foreground text-center mt-1">
          Hai sa desenam impreuna!
        </p>
      </header>

      {/* Mode selection grid */}
      <section className="flex-1 px-4 pb-6">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 max-w-lg mx-auto">
          <ModeCard
            href="/desen?mode=blank"
            icon={<Paintbrush className="size-8 text-white" />}
            title="Deseneaza"
            description="Foaie goala"
            bgColor="bg-coral"
          />
          
          <ModeCard
            href="/desen?mode=colorat"
            icon={<Palette className="size-8 text-white" />}
            title="Coloreaza"
            description="Alege un desen"
            bgColor="bg-mint"
          />
          
          <ModeCard
            href="/desen?mode=stampile"
            icon={<Stamp className="size-8 text-foreground" />}
            title="Stampile"
            description="Pune stampile"
            bgColor="bg-yellow"
          />
          
          <ModeCard
            href="/desen?mode=surpriza"
            icon={<Sparkles className="size-8 text-white" />}
            title="Surpriza"
            description="Desen aleator"
            bgColor="bg-[#AA96DA]"
          />
        </div>
      </section>

      {/* Footer links */}
      <footer className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/parinti" className="hover:text-foreground transition-colors">
            Pentru parinti
          </Link>
          <span>|</span>
          <Link href="/termeni" className="hover:text-foreground transition-colors">
            Termeni
          </Link>
          <span>|</span>
          <Link href="/confidentialitate" className="hover:text-foreground transition-colors">
            Confidentialitate
          </Link>
        </div>
      </footer>
    </main>
  )
}
