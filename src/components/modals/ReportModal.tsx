'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ReportType, ConfidenceLevel } from '@/types/database'

interface ReportModalProps {
  lat: number
  lng: number
  onClose: () => void
  onSubmitted: () => void
}

const REPORT_TYPES: { value: ReportType; label: string; color: string }[] = [
  { value: 'aircraft', label: '✈ AIRCRAFT', color: 'border-blue-500 text-blue-400' },
  { value: 'radio', label: '📡 RADIO', color: 'border-purple-500 text-purple-400' },
  { value: 'visual', label: '👁 VISUAL', color: 'border-yellow-500 text-yellow-400' },
  { value: 'alert', label: '⚠ ALERT', color: 'border-red-500 text-red-400' },
]

const CONFIDENCE_LEVELS: { value: ConfidenceLevel; label: string }[] = [
  { value: 'low', label: 'LOW' },
  { value: 'medium', label: 'MEDIUM' },
  { value: 'high', label: 'HIGH' },
  { value: 'confirmed', label: 'CONFIRMED' },
]

export function ReportModal({ lat, lng, onClose, onSubmitted }: ReportModalProps) {
  const { user } = useAuth()
  const [type, setType] = useState<ReportType>('aircraft')
  const [callsign, setCallsign] = useState('')
  const [description, setDescription] = useState('')
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      type,
      callsign: callsign.trim() || null,
      lat,
      lng,
      description: description.trim(),
      confidence,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onSubmitted()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center modal-backdrop bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-2 border border-border-subtle rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-mono font-bold text-text-primary">SUBMIT REPORT</h2>
            <p className="font-mono text-xs text-text-muted mt-1">
              {lat.toFixed(4)}°N {lng.toFixed(4)}°E
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type selector */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">REPORT TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`py-2 px-3 rounded border font-mono text-xs transition-all ${
                    type === t.value
                      ? `${t.color} bg-current/10`
                      : 'border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Callsign */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-1">CALLSIGN (optional)</label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              placeholder="e.g. IAF100, REDEYE1"
              className="w-full bg-surface-3 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-1">DESCRIPTION *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observed heading north at high altitude, military livery..."
              required
              rows={3}
              className="w-full bg-surface-3 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* Confidence */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">CONFIDENCE LEVEL</label>
            <div className="flex gap-2">
              {CONFIDENCE_LEVELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setConfidence(c.value)}
                  className={`flex-1 py-1.5 rounded border font-mono text-xs transition-all ${
                    confidence === c.value
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded border border-border-subtle font-mono text-xs text-text-secondary hover:border-text-muted transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="flex-1 py-2 rounded bg-accent hover:bg-accent-dim text-surface-1 font-mono text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
