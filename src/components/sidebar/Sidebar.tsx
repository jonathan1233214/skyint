'use client'

import { useState, useMemo } from 'react'
import { ReportCard } from './ReportCard'
import type { Report } from '@/types/database'

type Tab = 'feed' | 'callsigns' | 'frequencies'

interface SidebarProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

// Known military frequencies in region (static reference data)
const FREQUENCIES = [
  { freq: '121.500', label: 'GUARD (Air Emergency)', type: 'emergency' },
  { freq: '243.000', label: 'GUARD (Mil Emergency)', type: 'emergency' },
  { freq: '122.800', label: 'Unicom', type: 'civil' },
  { freq: '119.100', label: 'Tel Aviv Approach', type: 'atc' },
  { freq: '132.800', label: 'Tel Aviv Center', type: 'atc' },
  { freq: '118.700', label: 'Ben Gurion Tower', type: 'atc' },
  { freq: '138.100', label: 'IDF Air Operations', type: 'mil' },
  { freq: '311.000', label: 'IDF Tanker Common', type: 'mil' },
]

const FREQ_COLORS = {
  emergency: 'text-red-400',
  civil: 'text-blue-400',
  atc: 'text-yellow-400',
  mil: 'text-accent',
}

export function Sidebar({ reports, onReportClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  const callsigns = useMemo(() => {
    const map = new Map<string, { count: number; lastSeen: string; type: string }>()
    reports.forEach((r) => {
      if (!r.callsign) return
      const existing = map.get(r.callsign)
      if (!existing || r.created_at > existing.lastSeen) {
        map.set(r.callsign, {
          count: (existing?.count ?? 0) + 1,
          lastSeen: r.created_at,
          type: r.type,
        })
      } else {
        map.set(r.callsign, { ...existing, count: existing.count + 1 })
      }
    })
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count)
  }, [reports])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'feed', label: 'FEED' },
    { id: 'callsigns', label: 'CALLSIGNS' },
    { id: 'frequencies', label: 'FREQS' },
  ]

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-[300px] bg-surface-1 border-r border-border-subtle flex flex-col z-40">
      {/* Tabs */}
      <div className="flex border-b border-border-subtle flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 font-mono text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent bg-surface-2'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'feed' && (
          <div className="p-2 flex flex-col gap-2">
            {reports.length === 0 ? (
              <div className="text-center text-text-muted font-mono text-xs py-8">
                NO REPORTS YET<br />
                <span className="text-text-muted/60">Click map to submit</span>
              </div>
            ) : (
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => onReportClick(report)}
                />
              ))
            )}
          </div>
        )}

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

        {activeTab === 'frequencies' && (
          <div className="p-2 flex flex-col gap-1">
            {FREQUENCIES.map((f) => (
              <div
                key={f.freq}
                className="flex items-center justify-between p-2 border border-border-subtle/40 rounded hover:bg-surface-2 transition-colors"
              >
                <div>
                  <div className={`font-mono text-sm font-bold ${FREQ_COLORS[f.type as keyof typeof FREQ_COLORS]}`}>
                    {f.freq} MHz
                  </div>
                  <div className="font-mono text-xs text-text-muted">{f.label}</div>
                </div>
                <span className={`font-mono text-xs px-1.5 py-0.5 rounded border border-current/30 bg-current/10 ${FREQ_COLORS[f.type as keyof typeof FREQ_COLORS]}`}>
                  {f.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report count footer */}
      <div className="border-t border-border-subtle p-2 flex-shrink-0">
        <span className="font-mono text-xs text-text-muted">
          {reports.length} COMMUNITY REPORTS
        </span>
      </div>
    </aside>
  )
}
