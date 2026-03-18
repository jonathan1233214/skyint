/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef } from 'react'
import type { AircraftTrack } from '@/types/database'

// Bounding box: Israel/Middle East corridor
const BBOX = { lamin: 29.0, lomin: 33.0, lamax: 34.5, lomax: 36.5 }
const POLL_INTERVAL = 30000 // 30 seconds

export function useOpenSky() {
  const [aircraft, setAircraft] = useState<AircraftTrack[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAircraft = async () => {
    try {
      const params = new URLSearchParams({
        lamin: String(BBOX.lamin),
        lomin: String(BBOX.lomin),
        lamax: String(BBOX.lamax),
        lomax: String(BBOX.lomax),
      })
      const res = await fetch(`https://opensky-network.org/api/states/all?${params}`)
      if (!res.ok) throw new Error(`OpenSky error: ${res.status}`)
      const data = await res.json()

      const tracks: AircraftTrack[] = (data.states ?? []).map((s: any[]) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || null,
        lat: s[6],
        lng: s[5],
        altitude: s[7],
        velocity: s[9],
        heading: s[10],
        on_ground: s[8],
        last_contact: s[4],
      })).filter((t: AircraftTrack) => t.lat !== null && t.lng !== null)

      setAircraft(tracks)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
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
