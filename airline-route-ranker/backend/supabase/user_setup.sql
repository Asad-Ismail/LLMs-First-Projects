-- User Authentication and Data Tables for Airline Route Ranker
-- This file extends the base schema with user-specific tables

-- Note: Supabase already provides auth.users table with built-in authentication
-- These tables will extend the functionality for our application

-- ===== USER PROFILES TABLE =====
-- Stores additional user information beyond what auth.users provides
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    travel_class VARCHAR(50) DEFAULT 'ECONOMY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ===== USER SAVED ROUTES TABLE =====
-- Allows users to save favorite or frequently checked routes
CREATE TABLE user_saved_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    route_data JSONB,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for lookup
CREATE INDEX idx_user_saved_routes_user_id ON user_saved_routes(user_id);
CREATE INDEX idx_user_saved_routes_airports ON user_saved_routes(origin_iata, destination_iata);

-- Create RLS policies for user_saved_routes
ALTER TABLE user_saved_routes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own saved routes
CREATE POLICY "Users can view their own saved routes"
ON user_saved_routes FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved routes
CREATE POLICY "Users can insert their own saved routes"
ON user_saved_routes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own saved routes
CREATE POLICY "Users can update their own saved routes"
ON user_saved_routes FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own saved routes
CREATE POLICY "Users can delete their own saved routes"
ON user_saved_routes FOR DELETE
USING (auth.uid() = user_id);

-- ===== USER SEARCH HISTORY TABLE =====
-- Tracks user search history for analytics and quick access
CREATE TABLE user_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    search_date DATE,
    search_params JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for lookup
CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_created_at ON user_search_history(created_at);

-- Create RLS policies for user_search_history
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own search history
CREATE POLICY "Users can view their own search history"
ON user_search_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own search history
CREATE POLICY "Users can insert their own search history"
ON user_search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own search history
CREATE POLICY "Users can delete their own search history"
ON user_search_history FOR DELETE
USING (auth.uid() = user_id);

-- Update trigger functions
-- This ensures all tables with updated_at column get it updated
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_saved_routes_updated_at ON user_saved_routes;
CREATE TRIGGER update_user_saved_routes_updated_at
BEFORE UPDATE ON user_saved_routes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE user_profiles IS 'User profile information for Airline Route Ranker users';
COMMENT ON TABLE user_saved_routes IS 'Saved routes for quick access by users';
COMMENT ON TABLE user_search_history IS 'History of user searches for analytics and quick access'; 