#!/usr/bin/env python3
"""
Skript zum Scrapen von Marathon-Events von marathon.de und Import in Supabase
"""

import sys
import re
import time
import requests
from bs4 import BeautifulSoup
from utils import get_supabase_client, parse_german_date, clean_text

# Supabase-Verbindung
try:
    supabase = get_supabase_client()
    print("✓ Verbindung zu Supabase hergestellt")
except Exception as e:
    print(f"Fehler beim Verbinden mit Supabase: {e}")
    sys.exit(1)



def scrape_marathon_events(url, distance_km):
    """Scrapt Events von marathon.de
    
    Args:
        url: URL der zu scrapenden Seite
        distance_km: Distanz in km (z.B. '42km' oder '21km')
    """
    
    print(f"📡 Lade Seite: {url}")
    
    # WICHTIG: User-Agent setzen, um vollständiges HTML zu erhalten
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"⚠️ Fehler beim Laden von {url}: {e}")
        return []

    print("✓ Seite erfolgreich geladen")
    
    # Parse HTML mit BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')
    
    events = []
    distance_val = float(distance_km.replace('km', ''))
    
    # --- INTELLIGENTE DOM-SUCHE START ---
    print("📋 Versuche intelligente DOM-Suche (Datum -> Container -> Link)")

    # 1. Finde alle Text-Knoten, die wie ein Datum aussehen (DD.MM.YYYY)
    #    Wir nutzen regex direkt im find_all string argument
    date_pattern_str = re.compile(r'^\s*\d{2}\.\d{2}\.\d{4}\s*$')
    date_elements = soup.find_all(string=date_pattern_str)

    print(f"   Gefunden: {len(date_elements)} Datumseinträge im HTML-Baum")

    # --- DEBUGGING FÜR DEN ERSTEN TREFFER (nur wenn Probleme auftreten) ---
    if len(date_elements) > 0:
        example = date_elements[0]
        parent = example.parent
        print(f"   🔍 DEBUG Struktur: Datum '{example.strip()}' ist in <{parent.name} class='{parent.get('class')}'>")
    # ----------------------------------------------------------------------

    current_page_events = 0

    for date_el in date_elements:
        try:
            date_str = date_el.strip()
            
            # Wir gehen vom Datum aus nach oben, um den Container der Zeile/Box zu finden
            # Versuche verschiedene Parent-Elemente, auch mit Klassen
            container = None
            
            # Versuche zuerst ein spezifisches Parent-Element zu finden
            parent = date_el.parent
            if parent:
                # Gehe weitere Ebenen nach oben, um einen größeren Container zu finden
                # Der Container könnte ein div mit einer bestimmten Klasse sein, oder ein tr, li, etc.
                for level in range(5):  # Maximal 5 Ebenen nach oben
                    if not parent:
                        break
                    
                    # Prüfe ob dieses Element ein guter Container ist
                    parent_tag = parent.name
                    if parent_tag in ['tr', 'li', 'article', 'div', 'section']:
                        # Prüfe ob es Links enthält
                        if parent.find_all('a', href=True):
                            container = parent
                            break
                    
                    parent = parent.parent
            
            # Fallback: Nutze direkt den Parent des Datums
            if not container:
                container = date_el.find_parent(['tr', 'li', 'div', 'article', 'section', 'td'])
            
            if not container:
                continue

            # Suche ALLE Links in diesem Container
            links = container.find_all('a', href=True)
            
            valid_link = None
            name_candidate = None

            for link in links:
                link_text = link.get_text(strip=True)
                
                # Überspringe Links, die nur das Datum sind oder sehr kurz ("mehr")
                if link_text == date_str or len(link_text) < 3:
                    continue
                
                # Gefunden!
                valid_link = link
                
                # BESTIMME DEN NAMEN:
                # 1. Priorität: title-Attribut (oft vollständig, auch wenn Text abgeschnitten)
                title_attr = link.get('title', '').strip()
                
                if title_attr and len(title_attr) > len(link_text):
                    name_candidate = title_attr
                else:
                    name_candidate = link_text
                
                # Wir nehmen den ersten validen Link im Container
                break
            
            # Wenn kein Link gefunden wurde, versuchen wir Text im Container zu parsen (als Fallback)
            if not name_candidate:
                container_text = container.get_text(" ", strip=True)
                # Entferne Datum aus Text
                text_no_date = container_text.replace(date_str, "").strip()
                if len(text_no_date) > 5:
                    name_candidate = text_no_date.split("  ")[0] # Nimm den ersten Teil

            if not name_candidate:
                continue

            # Event bauen
            event_date = parse_german_date(date_str)
            if not event_date:
                continue

            # Bereinigung des Namens
            clean_name = re.sub(r'\s+', ' ', name_candidate).strip()
            
            # Link URL bauen
            link_url = ""
            if valid_link:
                link_url = valid_link['href']
                if link_url.startswith('/'):
                    link_url = f"https://www.marathon.de{link_url}"

            event_obj = {
                "name": clean_name,
                "date": event_date.strftime("%Y-%m-%d"),
                "location": None, # Wir lassen das leer, damit der Geocoder weiß: Hier muss ich ran
                "distance": distance_val, 
                "link": link_url,
                "type": "Laufen",
                "category": "Laufen"
            }

            # Duplikat-Check (in dieser Laufzeit)
            is_duplicate = any(e['name'] == event_obj['name'] and e['date'] == event_obj['date'] for e in events)
            
            if not is_duplicate:
                events.append(event_obj)
                current_page_events += 1

        except Exception as e:
            continue
    
    print(f"✓ {current_page_events} Events auf dieser Seite extrahiert")
    
    # Debug-Output: Zeige ersten 500 Zeichen des HTML-Body, falls nichts gefunden
    if not events:
        print("\n🔍 DEBUG: Erste 500 Zeichen des HTML-Body:")
        body = soup.find('body')
        if body:
            body_text = body.get_text()
            print(body_text[:500])
            print("...")
        else:
            html_text = str(soup)[:500]
            print(html_text)
            print("...")
    
    return events

