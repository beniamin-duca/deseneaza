'use client'

import { Sparkles } from 'lucide-react'
import { type Story } from '@/lib/stories'

interface StoryPanelProps {
  story: Story
  onDone: () => void
  doneDisabled?: boolean
}

export function StoryPanel({ story, onDone, doneDisabled = false }: StoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <header
        className="px-5 py-4 text-white"
        style={{ backgroundColor: story.accentColor }}
      >
        <h1 className="font-display text-xl font-bold">{story.titleRo}</h1>
        <p className="text-sm opacity-90">{story.scriptureRef}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {story.paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground">
            {p}
          </p>
        ))}
      </div>

      <div className="p-4 border-t border-border/50">
        <button
          onClick={onDone}
          disabled={doneDisabled}
          className="w-full h-12 rounded-full font-display text-lg font-bold bg-mint hover:bg-mint-dark text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          Gata!
        </button>
      </div>
    </div>
  )
}
