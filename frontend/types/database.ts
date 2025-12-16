/**
 * Event-Interface basierend auf der Supabase events-Tabelle
 */
export interface Event {
  id: string
  name: string | null
  title: string | null
  description: string | null
  category: string | null
  type: string | null
  location: string | null
  city: string | null
  date: string | null
  distance: number | null
  price: number | null
  capacity: number | null
  image_url: string | null
  link: string | null
  lat: number | null
  lng: number | null
  raw_location_data: any | null
  created_at: string | null
}

