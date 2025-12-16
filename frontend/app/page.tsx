import { supabase } from '@/lib/supabase'
import { Event } from '@/types/database'
import EventDashboard from '@/components/EventDashboard'

export default async function Home() {
  // Lade Events server-seitig
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error loading events:', error)
  }

  const eventsList: Event[] = events || []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-3xl">🏃</span>
            NextFinish
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventDashboard initialEvents={eventsList} />
      </main>
    </div>
  )
}
