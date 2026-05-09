'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  TEMPLATES,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type Template,
  type TemplateCategory,
  type TemplateDifficulty,
} from '@/lib/templates'
import { Star, Shuffle } from 'lucide-react'
import { SidebarShell } from './sidebar-shell'

interface TemplateSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: Template) => void
  currentTemplateId?: string
}

export function TemplateSidebar({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId,
}: TemplateSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<TemplateDifficulty | 'all'>('all')

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (activeDifficulty !== 'all' && t.difficulty !== activeDifficulty) return false
    return true
  }).sort((a, b) => a.order - b.order)

  const handleRandomTemplate = () => {
    if (filteredTemplates.length === 0) return
    const idx = Math.floor(Math.random() * filteredTemplates.length)
    onSelectTemplate(filteredTemplates[idx])
  }

  return (
    <SidebarShell isOpen={isOpen} onClose={onClose} title="Alege un desen">
      <div className="p-4 space-y-3 border-b border-border/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveDifficulty('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeDifficulty === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            Toate
          </button>
          {(['easy', 'medium', 'hard'] as TemplateDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1',
                activeDifficulty === diff
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              )}
            >
              {Array.from({ length: DIFFICULTY_LABELS[diff].stars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeCategory === 'all'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            Toate
          </button>
          {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                activeCategory === cat
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-border/50">
        <button
          onClick={handleRandomTemplate}
          className="w-full py-3 px-4 rounded-2xl bg-accent hover:bg-accent/80 text-accent-foreground font-display font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Shuffle className="w-5 h-5" />
          Surprinde-ma!
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={cn(
                'group relative aspect-square rounded-2xl overflow-hidden transition-all playful-card',
                currentTemplateId === template.id && 'ring-4 ring-primary ring-offset-2'
              )}
            >
              <Image
                src={template.src}
                alt={template.nameRo}
                fill
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-sm font-medium">{template.nameRo}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: DIFFICULTY_LABELS[template.difficulty].stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow text-yellow" />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SidebarShell>
  )
}
