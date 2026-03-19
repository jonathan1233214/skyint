import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

let lastFetchAt      = 0
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAircraft: any[] = []   // always returned so clients are never empty
const MIN_INTERVAL   = 50_000   // 50 s between real Airplanes.live fetches

export async function GET() {
  const now = Date.now()

  // Return cached data without hitting Airplanes.live again
  if (now - lastFetchAt < MIN_INTERVAL) {
    return NextResponse.json({ aircraft: cachedAircraft, cached: true })
  }

  try {
    const res = await fetch('https://api.airplanes.live/v2/mil', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[/api/aircraft] Airplanes.live status:', res.status)
      return NextResponse.json({ aircraft: cachedAircraft, error: res.status })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { ac?: any[] } = await res.json()
    const raw = data.ac ?? []
    console.log(`[/api/aircraft] Airplanes.live: ${raw.length} military aircraft`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = raw.filter((a: any) => a.lat != null && a.lon != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => ({
        icao24:        (a.hex as string).toLowerCase(),
        callsign:      a.flight?.trim() || null,
        lat:           a.lat  as number,
        lng:           a.lon  as number,
        altitude:      typeof a.alt_baro === 'number' ? Math.round(a.alt_baro * 0.3048) : null,
        velocity:      typeof a.gs === 'number'       ? Math.round(a.gs * 0.514444)      : null,
        heading:       a.track  ?? null,
        on_ground:     a.ground === 'ground',
        squawk:        a.squawk ?? null,
        aircraft_type: a.t ?? null,
        registration:  a.r ?? null,
        updated_at:    new Date().toISOString(),
      }))

    // Always update cache and fetch timestamp (even if Supabase upsert fails)
    cachedAircraft = rows
    lastFetchAt    = now

    // Try to persist to Supabase (optional — Realtime enhancement)
    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('live_flights')
        .upsert(rows, { onConflict: 'icao24' })

      if (upsertErr) {
        // Table not yet created — log once and continue
        console.warn('[/api/aircraft] Supabase upsert skipped (run supabase/live_flights.sql):', upsertErr.message)
      } else {
        const staleAt = new Date(now - 120_000).toISOString()
        await supabase.from('live_flights').delete().lt('updated_at', staleAt)
      }
    }

    return NextResponse.json({ aircraft: rows, count: rows.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/aircraft] error:', msg)
    return NextResponse.json({ aircraft: cachedAircraft, error: msg })
  }
}
