#!/usr/bin/env python3
"""
Set up Supabase database tables for the Airline Route Ranker application.
This script executes the SQL schema to create the necessary tables for storing flight route and reliability data.
"""
import os
import time
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Add the parent directory to the path for imports
sys.path.append(str(Path(__file__).parent.parent))

def main():
    """Main function to set up the Supabase database."""
    print("🚀 Airline Route Ranker - Supabase Database Setup")
    print("------------------------------------------------")
    
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
        return False
    
    # Read the schema file
    schema_file = os.path.join(os.path.dirname(__file__), "supabase_schema.sql")
    if not os.path.exists(schema_file):
        print(f"❌ Error: Schema file not found: {schema_file}")
        return False
    
    with open(schema_file, "r") as f:
        schema_sql = f.read()
    
    print("🔄 Setting up Supabase database tables...")
    
    try:
        # Initialize Supabase connection
        supabase = create_client(supabase_url, supabase_key)
        
        # Execute the schema SQL
        print("Executing SQL schema...")
        result = supabase.rpc('exec_sql', {"sql": schema_sql}).execute()
        
        print("✅ Successfully set up Supabase database tables.")
        return True
    except Exception as e:
        print(f"❌ Error setting up Supabase database: {e}")
        print("\nInstructions for manual setup:")
        print("1. Go to the Supabase dashboard (https://app.supabase.io)")
        print("2. Navigate to your project > SQL Editor")
        print("3. Copy and paste the contents of supabase_schema.sql")
        print("4. Execute the SQL manually")
        return False

def migrate_existing_cache():
    """Migrate existing pickle cache data to Supabase."""
    from app.utils.supabase_client import (
        save_flight_route_data, save_historical_flight_data, save_recent_flight_data
    )
    import pickle
    import re
    
    print("\n📦 Starting migration of existing cache data...")
    
    # Define cache directories
    cache_dir = Path(__file__).parent.parent / "cache"
    routes_dir = cache_dir / "routes"
    flights_dir = cache_dir / "flights"
    
    # Check if cache directories exist
    if not cache_dir.exists():
        print("No cache directory found, skipping migration.")
        return False
    
    # Migrate route data
    if routes_dir.exists():
        print("\n🛫 Migrating flight routes...")
        route_files = list(routes_dir.glob("*.pkl"))
        print(f"Found {len(route_files)} route cache files.")
        
        for route_file in route_files:
            try:
                # Extract origin, destination, and date from filename
                filename = route_file.stem
                match = re.match(r"([A-Z]{3})-([A-Z]{3})-(\d{4}-\d{2}-\d{2})", filename)
                
                if not match:
                    print(f"⚠️ Skipping file with invalid format: {filename}")
                    continue
                    
                origin, destination, date = match.groups()
                
                # Load the pickle file
                with open(route_file, "rb") as f:
                    cached_data = pickle.load(f)
                
                # Get the result data
                result = cached_data.get('result')
                if result is None:
                    print(f"⚠️ No result data found in {filename}")
                    continue
                
                # Save to Supabase
                print(f"Migrating route {origin}-{destination} on {date}...")
                save_flight_route_data(origin, destination, date, result)
                print(f"✅ Migrated {filename}")
            except Exception as e:
                print(f"❌ Error migrating route file {route_file.name}: {e}")
    else:
        print("No routes directory found, skipping route migration.")
    
    # Migrate historical flight data
    if flights_dir.exists():
        print("\n✈️ Migrating historical flight data...")
        historical_files = list(flights_dir.glob("historical_*.pkl"))
        print(f"Found {len(historical_files)} historical flight cache files.")
        
        for hist_file in historical_files:
            try:
                # Extract flight number from filename
                filename = hist_file.stem
                match = re.match(r"historical_([A-Z0-9]+)", filename)
                
                if not match:
                    print(f"⚠️ Skipping file with invalid format: {filename}")
                    continue
                    
                flight_number = match.group(1)
                
                # Load the pickle file
                with open(hist_file, "rb") as f:
                    cached_data = pickle.load(f)
                
                # Get the result data
                result = cached_data.get('result')
                if result is None:
                    print(f"⚠️ No result data found in {filename}")
                    continue
                
                # Save to Supabase
                print(f"Migrating historical data for {flight_number}...")
                save_historical_flight_data(flight_number, result)
                print(f"✅ Migrated {filename}")
            except Exception as e:
                print(f"❌ Error migrating historical file {hist_file.name}: {e}")
        
        print("\n✈️ Migrating recent flight data...")
        recent_files = list(flights_dir.glob("recent_*.pkl"))
        print(f"Found {len(recent_files)} recent flight cache files.")
        
        for recent_file in recent_files:
            try:
                # Extract flight number and week-year from filename
                filename = recent_file.stem
                match = re.match(r"recent_([A-Z0-9]+)_(\d{4}-\d{2})", filename)
                
                if not match:
                    print(f"⚠️ Skipping file with invalid format: {filename}")
                    continue
                    
                flight_number, week_year = match.groups()
                
                # Load the pickle file
                with open(recent_file, "rb") as f:
                    cached_data = pickle.load(f)
                
                # Get the result data
                result = cached_data.get('result')
                if result is None:
                    print(f"⚠️ No result data found in {filename}")
                    continue
                
                # Save to Supabase
                print(f"Migrating recent data for {flight_number} (week {week_year})...")
                save_recent_flight_data(flight_number, week_year, result)
                print(f"✅ Migrated {filename}")
            except Exception as e:
                print(f"❌ Error migrating recent file {recent_file.name}: {e}")
    else:
        print("No flights directory found, skipping flight data migration.")
    
    print("\n🎉 Migration completed!")
    return True

if __name__ == "__main__":
    start_time = time.time()
    
    # Set up Supabase tables
    setup_success = main()
    
    if setup_success:
        # Ask user if they want to migrate existing cache
        migrate_choice = input("\nDo you want to migrate existing pickle cache data to Supabase? (y/n): ")
        if migrate_choice.lower() == 'y':
            migrate_existing_cache()
    
    end_time = time.time()
    print(f"\nSetup completed in {end_time - start_time:.2f} seconds.")
    print("------------------------------------------------") 