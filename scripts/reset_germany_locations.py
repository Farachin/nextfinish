#!/usr/bin/env python3
"""
Einmaliges Skript: Setzt alle "Deutschland" Locations auf None,
damit der Geocoder diese Events neu verarbeiten kann.
"""

from utils import get_supabase_client

supabase = get_supabase_client()

print("🔄 Setze alle 'Deutschland' Locations auf None...")

# Update alle Events mit location='Deutschland' auf None
response = supabase.table('events')\
    .update({"location": None})\
    .eq("location", "Deutschland")\
    .execute()

print(f"✓ {len(response.data) if response.data else 0} Events aktualisiert.")
print("   Diese Events werden beim nächsten Geocoding-Lauf neu verarbeitet.")

