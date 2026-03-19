'use client'

import nextDynamic from 'next/dynamic'
import { useState } from 'react'
import { Header } from '@/components/ui/Header'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { AircraftNotesPanel } from '@/components/modals/AircraftNotesPanel'
import { useReports } from '@/hooks/useReports'
import { useLiveFlights } from '@/hooks/useLiveFlights'
import { useAuth } from '@/hooks/useAuth'
import type { AircraftTrack } from '@/types/database'

const MapView = nextDynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-surface-1">
        <div className="font-mono text-text-muted text-sm animate-pulse">INITIALIZING MAP...</div>
      </div>
    ),
  }
)

export default function Home() {
  const { user, signOut } = useAuth()
  const { reports } = useReports()
  const { aircraft } = useLiveFlights()
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftTrack | null>(null)

  const liveCount =
    aircraft.length +
    reports.filter((r) => {
      if (r.type === 'aircraft_note') return false
      return Date.now() - new Date(r.created_at).getTime() < 3_600_000
    }).length

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header liveCount={liveCount} user={user} onSignOut={signOut} />

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '48px' }}>
        <Sidebar
          reports={reports}
          onReportClick={() => {}}
        />

        <main className="flex-1 ml-[300px] relative overflow-hidden">
          <MapView
            reports={reports}
            aircraft={aircraft}
            onMapClick={() => {}}
            onReportClick={() => {}}
            onAircraftClick={(track) => setSelectedAircraft(track)}
          />
        </main>
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
