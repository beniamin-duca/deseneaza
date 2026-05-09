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
  bgClass: string
  textClass?: string
  delay?: number
}

function ModeCard({
  href,
  icon,
  title,
  description,
  bgClass,
  textClass = 'text-white',
  delay = 0,
}: ModeCardProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        'pop-in playful-card',
        'flex flex-col items-center justify-center gap-3 p-6 rounded-3xl',
        'min-h-[170px]',
        bgClass
      )}
    >
      <div className="p-4 rounded-full bg-white/30 backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-center">
        <h2
          className={cn(
            'font-display text-xl font-bold text-balance',
            textClass
          )}
        >
          {title}
        </h2>
        <p className={cn('text-sm mt-1 opacity-90', textClass)}>
          {description}
        </p>
      </div>
    </Link>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="relative w-28 h-28 mb-4 float">
          <div className="wiggle w-full h-full">
            <Image
              src="/mascot.jpg"
              alt="Riza mascota"
              fill
              className="object-contain rounded-full"
              priority
            />
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground text-center">
          Riza
        </h1>
        <p className="text-muted-foreground text-center mt-1 text-base">
          Hai sa desenam impreuna!
        </p>
      </header>

      <section className="flex-1 px-4 pb-6">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 max-w-lg mx-auto">
          <ModeCard
            href="/desen?mode=blank"
            icon={<Paintbrush className="size-8 text-white" />}
            title="Deseneaza"
            description="Foaie goala"
            bgClass="bg-gradient-to-br from-coral to-coral-dark"
            delay={0}
          />

          <ModeCard
            href="/desen?mode=colorat"
            icon={<Palette className="size-8 text-white" />}
            title="Coloreaza"
            description="Alege un desen"
            bgClass="bg-gradient-to-br from-mint to-mint-dark"
            delay={80}
          />

          <ModeCard
            href="/desen?mode=stampile"
            icon={<Stamp className="size-8 text-foreground" />}
            title="Stampile"
            description="Pune stampile"
            bgClass="bg-gradient-to-br from-yellow to-yellow-dark"
            textClass="text-foreground"
            delay={160}
          />

          <ModeCard
            href="/desen?mode=surpriza"
            icon={<Sparkles className="size-8 text-white" />}
            title="Surpriza"
            description="Desen aleator"
            bgClass="bg-gradient-to-br from-[#AA96DA] to-[#8E7BC4]"
            delay={240}
          />
        </div>
      </section>

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
          <Link
            href="/confidentialitate"
            className="hover:text-foreground transition-colors"
          >
            Confidentialitate
          </Link>
        </div>
      </footer>
    </main>
  )
}
