"""
Gemeinsame Utility-Funktionen für Scraping-Skripte
"""
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Lade Umgebungsvariablen aus .env.local (falls vorhanden)
# In GitHub Actions werden die Variablen direkt als Environment-Variablen gesetzt
load_dotenv('.env.local', override=False)


def get_supabase_client():
    """
    Erstellt und gibt einen Supabase-Client zurück.
    Nutzt Umgebungsvariablen aus .env.local oder direkte Environment-Variablen.
    """
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not url or not key:
        raise ValueError('NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY nicht gefunden. '
                        'Bitte setze diese als Umgebungsvariablen oder in .env.local')
    
    return create_client(url, key)


def parse_german_date(date_str):
    """
    Parst deutsches Datum (DD.MM.YYYY) und gibt datetime-Objekt zurück.
    
    Args:
        date_str: Datums-String im Format DD.MM.YYYY
    
    Returns:
        datetime-Objekt oder None bei Fehler
    """
    try:
        # Bereinige den String
        date_str = date_str.strip()
        # Entferne mögliche zusätzliche Zeichen
        date_str = re.sub(r'[^\d.]', '', date_str)
        return datetime.strptime(date_str, '%d.%m.%Y')
    except (ValueError, AttributeError):
        return None


def clean_text(text):
    """
    Bereinigt Text von überflüssigen Leerzeichen und normalisiert Whitespace.
    
    Args:
        text: Zu bereinigender Text
    
    Returns:
        Bereinigter Text-String
    """
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text).strip())

