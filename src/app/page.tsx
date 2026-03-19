'use client'

import nextDynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header }   from '@/components/ui/Header'
import { Sidebar, FREQUENCIES } from '@/components/sidebar/Sidebar'
import { AircraftNotesPanel }   from '@/components/modals/AircraftNotesPanel'
import { ReportCard }           from '@/components/sidebar/ReportCard'
import { useReports }      from '@/hooks/useReports'
import { useLiveFlights }  from '@/hooks/useLiveFlights'
import { useAuth }         from '@/hooks/useAuth'
import type { AircraftTrack } from '@/types/database'

const MapView = nextDynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', color: '#484f58', fontSize: 13 }}>INITIALIZING MAP…</span>
      </div>
    ),
  }
)

type MobileTab = 'map' | 'feed' | 'callsigns' | 'freqs'

const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'map',       label: 'MAP',       icon: '⊕' },
  { id: 'feed',      label: 'FEED',      icon: '≡' },
  { id: 'callsigns', label: 'CALLSIGNS', icon: '◎' },
  { id: 'freqs',     label: 'FREQS',     icon: '⏶' },
]

const mono = 'Space Mono, monospace'

function parseInterceptFreq(d: string): string | null {
  try { return JSON.parse(d).freq ?? null } catch { return null }
}
function activityColor(n: number) {
  return n === 0 ? '#484f58' : n <= 3 ? '#facc15' : '#f87171'
}
const FREQ_COLOR: Record<string, string> = { emergency: '#f87171', atc: '#60a5fa', mil: '#00e5a0' }
const FREQ_BADGE: Record<string, { border: string; bg: string; color: string; label: string }> = {
  emergency: { border: 'rgba(248,113,113,.3)', bg: 'rgba(248,113,113,.1)', color: '#f87171', label: 'EMERG' },
  atc:       { border: 'rgba(96,165,250,.3)',  bg: 'rgba(96,165,250,.1)',  color: '#60a5fa', label: 'ATC'   },
  mil:       { border: 'rgba(0,229,160,.3)',   bg: 'rgba(0,229,160,.1)',   color: '#00e5a0', label: 'MIL'   },
}

