'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ReportCard } from './ReportCard'
import type { Report } from '@/types/database'

type Tab = 'feed' | 'callsigns' | 'frequencies'

interface SidebarProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

const FREQUENCIES: { freq: string; label: string; type: 'emergency' | 'atc' | 'mil' }[] = [
  { freq: '121.500', label: 'GUARD — Air Emergency',     type: 'emergency' },
  { freq: '243.000', label: 'GUARD — Mil Emergency',     type: 'emergency' },
  { freq: '134.600', label: 'Ben Gurion Tower',          type: 'atc' },
  { freq: '121.400', label: 'Tel Aviv Control',          type: 'atc' },
  { freq: '120.500', label: 'Ben Gurion Dep/Appr',       type: 'atc' },
  { freq: '121.750', label: 'Ben Gurion Ground',         type: 'atc' },
  { freq: '128.350', label: 'IDF Base North',            type: 'mil' },
  { freq: '121.150', label: 'IDF Base South',            type: 'mil' },
  { freq: '122.900', label: 'Shnan',                     type: 'mil' },
  { freq: '118.400', label: 'Western Flotilla',          type: 'mil' },
  { freq: '123.850', label: 'Eastern Flotilla',          type: 'mil' },
  { freq: '119.600', label: 'Libya',                     type: 'mil' },
  { freq: '128.150', label: 'Tel Aviv TMA',              type: 'mil' },
  { freq: '134.300', label: 'Tel Aviv TMA Secondary',    type: 'mil' },
  { freq: '130.500', label: 'Ramat David',               type: 'mil' },
  { freq: '124.600', label: 'Ramon',                     type: 'mil' },
  { freq: '135.550', label: 'Palmachim',                 type: 'mil' },
  { freq: '123.550', label: 'Hatzor',                    type: 'mil' },
  { freq: '129.900', label: 'Ovda',                      type: 'mil' },
  { freq: '132.400', label: 'Negev',                     type: 'mil' },
  { freq: '125.350', label: 'Hatzrim North',             type: 'mil' },
  { freq: '130.800', label: 'Hatzrim South',             type: 'mil' },
  { freq: '134.700', label: 'Hatzrim Midweek',           type: 'mil' },
]

const FREQ_COLORS: Record<string, string> = {
  emergency: '#f87171',
  atc:       '#60a5fa',
  mil:       '#00e5a0',
}

