'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
import { getStoryById, type Story } from '@/lib/stories'

interface FormState {
  titleRo: string
  scriptureRef: string
  summary: string
  paragraphs: string[]
  accentColor: string
  templateSrc: string
}

function fromStory(s: Story): FormState {
  return {
    titleRo: s.titleRo,
    scriptureRef: s.scriptureRef,
    summary: s.summary,
    paragraphs: [...s.paragraphs],
    accentColor: s.accentColor,
    templateSrc: s.templateSrc ?? '',
  }
}

function diffFromSeed(seed: Story, form: FormState): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (form.titleRo !== seed.titleRo) out.titleRo = form.titleRo
  if (form.scriptureRef !== seed.scriptureRef) out.scriptureRef = form.scriptureRef
  if (form.summary !== seed.summary) out.summary = form.summary
  if (JSON.stringify(form.paragraphs) !== JSON.stringify(seed.paragraphs)) {
    out.paragraphs = form.paragraphs
  }
  if (form.accentColor !== seed.accentColor) out.accentColor = form.accentColor
  const seedTpl = seed.templateSrc ?? ''
  if (form.templateSrc !== seedTpl) {
    out.templateSrc = form.templateSrc === '' ? null : form.templateSrc
  }
  return out
}

export default function AdminStoryEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const seed = useMemo(() => getStoryById(params.id), [params.id])

  const [form, setForm] = useState<FormState | null>(seed ? fromStory(seed) : null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [isResetting, startResetting] = useTransition()

  useEffect(() => {
    if (!params.id) return
    let cancelled = false
    fetch(`/api/stories/${params.id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Story>) : null))
      .then((merged) => {
        if (cancelled || !merged) return
        setForm(fromStory(merged))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (!seed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Povestea nu exista.</p>
      </main>
    )
  }
  if (!form) return null

  const diff = diffFromSeed(seed, form)
  const isOverridden = Object.keys(diff).length > 0

  const onSave = () => {
    setError(null)
    startSaving(async () => {
      const res = await fetch(`/api/admin/stories/${seed.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(diff),
      })
      if (res.ok) {
        setSavedAt(Date.now())
      } else if (res.status === 401) {
        router.replace('/admin/login')
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Eroare la salvare.')
      }
    })
  }

  const onReset = () => {
    setError(null)
    startResetting(async () => {
      const res = await fetch(`/api/admin/stories/${seed.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setForm(fromStory(seed))
        setShowResetConfirm(false)
        setSavedAt(Date.now())
      } else if (res.status === 401) {
        router.replace('/admin/login')
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Eroare la stergere.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-12">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/povesti"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Povesti
            </Link>
            <h1 className="text-lg font-semibold truncate">
              #{seed.order} {seed.titleRo}
            </h1>
          </div>
          {isOverridden && (
            <span className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-0.5">
              {Object.keys(diff).length} modificari
            </span>
          )}
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-border p-5 space-y-5">
          <Field label="Titlu" diffMark={'titleRo' in diff}>
            <input
              type="text"
              value={form.titleRo}
              onChange={(e) => setForm({ ...form, titleRo: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Referinta scripturistica" diffMark={'scriptureRef' in diff}>
            <input
              type="text"
              value={form.scriptureRef}
              onChange={(e) =>
                setForm({ ...form, scriptureRef: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Rezumat (o linie)" diffMark={'summary' in diff}>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-white"
            />
          </Field>

          <Field label="Culoare accent" diffMark={'accentColor' in diff}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) =>
                  setForm({ ...form, accentColor: e.target.value })
                }
                className="h-10 w-14 rounded-md border border-border"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) =>
                  setForm({ ...form, accentColor: e.target.value })
                }
                className="flex-1 h-10 px-3 rounded-md border border-border bg-white font-mono text-sm"
              />
            </div>
          </Field>

          <Field label="URL sablon (optional)" diffMark={'templateSrc' in diff}>
            <input
              type="text"
              value={form.templateSrc}
              onChange={(e) =>
                setForm({ ...form, templateSrc: e.target.value })
              }
              placeholder="/templates/creatie.jpg"
              className="w-full h-10 px-3 rounded-md border border-border bg-white font-mono text-sm"
            />
          </Field>

          <Field label="Paragrafe" diffMark={'paragraphs' in diff}>
            <div className="space-y-2">
              {form.paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    value={p}
                    onChange={(e) => {
                      const next = [...form.paragraphs]
                      next[i] = e.target.value
                      setForm({ ...form, paragraphs: next })
                    }}
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.paragraphs.filter((_, j) => j !== i)
                      setForm({ ...form, paragraphs: next })
                    }}
                    className="h-9 px-2 text-sm text-destructive hover:underline"
                  >
                    Sterge
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, paragraphs: [...form.paragraphs, ''] })
                }
                className="text-sm text-blue-600 hover:underline"
              >
                + Adauga paragraf
              </button>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={!isOverridden || isResetting}
            className="text-sm text-destructive disabled:text-muted-foreground/60 disabled:cursor-not-allowed hover:underline"
          >
            {isResetting ? 'Se sterge...' : 'Reseteaza la valoarea implicita'}
          </button>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="text-xs text-muted-foreground">Salvat</span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!isOverridden || isSaving}
              className="h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </section>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stergi modificarile?</AlertDialogTitle>
            <AlertDialogDescription>
              Povestea revine la valoarea din cod. Aceasta actiune nu poate fi
              anulata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuleaza</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Sterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

function Field({
  label,
  children,
  diffMark,
}: {
  label: string
  children: React.ReactNode
  diffMark?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        {diffMark && (
          <span className="text-[10px] uppercase tracking-wide text-amber-700">
            modificat
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