export default function Home() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { reports }  = useReports()
  const { aircraft } = useLiveFlights()
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftTrack | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('map')

  const liveCount =
    aircraft.length +
    reports.filter((r) => r.type !== 'aircraft_note' && Date.now() - new Date(r.created_at).getTime() < 3_600_000).length

  /* Mobile computed values */
  const visibleReports = useMemo(() => reports.filter((r) => r.type !== 'aircraft_note'), [reports])

  const callsigns = useMemo(() => {
    const map = new Map<string, { count: number; lastSeen: string }>()
    reports.forEach((r) => {
      if (!r.callsign || r.type === 'aircraft_note') return
      const ex = map.get(r.callsign)
      map.set(r.callsign, { count: (ex?.count ?? 0) + 1, lastSeen: ex && ex.lastSeen > r.created_at ? ex.lastSeen : r.created_at })
    })
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count)
  }, [reports])

  const freqActivity = useMemo(() => {
    const cutoff = Date.now() - 86_400_000
    const counts = new Map<string, number>()
    reports.forEach((r) => {
      if (r.type !== 'intercept' || new Date(r.created_at).getTime() < cutoff) return
      const f = parseInterceptFreq(r.description)
      if (f) counts.set(f, (counts.get(f) ?? 0) + 1)
    })
    return counts
  }, [reports])

  return (
    /* Outer shell — just provides stacking context */
    <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>

      {/* Fixed header — always on top */}
      <Header liveCount={liveCount} user={user} onSignOut={signOut} />

      {/* ══════════════════════════════════════════════════
          DESKTOP body: sidebar + map (flex row, below header)
          Hidden on mobile via .desktop-sidebar and .map-wrapper CSS
      ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', height: '100%', paddingTop: 48 }}>
        <Sidebar reports={reports} onReportClick={() => {}} />

        {/* map-wrapper: margin-left:300px on desktop, position:fixed on mobile */}
        <main className="map-wrapper">
          <MapView
            reports={reports}
            aircraft={aircraft}
            onMapClick={() => {}}
            onReportClick={() => {}}
            onAircraftClick={(t) => setSelectedAircraft(t)}
          />
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE chrome — completely hidden on desktop via CSS
      ══════════════════════════════════════════════════ */}
      <div className="mobile-only">

        {/* ── Full-screen panel (Feed / Callsigns / Freqs) ── */}
        {/* Covers the map when any non-map tab is active    */}
        {mobileTab !== 'map' && (
          <div style={{
            position: 'fixed', top: 48, left: 0, right: 0, bottom: 56,
            background: '#0d1117', overflowY: 'auto', zIndex: 30,
          }}>

            {/* ── FEED ── */}
            {mobileTab === 'feed' && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Sign in bar */}
                {!user ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 12, color: '#8b949e' }}>Sign in to submit reports</span>
                    <button onClick={() => router.push('/login')} style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: '#0d1117', background: '#00e5a0', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer' }}>
                      SIGN IN
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: '#484f58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{user.email}</span>
                    <button onClick={signOut} style={{ fontFamily: mono, fontSize: 11, color: '#8b949e', background: 'transparent', border: '1px solid #30363d', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
                      LOGOUT
                    </button>
                  </div>
                )}

                {visibleReports.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
                    <p style={{ fontFamily: mono, fontSize: 13, color: '#484f58', margin: 0 }}>NO REPORTS YET</p>
                    <button onClick={() => router.push('/report')} style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, background: '#00e5a0', color: '#0d1117', border: 'none', borderRadius: 4, padding: '10px 20px', cursor: 'pointer' }}>
                      + REPORT
                    </button>
                  </div>
                ) : (
                  visibleReports.map((r) => <ReportCard key={r.id} report={r} onClick={() => {}} />)
                )}
              </div>
            )}

            {/* ── CALLSIGNS ── */}
            {mobileTab === 'callsigns' && (
              <div style={{ padding: 12 }}>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#484f58', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tracked Callsigns</p>
                {callsigns.length === 0 ? (
                  <p style={{ fontFamily: mono, fontSize: 13, color: '#484f58', textAlign: 'center', padding: '40px 0' }}>NO CALLSIGNS TRACKED</p>
                ) : (
                  <table style={{ width: '100%', fontFamily: mono, fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #30363d' }}>
                        <th style={{ textAlign: 'left', padding: '8px 4px', color: '#484f58', fontWeight: 400 }}>CALLSIGN</th>
                        <th style={{ textAlign: 'right', padding: '8px 4px', color: '#484f58', fontWeight: 400 }}>REPORTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callsigns.map(([cs, d]) => (
                        <tr key={cs} style={{ borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                          <td style={{ padding: '10px 4px', color: '#e6edf3' }}>{cs}</td>
                          <td style={{ padding: '10px 4px', color: '#8b949e', textAlign: 'right' }}>{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── FREQS ── */}
            {mobileTab === 'freqs' && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#484f58', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monitored Frequencies</p>
                {FREQUENCIES.map((f) => {
                  const count = freqActivity.get(f.freq) ?? 0
                  const badge = FREQ_BADGE[f.type]
                  return (
                    <div key={f.freq} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: activityColor(count), display: 'inline-block' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: FREQ_COLOR[f.type] }}>{f.freq} MHz</div>
                          <div style={{ fontFamily: mono, fontSize: 11, color: '#484f58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 6px', borderRadius: 3, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Floating + Report button ── */}
        <button
          onClick={() => router.push('/report')}
          aria-label="Submit report"
          style={{
            position: 'fixed', bottom: 72, right: 16, zIndex: 40,
            width: 56, height: 56, borderRadius: '50%',
            background: '#00e5a0', color: '#0d1117',
            fontSize: 28, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,229,160,.4)',
          }}
        >+</button>

        {/* ── Bottom navigation bar ── */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, zIndex: 50,
          background: '#161b22', borderTop: '1px solid #30363d',
          display: 'flex', alignItems: 'stretch',
        }}>
          {MOBILE_TABS.map((tab) => {
            const active = mobileTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  fontFamily: mono, fontSize: 9,
                  background: 'transparent', border: 'none',
                  borderTop: active ? '2px solid #00e5a0' : '2px solid transparent',
                  color: active ? '#00e5a0' : '#484f58',
                  cursor: 'pointer',
                  transition: 'color .15s',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {selectedAircraft && (
        <AircraftNotesPanel
          track={selectedAircraft}
          onClose={() => setSelectedAircraft(null)}
          onAuthRequired={() => setSelectedAircraft(null)}
        />
      )}
    </div>
  )
}
