'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Undo2, Trash2, Stamp as StampIcon, Save } from 'lucide-react'
import { FloatingTopBar } from '@/components/floating-top-bar'
import { FloatingToolbar, type Tool } from '@/components/floating-toolbar'
import { TemplateSidebar } from '@/components/template-sidebar'
import { StampSidebar } from '@/components/stamp-sidebar'
import { KidCanvas, type KidCanvasRef } from '@/components/kid-canvas'
import { SaveShareSheet } from '@/components/save-share-sheet'
import {
  STAMPS,
  getRandomTemplate,
  type Template,
  type Stamp,
} from '@/lib/templates'
import { cn } from '@/lib/utils'

type DrawMode = 'blank' | 'colorat' | 'stampile' | 'surpriza'

const MODE_TITLES: Record<DrawMode, string> = {
  blank: 'Deseneaza',
  colorat: 'Coloreaza',
  stampile: 'Stampile',
  surpriza: 'Surpriza',
}

function DrawingPageContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') as DrawMode) || 'blank'

  const canvasRef = useRef<KidCanvasRef>(null)
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#FF6B6B')
  const [brushSize, setBrushSize] = useState(16)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [showTemplateSidebar, setShowTemplateSidebar] = useState(false)
  const [showStampSidebar, setShowStampSidebar] = useState(false)

  useEffect(() => {
    if (mode === 'surpriza') {
      setSelectedTemplate(getRandomTemplate())
    } else if (mode === 'colorat') {
      setShowTemplateSidebar(true)
    } else if (mode === 'stampile') {
      setSelectedStamp(STAMPS[0])
    }
  }, [mode])

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) {
        setCanUndo(canvasRef.current.canUndo())
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleUndo = () => canvasRef.current?.undo()
  const handleClear = () => canvasRef.current?.clear()
  const handleSave = () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      setImageDataUrl(dataUrl)
      setShowSaveSheet(true)
    }
  }

  const templateSrc =
    mode === 'colorat' || mode === 'surpriza' ? selectedTemplate?.src ?? null : null
  const stampSrc = mode === 'stampile' ? selectedStamp?.src ?? null : null

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setShowTemplateSidebar(false)
    canvasRef.current?.clear()
  }

  const handleSelectStamp = (stamp: Stamp | null) => {
    setSelectedStamp(stamp)
    if (stamp) setShowStampSidebar(false)
  }

  const showTemplatesButton = mode === 'colorat' || mode === 'surpriza'

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <FloatingTopBar title={MODE_TITLES[mode]} />

      <KidCanvas
        ref={canvasRef}
        tool={tool}
        color={color}
        brushSize={brushSize}
        templateSrc={templateSrc}
        stampSrc={stampSrc}
        onStampPlaced={() => {}}
      />

      {mode !== 'stampile' ? (
        <FloatingToolbar
          activeTool={tool}
          onToolChange={setTool}
          activeColor={color}
          onColorChange={setColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onClear={handleClear}
          onSave={handleSave}
          onShowTemplates={
            showTemplatesButton ? () => setShowTemplateSidebar(true) : undefined
          }
          showTemplateButton={showTemplatesButton}
          canUndo={canUndo}
        />
      ) : (
        <StampsFloatingBar
          selectedStamp={selectedStamp}
          onShowStamps={() => setShowStampSidebar(true)}
          onUndo={handleUndo}
          onClear={handleClear}
          onSave={handleSave}
          canUndo={canUndo}
        />
      )}

      <TemplateSidebar
        isOpen={showTemplateSidebar}
        onClose={() => setShowTemplateSidebar(false)}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={selectedTemplate?.id}
      />

      <StampSidebar
        isOpen={showStampSidebar}
        onClose={() => setShowStampSidebar(false)}
        onSelectStamp={handleSelectStamp}
        selectedStampId={selectedStamp?.id}
      />

      <SaveShareSheet
        open={showSaveSheet}
        onOpenChange={setShowSaveSheet}
        imageDataUrl={imageDataUrl}
        onContinue={() => setShowSaveSheet(false)}
      />
    </div>
  )
}

interface StampsFloatingBarProps {
  selectedStamp: Stamp | null
  onShowStamps: () => void
  onUndo: () => void
  onClear: () => void
  onSave: () => void
  canUndo: boolean
}

function StampsFloatingBar({
  selectedStamp,
  onShowStamps,
  onUndo,
  onClear,
  onSave,
  canUndo,
}: StampsFloatingBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="floating-toolbar px-3 py-2 pop-in">
        <div className="floating-toolbar-inner flex items-center gap-2">
          <button
            onClick={onShowStamps}
            className="tool-btn bg-yellow/30 hover:bg-yellow/50 text-foreground"
            aria-label="Alege stampila"
            title={selectedStamp ? `Stampila: ${selectedStamp.name}` : 'Alege stampila'}
          >
            <StampIcon className="w-6 h-6" />
          </button>

          <div className="w-px h-8 bg-border mx-1" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'tool-btn',
              canUndo
                ? 'bg-muted/50 hover:bg-muted'
                : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
            )}
            aria-label="Inapoi"
            title="Inapoi"
          >
            <Undo2 className="w-6 h-6" />
          </button>

          <button
            onClick={onClear}
            className="tool-btn bg-coral/10 hover:bg-coral/20 text-coral-dark"
            aria-label="Sterge tot"
            title="Sterge tot"
          >
            <Trash2 className="w-6 h-6" />
          </button>

          <button
            onClick={onSave}
            className="tool-btn bg-mint text-white hover:bg-mint-dark"
            aria-label="Salveaza"
            title="Salveaza"
          >
            <Save className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DrawingPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Se incarca...</p>
          </div>
        </div>
      }
    >
      <DrawingPageContent />
    </Suspense>
  )
}