const FREQ_BADGE: Record<string, { border: string; bg: string; color: string; label: string }> = {
  emergency: { border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.1)', color: '#f87171', label: 'EMERG' },
  atc:       { border: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa', label: 'ATC'   },
  mil:       { border: 'rgba(0,229,160,0.3)',   bg: 'rgba(0,229,160,0.1)',   color: '#00e5a0', label: 'MIL'   },
}

function parseInterceptFreq(description: string): string | null {
  try { return JSON.parse(description).freq ?? null } catch { return null }
}

function activityColor(count: number): string {
  if (count === 0) return '#484f58'
  if (count <= 3)  return '#facc15'
  return '#f87171'
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed',        label: 'FEED',  icon: '≡'  },
  { id: 'callsigns',   label: 'CALLS', icon: '◎'  },
  { id: 'frequencies', label: 'FREQS', icon: '⏶'  },
]

/* ─── shared tab content ─────────────────────────────────── */
function TabContent({
  activeTab, visibleReports, callsigns, freqActivity, onReportClick, router,
}: {
  activeTab: Tab
  visibleReports: Report[]
  callsigns: [string, { count: number; lastSeen: string; type: string }][]
  freqActivity: Map<string, number>
  onReportClick: (r: Report) => void
  router: ReturnType<typeof useRouter>
}) {
  const mono = 'Space Mono, monospace'

  if (activeTab === 'feed') {
    return (
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleReports.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 16 }}>
            <p style={{ fontFamily: mono, fontSize: 12, color: '#484f58', margin: 0 }}>NO REPORTS YET</p>
            <button
              onClick={() => router.push('/report')}
              style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, background: '#00e5a0', color: '#0d1117', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
            >
              + REPORT
            </button>
          </div>
        ) : (
          visibleReports.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => onReportClick(r)} />
          ))
        )}
      </div>
    )
  }

  if (activeTab === 'callsigns') {
    return (
      <div style={{ padding: 8 }}>
        {callsigns.length === 0 ? (
          <p style={{ fontFamily: mono, fontSize: 12, color: '#484f58', textAlign: 'center', padding: '32px 0' }}>NO CALLSIGNS TRACKED</p>
        ) : (
          <table style={{ width: '100%', fontFamily: mono, fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #30363d' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: '#484f58', fontWeight: 400 }}>CALLSIGN</th>
                <th style={{ textAlign: 'right', padding: '8px 4px', color: '#484f58', fontWeight: 400 }}>REPORTS</th>
              </tr>
            </thead>
            <tbody>
              {callsigns.map(([cs, data]) => (
                <tr key={cs} style={{ borderBottom: '1px solid rgba(48,54,61,0.4)' }}>
                  <td style={{ padding: '8px 4px', color: '#e6edf3' }}>{cs}</td>
                  <td style={{ padding: '8px 4px', color: '#8b949e', textAlign: 'right' }}>{data.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // frequencies
  return (
    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {FREQUENCIES.map((f) => {
        const count = freqActivity.get(f.freq) ?? 0
        const badge = FREQ_BADGE[f.type]
        return (
          <div key={f.freq} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', border: '1px solid rgba(48,54,61,0.4)', borderRadius: 4, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: activityColor(count), display: 'inline-block' }} title={`${count} intercepts (24h)`} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: FREQ_COLORS[f.type], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.freq} MHz</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: '#484f58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontFamily: mono, fontSize: 11, padding: '2px 6px', borderRadius: 3, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color }}>{badge.label}</span>
              {count > 0 && <span style={{ fontFamily: mono, fontSize: 10, color: '#484f58' }}>{count} rep</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── main component ─────────────────────────────────────── */
export function Sidebar({ reports, onReportClick }: SidebarProps) {
  const router = useRouter()
  const [activeTab, setActiveTab]   = useState<Tab>('feed')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const callsigns = useMemo(() => {
    const map = new Map<string, { count: number; lastSeen: string; type: string }>()
    reports.forEach((r) => {
      if (!r.callsign || r.type === 'aircraft_note') return
      const existing = map.get(r.callsign)
      if (!existing || r.created_at > existing.lastSeen) {
        map.set(r.callsign, { count: (existing?.count ?? 0) + 1, lastSeen: r.created_at, type: r.type })
      } else {
        map.set(r.callsign, { ...existing, count: existing.count + 1 })
      }
    })
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count)
  }, [reports])

  const freqActivity = useMemo(() => {
    const cutoff = Date.now() - 86_400_000
    const counts = new Map<string, number>()
    reports.forEach((r) => {
      if (r.type !== 'intercept') return
      if (new Date(r.created_at).getTime() < cutoff) return
      const freq = parseInterceptFreq(r.description)
      if (freq) counts.set(freq, (counts.get(freq) ?? 0) + 1)
    })
    return counts
  }, [reports])

  const visibleReports = useMemo(
    () => reports.filter((r) => r.type !== 'aircraft_note'),
    [reports]
  )

  const openTab = (tab: Tab) => {
    setActiveTab(tab)
    setDrawerOpen(true)
  }

  const contentProps = { activeTab, visibleReports, callsigns, freqActivity, onReportClick, router }
  const mono = 'Space Mono, monospace'

  return (
    <>
      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR — hidden on mobile via CSS
      ══════════════════════════════════════ */}
      <aside
        className="desktop-sidebar"
        style={{
          position: 'fixed', left: 0, top: 48, bottom: 0,
          width: 300,
          background: '#0d1117',
          borderRight: '1px solid #30363d',
          flexDirection: 'column',
          zIndex: 40,
          overflow: 'hidden',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 0',
                fontFamily: mono, fontSize: 11,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #00e5a0' : '2px solid transparent',
                color: activeTab === tab.id ? '#00e5a0' : '#484f58',
                cursor: 'pointer', transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TabContent {...contentProps} />
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #30363d', padding: '8px 12px', flexShrink: 0 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#484f58' }}>
            {visibleReports.length} COMMUNITY REPORTS
          </span>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MOBILE — drawer + bottom nav
          Wrapper hidden on desktop via CSS
      ══════════════════════════════════════ */}
      <div className="mobile-drawer-wrap">
        {/* Backdrop */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 45,
              background: 'rgba(0,0,0,0.65)',
            }}
          />
        )}

        {/* Slide-up drawer */}
        <div
          style={{
            position: 'fixed',
            left: 0, right: 0,
            bottom: 56,           /* sits on top of the bottom nav */
            height: '72vh',
            zIndex: 50,
            background: '#0d1117',
            borderTop: '1px solid #30363d',
            display: 'flex',
            flexDirection: 'column',
            transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.28s ease-out',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#30363d' }} />
          </div>

          {/* Drawer tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 0',
                  fontFamily: mono, fontSize: 11,
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #00e5a0' : '2px solid transparent',
                  color: activeTab === tab.id ? '#00e5a0' : '#484f58',
                  cursor: 'pointer', marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TabContent {...contentProps} />
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #30363d', padding: '8px 12px', flexShrink: 0 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#484f58' }}>
              {visibleReports.length} COMMUNITY REPORTS
            </span>
          </div>
        </div>

        {/* Bottom nav bar */}
        <nav className="mobile-bottom-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => openTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                fontFamily: mono, fontSize: 10,
                background: 'transparent', border: 'none',
                color: drawerOpen && activeTab === tab.id ? '#00e5a0' : '#484f58',
                cursor: 'pointer',
                borderTop: drawerOpen && activeTab === tab.id ? '2px solid #00e5a0' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          {/* MAP — closes drawer */}
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              fontFamily: mono, fontSize: 10,
              background: 'transparent', border: 'none',
              color: !drawerOpen ? '#00e5a0' : '#484f58',
              cursor: 'pointer',
              borderTop: !drawerOpen ? '2px solid #00e5a0' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>⊕</span>
            MAP
          </button>
        </nav>
      </div>
    </>
  )
}
