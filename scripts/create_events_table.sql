-- SQL-Skript zum Erstellen/Anpassen der Events-Tabelle in Supabase
-- Führe dies in der SQL Editor-Konsole deines Supabase-Dashboards aus

-- Erstelle Tabelle, falls sie nicht existiert
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  date DATE,
  distance NUMERIC(5,1),
  price INTEGER,
  capacity INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Füge fehlende Spalten hinzu (falls Tabelle bereits existiert)
DO $$ 
BEGIN
  -- category
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'category') THEN
    ALTER TABLE events ADD COLUMN category TEXT;
  END IF;
  
  -- title
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'title') THEN
    ALTER TABLE events ADD COLUMN title TEXT;
  END IF;
  
  -- description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'description') THEN
    ALTER TABLE events ADD COLUMN description TEXT;
  END IF;
  
  -- location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'location') THEN
    ALTER TABLE events ADD COLUMN location TEXT;
  END IF;
  
  -- date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'date') THEN
    ALTER TABLE events ADD COLUMN date DATE;
  END IF;
  
  -- distance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'distance') THEN
    ALTER TABLE events ADD COLUMN distance NUMERIC(5,1);
  END IF;
  
  -- price
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'price') THEN
    ALTER TABLE events ADD COLUMN price INTEGER;
  END IF;
  
  -- capacity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'capacity') THEN
    ALTER TABLE events ADD COLUMN capacity INTEGER;
  END IF;
  
  -- image_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;
  
  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'events' AND column_name = 'created_at') THEN
    ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Erstelle Indizes für bessere Performance (ignoriert Fehler, falls bereits existierend)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);

-- Aktiviere Row Level Security (RLS) - erlaubt öffentliche Lesezugriffe
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Lösche alte Policies falls vorhanden und erstelle neu
DROP POLICY IF EXISTS "Events sind öffentlich lesbar" ON events;
DROP POLICY IF EXISTS "Events können öffentlich erstellt werden" ON events;

CREATE POLICY "Events sind öffentlich lesbar" ON events
  FOR SELECT
  USING (true);

-- Policy: Erlaube das Einfügen von Events (für Seed-Skript und öffentliche Nutzung)
CREATE POLICY "Events können öffentlich erstellt werden" ON events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Erlaube das Aktualisieren von Events (für Geocoding und Updates)
CREATE POLICY "Events können öffentlich aktualisiert werden" ON events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
