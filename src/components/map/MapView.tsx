/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { Report, AircraftTrack } from '@/types/database'

interface MapViewProps {
  reports: Report[]
  aircraft: AircraftTrack[]
  onMapClick: (lat: number, lng: number) => void
  onReportClick: (report: Report) => void
  onAircraftClick: (track: AircraftTrack) => void
}

const TYPE_COLORS: Record<string, string> = {
  aircraft:  '#3b82f6',
  radio:     '#a855f7',
  visual:    '#eab308',
  alert:     '#ef4444',
  intercept: '#f97316',
}

const CONFIDENCE_RADIUS: Record<string, number> = {
  low: 6, medium: 8, high: 10, confirmed: 12,
}

const MIL_PREFIXES = [
  'REACH', 'RCH', 'JAKE', 'MAGMA', 'SPAR', 'TOPAZ',
  'FURY', 'VIPER', 'DOOM', 'SATAN', 'FORTE', 'VALOR',
]

function isMilCallsign(callsign: string | null): boolean {
  if (!callsign) return false
  const cs = callsign.trim().toUpperCase()
  return MIL_PREFIXES.some((p) => cs.startsWith(p))
}

export function MapView({ reports, aircraft, onMapClick, onReportClick, onAircraftClick }: MapViewProps) {
  const mapRef          = useRef<any>(null)
  const containerRef    = useRef<HTMLDivElement>(null)
  const reportLayerRef  = useRef<any>(null)
  const aircraftLayerRef = useRef<any>(null)
  const clickListenerRef = useRef<((lat: number, lng: number) => void) | null>(null)
  const aircraftClickRef = useRef<((track: AircraftTrack) => void) | null>(null)

  // Flips to true once Leaflet finishes async init — used as effect dependency
  // so render effects re-run as soon as the layers are ready.
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => { clickListenerRef.current = onMapClick },     [onMapClick])
  useEffect(() => { aircraftClickRef.current = onAircraftClick }, [onAircraftClick])

  // ── Initialize map (once) ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const container = containerRef.current
    if (!container) return

    let map: any = null

    import('leaflet').then((L) => {
      // Clean up any leftover Leaflet state (strict-mode / HMR)
      if ((container as any)._leaflet_id != null) {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        } else {
          delete (container as any)._leaflet_id
        }
      }
      if (mapRef.current) return

      map = L.map(container, {
        center: [32, 38],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      reportLayerRef.current  = L.layerGroup().addTo(map)
      aircraftLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map

      map.on('click', (e: any) => {
        clickListenerRef.current?.(e.latlng.lat, e.latlng.lng)
      })

      // Signal that layers are ready — triggers render effects below
      setMapReady(true)
      console.log('[MapView] Leaflet initialized, layers ready')
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        reportLayerRef.current  = null
        aircraftLayerRef.current = null
      } else if (map) {
        map.remove()
      }
      setMapReady(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render report pins ─────────────────────────────────────────
  // mapReady in deps ensures this re-runs once the layer exists,
  // even if reports arrived before Leaflet finished loading.
  useEffect(() => {
    if (!mapReady || !reportLayerRef.current) return
    import('leaflet').then((L) => {
      if (!reportLayerRef.current) return
      reportLayerRef.current.clearLayers()
      // Skip reports with no real coords (lat=0, lng=0)
      const pinnable = reports.filter((r) => r.lat !== 0 || r.lng !== 0)
      pinnable.forEach((report) => {
        const color  = TYPE_COLORS[report.type] ?? '#8b949e'
        const radius = CONFIDENCE_RADIUS[report.confidence] ?? 8

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${radius * 2}px;height:${radius * 2}px;
            border-radius:50%;
            background:${color}33;
            border:2px solid ${color};
            box-shadow:0 0 8px ${color}66;
            cursor:pointer;
          "></div>`,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        })

        const marker = L.marker([report.lat, report.lng], { icon })
          .addTo(reportLayerRef.current)
          .bindPopup(`
            <div style="font-family:'Space Mono',monospace;min-width:180px;">
              <div style="color:#00e5a0;font-size:11px;margin-bottom:4px;">
                ${report.type.toUpperCase()} · ${report.confidence.toUpperCase()}
              </div>
              ${report.callsign
                ? `<div style="font-size:13px;font-weight:700;margin-bottom:4px;">${report.callsign}</div>`
                : ''}
              <div style="font-size:11px;color:#8b949e;">${report.description}</div>
              <div style="font-size:10px;color:#484f58;margin-top:6px;">▲ ${report.upvotes}</div>
            </div>
          `)
        marker.on('click', (e: any) => {
          e.originalEvent?.stopPropagation()
          onReportClick(report)
        })
      })
    })
  }, [reports, onReportClick, mapReady])

  // ── Render aircraft tracks ─────────────────────────────────────
  // mapReady in deps is the key fix: if aircraft data arrives before
  // Leaflet finishes loading, this effect re-runs once mapReady=true.
  useEffect(() => {
    if (!mapReady || !aircraftLayerRef.current) return

    console.log(`[MapView] Rendering ${aircraft.length} aircraft on map`)

    import('leaflet').then((L) => {
      if (!aircraftLayerRef.current) return
      aircraftLayerRef.current.clearLayers()

      aircraft.forEach((track) => {
        const mil     = isMilCallsign(track.callsign)
        const color   = mil ? '#f59e0b' : '#00e5a0'
        const heading = track.heading ?? 0

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            transform:rotate(${heading}deg);
            font-size:${mil ? 18 : 14}px;
            color:${color};
            text-shadow:0 0 6px ${color};
            line-height:1;
            cursor:pointer;
          ">✈</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([track.lat, track.lng], { icon })
          .addTo(aircraftLayerRef.current)
          .bindPopup(`
            <div style="font-family:'Space Mono',monospace;">
              <div style="color:${color};font-size:11px;margin-bottom:2px;">
                ${mil ? '⚠ MIL · ' : ''}LIVE
              </div>
              <div style="font-size:13px;font-weight:700;">${track.callsign ?? track.icao24}</div>
              <div style="font-size:11px;color:#8b949e;margin-top:2px;">
                ALT ${track.altitude != null ? Math.round(track.altitude) + ' m' : 'N/A'} ·
                SPD ${track.velocity != null ? Math.round(track.velocity) + ' m/s' : 'N/A'} ·
                HDG ${track.heading  != null ? Math.round(track.heading)  + '°'   : 'N/A'}
              </div>
            </div>
          `)

        marker.on('click', (e: any) => {
          e.originalEvent?.stopPropagation()
          aircraftClickRef.current?.(track)
        })
      })
    })
  }, [aircraft, mapReady])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, background: '#0d1117' }}
    />
  )
}
