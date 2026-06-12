'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share2, ArrowRight, ImageUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { downscaleDataUrl } from '@/lib/downscale'

interface SaveShareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageDataUrl: string | null
  onContinue: () => void
}

type View = 'actions' | 'form' | 'sent'

export function SaveShareSheet({
  open,
  onOpenChange,
  imageDataUrl,
  onContinue,
}: SaveShareSheetProps) {
  const [sharing, setSharing] = useState(false)
  const [view, setView] = useState<View>('actions')
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset the publish flow each time the sheet opens.
  useEffect(() => {
    if (open) {
      setView('actions')
      setFirstName('')
      setAge('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

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
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'desen-riza.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Desenul meu',
          text: 'Uite ce am desenat!',
          files: [file],
        })
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Uite ce am desenat!')}`
        window.open(whatsappUrl, '_blank')
      }
    } catch {
      // user cancelled
    } finally {
      setSharing(false)
    }
  }

  const handlePublish = async () => {
    setError(null)
    const name = firstName.trim()
    const ageNum = Number(age)
    if (!/^[\p{L} \-]{1,20}$/u.test(name)) {
      setError('Scrie un prenume (doar litere).')
      return
    }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 14) {
      setError('Scrie o vârstă între 1 și 14.')
      return
    }
    if (!imageDataUrl) return
    setSubmitting(true)
    try {
      const image = await downscaleDataUrl(imageDataUrl)
      const res = await fetch('/api/gallery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, firstName: name, age: ageNum }),
      })
      if (res.ok) setView('sent')
      else if (res.status === 429)
        setError('Ai trimis deja multe desene. Mai încearcă mai târziu.')
      else setError('Nu am putut trimite desenul. Mai încearcă o dată.')
    } catch {
      setError('Nu am putut trimite desenul. Mai încearcă o dată.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle className="font-display text-2xl">
            {view === 'sent' ? 'Mulțumim!' : 'Bravo!'}
          </SheetTitle>
          <SheetDescription>
            {view === 'sent'
              ? 'Desenul tău apare în galerie după ce îl verifică un om.'
              : 'Ai facut un desen frumos! Ce vrei sa faci acum?'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {imageDataUrl && view !== 'sent' && (
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary shadow-lg">
              <Image src={imageDataUrl} alt="Desenul tau" fill className="object-contain bg-white" />
            </div>
          )}

          {view === 'actions' && (
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button onClick={handleDownload} className="h-14 rounded-full font-display text-lg btn-bounce">
                <Download className="size-5 mr-2" />
                Salveaza
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-secondary hover:bg-secondary/90"
              >
                <Share2 className="size-5 mr-2" />
                {sharing ? 'Se trimite...' : 'Trimite'}
              </Button>
              <Button
                onClick={() => setView('form')}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-mint hover:bg-mint-dark text-white"
              >
                <ImageUp className="size-5 mr-2" />
                Trimite în galerie
              </Button>
              <Button onClick={onContinue} variant="outline" className="h-14 rounded-full font-display text-lg btn-bounce">
                Continua sa desenezi
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          )}

          {view === 'form' && (
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prenume"
                maxLength={20}
                className="selectable h-12 rounded-full border-2 border-border px-5 text-base outline-none focus:border-primary"
              />
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                inputMode="numeric"
                placeholder="Vârsta"
                className="selectable h-12 rounded-full border-2 border-border px-5 text-base outline-none focus:border-primary"
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                onClick={handlePublish}
                disabled={submitting}
                className="h-14 rounded-full font-display text-lg btn-bounce bg-mint hover:bg-mint-dark text-white"
              >
                {submitting ? 'Se trimite...' : 'Trimite desenul'}
              </Button>
              <Button onClick={() => setView('actions')} variant="outline" className="h-12 rounded-full font-display">
                Înapoi
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Cerem doar prenumele și vârsta. Desenul apare după verificare.
              </p>
            </div>
          )}

          {view === 'sent' && (
            <div className="flex flex-col w-full gap-3 max-w-xs items-center">
              <div className="text-5xl">🎉</div>
              <Button onClick={onContinue} className="h-14 rounded-full font-display text-lg btn-bounce w-full">
                Continua sa desenezi
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
