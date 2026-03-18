'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center modal-backdrop bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-2 border border-border-subtle rounded-lg p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono font-bold text-text-primary">
            <span className="text-accent">SKY</span>INT ACCESS
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg">✕</button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-accent text-3xl mb-4">✓</div>
            <p className="font-mono text-sm text-text-primary mb-2">MAGIC LINK SENT</p>
            <p className="font-mono text-xs text-text-secondary">Check your email at <strong>{email}</strong></p>
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
                className="w-full bg-surface-3 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && (
              <p className="font-mono text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-dim text-surface-1 font-mono font-bold text-sm py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
            </button>
            <p className="font-mono text-xs text-text-muted text-center">
              No password required. Check your inbox.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
