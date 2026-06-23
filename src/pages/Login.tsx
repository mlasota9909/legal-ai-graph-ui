import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!AUTH_DISABLED) return
    const timer = window.setTimeout(() => navigate('/', { replace: true }), 1000)
    return () => window.clearTimeout(timer)
  }, [navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (response.ok) {
        const data = (await response.json()) as { token?: string }
        if (data.token) {
          login(data.token)
          navigate('/', { replace: true })
        } else {
          setError('Invalid response from server.')
        }
      } else {
        setError('Invalid email or password.')
      }
    } catch {
      setError('Unable to reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="theme-atrium flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--ink)]">
      <div className="w-full max-w-md border border-[var(--rule)] bg-[var(--panel)] p-8 shadow-sm">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight text-[var(--ink)]">
          Sign in
        </h1>
        <p className="mt-2 font-mono text-[12px] text-[var(--ink-3)]">
          Legal evidence graph — operator access
        </p>

        {AUTH_DISABLED && (
          <div
            className="mt-5 border border-[var(--rule)] bg-[var(--accent-soft)] px-3 py-2 font-mono text-[11px]"
            style={{ color: 'var(--accent)' }}
          >
            Auth bypassed — dev mode
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              disabled={AUTH_DISABLED || loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              disabled={AUTH_DISABLED || loading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
            />
          </label>

          {error && (
            <p className="font-mono text-[12px]" style={{ color: 'var(--bad)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={AUTH_DISABLED || loading}
            className="w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
