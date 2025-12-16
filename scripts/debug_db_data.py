#!/usr/bin/env python3
"""
Debug-Skript: Prüft Events in der Datenbank auf Geodaten
"""

from utils import get_supabase_client

supabase = get_supabase_client()

print("🔍 Prüfe Events in der Datenbank...\n")

# Lade alle Events
response = supabase.table('events').select('*').execute()
all_events = response.data

print(f"📊 Gesamt: {len(all_events)} Events in der Datenbank\n")

# Prüfe erste 5 Events
print("=" * 60)
print("ERSTE 5 EVENTS:")
print("=" * 60)

for i, event in enumerate(all_events[:5], 1):
    print(f"\n{i}. {event.get('name', 'N/A')}")
    print(f"   Lat: {event.get('lat')}")
    print(f"   Lng: {event.get('lng')}")
    print(f"   City: {event.get('city')}")
    print(f"   Location: {event.get('location')}")

# Zähle Events mit Koordinaten
events_with_coords = [
    e for e in all_events 
    if e.get('lat') is not None and e.get('lng') is not None
]

events_without_coords = [
    e for e in all_events 
    if e.get('lat') is None or e.get('lng') is None
]

print("\n" + "=" * 60)
print("STATISTIK:")
print("=" * 60)
print(f"✅ Events MIT Koordinaten (lat IS NOT NULL): {len(events_with_coords)}")
print(f"❌ Events OHNE Koordinaten: {len(events_without_coords)}")

if events_with_coords:
    print(f"\n📍 Beispiel Event MIT Koordinaten:")
    example = events_with_coords[0]
    print(f"   Name: {example.get('name')}")
    print(f"   Lat: {example.get('lat')} (Typ: {type(example.get('lat'))})")
    print(f"   Lng: {example.get('lng')} (Typ: {type(example.get('lng'))})")

if events_without_coords:
    print(f"\n⚠️  Beispiel Event OHNE Koordinaten:")
    example = events_without_coords[0]
    print(f"   Name: {example.get('name')}")
    print(f"   Lat: {example.get('lat')}")
    print(f"   Lng: {example.get('lng')}")

