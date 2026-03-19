'use client'

import nextDynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', color: '#484f58', fontSize: 14 }}>INITIALIZING MAP...</div>
      </div>
    ),
  }
)

export default function Home() {
  const router = useRouter()
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
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header liveCount={liveCount} user={user} onSignOut={signOut} />

      {/* Body: below header */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 48 }}>
        <Sidebar reports={reports} onReportClick={() => {}} />

        {/* Map — map-wrapper class controls left margin via CSS */}
        <main
          className="map-wrapper"
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        >
          <MapView
            reports={reports}
            aircraft={aircraft}
            onMapClick={() => {}}
            onReportClick={() => {}}
            onAircraftClick={(track) => setSelectedAircraft(track)}
          />
        </main>
      </div>

      {/* Floating + Report — mobile only, controlled by CSS */}
      <button
        className="mobile-fab"
        onClick={() => router.push('/report')}
        aria-label="Submit report"
      >
        +
      </button>

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
