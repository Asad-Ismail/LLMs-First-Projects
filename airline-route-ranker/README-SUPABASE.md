# Setting Up Supabase for Airport Route Ranker

This document provides instructions for setting up Supabase as a database backend for the Airport Route Ranker application.

## Overview

Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, instant APIs, and realtime subscriptions. We'll use it to store our airport data and potentially flight data in the future.

## Prerequisites

- A Supabase account (free tier is sufficient to start)
- Node.js and npm (already installed for this project)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/) and sign up or log in
2. Create a new project and give it a name (e.g., "airline-route-ranker")
3. Choose a strong database password and save it securely
4. Select a region close to your target audience
5. Wait for your database to be provisioned (usually a few minutes)

## Step 2: Set Up Tables

Once your project is ready, you'll need to set up the database tables. Here's the schema for the airports table:

```sql
CREATE TABLE airports (
  id SERIAL PRIMARY KEY,
  iata TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add a text search index
CREATE INDEX airports_search_idx ON airports USING GIN (
  to_tsvector('english', iata || ' ' || name || ' ' || city || ' ' || country)
);

-- Example: Add a few airports
INSERT INTO airports (iata, name, city, country)
VALUES 
  ('LHR', 'Heathrow Airport', 'London', 'United Kingdom'),
  ('JFK', 'John F. Kennedy International Airport', 'New York', 'United States'),
  ('LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States');
```

You can run this SQL in the Supabase SQL Editor.

## Step 3: Import Airport Data

For a complete dataset, you can import the airport data from our seed file:

1. Go to the Supabase Table Editor
2. Select the "airports" table
3. Click "Import Data"
4. Choose CSV format and upload the provided `airports.csv` file 
   (You can convert the data in `frontend/src/lib/data/airports.ts` to CSV format)

## Step 4: Set Up Row Level Security (Optional but Recommended)

To secure your data, you may want to set up Row Level Security policies:

```sql
-- Enable RLS on the airports table
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read airport data
CREATE POLICY "Allow public read access to airports" 
  ON airports FOR SELECT USING (true);

-- If you add authenticated users later, you can add more policies
```

## Step 5: Integrate Supabase with the Frontend

1. Install the Supabase client in your project:

```bash
cd frontend
npm install @supabase/supabase-js
```

2. Create a `.env` file in the `frontend` directory:

```
PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

You can find these values in your Supabase project settings.

3. Update the `frontend/src/lib/utils/airportDataService.ts` file:
   - Change `USE_LOCAL_DATA` to `false`
   - Uncomment the Supabase implementation code
   - Initialize the Supabase client

## Usage

Once set up, the application will use Supabase to:

1. Fetch airport data for the autocomplete dropdown
2. Perform fuzzy search on airport names and codes
3. Store and retrieve flight ranking data (future implementation)

## Future Enhancements

- Add user authentication to save favorite routes
- Store search history for users
- Create a flight data table to store historical flight performance
- Implement real-time updates for flight statuses

---

For any questions or issues, please create a GitHub issue or contact the project maintainers. 