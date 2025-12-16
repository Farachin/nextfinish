'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Event } from '@/types/database'
import { calculateDistance } from '@/lib/geoUtils'

// Dynamischer Import der Map-Komponente (SSR deaktiviert)
const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-150px)] rounded-xl bg-slate-200 flex items-center justify-center border border-slate-300 shadow-md">
      <p className="text-slate-600">Karte wird geladen...</p>
    </div>
  ),
})

interface EventDashboardProps {
  initialEvents: Event[]
}

export default function EventDashboard({ initialEvents }: EventDashboardProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents)
  const [searchLocation, setSearchLocation] = useState<string>('')
  const [searchRadius, setSearchRadius] = useState<number>(50)
  const [selectedDistance, setSelectedDistance] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_asc')
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [mapZoom, setMapZoom] = useState<number>(6)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // State für aktive Radius-Suche (behält Position und Radius bei)
  const [activeSearchCenter, setActiveSearchCenter] = useState<[number, number] | null>(null)
  const [activeSearchRadius, setActiveSearchRadius] = useState<number | null>(null)

  // Filter- und Sortier-Logik (wendet alle Filter gemeinsam an)
  useEffect(() => {
    let events = [...initialEvents]

    // Filter nach Distanz
    if (selectedDistance !== 'all') {
      const targetDistance = selectedDistance === '42.195' ? 42.195 : 21.1
      events = events.filter((event) => {
        if (!event.distance) return false
        // Toleranz für kleine Unterschiede (±0.1 km)
        return Math.abs(event.distance - targetDistance) < 0.1
      })
    }

    // Filter nach Radius (wenn aktive Suche vorhanden)
    if (activeSearchCenter !== null && activeSearchRadius !== null) {
      const [searchLat, searchLon] = activeSearchCenter
      events = events.filter((event) => {
        if (event.lat === null || event.lng === null) return false
        
        const distance = calculateDistance(
          searchLat,
          searchLon,
          event.lat,
          event.lng
        )
        
        return distance <= activeSearchRadius
      })
    }

    // Sortierung
    events.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      
      if (sortBy === 'date_asc') {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    })

    setFilteredEvents(events)
  }, [initialEvents, selectedDistance, sortBy, activeSearchCenter, activeSearchRadius])

  const handleSearch = async () => {
    if (!searchLocation.trim()) {
      // Reset Radius-Filter
      setActiveSearchCenter(null)
      setActiveSearchRadius(null)
      setMapCenter(undefined)
      setMapZoom(6)
      setError(null)
      // Das useEffect wird automatisch alle Filter neu anwenden
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      // Nominatim API aufrufen
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`,
        {
          headers: {
            'User-Agent': 'nextfinish-app/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Geodaten')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        setError(`Ort "${searchLocation}" nicht gefunden.`)
        setIsSearching(false)
        return
      }

      const searchLocationData = data[0]
      const searchLat = parseFloat(searchLocationData.lat)
      const searchLon = parseFloat(searchLocationData.lon)

      // Setze aktive Suche (useEffect wird automatisch alle Filter anwenden)
      setActiveSearchCenter([searchLat, searchLon])
      setActiveSearchRadius(searchRadius)
      
      // Zentriere Karte auf Suchort
      setMapCenter([searchLat, searchLon])
      setMapZoom(searchRadius > 100 ? 7 : searchRadius > 50 ? 8 : 9)

      // Fehler wird nach dem useEffect gesetzt, wenn keine Events gefunden wurden
      setIsSearching(false)
    } catch (err) {
      setError('Fehler bei der Suche. Bitte versuche es erneut.')
      console.error('Search error:', err)
      setIsSearching(false)
    }
  }

  // Setze Fehler, wenn nach Filterung keine Events vorhanden sind
  useEffect(() => {
    if (filteredEvents.length === 0 && activeSearchCenter !== null && activeSearchRadius !== null) {
      setError(`Keine Events im Umkreis von ${activeSearchRadius} km gefunden.`)
    } else if (filteredEvents.length > 0 && error && error.includes('Keine Events')) {
      setError(null)
    }
  }, [filteredEvents.length, activeSearchCenter, activeSearchRadius, error])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { day: '', month: '', year: '', full: 'Datum unbekannt' }
    const date = new Date(dateString)
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('de-DE', { month: 'short' }),
      year: date.getFullYear().toString(),
      full: date.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    }
  }

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Sidebar: Filter & Suche (Links) */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Filter & Suche</h2>
          
          {activeSearchCenter !== null && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs font-medium text-emerald-800 mb-1">🔍 Suche aktiv</p>
              <p className="text-xs text-emerald-700">{searchLocation || 'Radius-Filter'}</p>
              <p className="text-xs text-emerald-600 mt-1">{activeSearchRadius} km Radius</p>
              <button
                onClick={() => {
                  setActiveSearchCenter(null)
                  setActiveSearchRadius(null)
                  setSearchLocation('')
                  setMapCenter(undefined)
                  setMapZoom(6)
                  setError(null)
                }}
                className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 underline"
              >
                Suche zurücksetzen
              </button>
            </div>
          )}

          {/* Umkreissuche */}
          <div className="mb-8">
            <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
              Stadt / Ort
            </label>
            <input
              id="location"
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="z.B. Leipzig, Berlin..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
              disabled={isSearching}
            />
            
            <div className="mt-3">
              <label htmlFor="radius" className="block text-sm font-medium text-slate-700 mb-2">
                Radius: {searchRadius} km
              </label>
              <input
                id="radius"
                type="range"
                min="10"
                max="200"
                step="10"
                value={searchRadius}
                onChange={(e) => {
                  const newRadius = Number(e.target.value)
                  setSearchRadius(newRadius)
                  // Wenn aktive Suche vorhanden, Radius sofort aktualisieren
                  if (activeSearchCenter !== null) {
                    setActiveSearchRadius(newRadius)
                    // Karten-Zoom anpassen
                    setMapZoom(newRadius > 100 ? 7 : newRadius > 50 ? 8 : 9)
                  }
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                disabled={isSearching}
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="mt-4 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
            >
              {isSearching ? 'Suche...' : 'Suchen'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Distanz-Filter */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Distanz
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="distance"
                  value="all"
                  checked={selectedDistance === 'all'}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Alle</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="distance"
                  value="42.195"
                  checked={selectedDistance === '42.195'}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Marathon (42 km)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="distance"
                  value="21.1"
                  checked={selectedDistance === '21.1'}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Halbmarathon (21 km)</span>
              </label>
            </div>
          </div>

          {/* Sortierung */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Sortierung
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
            >
              <option value="date_asc">Bald stattfindend</option>
              <option value="date_desc">Späteste zuerst</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content: Karte + Event-Liste */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Karte (Oben, immer sichtbar) */}
        <div className="w-full flex-shrink-0">
          <div className="h-80 lg:h-96">
            <EventMap events={filteredEvents} center={mapCenter} zoom={mapZoom} />
          </div>
        </div>

        {/* Event-Liste (Unten) */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Events ({filteredEvents.length})
                </h2>
                {activeSearchCenter !== null && activeSearchRadius !== null && (
                  <p className="text-sm text-emerald-600 mt-1">
                    🔍 Suche aktiv: {searchLocation || 'Aktiver Radius-Filter'} ({activeSearchRadius} km)
                  </p>
                )}
              </div>
              
              {/* Mobile Filter Toggle (für kleine Screens) */}
              <div className="lg:hidden flex gap-2">
                <select
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="all">Alle</option>
                  <option value="42.195">Marathon</option>
                  <option value="21.1">Halbmarathon</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="date_asc">Bald</option>
                  <option value="date_desc">Spät</option>
                </select>
              </div>
            </div>

            {/* Mobile Suche (für kleine Screens) */}
            <div className="lg:hidden mb-4">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ort suchen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                disabled={isSearching}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={searchRadius}
                  onChange={(e) => {
                    const newRadius = Number(e.target.value)
                    setSearchRadius(newRadius)
                    // Wenn aktive Suche vorhanden, Radius sofort aktualisieren
                    if (activeSearchCenter !== null) {
                      setActiveSearchRadius(newRadius)
                      // Karten-Zoom anpassen
                      setMapZoom(newRadius > 100 ? 7 : newRadius > 50 ? 8 : 9)
                    }
                  }}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-xs text-slate-600 w-16">{searchRadius} km</span>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  {isSearching ? '...' : 'Suchen'}
                </button>
              </div>
              {error && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  {error}
                </div>
              )}
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-2">Keine Events gefunden.</p>
                  {activeSearchCenter !== null && activeSearchRadius !== null && (
                    <p className="text-sm text-slate-500">
                      Versuche einen größeren Radius oder eine andere Stadt.
                    </p>
                  )}
                  {(selectedDistance !== 'all' || activeSearchCenter !== null) && (
                    <button
                      onClick={() => {
                        setSelectedDistance('all')
                        setActiveSearchCenter(null)
                        setActiveSearchRadius(null)
                        setSearchLocation('')
                        setMapCenter(undefined)
                        setMapZoom(6)
                        setError(null)
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const dateInfo = formatDate(event.date)
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer hover:border-emerald-300">
                        {/* Datum-Block */}
                        <div className="flex gap-4 mb-3">
                          <div className="flex-shrink-0">
                            <div className="bg-emerald-100 text-emerald-800 rounded-lg p-3 text-center min-w-[70px] shadow-sm">
                              <div className="text-3xl font-bold leading-tight">{dateInfo.day}</div>
                              <div className="text-xs font-medium uppercase mt-1">{dateInfo.month}</div>
                              {dateInfo.year && (
                                <div className="text-xs mt-1 text-emerald-600 font-semibold">{dateInfo.year}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 hover:text-emerald-600 transition-colors">
                              {event.name || event.title || 'Unbenanntes Event'}
                            </h3>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {event.distance && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {event.distance} km
                                </span>
                              )}
                              {event.city && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                  📍 {event.city}
                                </span>
                              )}
                              {event.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {event.category}
                                </span>
                              )}
                            </div>

                            {/* Datum vollständig */}
                            <p className="text-sm text-slate-600">{dateInfo.full}</p>
                          </div>
                        </div>
                        
                        {/* Link zu externer Seite (stoppt Event-Bubbling) */}
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm mt-2"
                          >
                            Offizielle Webseite
                            <span>→</span>
                          </a>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
