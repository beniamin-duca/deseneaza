'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/povesti'
  const configError = params.get('error') === 'not-configured'

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.replace(next)
        return
      }
      if (res.status === 503) {
        setError('Admin nu este configurat. Verifica ADMIN_PASSWORD si ADMIN_SECRET.')
      } else {
        setError('Parola gresita.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-lg p-6 flex flex-col gap-4"
      >
        <header>
          <h1 className="text-xl font-semibold">Admin Riza</h1>
          <p className="text-sm text-muted-foreground">
            Editare povesti din Biblie.
          </p>
        </header>

        {configError && (
          <p className="text-sm text-destructive">
            Variabilele de mediu nu sunt setate inca.
          </p>
        )}

        <label className="text-sm font-medium">
          Parola
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !password}
          className="h-10 rounded-md bg-foreground text-background font-medium disabled:opacity-50"
        >
          {submitting ? 'Se verifica...' : 'Intra'}
        </button>
      </form>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
