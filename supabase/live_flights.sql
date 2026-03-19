-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS public.live_flights (
  icao24        TEXT PRIMARY KEY,
  callsign      TEXT,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  altitude      DOUBLE PRECISION,          -- metres
  velocity      DOUBLE PRECISION,          -- m/s
  heading       DOUBLE PRECISION,          -- degrees
  on_ground     BOOLEAN DEFAULT FALSE,
  squawk        TEXT,
  aircraft_type TEXT,
  registration  TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Full replica identity so DELETE events carry the row data
ALTER TABLE public.live_flights REPLICA IDENTITY FULL;

-- Public flight tracking data — no sensitive information, disable RLS
ALTER TABLE public.live_flights DISABLE ROW LEVEL SECURITY;

-- Add to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_flights;
