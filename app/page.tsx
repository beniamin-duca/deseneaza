import { PlaiuNav } from '@/components/plaiu/plaiu-nav'
import { Hero } from '@/components/plaiu/hero'
import { PlayModes } from '@/components/plaiu/play-modes'
import { Gallery } from '@/components/plaiu/gallery'
import { Verticals } from '@/components/plaiu/verticals'
import { Trust } from '@/components/plaiu/trust'
import { StoryBand } from '@/components/plaiu/story-band'
import { FinalCta } from '@/components/plaiu/final-cta'
import { PlaiuFooter } from '@/components/plaiu/plaiu-footer'

export default function HomePage() {
  return (
    <div className="plaiu">
      <PlaiuNav />
      <main>
        <Hero />
        <PlayModes />
        <Gallery />
        <Verticals />
        <Trust />
        <StoryBand />
        <FinalCta />
      </main>
      <PlaiuFooter />
    </div>
  )
}
