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
  { freq: '121.500', label: 'GUARD — Air Emergency',        type: 'emergency' },
  { freq: '243.000', label: 'GUARD — Mil Emergency',        type: 'emergency' },
  { freq: '134.600', label: 'Ben Gurion Tower',             type: 'atc' },
  { freq: '121.400', label: 'Tel Aviv Control',             type: 'atc' },
  { freq: '120.500', label: 'Ben Gurion Departure/Appr',    type: 'atc' },
  { freq: '121.750', label: 'Ben Gurion Ground',            type: 'atc' },
  { freq: '128.350', label: 'IDF Base North',               type: 'mil' },
  { freq: '121.150', label: 'IDF Base South',               type: 'mil' },
  { freq: '122.900', label: 'Shnan',                        type: 'mil' },
  { freq: '118.400', label: 'Western Flotilla',             type: 'mil' },
  { freq: '123.850', label: 'Eastern Flotilla',             type: 'mil' },
  { freq: '119.600', label: 'Libya',                        type: 'mil' },
  { freq: '128.150', label: 'Tel Aviv TMA',                 type: 'mil' },
  { freq: '134.300', label: 'Tel Aviv TMA Secondary',       type: 'mil' },
  { freq: '130.500', label: 'Ramat David',                  type: 'mil' },
  { freq: '124.600', label: 'Ramon',                        type: 'mil' },
  { freq: '135.550', label: 'Palmachim',                    type: 'mil' },
  { freq: '123.550', label: 'Hatzor',                       type: 'mil' },
  { freq: '129.900', label: 'Ovda',                         type: 'mil' },
  { freq: '132.400', label: 'Negev',                        type: 'mil' },
  { freq: '125.350', label: 'Hatzrim North',                type: 'mil' },
  { freq: '130.800', label: 'Hatzrim South',                type: 'mil' },
  { freq: '134.700', label: 'Hatzrim Midweek',              type: 'mil' },
]

const FREQ_COLORS = {
  emergency: 'text-red-400',
  atc:       'text-blue-400',
  mil:       'text-accent',
}

const FREQ_BADGE_COLORS = {
  emergency: 'border-red-400/30   bg-red-400/10   text-red-400',
  atc:       'border-blue-400/30  bg-blue-400/10  text-blue-400',
  mil:       'border-accent/30    bg-accent/10    text-accent',
}

function parseInterceptFreq(description: string): string | null {
  try {
    const d = JSON.parse(description)
    return d.freq ?? null
  } catch {
    return null
  }
}

function activityDot(count: number): string {
  if (count === 0) return 'bg-text-muted'
  if (count <= 3) return 'bg-yellow-400'
  return 'bg-red-400'
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'feed',        label: 'FEED'      },
  { id: 'callsigns',   label: 'CALLSIGNS' },
  { id: 'frequencies', label: 'FREQS'     },
]

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

  // Shared tab content rendered in both desktop sidebar and mobile drawer
  const renderContent = () => (
    <div className="flex-1 overflow-y-auto">
      {/* ── FEED ── */}
      {activeTab === 'feed' && (
        <div className="p-2 flex flex-col gap-2">
          {visibleReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="font-mono text-xs text-text-muted">NO REPORTS YET</p>
              <button
                onClick={() => router.push('/report')}
                className="bg-accent hover:bg-accent-dim text-surface-1 font-mono font-bold text-xs px-4 py-2 rounded transition-colors"
              >
                + REPORT
              </button>
            </div>
          ) : (
            visibleReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => onReportClick(report)}
              />
            ))
          )}
        </div>
      )}

      {/* ── CALLSIGNS ── */}
      {activeTab === 'callsigns' && (
        <div className="p-2">
          {callsigns.length === 0 ? (
            <div className="text-center text-text-muted font-mono text-xs py-8">
              NO CALLSIGNS TRACKED
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-text-muted border-b border-border-subtle">
                  <th className="text-left py-2">CALLSIGN</th>
                  <th className="text-right py-2">REPORTS</th>
                </tr>
              </thead>
              <tbody>
                {callsigns.map(([cs, data]) => (
                  <tr key={cs} className="border-b border-border-subtle/40 hover:bg-surface-2 transition-colors">
                    <td className="py-2 text-text-primary">{cs}</td>
                    <td className="py-2 text-right text-text-secondary">{data.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── FREQUENCIES ── */}
      {activeTab === 'frequencies' && (
        <div className="p-2 flex flex-col gap-1">
          {FREQUENCIES.map((f) => {
            const count = freqActivity.get(f.freq) ?? 0
            return (
              <div
                key={f.freq}
                className="flex items-center justify-between p-2 border border-border-subtle/40 rounded hover:bg-surface-2 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    title={`${count} intercept${count !== 1 ? 's' : ''} (24h)`}
                    className={`flex-shrink-0 w-2 h-2 rounded-full ${activityDot(count)}`}
                  />
                  <div className="min-w-0">
                    <div className={`font-mono text-sm font-bold truncate ${FREQ_COLORS[f.type]}`}>
                      {f.freq} MHz
                    </div>
                    <div className="font-mono text-xs text-text-muted truncate">{f.label}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${FREQ_BADGE_COLORS[f.type]}`}>
                    {f.type === 'atc' ? 'ATC' : f.type === 'emergency' ? 'EMERG' : 'MIL'}
                  </span>
                  {count > 0 && (
                    <span className="font-mono text-xs text-text-muted">{count} rep</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ══════════════════════════════════════════
          DESKTOP — fixed left sidebar (md+)
      ══════════════════════════════════════════ */}
      <aside className="hidden md:flex fixed left-0 top-12 bottom-0 w-[300px] bg-surface-1 border-r border-border-subtle flex-col z-40">
        {/* Tabs */}
        <div className="flex border-b border-border-subtle flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 font-mono text-xs transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-surface-2 -mb-px'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}

        <div className="border-t border-border-subtle p-2 flex-shrink-0">
          <span className="font-mono text-xs text-text-muted">
            {visibleReports.length} COMMUNITY REPORTS
          </span>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MOBILE — bottom drawer + bottom nav
      ══════════════════════════════════════════ */}

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`md:hidden fixed left-0 right-0 z-50 bg-surface-1 border-t border-border-subtle flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ bottom: '56px', height: '72vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* Tabs inside drawer */}
        <div className="flex border-b border-border-subtle flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 font-mono text-xs transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-surface-2 -mb-px'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}

        <div className="border-t border-border-subtle px-3 py-2 flex-shrink-0">
          <span className="font-mono text-xs text-text-muted">
            {visibleReports.length} COMMUNITY REPORTS
          </span>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-surface-2 border-t border-border-subtle flex items-stretch">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => openTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 font-mono text-[10px] transition-colors ${
              drawerOpen && activeTab === tab.id
                ? 'text-accent bg-surface-3'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <span className="text-base leading-none">
              {tab.id === 'feed' ? '📋' : tab.id === 'callsigns' ? '📡' : '📻'}
            </span>
            {tab.label}
          </button>
        ))}

        {/* Close / MAP button — only visible when drawer is open */}
        <button
          onClick={() => setDrawerOpen(false)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 font-mono text-[10px] transition-all ${
            drawerOpen
              ? 'text-accent opacity-100'
              : 'text-text-muted opacity-40 pointer-events-none'
          }`}
        >
          <span className="text-base leading-none">🗺</span>
          MAP
        </button>
      </nav>
    </>
  )
}
