#!/usr/bin/env python3
"""
Geocoding-Skript: Findet Koordinaten für Events ohne Location-Daten
Nutzt Nominatim (OpenStreetMap) API
"""

import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from utils import get_supabase_client

# Setup
supabase = get_supabase_client()
geolocator = Nominatim(user_agent="nextfinish_scraper_v1")

def geocode_missing_events():
    print("🌍 Starte Geocoding für Events ohne Koordinaten...")
    
    # 1. Hole alle Events, die noch keine Koordinaten haben (lat is NULL)
    response = supabase.table('events').select("*").is_('lat', 'null').execute()
    events_to_process = response.data
    
    print(f"   Gefunden: {len(events_to_process)} Events ohne Ort.")
    
    if len(events_to_process) == 0:
        print("   ✓ Alle Events haben bereits Koordinaten.")
        return
    
    count = 0
    for event in events_to_process:
        event_name = event.get('name', '')
        event_id = event['id']
        
        print(f"\n📍 Suche Geodaten für: '{event_name}' (ID: {event_id})")

        # --- VERBESSERTE STRATEGIE ---
        search_queries = []
        
        # 1. Versuch: Der exakte Name (falls das Event als POI existiert)
        search_queries.append(event_name)

        # Vorbereitung für intelligente Suche: Name zerlegen
        parts = event_name.replace("-", " ").split()
        
        # Blacklist für Wörter, die KEINE Städte sind
        ignore_terms = [
            "marathon", "halbmarathon", "lauf", "triathlon", "ultra", "run", "city", 
            "firma", "firmenlauf", "nachtlauf", "silvesterlauf", "neujahrslauf", 
            "ev", "e.v.", "gmbh", "international", "internationaler", "den", "der", "die", "das",
            "winter", "sommer", "frühling", "herbst", "cross", "trail", "cup"
        ]
        
        # Bereinige den Namen um diese Begriffe und Zahlen
        potential_places = [
            p for p in parts 
            if p.lower() not in ignore_terms 
            and not p.isdigit() 
            and len(p) > 2
        ]

        # 2. Versuch: Alle "Nicht-Lauf-Wörter" zusammen (z.B. "Wintermarathon Leipzig" -> "Leipzig")
        if potential_places:
            cleaned_query = " ".join(potential_places)
            if cleaned_query != event_name:
                search_queries.append(cleaned_query)

        # 3. Versuch: Das letzte Wort (oft die Stadt bei "X-Lauf Stadt")
        if len(parts) > 1:
            search_queries.append(parts[-1])

        # 4. Versuch: Das erste Wort (Klassiker "Berlin Marathon")
        if len(parts) > 1:
            search_queries.append(parts[0])

        # Duplikate entfernen, Reihenfolge behalten
        unique_queries = []
        [unique_queries.append(x) for x in search_queries if x not in unique_queries]
        
        location = None
        for query in unique_queries:
            # Sicherheits-Check: Nicht nach leeren Strings oder "Marathon" pur suchen
            if len(query) < 3: 
                continue
            
            try:
                # Rate Limit
                time.sleep(1.1) 
                
                # Fokus auf DACH-Region (viewbox ist optional, aber 'countrycodes' hilft)
                # Wir suchen global, aber bevorzugen deutschsprachige Ergebnisse
                location = geolocator.geocode(query, language="de", addressdetails=True)
                
                if location:
                    print(f"   ✅ Gefunden via '{query}': {location.address}")
                    break 
                else:
                    print(f"   ❌ Nicht gefunden via '{query}'")
            except Exception as e:
                print(f"   ⚠️ Fehler bei Anfrage '{query}': {e}")
        
        # Update in Datenbank
        if location:
            address = location.raw.get('address', {})
            update_data = {
                "lat": location.latitude,
                "lng": location.longitude,
                # Wir versuchen, die Stadt sauber zu extrahieren
                "city": address.get('city') or address.get('town') or address.get('state') or address.get('village'),
                "location": location.address, # Wir überschreiben das alte "Deutschland" mit der echten Adresse
            }
            
            # Optional: raw_location_data speichern (nur wenn Spalte existiert)
            try:
                update_data["raw_location_data"] = location.raw
            except:
                pass  # Spalte existiert möglicherweise nicht
            
            try:
                result = supabase.table('events').update(update_data).eq('id', event_id).execute()
                if result.data and len(result.data) > 0:
                    count += 1
                else:
                    print(f"   ⚠️  Warnung: Update für Event {event_id} - keine Daten zurückgegeben")
            except Exception as e:
                print(f"   ❌ Fehler beim Update: {e}")
                print(f"      Event ID: {event_id}, Update Data: {update_data}")
        else:
            print("   🏳️  Aufgegeben. Kein Ort gefunden.")
            # Optional: Markieren, damit wir nicht immer wieder suchen (z.B. lat=0 setzen)

    print(f"\n🏁 Fertig. {count}/{len(events_to_process)} Events geocodiert.")

if __name__ == "__main__":
    geocode_missing_events()

