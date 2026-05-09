'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Share2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface SaveShareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageDataUrl: string | null
  onContinue: () => void
}

export function SaveShareSheet({ 
  open, 
  onOpenChange, 
  imageDataUrl,
  onContinue 
}: SaveShareSheetProps) {
  const [sharing, setSharing] = useState(false)

  const handleDownload = () => {
    if (!imageDataUrl) return
    
    const link = document.createElement('a')
    link.download = `riza-desen-${Date.now()}.png`
    link.href = imageDataUrl
    link.click()
  }

  const handleShare = async () => {
    if (!imageDataUrl) return
    
    setSharing(true)
    
    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'desen-riza.png', { type: 'image/png' })
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Desenul meu din Riza',
          text: 'Uite ce am desenat!',
          files: [file],
        })
      } else {
        // Fallback: try WhatsApp direct share
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Uite ce am desenat in Riza!')}`
        window.open(whatsappUrl, '_blank')
      }
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed')
    } finally {
      setSharing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle className="font-display text-2xl">Bravo!</SheetTitle>
          <SheetDescription>
            Ai facut un desen frumos! Ce vrei sa faci acum?
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Preview */}
          {imageDataUrl && (
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary shadow-lg">
              <Image
                src={imageDataUrl}
                alt="Desenul tau"
                fill
                className="object-contain bg-white"
              />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col w-full gap-3 max-w-xs">
            <Button
              onClick={handleDownload}
              className="h-14 rounded-full font-display text-lg btn-bounce"
              variant="default"
            >
              <Download className="size-5 mr-2" />
              Salveaza
            </Button>
            
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="h-14 rounded-full font-display text-lg btn-bounce bg-secondary hover:bg-secondary/90"
              variant="default"
            >
              <Share2 className="size-5 mr-2" />
              {sharing ? 'Se trimite...' : 'Trimite'}
            </Button>
            
            <Button
              onClick={onContinue}
              variant="outline"
              className="h-14 rounded-full font-display text-lg btn-bounce"
            >
              Continua sa desenezi
              <ArrowRight className="size-5 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
