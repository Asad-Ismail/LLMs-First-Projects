"""
Supabase client utilities for airline route data.
This replaces the pickle cache system with Supabase database storage.
"""
import os
import time
import json
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Cache configuration (used for logging purposes only)
ROUTE_CACHE_EXPIRY = 35 * 24 * 60 * 60  # 35 days in seconds
FLIGHT_CACHE_EXPIRY = 35 * 24 * 60 * 60  # 35 days in seconds

# Initialize Supabase client
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
    supabase = None
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing Supabase client: {e}")
        supabase = None


def get_flight_route_data(origin: str, destination: str, date: str) -> Optional[Dict[str, Any]]:
    """
    Get flight route data from Supabase database.
    
    Args:
        origin: Origin airport IATA code (e.g., "AMS")
        destination: Destination airport IATA code (e.g., "LHE")
        date: Specific date in YYYY-MM-DD format
        
    Returns:
        Route data if found, None otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return None
    
    try:
        # Get data from Supabase
        response = (supabase.table("flight_routes")
                   .select("route_data, created_at")
                   .eq("origin_iata", origin.upper())
                   .eq("destination_iata", destination.upper())
                   .eq("route_date", date)
                   .execute())
        
        # Check if any data was found
        if len(response.data) == 0:
            print(f"No route data found for {origin}-{destination} on {date}")
            return None
        
        # Log cache hit with more visible indicator
        print(f"🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 LOADING ROUTE DATA FROM CACHE: {origin}-{destination} ({date}) 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦")
        cache_timestamp = response.data[0]["created_at"]
        try:
            cache_datetime = datetime.fromisoformat(cache_timestamp.replace("Z", "+00:00"))
            cache_age = time.time() - cache_datetime.timestamp()
            cache_age_days = cache_age / (24 * 60 * 60)  # Convert to days
            print(f"  ✅ Using cached route data from {cache_datetime.strftime('%Y-%m-%d %H:%M:%S')} ({cache_age_days:.2f} days old)")
        except Exception as e:
            print(f"  ⚠️ Warning: Error processing timestamp: {e}")
        
        # Return the route data
        return response.data[0]["route_data"]
    except Exception as e:
        print(f"❌ Error getting route data from Supabase: {e}")
        return None


def save_flight_route_data(origin: str, destination: str, date: str, data: Dict[str, Any]) -> bool:
    """
    Save flight route data to Supabase database.
    
    Args:
        origin: Origin airport IATA code (e.g., "AMS")
        destination: Destination airport IATA code (e.g., "LHE")
        date: Specific date in YYYY-MM-DD format
        data: Route data to save
        
    Returns:
        True if successful, False otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return False
    
    try:
        # Create new record (or update if exists)
        response = (supabase.table("flight_routes")
                   .upsert({
                       "origin_iata": origin.upper(),
                       "destination_iata": destination.upper(),
                       "route_date": date,
                       "route_data": data
                   })
                   .execute())
        
        print(f"✅ Successfully saved route data for {origin}-{destination} on {date}")
        return True
    except Exception as e:
        print(f"❌ Error saving route data to Supabase: {e}")
        return False


def get_historical_flight_data(flight_number: str) -> Optional[Dict[str, Any]]:
    """
    Get historical flight data from Supabase database.
    
    Args:
        flight_number: Flight number (e.g., "EK622")
        
    Returns:
        Historical flight data if found, None otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return None
    
    try:
        # Get data from Supabase
        response = (supabase.table("flight_delay_historical")
                   .select("delay_data, created_at")
                   .eq("flight_number", flight_number)
                   .execute())
        
        # Check if any data was found
        if len(response.data) == 0:
            print(f"No historical data found for flight {flight_number}")
            return None
        
        # Log cache hit with more visible indicator
        print(f"🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 LOADING HISTORICAL DATA FROM CACHE: {flight_number} 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦")
        cache_timestamp = response.data[0]["created_at"]
        try:
            cache_datetime = datetime.fromisoformat(cache_timestamp.replace("Z", "+00:00"))
            cache_age = time.time() - cache_datetime.timestamp()
            cache_age_days = cache_age / (24 * 60 * 60)  # Convert to days
            print(f"  ✅ Using cached historical data from {cache_datetime.strftime('%Y-%m-%d %H:%M:%S')} ({cache_age_days:.2f} days old)")
        except Exception as e:
            print(f"  ⚠️ Warning: Error processing timestamp: {e}")
        
        # Return the historical data
        return response.data[0]["delay_data"]
    except Exception as e:
        print(f"❌ Error getting historical data from Supabase: {e}")
        return None


def save_historical_flight_data(flight_number: str, data: Dict[str, Any]) -> bool:
    """
    Save historical flight data to Supabase database.
    
    Args:
        flight_number: Flight number (e.g., "EK622")
        data: Historical flight data to save
        
    Returns:
        True if successful, False otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return False
    
    try:
        # Create new record (or update if exists)
        response = (supabase.table("flight_delay_historical")
                   .upsert({
                       "flight_number": flight_number,
                       "delay_data": data
                   })
                   .execute())
        
        print(f"✅ Successfully saved historical data for flight {flight_number}")
        return True
    except Exception as e:
        print(f"❌ Error saving historical data to Supabase: {e}")
        return False


