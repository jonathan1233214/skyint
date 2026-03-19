'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useAircraftNotes } from '@/hooks/useAircraftNotes'
import { useAuth } from '@/hooks/useAuth'
import type { AircraftTrack } from '@/types/database'

interface AircraftNotesPanelProps {
  track: AircraftTrack
  onClose: () => void
  onAuthRequired: () => void
}

const MIL_PREFIXES = ['REACH','RCH','JAKE','MAGMA','SPAR','TOPAZ','FURY','VIPER','DOOM','SATAN','FORTE','VALOR']
function isMil(cs: string | null) {
  if (!cs) return false
  const u = cs.trim().toUpperCase()
  return MIL_PREFIXES.some((p) => u.startsWith(p))
}

export function AircraftNotesPanel({ track, onClose, onAuthRequired }: AircraftNotesPanelProps) {
  const { user } = useAuth()
  const { notes, loading, addNote } = useAircraftNotes(track.icao24)
  const [draft, setDraft]   = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const mil = isMil(track.callsign)
  const accentColor = mil ? '#f59e0b' : '#00e5a0'

  const handleAddNote = async () => {
    if (!user) { onAuthRequired(); return }
    if (!draft.trim()) return
    setSaving(true)
    setErr(null)
    const e = await addNote(user.id, draft.trim())
    setSaving(false)
    if (e) { setErr(e) } else { setDraft('') }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-end sm:justify-end pointer-events-none"
    >
      {/* backdrop — closes panel */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative pointer-events-auto w-full sm:w-[380px] h-[80vh] sm:h-full sm:max-h-screen bg-surface-2 border-l border-border-subtle flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border-subtle flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              {mil && <span className="font-mono text-xs text-yellow-400 border border-yellow-400/30 rounded px-1.5 py-0.5">MIL</span>}
              <span className="font-mono font-bold text-text-primary text-sm" style={{ color: accentColor }}>
                {track.callsign ?? track.icao24}
              </span>
            </div>
            <p className="font-mono text-xs text-text-muted mt-0.5">{track.icao24.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* Aircraft data */}
        <div className="p-4 border-b border-border-subtle flex-shrink-0 grid grid-cols-3 gap-3">
          <div>
            <div className="font-mono text-xs text-text-muted mb-0.5">ALT</div>
            <div className="font-mono text-sm text-text-primary">
              {track.altitude != null ? `${Math.round(track.altitude)}m` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-text-muted mb-0.5">SPD</div>
            <div className="font-mono text-sm text-text-primary">
              {track.velocity != null ? `${Math.round(track.velocity)}m/s` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-text-muted mb-0.5">HDG</div>
            <div className="font-mono text-sm text-text-primary">
              {track.heading != null ? `${Math.round(track.heading)}°` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-text-muted mb-0.5">STATUS</div>
            <div className={`font-mono text-sm ${track.on_ground ? 'text-text-secondary' : 'text-accent'}`}>
              {track.on_ground ? 'GROUND' : 'AIRBORNE'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="font-mono text-xs text-text-muted mb-0.5">LAST CONTACT</div>
            <div className="font-mono text-xs text-text-secondary">
              {formatDistanceToNow(new Date(track.last_contact * 1000), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          <div className="font-mono text-xs text-text-muted mb-1">COMMUNITY NOTES ({notes.length})</div>

          {loading ? (
            <div className="font-mono text-xs text-text-muted text-center py-4 animate-pulse">LOADING...</div>
          ) : notes.length === 0 ? (
            <div className="font-mono text-xs text-text-muted text-center py-6">
              No notes yet. Be the first.
            </div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="bg-surface-3 border border-border-subtle/40 rounded p-2.5">
                <p className="font-mono text-xs text-text-primary leading-relaxed">{n.note}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="font-mono text-xs text-text-muted">{n.user_email.split('@')[0]}</span>
                  <span className="font-mono text-xs text-text-muted">·</span>
                  <span className="font-mono text-xs text-text-muted">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add note */}
        <div className="p-3 border-t border-border-subtle flex-shrink-0">
          {user ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note about this aircraft..."
                rows={2}
                className="w-full bg-surface-3 border border-border-subtle rounded px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none mb-2"
              />
              {err && <p className="font-mono text-xs text-red-400 mb-2">{err}</p>}
              <button
                onClick={handleAddNote}
                disabled={saving || !draft.trim()}
                className="w-full py-2 rounded bg-accent hover:bg-accent-dim text-surface-1 font-mono text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'SAVING...' : 'ADD NOTE'}
              </button>
            </>
          ) : (
            <button
              onClick={onAuthRequired}
              className="w-full py-2 rounded border border-accent/50 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
            >
              SIGN IN TO ADD NOTES
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
