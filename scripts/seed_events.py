#!/usr/bin/env python3
"""
Skript zum Befüllen der Supabase-Datenbank mit Test-Events
"""

import sys
from datetime import datetime, timedelta
import random
from faker import Faker
from utils import get_supabase_client

# Initialisiere Faker mit deutschem Locale
fake = Faker('de_DE')

# Supabase-Verbindung
try:
    supabase = get_supabase_client()
    print("✓ Verbindung zu Supabase hergestellt")
except Exception as e:
    print(f"Fehler beim Verbinden mit Supabase: {e}")
    sys.exit(1)

# Deutsche Städte
DEUTSCHE_STAEDTE = [
    "Berlin", "München", "Hamburg", "Köln", "Frankfurt am Main",
    "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig",
    "Bremen", "Dresden", "Hannover", "Nürnberg", "Duisburg",
    "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster",
    "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Gelsenkirchen",
    "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen",
    "Halle", "Magdeburg", "Freiburg im Breisgau", "Krefeld", "Lübeck",
    "Oberhausen", "Erfurt", "Mainz", "Rostock", "Kassel",
    "Hagen", "Hamm", "Saarbrücken", "Mülheim an der Ruhr", "Potsdam",
    "Ludwigshafen am Rhein", "Oldenburg", "Osnabrück", "Leverkusen", "Heidelberg"
]

# Event-Typen mit Verteilung
EVENT_TYPES = {
    'Laufen': {
        'weight': 40,
        'distance_ranges': [
            (5, 10, '5 km City-Lauf'),
            (10, 21, '10 km Volkslauf'),
            (21, 42, 'Halbmarathon'),
            (42, 43, 'Marathon'),
            (5, 10, '10 km Nachtlauf'),
        ],
        'price_range': (15, 89),
    },
    'Rad': {
        'weight': 20,
        'distance_ranges': [
            (40, 60, 'Radmarathon 50 km'),
            (60, 100, 'Century Ride 100 km'),
            (100, 160, 'Gravel Challenge'),
            (160, 200, 'Ultradistanz'),
        ],
        'price_range': (25, 129),
    },
    'Marsch': {
        'weight': 20,
        'distance_ranges': [
            (20, 30, 'Volksmarsch'),
            (30, 50, 'Militärmarsch'),
            (50, 100, 'Ultramarsch'),
            (100, 160, '24h-Marsch'),
        ],
        'price_range': (10, 79),
    },
    'Obstacle': {
        'weight': 20,
        'distance_ranges': [
            (5, 8, 'Spartan Sprint'),
            (10, 15, 'Tough Mudder'),
            (15, 21, 'Spartan Super'),
            (21, 25, 'Ultra Challenge'),
        ],
        'price_range': (49, 149),
    }
}

def generate_event_type():
    """Generiert Event-Typ basierend auf Gewichtung"""
    types = []
    for event_type, config in EVENT_TYPES.items():
        types.extend([event_type] * config['weight'])
    return random.choice(types)

def generate_event_date(start_year=2025):
    """Generiert ein zufälliges Datum in 2025/2026"""
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(2026, 12, 31)
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_date = start_date + timedelta(days=random_days)
    return random_date.strftime('%Y-%m-%d')

def generate_capacity():
    """Generiert Capacity, manche fast ausgebucht (>90%), manche leer"""
    if random.random() < 0.3:  # 30% fast ausgebucht
        return random.randint(91, 100)
    elif random.random() < 0.4:  # 40% mittelvoll
        return random.randint(50, 90)
    else:  # 30% leer/mit vielen Plätzen
        return random.randint(10, 49)

