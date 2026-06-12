'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Item {
  id: string
  firstName: string
  age: number
  image: string
  status: 'pending' | 'approved'
  createdAt: number
}

export default function GalleryAdminPage() {
  const [pending, setPending] = useState<Item[]>([])
  const [approved, setApproved] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending ?? [])
        setApproved(data.approved ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, action: 'approve' | 'reject' | 'remove') => {
    setBusy(id)
    try {
      await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const Card = ({ it, children }: { it: Item; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={it.image}
        alt={`Desen de ${it.firstName}`}
        className="w-full aspect-square object-contain rounded-xl bg-white"
      />
      <p className="font-display font-semibold mt-2">
        {it.firstName}, {it.age} ani
      </p>
      <div className="flex gap-2 mt-2">{children}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Galerie — moderare</h1>
      {loading ? (
        <p className="text-muted-foreground">Se încarcă…</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-3">
              În așteptare ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-muted-foreground">Nimic de verificat. 🎉</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pending.map((it) => (
                  <Card it={it} key={it.id}>
                    <Button size="sm" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'approve')}>
                      Aprobă
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'reject')}>
                      Respinge
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              Publicate ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <p className="text-muted-foreground">Încă nimic publicat.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {approved.map((it) => (
                  <Card it={it} key={it.id}>
                    <Button size="sm" variant="outline" className="flex-1" disabled={busy === it.id} onClick={() => act(it.id, 'remove')}>
                      Scoate
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
