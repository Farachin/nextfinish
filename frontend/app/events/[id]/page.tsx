import { supabase } from '@/lib/supabase'
import { Event } from '@/types/database'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventMapClient from '@/components/EventMapClient'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params

  // Hole Event aus der Datenbank
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  const eventData: Event = event

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { day: '', month: '', year: '', full: 'Datum unbekannt' }
    const date = new Date(dateString)
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('de-DE', { month: 'short' }),
      year: date.getFullYear().toString(),
      full: date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    }
  }

  const dateInfo = formatDate(eventData.date)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 transition-colors"
            >
              <span>←</span>
              <span>Zurück zur Übersicht</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-3xl">🏃</span>
              NextFinish
            </h1>
            <div className="w-32"></div> {/* Spacer für Zentrierung */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Datum-Box */}
            <div className="flex-shrink-0">
              <div className="bg-emerald-100 text-emerald-800 rounded-xl p-6 text-center min-w-[100px] shadow-sm">
                <div className="text-5xl font-bold leading-tight">{dateInfo.day}</div>
                <div className="text-lg font-medium uppercase mt-2">{dateInfo.month}</div>
                {dateInfo.year && (
                  <div className="text-sm mt-2 text-emerald-600 font-semibold">{dateInfo.year}</div>
                )}
              </div>
            </div>

            {/* Event-Info */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                {eventData.name || eventData.title || 'Unbenanntes Event'}
              </h1>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {eventData.city && (
                  <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-medium">
                    📍 {eventData.city}
                  </div>
                )}
                {eventData.location && eventData.location !== eventData.city && (
                  <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-medium">
                    🗺️ {eventData.location}
                  </div>
                )}
              </div>

              <p className="text-lg text-slate-600 mb-6">
                {dateInfo.full}
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Distanz Badge */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="text-sm font-medium text-slate-600 mb-2">Distanz</div>
            <div className="text-3xl font-bold text-emerald-600">
              {eventData.distance ? `${eventData.distance} km` : 'Nicht angegeben'}
            </div>
            {eventData.distance === 42.195 && (
              <div className="mt-2 text-sm text-slate-600">Marathon</div>
            )}
            {eventData.distance === 21.1 && (
              <div className="mt-2 text-sm text-slate-600">Halbmarathon</div>
            )}
          </div>

          {/* Stadt */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="text-sm font-medium text-slate-600 mb-2">Stadt</div>
            <div className="text-2xl font-bold text-slate-900">
              {eventData.city || eventData.location || 'Nicht angegeben'}
            </div>
          </div>

          {/* Link Button */}
          {eventData.link && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <div className="text-sm font-medium text-slate-600 mb-4">Offizielle Webseite</div>
              <a
                href={eventData.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-center shadow-sm"
              >
                Zur Webseite →
              </a>
            </div>
          )}
        </div>

        {/* Karte */}
        {eventData.lat !== null && eventData.lng !== null && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Lage</h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <EventMapClient
                events={[eventData]}
                center={[eventData.lat, eventData.lng]}
                zoom={13}
              />
            </div>
          </div>
        )}

        {/* Beschreibung (falls vorhanden) */}
        {eventData.description && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Beschreibung</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {eventData.description}
            </p>
          </div>
        )}

        {/* Weitere Infos */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Weitere Informationen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {eventData.category && (
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Kategorie</div>
                <div className="text-lg font-semibold text-slate-900">{eventData.category}</div>
              </div>
            )}
            {eventData.type && (
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Typ</div>
                <div className="text-lg font-semibold text-slate-900">{eventData.type}</div>
              </div>
            )}
            {eventData.price !== null && (
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Preis</div>
                <div className="text-lg font-semibold text-slate-900">
                  {eventData.price === 0 ? 'Kostenlos' : `${eventData.price} €`}
                </div>
              </div>
            )}
            {eventData.capacity !== null && (
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Kapazität</div>
                <div className="text-lg font-semibold text-slate-900">{eventData.capacity} Teilnehmer</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

