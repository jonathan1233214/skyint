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

export const FREQUENCIES: { freq: string; label: string; type: 'emergency' | 'atc' | 'mil' }[] = [
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

const FREQ_COLOR: Record<string, string> = {
  emergency: '#f87171', atc: '#60a5fa', mil: '#00e5a0',
}
const FREQ_BADGE: Record<string, { border: string; bg: string; color: string; label: string }> = {
  emergency: { border: 'rgba(248,113,113,.3)', bg: 'rgba(248,113,113,.1)', color: '#f87171', label: 'EMERG' },
  atc:       { border: 'rgba(96,165,250,.3)',  bg: 'rgba(96,165,250,.1)',  color: '#60a5fa', label: 'ATC'   },
  mil:       { border: 'rgba(0,229,160,.3)',   bg: 'rgba(0,229,160,.1)',   color: '#00e5a0', label: 'MIL'   },
}

function parseInterceptFreq(d: string): string | null {
  try { return JSON.parse(d).freq ?? null } catch { return null }
}
function activityColor(n: number) {
  return n === 0 ? '#484f58' : n <= 3 ? '#facc15' : '#f87171'
}

const mono = 'Space Mono, monospace'
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed',        label: 'FEED'      },
  { id: 'callsigns',   label: 'CALLSIGNS' },
  { id: 'frequencies', label: 'FREQS'     },
]

/** Desktop-only sidebar — completely hidden on mobile via .desktop-sidebar CSS class */
export function Sidebar({ reports, onReportClick }: SidebarProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('feed')

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

  const visibleReports = useMemo(() => reports.filter((r) => r.type !== 'aircraft_note'), [reports])

  return (
    <aside className="desktop-sidebar" style={{
      position: 'fixed', left: 0, top: 48, bottom: 0, width: 300,
      background: '#0d1117', borderRight: '1px solid #30363d',
      flexDirection: 'column', zIndex: 40, overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '8px 0', fontFamily: mono, fontSize: 11,
            background: 'transparent', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid #00e5a0' : '2px solid transparent',
            color: activeTab === t.id ? '#00e5a0' : '#484f58',
            cursor: 'pointer', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Feed */}
        {activeTab === 'feed' && (
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleReports.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
                <p style={{ fontFamily: mono, fontSize: 12, color: '#484f58', margin: 0 }}>NO REPORTS YET</p>
                <button onClick={() => router.push('/report')} style={{
                  fontFamily: mono, fontSize: 12, fontWeight: 700,
                  background: '#00e5a0', color: '#0d1117',
                  border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer',
                }}>+ REPORT</button>
              </div>
            ) : (
              visibleReports.map((r) => <ReportCard key={r.id} report={r} onClick={() => onReportClick(r)} />)
            )}
          </div>
        )}

        {/* Callsigns */}
        {activeTab === 'callsigns' && (
          <div style={{ padding: 8 }}>
            {callsigns.length === 0 ? (
              <p style={{ fontFamily: mono, fontSize: 12, color: '#484f58', textAlign: 'center', padding: '32px 0' }}>NO CALLSIGNS TRACKED</p>
            ) : (
              <table style={{ width: '100%', fontFamily: mono, fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #30363d' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px', color: '#484f58', fontWeight: 400 }}>CALLSIGN</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#484f58', fontWeight: 400 }}>SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {callsigns.map(([cs, d]) => (
                    <tr key={cs} style={{ borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                      <td style={{ padding: '6px 4px', color: '#e6edf3' }}>{cs}</td>
                      <td style={{ padding: '6px 4px', color: '#8b949e', textAlign: 'right' }}>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Frequencies */}
        {activeTab === 'frequencies' && (
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FREQUENCIES.map((f) => {
              const count = freqActivity.get(f.freq) ?? 0
              const badge = FREQ_BADGE[f.type]
              return (
                <div key={f.freq} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid rgba(48,54,61,.4)', borderRadius: 4, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: activityColor(count), display: 'inline-block' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: FREQ_COLOR[f.type], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.freq} MHz</div>
                      <div style={{ fontFamily: mono, fontSize: 11, color: '#484f58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 5px', borderRadius: 3, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #30363d', padding: '8px 12px', flexShrink: 0 }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#484f58' }}>{visibleReports.length} COMMUNITY REPORTS</span>
      </div>
    </aside>
  )
}
