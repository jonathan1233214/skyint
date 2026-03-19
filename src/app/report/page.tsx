'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// PinMap uses Leaflet — must be client-only, no SSR
const PinMap = nextDynamic(
  () => import('@/components/map/PinMap').then((m) => m.PinMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ height: 300 }}
        className="w-full rounded bg-surface-3 border border-border-subtle flex items-center justify-center"
      >
        <span className="font-mono text-xs text-text-muted animate-pulse">LOADING MAP...</span>
      </div>
    ),
  }
)

const REPORT_TYPES = [
  { value: 'aircraft',  label: '✈ Aircraft Sighting' },
  { value: 'intercept', label: '🎙 Radio Intercept'   },
  { value: 'visual',    label: '👁 Visual Sighting'   },
  { value: 'alert',     label: '⚠ Alert'              },
]

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Confirmed',
}

function confidenceToLevel(n: number) {
  if (n <= 2) return 'low'
  if (n === 3) return 'medium'
  if (n === 4) return 'high'
  return 'confirmed'
}

export default function ReportPage() {
  const router = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Pin state — null means no pin dropped yet
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null)

  // Form fields
  const [reportType, setReportType]     = useState('aircraft')
  const [callsign, setCallsign]         = useState('')
  const [aircraftType, setAircraftType] = useState('')
  const [route, setRoute]               = useState('')
  const [mission, setMission]           = useState('')
  const [frequency, setFrequency]       = useState('')
  const [description, setDescription]   = useState('')
  const [confidence, setConfidence]     = useState(3)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const isIntercept = reportType === 'intercept'
  // Radio intercepts don't require a map pin
  const needsPin = !isIntercept
  const pinReady = !needsPin || pinned !== null

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/login'); return }
    if (!description.trim()) return
    if (needsPin && !pinned) return

    setSubmitting(true)
    setError(null)

    const descPayload = JSON.stringify({
      notes:         description.trim(),
      aircraft_type: aircraftType.trim() || null,
      route:         route.trim()        || null,
      mission:       mission.trim()      || null,
      frequency:     frequency.trim()    || null,
    })

    const { error: dbError } = await supabase.from('reports').insert({
      user_id:     user.id,
      type:        reportType,
      callsign:    callsign.trim().toUpperCase() || null,
      // Real pin coords — or 0,0 for intercepts with no pin
      lat:         pinned?.lat ?? 0,
      lng:         pinned?.lng ?? 0,
      description: descPayload,
      confidence:  confidenceToLevel(confidence),
    })

    setSubmitting(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      router.push('/')
    }
  }

  // ── Loading / auth gates ──────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <p className="font-mono text-text-muted text-sm animate-pulse">LOADING...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-mono text-text-primary mb-2">SIGN IN REQUIRED</p>
          <p className="font-mono text-xs text-text-muted mb-6">You must be signed in to submit a report.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-accent hover:bg-accent-dim text-surface-1 font-mono font-bold text-sm px-6 py-2 rounded transition-colors"
          >
            SIGN IN
          </button>
          <br />
          <button
            onClick={() => router.push('/')}
            className="mt-4 font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ← Back to map
          </button>
        </div>
      </div>
    )
  }

  // ── Report form ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-surface-2 border-b border-border-subtle flex items-center px-4 gap-4">
        <button
          onClick={() => router.push('/')}
          className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          ← MAP
        </button>
        <span className="font-mono font-bold text-text-primary tracking-widest text-sm">
          SKY<span className="text-accent">INT</span>
        </span>
        <span className="font-mono text-xs text-text-muted">/ SUBMIT REPORT</span>
        <div className="flex-1" />
        <span className="font-mono text-xs text-text-muted truncate max-w-[200px]">{user.email}</span>
      </div>

      <div className="pt-20 pb-16 px-4 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-6">

          <div>
            <h1 className="font-mono font-bold text-text-primary text-lg mb-1">NEW REPORT</h1>
            <p className="font-mono text-xs text-text-muted">
              {needsPin
                ? 'Click the map to mark the location, then fill in the details below.'
                : 'Fill in the intercept details below.'}
            </p>
          </div>

          {/* ── Report type ── */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">REPORT TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setReportType(t.value)}
                  className={`py-2 px-3 rounded border font-mono text-xs transition-all text-left ${
                    reportType === t.value
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Interactive map pin ── */}
          {needsPin && (
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                MARK LOCATION ON MAP <span className="text-red-400">*</span>
              </label>
              <div className="rounded overflow-hidden border border-border-subtle">
                <PinMap onPin={(lat, lng) => setPinned({ lat, lng })} pinned={pinned} height={300} />
              </div>
              {pinned ? (
                <p className="font-mono text-xs text-accent mt-2">
                  ✓ PIN DROPPED — {pinned.lat.toFixed(5)}°N {pinned.lng.toFixed(5)}°E
                  <button
                    type="button"
                    onClick={() => setPinned(null)}
                    className="ml-3 text-text-muted hover:text-red-400 transition-colors"
                  >
                    ✕ clear
                  </button>
                </p>
              ) : (
                <p className="font-mono text-xs text-text-muted mt-2">
                  Click the map above to drop a pin at the observed location.
                </p>
              )}
            </div>
          )}

          {/* ── Callsign ── */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-1">CALLSIGN</label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              placeholder="e.g. REACH301, IAF100"
              className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* ── Aircraft type ── */}
          {!isIntercept && (
            <div>
              <label className="font-mono text-xs text-text-muted block mb-1">AIRCRAFT TYPE</label>
              <input
                type="text"
                value={aircraftType}
                onChange={(e) => setAircraftType(e.target.value)}
                placeholder="e.g. C-17, F-35, KC-135"
                className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* ── Route ── */}
          {!isIntercept && (
            <div>
              <label className="font-mono text-xs text-text-muted block mb-1">ROUTE (FROM / TO)</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="e.g. LLBG → ORBS, Unknown"
                className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* ── Mission ── */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-1">MISSION (IF KNOWN)</label>
            <input
              type="text"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="e.g. SIGINT, Airdrop, Refuelling"
              className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* ── Frequency (radio intercept only) ── */}
          {isIntercept && (
            <div>
              <label className="font-mono text-xs text-text-muted block mb-1">FREQUENCY (MHz)</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. 121.500"
                className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* ── Description ── */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-1">
              DESCRIPTION <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isIntercept
                  ? 'What was heard? Partial transcript, callsigns mentioned, content...'
                  : 'Describe what you observed — heading, altitude, markings, behaviour...'
              }
              required
              rows={5}
              className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-y"
            />
          </div>

          {/* ── Confidence slider ── */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">
              CONFIDENCE —{' '}
              <span className="text-accent">{confidence} / 5 · {CONFIDENCE_LABELS[confidence]}</span>
            </label>
            <input
              type="range"
              min={1} max={5} step={1}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-[#00e5a0]"
            />
            <div className="flex justify-between font-mono text-xs text-text-muted mt-1">
              <span>Very Low</span><span>Low</span><span>Medium</span><span>High</span><span>Confirmed</span>
            </div>
          </div>

          {error && (
            <p className="font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded px-3 py-2">
              ERROR: {error}
            </p>
          )}

          {/* ── Submit ── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-2.5 rounded border border-border-subtle font-mono text-sm text-text-secondary hover:border-text-muted transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim() || !pinReady}
              className="flex-1 py-2.5 rounded bg-accent hover:bg-accent-dim text-surface-1 font-mono text-sm font-bold transition-colors disabled:opacity-40"
            >
              {submitting
                ? 'SUBMITTING...'
                : needsPin && !pinned
                ? 'DROP A PIN FIRST'
                : 'SUBMIT REPORT'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
