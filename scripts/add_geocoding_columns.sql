-- SQL-Skript zum Hinzufügen von Geocoding-Spalten zur Events-Tabelle
-- Führe dies in der SQL Editor-Konsole deines Supabase-Dashboards aus

-- Füge Geocoding-Spalten hinzu, falls sie nicht existieren
DO $$ 
BEGIN
  -- lat (Breitengrad)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'lat') THEN
    ALTER TABLE events ADD COLUMN lat NUMERIC(10, 8);
  END IF;
  
  -- lng (Längengrad)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'lng') THEN
    ALTER TABLE events ADD COLUMN lng NUMERIC(11, 8);
  END IF;
  
  -- city (Stadt)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'city') THEN
    ALTER TABLE events ADD COLUMN city TEXT;
  END IF;
  
  -- raw_location_data (JSON mit vollständigen Geocoding-Daten - optional)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'raw_location_data') THEN
    ALTER TABLE events ADD COLUMN raw_location_data JSONB;
  END IF;
END $$;

-- Erstelle Index für bessere Performance bei Geocoding-Queries
CREATE INDEX IF NOT EXISTS idx_events_lat_null ON events(lat) WHERE lat IS NULL;

