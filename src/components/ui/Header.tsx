'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  liveCount: number
  user: User | null
  onSignOut: () => void
}

const mono = 'Space Mono, monospace'

export function Header({ liveCount, user, onSignOut }: HeaderProps) {
  const router = useRouter()

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 48, background: '#161b22', borderBottom: '1px solid #30363d',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
    }}>

      {/* Logo — always visible */}
      <div onClick={() => router.push('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ color: '#00e5a0', fontSize: 18 }}>⬡</span>
        <span style={{ fontFamily: mono, fontWeight: 700, color: '#e6edf3', letterSpacing: '0.15em', fontSize: 14 }}>
          SKY<span style={{ color: '#00e5a0' }}>INT</span>
        </span>
      </div>

      {/* Live pill — always visible */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#21262d', border: '1px solid #30363d',
        borderRadius: 999, padding: '3px 10px', flexShrink: 0,
      }}>
        <span className="pulse-green" style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e5a0', display: 'inline-block' }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: '#00e5a0' }}>{liveCount} LIVE</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Desktop-only: + Report + auth (hidden on mobile via CSS) */}
      <div className="desktop-only" style={{ alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/report')} style={{
          fontFamily: mono, fontSize: 12, fontWeight: 700,
          color: '#0d1117', background: '#00e5a0',
          border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
        }}>
          + REPORT
        </button>

        {user ? (
          <>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#8b949e', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button onClick={onSignOut} style={{
              fontFamily: mono, fontSize: 11, color: '#8b949e',
              background: 'transparent', border: '1px solid #30363d',
              borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
            }}>LOGOUT</button>
          </>
        ) : (
          <button onClick={() => router.push('/login')} style={{
            fontFamily: mono, fontSize: 12, fontWeight: 700,
            color: '#0d1117', background: '#00e5a0',
            border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
          }}>SIGN IN</button>
        )}
      </div>
    </header>
  )
}