def generate_event(event_type: str):
    """Generiert ein einzelnes Event"""
    config = EVENT_TYPES[event_type]
    
    # Distanz basierend auf Typ
    distance_range = random.choice(config['distance_ranges'])
    distance = round(random.uniform(distance_range[0], distance_range[1]), 1)
    base_title = distance_range[2] if len(distance_range) > 2 else f"{event_type}-Event"
    
    # Titel generieren
    title_prefixes = {
        'Laufen': ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'International', 'City', 'Nacht'],
        'Rad': ['Bike', 'Rad', 'Cycling', 'Gravel', 'Mountain', 'Road', 'E-Bike'],
        'Marsch': ['Volksmarsch', 'Militärmarsch', 'Stadtmarsch', 'Nachtmarsch', 'Extremmarsch'],
        'Obstacle': ['Spartan', 'Tough Mudder', 'Warrior', 'Zombie Run', 'Mud', 'Extreme']
    }
    
    city = random.choice(DEUTSCHE_STAEDTE)
    prefix = random.choice(title_prefixes.get(event_type, ['Event']))
    
    title = f"{prefix} {city}" if random.random() > 0.5 else f"{city} {base_title}"
    
    # Beschreibung
    descriptions = {
        'Laufen': [
            f"Ein anspruchsvoller {distance} km Lauf durch die wunderschöne Stadt {city}. Perfekt für Läufer aller Levels.",
            f"Erlebe {city} beim Laufen! {distance} km durch die historischen und modernen Viertel der Stadt.",
            f"Der ultimative Lauf-Event in {city}. {distance} km voller Herausforderungen und Spaß.",
        ],
        'Rad': [
            f"{distance} km Radtour durch die malerische Landschaft um {city}. Für Rennrad- und Gravel-Fans.",
            f"Erkunde {city} auf zwei Rädern! {distance} km durch Stadt und Natur.",
            f"Die perfekte Rad-Challenge in {city}. {distance} km Strecke für alle Radbegeisterten.",
        ],
        'Marsch': [
            f"Ein traditioneller Volksmarsch in {city}. {distance} km für alle, die wandern und marschieren lieben.",
            f"Herausforderung in {city}: {distance} km Marsch durch abwechslungsreiches Terrain.",
            f"Der ultimative Marsch-Event in {city}. {distance} km voller Entdeckungen.",
        ],
        'Obstacle': [
            f"Mud, Fun und Herausforderungen in {city}! {distance} km voller Hindernisse und Spaß.",
            f"Der härteste Obstacle-Lauf in {city}. {distance} km, zahlreiche Hindernisse, unvergessliche Erlebnisse.",
            f"Überwinde dich selbst in {city}! {distance} km Obstacle-Run mit spektakulären Hindernissen.",
        ]
    }
    
    description = random.choice(descriptions[event_type])
    
    # Preis
    price_min, price_max = config['price_range']
    price = random.randint(price_min, price_max)
    
    # Datum
    date = generate_event_date()
    
    # Capacity
    capacity = generate_capacity()
    
    return {
        'name': title,  # Falls die Tabelle 'name' statt 'title' erwartet
        'title': title,
        'description': description,
        'type': event_type,  # Falls die Tabelle 'type' statt 'category' erwartet
        'category': event_type,
        'location': city,
        'date': date,
        'distance': distance,
        'price': price,
        'capacity': capacity,
    }

def main():
    """Hauptfunktion"""
    print("\n🚀 Starte Seed-Prozess für Events...\n")
    
    try:
        # 1. Lösche alle alten Events
        print("🗑️  Lösche alte Events aus der Datenbank...")
        delete_response = supabase.table('events').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("✓ Alte Events gelöscht\n")
    except Exception as e:
        print(f"⚠️  Warnung beim Löschen alter Events: {e}")
        print("  (Möglicherweise existiert die Tabelle noch nicht oder ist leer)\n")
    
    # 2. Generiere 50 Events
    print("📝 Generiere 50 Events...")
    events = []
    for i in range(50):
        event_type = generate_event_type()
        event = generate_event(event_type)
        events.append(event)
        
        if (i + 1) % 10 == 0:
            print(f"  ✓ {i + 1}/50 Events generiert")
    
    print(f"✓ Alle 50 Events generiert\n")
    
    # 3. Füge Events in die Datenbank ein
    print("💾 Füge Events in die Datenbank ein...")
    
    # Teile in Batches von 50 (Supabase-Limit beachten)
    batch_size = 50
    total_inserted = 0
    
    for i in range(0, len(events), batch_size):
        batch = events[i:i + batch_size]
        try:
            response = supabase.table('events').insert(batch).execute()
            inserted_count = len(response.data) if response.data else len(batch)
            total_inserted += inserted_count
            print(f"  ✓ Batch {i // batch_size + 1}: {inserted_count} Events eingefügt")
        except Exception as e:
            print(f"  ✗ Fehler beim Einfügen von Batch {i // batch_size + 1}: {e}")
            print(f"    Details: {str(e)}")
    
    # 4. Zusammenfassung
    print(f"\n✅ Fertig! {total_inserted} Events erfolgreich in die Datenbank eingefügt.")
    
    # Statistiken
    category_counts = {}
    for event in events:
        category = event['category']
        category_counts[category] = category_counts.get(category, 0) + 1
    
    print("\n📊 Verteilung nach Kategorie:")
    for category, count in sorted(category_counts.items()):
        percentage = (count / len(events)) * 100
        print(f"  • {category}: {count} Events ({percentage:.0f}%)")
    
    print("\n✨ Seed-Prozess abgeschlossen!\n")

if __name__ == '__main__':
    main()

