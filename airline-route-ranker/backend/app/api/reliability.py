"""
Reliability API functionality for flight reliability analysis.
"""
import os
import json
import time
from dotenv import load_dotenv
import requests

# Replace the pickle cache import with Supabase client import
from ..utils.supabase_client import (
    get_historical_flight_data, save_historical_flight_data,
    get_recent_flight_data, save_recent_flight_data,
    FLIGHT_CACHE_EXPIRY
)


class FlightDataAPI:
    """Class to handle all API interactions with AeroDataBox."""
    
    def __init__(self, api_key=None):
        """Initialize the API client with authentication."""
        # Load API key from environment or parameter
        if api_key is None:
            load_dotenv()
            api_key = os.getenv("RAPIDAPI_KEY")
            
        if not api_key:
            raise ValueError("API key not provided and not found in environment")
            
        self.headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "aerodatabox.p.rapidapi.com"
        }
        self.base_url = "https://aerodatabox.p.rapidapi.com"
        
        # Initialize rate limit flag
        self._rate_limited = False
    
    def get_historical_delay_stats(self, flight_number, use_cache=True):
        """Fetch historical delay statistics for a flight number."""
        # Check cache if enabled
        if use_cache:
            cached_result = get_historical_flight_data(flight_number)
            if cached_result:
                return cached_result
        
        # Visual indicator for API call start
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 MAKING API CALL FOR HISTORICAL DATA: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        
        url = f"{self.base_url}/flights/{flight_number}/delays"
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            # Visual indicator for API call end
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 COMPLETED API CALL FOR HISTORICAL DATA: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            
            # Handle 204 No Content specifically
            if response.status_code == 204:
                print(f"  ⚠️ No historical data available for {flight_number} (API returned 204 No Content)")
                # Create a special empty cache object to prevent future API calls
                empty_result = {
                    "empty": True,
                    "flight_number": flight_number,
                    "cached_at": time.time(),
                    "reason": "204_No_Content",
                    "message": "No historical data available for this flight"
                }
                # Cache this empty result to prevent repeated API calls
                if use_cache:
                    cache_days = FLIGHT_CACHE_EXPIRY // (24 * 60 * 60)  # Convert seconds to days
                    print(f"  ⓘ Caching empty historical data result for {flight_number} for {cache_days} days")
                    save_historical_flight_data(flight_number, empty_result)
                return None
            
            response.raise_for_status()
            print(f"  Successfully fetched historical data for {flight_number} from API")
            
            result = response.json()
            if use_cache:
                save_historical_flight_data(flight_number, result)
            return result
        except requests.exceptions.HTTPError as http_err:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR HISTORICAL DATA: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            print(f"  ⚠️ HTTP error fetching historical data for {flight_number}: {http_err}")
            
            # Cache the failure to prevent repeated API calls
            if use_cache:
                error_result = {
                    "empty": True,
                    "flight_number": flight_number,
                    "cached_at": time.time(),
                    "reason": "http_error",
                    "error": str(http_err),
                    "message": "HTTP error occurred when fetching historical data"
                }
                print(f"  ⓘ Caching HTTP error for {flight_number} to prevent repeated API calls")
                save_historical_flight_data(flight_number, error_result)
                
            return None
            
        except json.JSONDecodeError:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR HISTORICAL DATA: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            print(f"  ⚠️ Could not parse API response for {flight_number} (empty or invalid JSON)")
            
            # Cache the failure to prevent repeated API calls
            if use_cache:
                error_result = {
                    "empty": True,
                    "flight_number": flight_number,
                    "cached_at": time.time(),
                    "reason": "json_decode_error",
                    "message": "Could not parse API response (empty or invalid JSON)"
                }
                print(f"  ⓘ Caching JSON error for {flight_number} to prevent repeated API calls")
                save_historical_flight_data(flight_number, error_result)
                
            return None
            
        except Exception as e:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR HISTORICAL DATA: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            print(f"  ⚠️ Error fetching historical data for {flight_number}: {e}")
            
            # Cache the failure to prevent repeated API calls
            if use_cache:
                error_result = {
                    "empty": True,
                    "flight_number": flight_number,
                    "cached_at": time.time(),
                    "reason": "general_error",
                    "error": str(e),
                    "message": "General error occurred when fetching historical data"
                }
                print(f"  ⓘ Caching error for {flight_number} to prevent repeated API calls")
                save_historical_flight_data(flight_number, error_result)
                
            return None
    
    def get_recent_flights(self, flight_number, days_back=7, use_cache=True):
        """Fetch recent flight data for the past days."""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        # Create a more stable cache key that only changes weekly
        # Use the year and week number of the end date to create a weekly bucket
        end_year_week = end_date.strftime("%Y-%U")  # Format: YYYY-WW (year-week number)
        
        # Track if we found any valid cache data - for potential fallback
        expired_cache_data = None
        
        # Check cache if enabled
        if use_cache:
            # First try normal cache with our primary week-year key
            cached_result = get_recent_flight_data(flight_number, end_year_week)
            if cached_result:
                return cached_result
            
            # Try a few different date ranges from recent weeks that might have cached data
            backup_weeks = 5  # Try up to 5 previous weeks
            for i in range(1, backup_weeks + 1):
                backup_date = end_date - timedelta(days=i * 7)
                backup_year_week = backup_date.strftime("%Y-%U")
                backup_result = get_recent_flight_data(flight_number, backup_year_week)
                if backup_result:
                    print(f"  Using cached data from {backup_year_week} week for {flight_number}")
                    # Save this to our current cache bucket too
                    save_recent_flight_data(flight_number, end_year_week, backup_result)
                    return backup_result
                elif backup_result is not None:
                    # Keep track of any non-None result for potential fallback
                    expired_cache_data = backup_result
        
        # Check if we're already rate limited - if so, don't even try API call
        if hasattr(self, '_rate_limited') and self._rate_limited:
            print(f"  ⚠️ API already rate limited, skipping API call for {flight_number}")
            
            # If we have expired cache data, use it instead of returning empty list
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to rate limiting")
                # Save this to prevent future API calls
                save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                return expired_cache_data
                
            # Create an empty cached result to prevent future API calls
            empty_result = []
            if use_cache:
                save_recent_flight_data(flight_number, end_year_week, empty_result)
            return empty_result
            
        # Visual indicator for API call start
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 MAKING API CALL FOR RECENT FLIGHTS: {flight_number} ({start_str} to {end_str}) 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        
        # Use the correct URL format
        url = f"{self.base_url}/flights/number/{flight_number}/{start_str}/{end_str}?dateLocalRole=Both"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            # Visual indicator for API call end
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 COMPLETED API CALL FOR RECENT FLIGHTS: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            
            # Handle 204 No Content specifically
            if response.status_code == 204:
                print(f"  ⚠️ No recent flights found for {flight_number} ({start_str} to {end_str}) (API returned 204 No Content)")
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} since API returned no content")
                    # Save this to prevent future API calls
                    save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_recent_flight_data(flight_number, end_year_week, empty_result)
                return empty_result
            
            # Special handling for rate limits - set a flag to prevent future calls
            if response.status_code == 429:
                print(f"  ⚠️ Rate limit hit for {flight_number}, will not retry")
                # Set global rate limit flag for this session
                self._rate_limited = True
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} due to rate limiting")
                    # Save this to prevent future API calls
                    save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_recent_flight_data(flight_number, end_year_week, empty_result)
                return empty_result
            
            response.raise_for_status()
            
            # Check if we got an empty array
            data = response.json()
            if isinstance(data, list) and len(data) == 0:
                print(f"  ⚠️ No recent flights found for {flight_number} ({start_str} to {end_str}) (empty array returned)")
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} since API returned empty list")
                    # Save this to prevent future API calls
                    save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                    return expired_cache_data
                    
                if use_cache:
                    save_recent_flight_data(flight_number, end_year_week, data)
                return data
            
            print(f"  Successfully fetched recent data for {flight_number} ({start_str} to {end_str}) from API")
            
            if use_cache:
                save_recent_flight_data(flight_number, end_year_week, data)
            return data
            
        except requests.exceptions.HTTPError as http_err:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR RECENT FLIGHTS: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            
            if "429" in str(http_err):
                # Handle rate limiting exception - set flag to prevent future calls
                print(f"  ⚠️ Rate limit error for {flight_number}, will not retry")
                self._rate_limited = True
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} due to rate limiting")
                    # Save this to prevent future API calls
                    save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_recent_flight_data(flight_number, end_year_week, empty_result)
                return empty_result
            
            print(f"  ⚠️ HTTP error fetching recent data for {flight_number}: {http_err}")
            
            # If we have expired cache data, use it as a fallback on any HTTP error
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to HTTP error")
                save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                return expired_cache_data
                
            error_result = {
                "empty": True,
                "flight_number": flight_number,
                "cached_at": time.time(),
                "reason": "http_error",
                "error": str(http_err),
                "message": "HTTP error occurred when fetching recent flight data"
            }
            if use_cache:
                save_recent_flight_data(flight_number, end_year_week, error_result)
            return None
            
        except json.JSONDecodeError:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR RECENT FLIGHTS: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            print(f"  ⚠️ Could not parse API response for {flight_number} (empty or invalid JSON)")
            
            # If we have expired cache data, use it as a fallback
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to JSON parsing error")
                save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                return expired_cache_data
                
            error_result = {
                "empty": True,
                "flight_number": flight_number,
                "cached_at": time.time(),
                "reason": "json_decode_error",
                "message": "Could not parse API response (empty or invalid JSON)"
            }
            if use_cache:
                save_recent_flight_data(flight_number, end_year_week, error_result)
            return None
            
        except Exception as e:
            # Visual indicator for API call end with error
            print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR RECENT FLIGHTS: {flight_number} 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
            print(f"  ⚠️ Error fetching recent data for {flight_number}: {e}")
            
            # If we have expired cache data, use it as a fallback on any error
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to error: {e}")
                save_recent_flight_data(flight_number, end_year_week, expired_cache_data)
                return expired_cache_data
                
            error_result = {
                "empty": True,
                "flight_number": flight_number,
                "cached_at": time.time(),
                "reason": "general_error",
                "error": str(e),
                "message": "General error occurred when fetching recent flight data"
            }
            if use_cache:
                save_recent_flight_data(flight_number, end_year_week, error_result)
            return None