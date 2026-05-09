'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  src: string
}

const TEMPLATES: Template[] = [
  { id: 'cat', name: 'Pisica', src: '/templates/cat.jpg' },
  { id: 'dog', name: 'Catel', src: '/templates/dog.jpg' },
  { id: 'lion', name: 'Leu', src: '/templates/lion.jpg' },
  { id: 'bunny', name: 'Iepuras', src: '/templates/bunny.jpg' },
  { id: 'car', name: 'Masina', src: '/templates/car.jpg' },
  { id: 'plane', name: 'Avion', src: '/templates/plane.jpg' },
  { id: 'rocket', name: 'Racheta', src: '/templates/rocket.jpg' },
  { id: 'tree', name: 'Copac', src: '/templates/tree.jpg' },
  { id: 'flower', name: 'Floare', src: '/templates/flower.jpg' },
  { id: 'sun', name: 'Soare', src: '/templates/sun.jpg' },
  { id: 'unicorn', name: 'Unicorn', src: '/templates/unicorn.jpg' },
  { id: 'dinosaur', name: 'Dinozaur', src: '/templates/dinosaur.jpg' },
]

interface TemplatePickerProps {
  selectedTemplate: string | null
  onSelectTemplate: (templateId: string) => void
}

export function TemplatePicker({ selectedTemplate, onSelectTemplate }: TemplatePickerProps) {
  return (
    <div className="w-full bg-card border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-select">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={cn(
              'flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all btn-bounce',
              selectedTemplate === template.id 
                ? 'bg-primary/20 ring-2 ring-primary' 
                : 'bg-muted hover:bg-muted/80'
            )}
            aria-label={`Selecteaza ${template.name}`}
          >
            <div className="relative size-16 rounded-lg overflow-hidden bg-white">
              <Image
                src={template.src}
                alt={template.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <span className="text-xs font-medium text-foreground">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { TEMPLATES }
