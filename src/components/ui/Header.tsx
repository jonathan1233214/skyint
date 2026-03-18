'use client'

import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  liveCount: number
  onAuthClick: () => void
}

export function Header({ liveCount, onAuthClick }: HeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-surface-2 border-b border-border-subtle flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Auth */}
      {user ? (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-secondary truncate max-w-[160px]">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="font-mono text-xs text-text-secondary hover:text-text-primary border border-border-subtle rounded px-2 py-1 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      ) : (
        <button
          onClick={onAuthClick}
          className="font-mono text-xs text-surface-1 bg-accent hover:bg-accent-dim rounded px-3 py-1 transition-colors font-bold"
        >
          SIGN IN
        </button>
      )}
    </header>
  )
}