def get_recent_flight_data(flight_number: str, week_year: str) -> Optional[Dict[str, Any]]:
    """
    Get recent flight data from Supabase database.
    
    Args:
        flight_number: Flight number (e.g., "EK622")
        week_year: Year and week number in the format YYYY-WW
        
    Returns:
        Recent flight data if found, None otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return None
    
    try:
        # Get data from Supabase
        response = (supabase.table("flight_delay_recent")
                   .select("flight_data, created_at")
                   .eq("flight_number", flight_number)
                   .eq("week_year", week_year)
                   .execute())
        
        # Check if any data was found
        if len(response.data) == 0:
            print(f"No recent data found for flight {flight_number} in week {week_year}")
            return None
        
        # Log cache hit with more visible indicator
        print(f"🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 LOADING RECENT FLIGHT DATA FROM CACHE: {flight_number} (week {week_year}) 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦")
        cache_timestamp = response.data[0]["created_at"]
        try:
            cache_datetime = datetime.fromisoformat(cache_timestamp.replace("Z", "+00:00"))
            cache_age = time.time() - cache_datetime.timestamp()
            cache_age_days = cache_age / (24 * 60 * 60)  # Convert to days
            print(f"  ✅ Using cached recent data from {cache_datetime.strftime('%Y-%m-%d %H:%M:%S')} ({cache_age_days:.2f} days old)")
        except Exception as e:
            print(f"  ⚠️ Warning: Error processing timestamp: {e}")
        
        # Return the recent flight data
        return response.data[0]["flight_data"]
    except Exception as e:
        print(f"❌ Error getting recent flight data from Supabase: {e}")
        return None


def save_recent_flight_data(flight_number: str, week_year: str, data: Dict[str, Any]) -> bool:
    """
    Save recent flight data to Supabase database.
    
    Args:
        flight_number: Flight number (e.g., "EK622")
        week_year: Year and week number in the format YYYY-WW
        data: Recent flight data to save
        
    Returns:
        True if successful, False otherwise
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return False
    
    try:
        # Create new record (or update if exists)
        response = (supabase.table("flight_delay_recent")
                   .upsert({
                       "flight_number": flight_number,
                       "week_year": week_year,
                       "flight_data": data
                   })
                   .execute())
        
        print(f"✅ Successfully saved recent data for flight {flight_number} in week {week_year}")
        return True
    except Exception as e:
        print(f"❌ Error saving recent flight data to Supabase: {e}")
        return False


def get_cached_dates_for_route(origin: str, destination: str) -> list:
    """
    Get a list of dates for which we have cached route data.
    
    Args:
        origin: Origin airport IATA code (e.g., "AMS")
        destination: Destination airport IATA code (e.g., "LHE")
        
    Returns:
        List of dates in YYYY-MM-DD format
    """
    if not supabase:
        print("❌ Supabase client not initialized.")
        return []
    
    try:
        # Retrieve from Supabase
        print(f"🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 CHECKING CACHED DATES FOR ROUTE: {origin}-{destination} 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦")
        response = (supabase.table("flight_routes")
                   .select("route_date")
                   .eq("origin_iata", origin.upper())
                   .eq("destination_iata", destination.upper())
                   .execute())
        
        dates = []
        for item in response.data:
            dates.append(item["route_date"])
            
        print(f"  ✅ Found {len(dates)} cached dates for {origin}-{destination}")
        return dates
    except Exception as e:
        print(f"❌ Error getting cached dates from Supabase: {e}")
        return [] 