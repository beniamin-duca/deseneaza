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
  type TemplateDifficulty 
} from '@/lib/templates'
import { X, Star, Shuffle } from 'lucide-react'

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
    const randomIndex = Math.floor(Math.random() * filteredTemplates.length)
    onSelectTemplate(filteredTemplates[randomIndex])
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-80 glass-panel z-50 sidebar-slide flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="font-display text-xl font-bold text-foreground">Alege un desen</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Inchide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-border/50">
          {/* Difficulty filter */}
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

          {/* Category filter */}
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

        {/* Random button */}
        <div className="p-4 border-b border-border/50">
          <button
            onClick={handleRandomTemplate}
            className="w-full py-3 px-4 rounded-2xl bg-accent hover:bg-accent/80 text-accent-foreground font-display font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shuffle className="w-5 h-5" />
            Surprinde-ma!
          </button>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-4">
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
      </div>
    </>
  )
}
