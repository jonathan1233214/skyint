'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  liveCount: number
  user: User | null
  onSignOut: () => void
}

export function Header({ liveCount, user, onSignOut }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] h-12 bg-surface-2 border-b border-border-subtle flex items-center px-4 gap-3">
      {/* Logo */}
      <div
        className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
        onClick={() => router.push('/')}
      >
        <span className="text-accent text-lg">⬡</span>
        <span className="font-mono font-bold text-text-primary tracking-widest text-sm">
          SKY<span className="text-accent">INT</span>
        </span>
      </div>

      {/* Live pill */}
      <div className="flex items-center gap-2 bg-surface-3 border border-border-subtle rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-accent pulse-green inline-block" />
        <span className="font-mono text-xs text-accent">{liveCount} LIVE</span>
      </div>

      <div className="flex-1" />

      {/* + Report — desktop only */}
      <button
        onClick={() => router.push('/report')}
        className="hidden md:inline-flex font-mono text-xs text-surface-1 bg-accent hover:bg-accent-dim rounded px-3 py-1 transition-colors font-bold"
      >
        + REPORT
      </button>

      {/* Auth — desktop only */}
      {user ? (
        <div className="hidden md:flex items-center gap-3">
          <span className="font-mono text-xs text-text-secondary truncate max-w-[160px]">
            {user.email}
          </span>
          <button
            onClick={onSignOut}
            className="font-mono text-xs text-text-secondary hover:text-text-primary border border-border-subtle rounded px-2 py-1 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="hidden md:inline-flex font-mono text-xs text-surface-1 bg-accent hover:bg-accent-dim rounded px-3 py-1 transition-colors font-bold"
        >
          SIGN IN
        </button>
      )}
    </header>
  )
}
