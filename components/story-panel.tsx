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
      <div
        aria-hidden
        className="h-1.5 shrink-0"
        style={{ backgroundColor: story.accentColor }}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: story.accentColor }}
        >
          {story.scriptureRef}
        </p>
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
