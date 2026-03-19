/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef } from 'react'
import type { AircraftTrack } from '@/types/database'

const POLL_INTERVAL = 60_000 // 60 seconds — respects OpenSky anonymous rate limit

export function useOpenSky() {
  const [aircraft, setAircraft] = useState<AircraftTrack[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAircraft = async () => {
    try {
      const res = await fetch('/api/aircraft')
      if (!res.ok) throw new Error(`OpenSky proxy error: ${res.status}`)
      const data = await res.json()

      const raw = data.states ?? []
      console.log(`[useOpenSky] API returned ${raw.length} states`)

      const tracks: AircraftTrack[] = raw
        .map((s: any[]) => ({
          icao24:       s[0],
          callsign:     s[1]?.trim() || null,
          lat:          s[6],
          lng:          s[5],
          altitude:     s[7],
          velocity:     s[9],
          heading:      s[10],
          on_ground:    s[8],
          last_contact: s[4],
        }))
        .filter((t: AircraftTrack) => t.lat !== null && t.lng !== null)

      console.log(`[useOpenSky] ${tracks.length} aircraft after filtering nulls`)
      setAircraft(tracks)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      console.error('[useOpenSky] fetch error:', err.message)
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchAircraft()
    timerRef.current = setInterval(fetchAircraft, POLL_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { aircraft, lastUpdated, error }
}