def upsert_events(events):
    """Fügt Events in die Datenbank ein (Update or Insert)"""
    if not events:
        return 0
    
    print(f"\n💾 Füge {len(events)} Events in die Datenbank ein...")
    
    inserted_count = 0
    updated_count = 0
    error_count = 0
    
    for i, event in enumerate(events, 1):
        try:
            # Erstelle einen eindeutigen Identifier aus Name und Datum
            # Für Upsert nutzen wir eine Kombination aus Name und Datum
            event_name = event.get('name', '')
            event_date = event.get('date', '')
            
            # Prüfe, ob Event bereits existiert (basierend auf Name und Datum)
            existing = supabase.table('events')\
                .select('id')\
                .eq('name', event_name)\
                .eq('date', event_date)\
                .execute()
            
            # Bereite Event-Daten vor
            event_data = {
                'name': event.get('name'),
                'title': event.get('name'),  # Auch title setzen
                'type': event.get('type', 'Laufen'),
                'category': event.get('category', 'Laufen'),
                'location': event.get('location'),  # None wenn nicht vorhanden - Geocoder übernimmt
                'date': event.get('date'),
                'description': f"Marathon-Event: {event.get('name', '')}",
            }
            
            # Füge Distanz hinzu, falls vorhanden
            if event.get('distance'):
                event_data['distance'] = event.get('distance')
            
            # Setze optionale Felder, falls vorhanden
            if event.get('link'):
                if not event_data.get('description'):
                    event_data['description'] = ''
                event_data['description'] += f"\nLink: {event.get('link')}"
            
            if existing.data and len(existing.data) > 0:
                # Update bestehendes Event
                event_id = existing.data[0]['id']
                supabase.table('events')\
                    .update(event_data)\
                    .eq('id', event_id)\
                    .execute()
                updated_count += 1
                if i % 10 == 0:
                    print(f"  ✓ {i}/{len(events)} Events verarbeitet...")
            else:
                # Insert neues Event
                supabase.table('events')\
                    .insert(event_data)\
                    .execute()
                inserted_count += 1
                if i % 10 == 0:
                    print(f"  ✓ {i}/{len(events)} Events verarbeitet...")
            
            # Höflich zum Server: kurze Pause
            time.sleep(0.5)
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ Fehler bei Event {i} ({event.get('name', 'Unbekannt')}): {e}")
    
    print(f"\n✅ Fertig:")
    print(f"  • {inserted_count} neue Events eingefügt")
    print(f"  • {updated_count} Events aktualisiert")
    if error_count > 0:
        print(f"  • {error_count} Fehler")
    
    return inserted_count + updated_count

def main():
    """Hauptfunktion"""
    print("\n🚀 Starte Scraping von Marathon.de...\n")
    
    all_events = []
    
    # Scrape Marathon-Events (42km)
    print("🏃 Scrape Marathon-Events (42km)...")
    marathon_events = scrape_marathon_events('https://www.marathon.de/marathon', '42km')
    if marathon_events:
        print(f"✓ Gefunden: {len(marathon_events)} Marathon-Events\n")
        all_events.extend(marathon_events)
    else:
        print("⚠️  Keine Marathon-Events gefunden\n")
    
    # Kurze Pause zwischen Requests
    time.sleep(1)
    
    # Scrape Halbmarathon-Events (21km)
    print("🏃 Scrape Halbmarathon-Events (21km)...")
    halbmarathon_events = scrape_marathon_events('https://www.marathon.de/halbmarathon', '21km')
    if halbmarathon_events:
        print(f"✓ Gefunden: {len(halbmarathon_events)} Halbmarathon-Events\n")
        all_events.extend(halbmarathon_events)
    else:
        print("⚠️  Keine Halbmarathon-Events gefunden\n")
    
    if not all_events:
        print("\n⚠️  Keine Events gefunden. Möglicherweise hat sich die Struktur der Website geändert.")
        print("   Bitte überprüfe die Seite manuell oder passe die Selektoren an.")
        return
    
    print(f"\n📊 Gesamt gefunden: {len(all_events)} Events")
    
    # Zeige erste paar Events als Beispiel mit vollständigen Namen
    if all_events:
        print("\n📋 Erste Events (Beispiel) - Vollständige Namen:")
        for event in all_events[:3]:
            distance_str = f"{event.get('distance', 'N/A')}km" if event.get('distance') else 'N/A'
            event_name = event.get('name', 'N/A')
            print(f"  • {event.get('date')} - {event_name} ({event.get('location', 'N/A')}) - {distance_str}")
    
    # Füge Events in die Datenbank ein
    total_imported = upsert_events(all_events)
    
    print(f"\n✨ Erfolgreich {total_imported} Events von Marathon.de importiert\n")

if __name__ == '__main__':
    main()

