'use client'

export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { Header } from '@/components/ui/Header'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { AuthModal } from '@/components/modals/AuthModal'
import { ReportModal } from '@/components/modals/ReportModal'
import { useReports } from '@/hooks/useReports'
import { useOpenSky } from '@/hooks/useOpenSky'
import { useAuth } from '@/hooks/useAuth'
import type { Report } from '@/types/database'

// SSR must be disabled for Leaflet
const MapView = nextDynamic(() => import('@/components/map/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-1">
      <div className="font-mono text-text-muted text-sm animate-pulse">INITIALIZING MAP...</div>
    </div>
  ),
})

export default function Home() {
  const { user } = useAuth()
  const { reports, refetch } = useReports()
  const { aircraft } = useOpenSky()

  const [showAuth, setShowAuth] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!user) {
      setShowAuth(true)
      return
    }
    setPendingLocation({ lat, lng })
  }, [user])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReportClick = useCallback((_report: Report) => {
    // Reports open via Leaflet popup — future: open detail panel
  }, [])

  const liveCount = aircraft.length + reports.filter(r => {
    const age = Date.now() - new Date(r.created_at).getTime()
    return age < 3600000 // last hour
  }).length

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        liveCount={liveCount}
        onAuthClick={() => setShowAuth(true)}
      />

      <div className="flex flex-1 pt-12 overflow-hidden">
        <Sidebar
          reports={reports}
          onReportClick={handleReportClick}
        />

        {/* Map area */}
        <main className="flex-1 ml-[300px] relative">
          <MapView
            reports={reports}
            aircraft={aircraft}
            onMapClick={handleMapClick}
            onReportClick={handleReportClick}
          />

          {/* Click hint overlay */}
          {user && (
            <div className="absolute bottom-4 right-4 bg-surface-2/90 border border-border-subtle rounded px-3 py-2 font-mono text-xs text-text-muted pointer-events-none">
              CLICK MAP TO REPORT
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {pendingLocation && user && (
        <ReportModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={() => setPendingLocation(null)}
          onSubmitted={refetch}
        />
      )}
    </div>
  )
}
