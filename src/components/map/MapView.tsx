/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef } from 'react'
import type { Report, AircraftTrack } from '@/types/database'

interface MapViewProps {
  reports: Report[]
  aircraft: AircraftTrack[]
  onMapClick: (lat: number, lng: number) => void
  onReportClick: (report: Report) => void
}

const TYPE_COLORS = {
  aircraft: '#3b82f6',
  radio: '#a855f7',
  visual: '#eab308',
  alert: '#ef4444',
}

const CONFIDENCE_RADIUS: Record<string, number> = {
  low: 6,
  medium: 8,
  high: 10,
  confirmed: 12,
}

export function MapView({ reports, aircraft, onMapClick, onReportClick }: MapViewProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reportLayerRef = useRef<any>(null)
  const aircraftLayerRef = useRef<any>(null)
  const clickListenerRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      const map = L.map(containerRef.current!, {
        center: [32, 34],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 18,
        }
      ).addTo(map)

      reportLayerRef.current = L.layerGroup().addTo(map)
      aircraftLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update click handler ref
  useEffect(() => {
    clickListenerRef.current = onMapClick
  }, [onMapClick])

  // Attach map click listener once map is ready
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const handler = (e: any) => {
      clickListenerRef.current?.(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render report pins
  useEffect(() => {
    if (!mapRef.current || !reportLayerRef.current) return
    import('leaflet').then((L) => {
      reportLayerRef.current.clearLayers()
      reports.forEach((report) => {
        const color = TYPE_COLORS[report.type] ?? '#8b949e'
        const radius = CONFIDENCE_RADIUS[report.confidence] ?? 8

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:${radius * 2}px;
              height:${radius * 2}px;
              border-radius:50%;
              background:${color}33;
              border:2px solid ${color};
              box-shadow:0 0 8px ${color}66;
              cursor:pointer;
            "></div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        })

        const marker = L.marker([report.lat, report.lng], { icon })
          .addTo(reportLayerRef.current)
          .bindPopup(`
            <div style="font-family:'Space Mono',monospace;min-width:200px;">
              <div style="color:#00e5a0;font-size:11px;margin-bottom:4px;">${report.type.toUpperCase()} · ${report.confidence.toUpperCase()}</div>
              ${report.callsign ? `<div style="font-size:13px;font-weight:700;margin-bottom:4px;">${report.callsign}</div>` : ''}
              <div style="font-size:11px;color:#8b949e;">${report.description}</div>
              <div style="font-size:10px;color:#484f58;margin-top:6px;">▲ ${report.upvotes} upvotes</div>
            </div>
          `)
        marker.on('click', (e: any) => {
          e.originalEvent?.stopPropagation()
          onReportClick(report)
        })
      })
    })
  }, [reports, onReportClick])

  // Render aircraft tracks
  useEffect(() => {
    if (!mapRef.current || !aircraftLayerRef.current) return
    import('leaflet').then((L) => {
      aircraftLayerRef.current.clearLayers()
      aircraft.forEach((track) => {
        const heading = track.heading ?? 0
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              transform:rotate(${heading}deg);
              font-size:16px;
              color:#00e5a0;
              text-shadow:0 0 6px #00e5a0;
              line-height:1;
            ">✈</div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        L.marker([track.lat, track.lng], { icon })
          .addTo(aircraftLayerRef.current)
          .bindPopup(`
            <div style="font-family:'Space Mono',monospace;">
              <div style="color:#00e5a0;font-size:11px;">LIVE TRACK</div>
              <div style="font-size:13px;font-weight:700;">${track.callsign ?? track.icao24}</div>
              <div style="font-size:11px;color:#8b949e;">
                ALT ${track.altitude != null ? Math.round(track.altitude) + 'm' : 'N/A'} ·
                SPD ${track.velocity != null ? Math.round(track.velocity) + 'm/s' : 'N/A'}
              </div>
            </div>
          `)
      })
    })
  }, [aircraft])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#0d1117' }}
    />
  )
}
