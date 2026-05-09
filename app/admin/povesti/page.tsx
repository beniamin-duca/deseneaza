'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllStories, type Story, type Testament } from '@/lib/stories'

interface RowState {
  story: Story
  merged: Story
  isOverridden: boolean
}

export default function AdminPovestiPage() {
  const router = useRouter()
  const seedStories = useMemo(() => getAllStories(), [])

  const [rows, setRows] = useState<RowState[]>(() =>
    seedStories.map((s) => ({ story: s, merged: s, isOverridden: false })),
  )
  const [testament, setTestament] = useState<'all' | Testament>('all')
  const [overriddenOnly, setOverriddenOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stories')
      .then((r) => (r.ok ? (r.json() as Promise<Story[]>) : null))
      .then((merged) => {
        if (!merged || cancelled) return
        const byId = new Map(merged.map((s) => [s.id, s]))
        setRows(
          seedStories.map((s) => {
            const m = byId.get(s.id) ?? s
            const isOverridden =
              m.titleRo !== s.titleRo ||
              m.scriptureRef !== s.scriptureRef ||
              m.summary !== s.summary ||
              m.accentColor !== s.accentColor ||
              m.templateSrc !== s.templateSrc ||
              JSON.stringify(m.paragraphs) !== JSON.stringify(s.paragraphs)
            return { story: s, merged: m, isOverridden }
          }),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [seedStories])

  const filtered = rows.filter((r) => {
    if (testament !== 'all' && r.story.testament !== testament) return false
    if (overriddenOnly && !r.isOverridden) return false
    return true
  })

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Povesti din Biblie</h1>
            <span className="text-sm text-muted-foreground">
              {rows.length} povesti
            </span>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Iesi
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 pb-4">
          <select
            value={testament}
            onChange={(e) => setTestament(e.target.value as 'all' | Testament)}
            className="h-9 px-2 rounded-md border border-border bg-white text-sm"
          >
            <option value="all">Toate testamentele</option>
            <option value="vechi">Vechi</option>
            <option value="nou">Nou</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overriddenOnly}
              onChange={(e) => setOverriddenOnly(e.target.checked)}
            />
            Doar editate
          </label>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Titlu</th>
                <th className="px-3 py-2 text-left font-medium">Scriptura</th>
                <th className="px-3 py-2 text-left font-medium w-28">Status</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.story.id} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.story.order}
                  </td>
                  <td className="px-3 py-2">{r.merged.titleRo}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.merged.scriptureRef}
                  </td>
                  <td className="px-3 py-2">
                    {r.isOverridden ? (
                      <span className="text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 text-xs">
                        Editat
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Implicit</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/povesti/${r.story.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editeaza
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
