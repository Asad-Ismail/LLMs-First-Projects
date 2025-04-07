-- Airline Route Ranker Supabase Schema
-- This schema defines the tables needed to store flight route and reliability data

-- Enable RLS (Row Level Security)
-- ALTER TABLE IF EXISTS flight_routes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS flight_delay_historical DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS flight_delay_recent DISABLE ROW LEVEL SECURITY;

-- Create EXTENSION for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS flight_routes;
DROP TABLE IF EXISTS flight_delay_historical;
DROP TABLE IF EXISTS flight_delay_recent;

-- ===== FLIGHT ROUTES TABLE =====
-- Stores flight route information between origin and destination airports
CREATE TABLE flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    route_date DATE NOT NULL,
    route_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Composite key to ensure uniqueness of route + date combo
    UNIQUE(origin_iata, destination_iata, route_date)
);

-- Create index for faster lookups
CREATE INDEX idx_flight_routes_origin_destination ON flight_routes(origin_iata, destination_iata);
CREATE INDEX idx_flight_routes_route_date ON flight_routes(route_date);

-- Comment on table
COMMENT ON TABLE flight_routes IS 'Stores flight route information between airports';

-- ===== FLIGHT DELAY HISTORICAL TABLE =====
-- Stores historical flight delay data from AeroDataBox API
CREATE TABLE flight_delay_historical (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(10) NOT NULL,
    delay_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure uniqueness of flight numbers
    UNIQUE(flight_number)
);

-- Create index for faster lookups
CREATE INDEX idx_flight_delay_historical_flight_number ON flight_delay_historical(flight_number);

-- Comment on table
COMMENT ON TABLE flight_delay_historical IS 'Stores historical flight delay data';

-- ===== FLIGHT DELAY RECENT TABLE =====
-- Stores recent flight data from AeroDataBox API
CREATE TABLE flight_delay_recent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(10) NOT NULL,
    week_year VARCHAR(10) NOT NULL, -- Format: YYYY-WW (year-week number)
    flight_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Composite key to ensure uniqueness of flight_number + week_year combo
    UNIQUE(flight_number, week_year)
);

-- Create index for faster lookups
CREATE INDEX idx_flight_delay_recent_flight_number ON flight_delay_recent(flight_number);
CREATE INDEX idx_flight_delay_recent_week_year ON flight_delay_recent(week_year);

-- Comment on table
COMMENT ON TABLE flight_delay_recent IS 'Stores recent flight data';

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at timestamp
CREATE TRIGGER update_flight_routes_updated_at
BEFORE UPDATE ON flight_routes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_delay_historical_updated_at
BEFORE UPDATE ON flight_delay_historical
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_delay_recent_updated_at
BEFORE UPDATE ON flight_delay_recent
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 