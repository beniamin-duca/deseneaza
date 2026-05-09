'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, Paintbrush } from 'lucide-react'
import { TopHeader } from '@/components/top-header'
import { FloatingToolbar, type Tool } from '@/components/floating-toolbar'
import { StampSidebar } from '@/components/stamp-sidebar'
import { KidCanvas, type KidCanvasRef } from '@/components/kid-canvas'
import { SaveShareSheet } from '@/components/save-share-sheet'
import { StoryPanel } from '@/components/story-panel'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { type Stamp } from '@/lib/templates'
import { getStoryById, type Story } from '@/lib/stories'
import {
  getStatus,
  loadCanvas,
  saveCanvas,
  markDone,
} from '@/lib/progress'
import { cn } from '@/lib/utils'

function StoryDetailContent() {
  const params = useParams<{ storyId: string }>()
  const router = useRouter()
  const isMobile = useIsMobile()

  const story = getStoryById(params.storyId)

  const canvasRef = useRef<KidCanvasRef>(null)
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#FF6B6B')
  const [brushSize, setBrushSize] = useState(16)
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [showStampSidebar, setShowStampSidebar] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showStoryDrawer, setShowStoryDrawer] = useState(false)
  const [initialBlob, setInitialBlob] = useState<Blob | null | undefined>(undefined)
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!story) {
      router.replace('/povesti')
      return
    }
    let cancelled = false
    getStatus(story.id).then((s) => {
      if (cancelled) return
      if (s === 'locked') {
        router.replace('/povesti')
        return
      }
      setAccessChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [story, router])

  useEffect(() => {
    if (!accessChecked || !story) return
    let cancelled = false
    loadCanvas(story.id).then((blob) => {
      if (cancelled) return
      setInitialBlob(blob)
      // Skip splash for returning kids who already have a drawing in progress.
      if (blob) setHasStarted(true)
    })
    return () => {
      cancelled = true
    }
  }, [accessChecked, story])

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) setCanUndo(canvasRef.current.canUndo())
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!story || !accessChecked || initialBlob === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!hasStarted) {
    return <StorySplash story={story} onStart={() => setHasStarted(true)} />
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    if (tool === 'stamp' || tool === 'eraser') setTool('brush')
  }
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size)
    if (tool === 'stamp' || tool === 'fill') setTool('brush')
  }

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

  const handleCanvasIdle = (blob: Blob) => {
    saveCanvas(story.id, blob).catch(() => {})
  }

  const handleDone = async () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await saveCanvas(story.id, blob)
    }
    await markDone(story.id)
    router.push(`/povesti?completed=${story.id}`)
  }

  const handleSelectStamp = (stamp: Stamp | null) => {
    setSelectedStamp(stamp)
    if (stamp) setShowStampSidebar(false)
  }

  const stampSrc = tool === 'stamp' ? selectedStamp?.src ?? null : null
  const canvasDisabled = tool === 'stamp' && !selectedStamp

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <TopHeader title={story.titleRo} backHref="/povesti" />

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && (
          <aside className="w-[340px] border-r border-border/50 shrink-0">
            <StoryPanel story={story} onDone={handleDone} />
          </aside>
        )}

        <div className="flex-1 flex flex-col relative">
          <KidCanvas
            ref={canvasRef}
            tool={tool}
            color={color}
            brushSize={brushSize}
            templateSrc={story.templateSrc}
            stampSrc={stampSrc}
            disabled={canvasDisabled}
            initialImageBlob={initialBlob}
            onCanvasIdle={handleCanvasIdle}
          />

          {isMobile && (
            <button
              onClick={() => setShowStoryDrawer(true)}
              className="fixed top-20 left-4 z-30 floating-toolbar px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground"
              aria-label="Citeste povestea"
            >
              <BookOpen className="w-4 h-4" />
              Povestea
            </button>
          )}

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
            onShowStamps={() => setShowStampSidebar(true)}
            canUndo={canUndo}
            hidden={showStampSidebar || showStoryDrawer}
          />
        </div>
      </div>

      {isMobile && (
        <Drawer
          open={showStoryDrawer}
          onOpenChange={setShowStoryDrawer}
        >
          <DrawerContent className="max-h-[85vh] rounded-t-3xl bg-white">
            <DrawerTitle className="sr-only">{story.titleRo}</DrawerTitle>
            <div className="flex-1 overflow-hidden">
              <StoryPanel
                story={story}
                onDone={async () => {
                  setShowStoryDrawer(false)
                  await handleDone()
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <StampSidebar
        isOpen={showStampSidebar}
        onClose={() => {
          setShowStampSidebar(false)
          if (tool === 'stamp' && !selectedStamp) setTool('brush')
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
              className={cn(
                'h-12 rounded-full font-display text-base bg-coral hover:bg-coral-dark'
              )}
            >
              Da, sterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StorySplash({ story, onStart }: { story: Story; onStart: () => void }) {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <TopHeader title={story.titleRo} backHref="/povesti" />

      <div
        className="flex-1 relative pb-32"
        style={{
          background:
            'radial-gradient(ellipse at top, #FFF4D6 0%, #F5E6BC 60%, #E8D69E 100%)',
        }}
      >
        <div className="pt-8 px-6 max-w-2xl mx-auto">
          <header
            className="text-center py-6 px-4 rounded-3xl mb-6 shadow-lg"
            style={{ backgroundColor: story.accentColor }}
          >
            <h1 className="font-display text-3xl font-bold text-white">
              {story.titleRo}
            </h1>
            <p className="text-white/90 text-sm mt-1">{story.scriptureRef}</p>
          </header>

          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-6 shadow-lg space-y-4">
            {story.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-foreground">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="fixed bottom-6 inset-x-0 px-6 z-30">
          <button
            onClick={onStart}
            className="mx-auto block max-w-md w-full h-14 rounded-full font-display text-xl font-bold bg-mint hover:bg-mint-dark text-white shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Paintbrush className="w-5 h-5" />
            Incepe sa desenezi!
          </button>
        </div>
      </div>
    </main>
  )
}

export default function StoryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <StoryDetailContent />
    </Suspense>
  )
}
