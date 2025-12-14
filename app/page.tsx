'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  description?: string
  category: string
  location: string
  date: string
  distance?: number
  image_url?: string
  created_at?: string
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDistance, setSelectedDistance] = useState<string>('')

  const categories = ['Laufen', 'Rad', 'Marsch', 'Obstacle']
  const distanceOptions = [
    { label: 'Alle Distanzen', value: '' },
    { label: 'Bis 5 km', value: '5' },
    { label: '5-10 km', value: '10' },
    { label: '10-21 km', value: '21' },
    { label: 'Über 21 km', value: '21+' },
  ]

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const filteredEvents = events.filter((event) => {
    // Text-Suche in Titel, Beschreibung und Ort
    const matchesSearch =
      searchText === '' ||
      event.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchText.toLowerCase())

    // Orts-Suche
    const matchesLocation =
      searchLocation === '' ||
      event.location?.toLowerCase().includes(searchLocation.toLowerCase())

    // Kategorie-Filter
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(event.category)

    // Distanz-Filter
    let matchesDistance = true
    if (selectedDistance && event.distance) {
      const distance = event.distance
      switch (selectedDistance) {
        case '5':
          matchesDistance = distance <= 5
          break
        case '10':
          matchesDistance = distance > 5 && distance <= 10
          break
        case '21':
          matchesDistance = distance > 10 && distance <= 21
          break
        case '21+':
          matchesDistance = distance > 21
          break
      }
    }

    return matchesSearch && matchesLocation && matchesCategory && matchesDistance
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-rose-600">nextfinish</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                Anmelden
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                Registrieren
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section mit Suche */}
      <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">
              Dein nächstes Ziel wartet.
            </h2>
            <p className="text-xl text-rose-100">
              Der einzige Kalender, den du brauchst. Marathons, Schlammläufe, Radtouren und Märsche auf einen Blick.
            </p>
          </div>

          {/* Suchfelder */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was suchst du?
                </label>
                <input
                  type="text"
                  placeholder="z.B. Marathon, Triathlon..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wo?
                </label>
                <input
                  type="text"
                  placeholder="Ort oder Stadt"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button className="px-8 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors whitespace-nowrap">
                  Suchen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hauptinhalt */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar mit Filtern */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">
                Filter
              </h3>

              {/* Kategorien */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Kategorie
                </h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-rose-100 text-rose-700 font-medium border-2 border-rose-500'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distanz */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Distanz
                </h4>
                <div className="space-y-2">
                  {distanceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDistance(option.value)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedDistance === option.value
                          ? 'bg-rose-100 text-rose-700 font-medium border-2 border-rose-500'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Event-Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
                  <p className="text-gray-600">Lade Events...</p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  Keine Events gefunden. Versuche andere Filter oder Suchbegriffe.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    {filteredEvents.length}{' '}
                    {filteredEvents.length === 1 ? 'Event gefunden' : 'Events gefunden'}
          </p>
        </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      {/* Event-Bild */}
                      <div className="relative h-48 bg-gradient-to-br from-rose-400 to-rose-600">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                            {event.category.charAt(0)}
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white text-rose-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {event.category}
                          </span>
                        </div>
                      </div>

                      {/* Event-Info */}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {event.location}
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {formatDate(event.date)}
                          </div>
                          {event.distance && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                />
                              </svg>
                              {event.distance} km
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
