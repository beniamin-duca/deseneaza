'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { TopBar } from '@/components/top-bar'
import { Toolbar, type Tool } from '@/components/toolbar'
import { TemplatePicker, TEMPLATES } from '@/components/template-picker'
import { StampPicker, STAMPS } from '@/components/stamp-picker'
import { KidCanvas, type KidCanvasRef } from '@/components/kid-canvas'
import { SaveShareSheet } from '@/components/save-share-sheet'
import { Button } from '@/components/ui/button'

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)

  // Set random template for surprise mode
  useEffect(() => {
    if (mode === 'surpriza') {
      const randomIndex = Math.floor(Math.random() * TEMPLATES.length)
      setSelectedTemplate(TEMPLATES[randomIndex].id)
    }
  }, [mode])

  // Update canUndo state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) {
        setCanUndo(canvasRef.current.canUndo())
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleUndo = () => {
    canvasRef.current?.undo()
  }

  const handleClear = () => {
    canvasRef.current?.clear()
  }

  const handleSave = () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      setImageDataUrl(dataUrl)
      setShowSaveSheet(true)
    }
  }

  const handleContinue = () => {
    setShowSaveSheet(false)
  }

  const getTemplateSrc = () => {
    if (mode === 'colorat' || mode === 'surpriza') {
      const template = TEMPLATES.find(t => t.id === selectedTemplate)
      return template?.src || null
    }
    return null
  }

  const getStampSrc = () => {
    if (mode === 'stampile' && selectedStamp) {
      const stamp = STAMPS.find(s => s.id === selectedStamp)
      return stamp?.src || null
    }
    return null
  }

  const handleStampPlaced = () => {
    // Optionally deselect stamp after placing, or keep it selected for multiple placements
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar title={MODE_TITLES[mode]} />
      
      {/* Template picker for colorat mode */}
      {mode === 'colorat' && (
        <TemplatePicker
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
        />
      )}
      
      {/* Stamp picker for stampile mode */}
      {mode === 'stampile' && (
        <StampPicker
          selectedStamp={selectedStamp}
          onSelectStamp={setSelectedStamp}
        />
      )}
      
      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <KidCanvas
          ref={canvasRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          templateSrc={getTemplateSrc()}
          stampSrc={getStampSrc()}
          onStampPlaced={handleStampPlaced}
        />
        
        {/* Save button overlay */}
        <Button
          onClick={handleSave}
          className="absolute bottom-4 right-4 h-14 px-6 rounded-full font-display text-lg shadow-lg btn-bounce bg-secondary hover:bg-secondary/90"
          aria-label="Gata"
        >
          <Check className="size-5 mr-2" />
          Gata
        </Button>
      </div>
      
      {/* Toolbar - hide for stamps mode since they just tap to place */}
      {mode !== 'stampile' && (
        <Toolbar
          currentTool={tool}
          currentColor={color}
          brushSize={brushSize}
          onToolChange={setTool}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onClear={handleClear}
          canUndo={canUndo}
        />
      )}
      
      {/* Simple toolbar for stamps mode */}
      {mode === 'stampile' && (
        <div className="flex items-center justify-center gap-4 p-4 bg-card border-t border-border">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={!canUndo}
            className="h-12 px-6 rounded-full btn-bounce"
          >
            Anuleaza
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="h-12 px-6 rounded-full btn-bounce text-destructive hover:text-destructive"
          >
            Sterge tot
          </Button>
        </div>
      )}
      
      {/* Save/Share sheet */}
      <SaveShareSheet
        open={showSaveSheet}
        onOpenChange={setShowSaveSheet}
        imageDataUrl={imageDataUrl}
        onContinue={handleContinue}
      />
    </div>
  )
}

export default function DrawingPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Se incarca...</p>
        </div>
      </div>
    }>
      <DrawingPageContent />
    </Suspense>
  )
}
