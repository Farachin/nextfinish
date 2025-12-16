'use client'

import dynamic from 'next/dynamic'
import { Event } from '@/types/database'

// Dynamischer Import der Map-Komponente (SSR deaktiviert)
const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-slate-200 flex items-center justify-center border border-slate-300">
      <p className="text-slate-600">Karte wird geladen...</p>
    </div>
  ),
})

interface EventMapClientProps {
  events: Event[]
  center?: [number, number]
  zoom?: number
}

export default function EventMapClient({ events, center, zoom }: EventMapClientProps) {
  return <EventMap events={events} center={center} zoom={zoom} />
}

