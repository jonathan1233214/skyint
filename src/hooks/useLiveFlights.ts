/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { AircraftTrack } from '@/types/database'

const POLL_INTERVAL = 60_000 // 60 s

function apiRowToTrack(a: any): AircraftTrack {
  return {
    icao24:       a.icao24,
    callsign:     a.callsign  ?? null,
    lat:          a.lat,
    lng:          a.lng,
    altitude:     a.altitude  ?? null,
    velocity:     a.velocity  ?? null,
    heading:      a.heading   ?? null,
    on_ground:    a.on_ground ?? false,
    last_contact: a.updated_at
      ? Math.floor(new Date(a.updated_at).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
  }
}

function dbRowToTrack(r: any): AircraftTrack {
  return {
    icao24:       r.icao24,
    callsign:     r.callsign  ?? null,
    lat:          r.lat,
    lng:          r.lng,
    altitude:     r.altitude  ?? null,
    velocity:     r.velocity  ?? null,
    heading:      r.heading   ?? null,
    on_ground:    r.on_ground ?? false,
    last_contact: r.updated_at
      ? Math.floor(new Date(r.updated_at).getTime() / 1000)
      : 0,
  }
}

export function useLiveFlights() {
  const [aircraft, setAircraft] = useState<AircraftTrack[]>([])
  const realtimeActiveRef = useRef(false)

  useEffect(() => {
    // ── Primary source: poll /api/aircraft directly ────────────
    // This works even if the Supabase live_flights table doesn't exist.
    const fetchAndApply = async () => {
      try {
        const res = await fetch('/api/aircraft')
        const data = await res.json()

        if (Array.isArray(data.aircraft) && data.aircraft.length > 0) {
          const tracks = data.aircraft.map(apiRowToTrack)
          console.log(`[useLiveFlights] ${tracks.length} aircraft from API`)
          // Only update from API if Realtime isn't driving state
          if (!realtimeActiveRef.current) {
            setAircraft(tracks)
          }
        }
      } catch (e) {
        console.error('[useLiveFlights] poll error:', e)
      }
    }

    fetchAndApply()
    const pollInterval = setInterval(fetchAndApply, POLL_INTERVAL)

    // ── Secondary source: Supabase Realtime (when table exists) ──
    // On first successful event we flip realtimeActive so API polling
    // stops overwriting state (Realtime gives smoother incremental updates).
    const channel = supabase
      .channel('live_flights_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_flights' },
        (payload) => {
          realtimeActiveRef.current = true
          const track = dbRowToTrack(payload.new)
          setAircraft((prev) => {
            const without = prev.filter((a) => a.icao24 !== track.icao24)
            return [...without, track]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_flights' },
        (payload) => {
          realtimeActiveRef.current = true
          const track = dbRowToTrack(payload.new)
          setAircraft((prev) =>
            prev.map((a) => (a.icao24 === track.icao24 ? track : a))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'live_flights' },
        (payload) => {
          const icao24 = payload.old?.icao24
          if (icao24) {
            setAircraft((prev) => prev.filter((a) => a.icao24 !== icao24))
          }
        }
      )
      .subscribe((status) => {
        console.log('[useLiveFlights] realtime status:', status)
      })

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  return { aircraft }
}
