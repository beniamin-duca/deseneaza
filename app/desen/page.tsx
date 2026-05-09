'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FloatingTopBar } from '@/components/floating-top-bar'
import { FloatingToolbar, type Tool } from '@/components/floating-toolbar'
import { TemplateSidebar } from '@/components/template-sidebar'
import { StampSidebar } from '@/components/stamp-sidebar'
import { KidCanvas, type KidCanvasRef } from '@/components/kid-canvas'
import { SaveShareSheet } from '@/components/save-share-sheet'
import { type Template, type Stamp } from '@/lib/templates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type DrawMode = 'blank' | 'colorat'

const MODE_TITLES: Record<DrawMode, string> = {
  blank: 'Deseneaza',
  colorat: 'Coloreaza',
}

function isDrawMode(value: string | null): value is DrawMode {
  return value === 'blank' || value === 'colorat'
}

function DrawingPageContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode')
  const mode: DrawMode = isDrawMode(modeParam) ? modeParam : 'blank'

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
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if (mode === 'colorat') {
      setShowTemplateSidebar(true)
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
  const handleClear = () => setShowClearConfirm(true)
  const handleConfirmClear = () => {
    canvasRef.current?.clear()
    setShowClearConfirm(false)
  }
  const handleSave = () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      setImageDataUrl(dataUrl)
      setShowSaveSheet(true)
    }
  }

  // Picking a color while in a tool that doesn't use color (stamp/eraser)
  // should switch to brush — the kid clearly wants to draw with that color.
  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    if (tool === 'stamp' || tool === 'eraser') {
      setTool('brush')
    }
  }

  // Picking a brush size while in a tool that doesn't use size (stamp/fill)
  // should switch to brush. Eraser uses size, so keep eraser when active.
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size)
    if (tool === 'stamp' || tool === 'fill') {
      setTool('brush')
    }
  }

  const templateSrc = mode === 'colorat' ? selectedTemplate?.src ?? null : null
  const stampSrc = tool === 'stamp' ? selectedStamp?.src ?? null : null
  const canvasDisabled = tool === 'stamp' && !selectedStamp

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setShowTemplateSidebar(false)
    canvasRef.current?.clear()
  }

  const handleSelectStamp = (stamp: Stamp | null) => {
    setSelectedStamp(stamp)
    if (stamp) setShowStampSidebar(false)
  }

  const showTemplatesButton = mode === 'colorat'
  const anySidebarOpen = showTemplateSidebar || showStampSidebar

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
        disabled={canvasDisabled}
      />

      <FloatingToolbar
        activeTool={tool}
        onToolChange={setTool}
        activeColor={color}
        onColorChange={handleColorChange}
        brushSize={brushSize}
        onBrushSizeChange={handleBrushSizeChange}
        onUndo={handleUndo}
        onClear={handleClear}
        onSave={handleSave}
        onShowTemplates={
          showTemplatesButton ? () => setShowTemplateSidebar(true) : undefined
        }
        onShowStamps={() => setShowStampSidebar(true)}
        showTemplateButton={showTemplatesButton}
        canUndo={canUndo}
        hidden={anySidebarOpen}
      />

      <TemplateSidebar
        isOpen={showTemplateSidebar}
        onClose={() => setShowTemplateSidebar(false)}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={selectedTemplate?.id}
      />

      <StampSidebar
        isOpen={showStampSidebar}
        onClose={() => {
          setShowStampSidebar(false)
          // If they bailed out without picking a stamp, don't leave them
          // stuck in 'stamp' mode with nothing to place — go back to brush.
          if (tool === 'stamp' && !selectedStamp) {
            setTool('brush')
          }
        }}
        onSelectStamp={handleSelectStamp}
        selectedStampId={selectedStamp?.id}
      />

      <SaveShareSheet
        open={showSaveSheet}
        onOpenChange={setShowSaveSheet}
        imageDataUrl={imageDataUrl}
        onContinue={() => setShowSaveSheet(false)}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Stergi tot desenul?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Vei pierde ce ai desenat pana acum. Esti sigur?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 rounded-full font-display text-base">
              Nu, pastreaza
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              className="h-12 rounded-full font-display text-base bg-coral hover:bg-coral-dark"
            >
              Da, sterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
