'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Event } from '@/types/database'

// Fix für Standard-Icons in Leaflet (next.js SSR Problem)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface EventMapProps {
  events: Event[]
  center?: [number, number]
  zoom?: number
}

// Komponente zum Aktualisieren des Kartenzentrums
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom())
    }
  }, [center, zoom, map])

  return null
}

export default function EventMap({ events, center, zoom = 6 }: EventMapProps) {
  // Filtere Events, die Koordinaten haben
  const eventsWithCoords = events.filter(
    (event) => {
      const hasLat = event.lat !== null && event.lat !== undefined
      const hasLng = event.lng !== null && event.lng !== undefined
      const isNumber = typeof event.lat === 'number' && typeof event.lng === 'number'
      return hasLat && hasLng && isNumber
    }
  )
  
  // Debug
  console.log("🗺️ EventMap Debug:")
  console.log("Gesamt Events:", events.length)
  console.log("Events mit Koordinaten:", eventsWithCoords.length)

  // Initiales Zentrum: Deutschland oder gesetztes center
  const initialCenter: [number, number] = center || [51.1657, 10.4515]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Datum unbekannt'
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 shadow-md">
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Zentrum-Update-Komponente */}
        {center && <MapCenterUpdater center={center} zoom={zoom} />}
        
        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat!, event.lng!]}
          >
            <Popup className="event-popup" maxWidth={300}>
              <div className="p-3">
                <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">
                  {event.name || event.title || 'Unbenanntes Event'}
                </h3>
                <div className="space-y-1.5 mb-3 text-sm">
                  <p className="text-slate-600">
                    📅 {formatDate(event.date)}
                  </p>
                  {event.location && (
                    <p className="text-slate-600">
                      📍 {event.location}
                    </p>
                  )}
                  {event.distance && (
                    <p className="text-slate-600">
                      🏃 {event.distance} km
                    </p>
                  )}
                  {event.city && (
                    <p className="text-slate-600">
                      🏙️ {event.city}
                    </p>
                  )}
                </div>
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Mehr Informationen →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
