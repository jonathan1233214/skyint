'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-mono font-bold text-2xl text-text-primary tracking-widest mb-1">
            SKY<span className="text-accent">INT</span>
          </div>
          <p className="font-mono text-xs text-text-muted">MILITARY AVIATION OSINT</p>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-lg p-6">
          <h1 className="font-mono font-bold text-text-primary mb-1">ACCESS REQUIRED</h1>
          <p className="font-mono text-xs text-text-muted mb-6">Sign in with your email to submit reports.</p>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-accent text-4xl mb-4">✓</div>
              <p className="font-mono text-sm text-text-primary mb-2">MAGIC LINK SENT</p>
              <p className="font-mono text-xs text-text-muted mb-6">
                Check your inbox at <strong className="text-text-secondary">{email}</strong>.<br />
                Click the link to sign in.
              </p>
              <button
                onClick={() => router.push('/')}
                className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                ← Back to map
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs text-text-muted block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@example.com"
                  required
                  autoFocus
                  className="w-full bg-surface-3 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && <p className="font-mono text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-dim text-surface-1 font-mono font-bold text-sm py-2 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
              </button>

              <p className="font-mono text-xs text-text-muted text-center">
                No password required. Link expires in 1 hour.
              </p>
            </form>
          )}
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-4 w-full font-mono text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
        >
          ← Back to map
        </button>
      </div>
    </div>
  )
}
