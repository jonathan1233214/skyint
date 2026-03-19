/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

export interface PinMapProps {
  onPin: (lat: number, lng: number) => void
  pinned: { lat: number; lng: number } | null
  height?: number
}

export function PinMap({ onPin, pinned, height = 300 }: PinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markerRef    = useRef<any>(null)
  // Keep onPin stable across re-renders without re-initializing the map
  const onPinRef     = useRef(onPin)
  useEffect(() => { onPinRef.current = onPin }, [onPin])

  // Initialize Leaflet once
  useEffect(() => {
    if (typeof window === 'undefined') return
    const container = containerRef.current
    if (!container) return

    import('leaflet').then((L) => {
      // Guard against double-init (strict mode / HMR)
      if ((container as any)._leaflet_id != null) {
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        else { delete (container as any)._leaflet_id }
      }
      if (mapRef.current) return

      const map = L.map(container, {
        center: [32, 35],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 18,
      }).addTo(map)

      map.on('click', (e: any) => {
        onPinRef.current(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update pin marker whenever `pinned` changes
  useEffect(() => {
    if (!pinned) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="
              position:absolute;inset:3px;
              border-radius:50%;
              background:#00e5a0;
              border:2px solid #fff;
              box-shadow:0 0 0 3px #00e5a040, 0 0 12px #00e5a0;
            "></div>
          </div>`,
        iconSize:   [20, 20],
        iconAnchor: [10, 10],
      })

      if (markerRef.current) {
        markerRef.current.setLatLng([pinned.lat, pinned.lng])
        markerRef.current.setIcon(icon)
      } else {
        markerRef.current = L.marker([pinned.lat, pinned.lng], { icon })
          .addTo(mapRef.current)
      }

      mapRef.current.panTo([pinned.lat, pinned.lng], { animate: true, duration: 0.3 })
    })
  }, [pinned])

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: '6px', overflow: 'hidden' }}
    />
  )
}
