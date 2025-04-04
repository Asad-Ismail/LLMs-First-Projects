"""
Reliability API functionality for flight reliability analysis.
"""
import os
import json
import time
from dotenv import load_dotenv
import requests
from ..utils.cache import get_cache_file_path, load_cache, save_to_cache, FLIGHT_CACHE_EXPIRY, CACHE_BASE_DIR


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
        cache_key = f"historical_{flight_number}"
        cache_file = get_cache_file_path(cache_key, subdirectory="flights")
        
        # Check cache if enabled
        if use_cache:
            cached_result = load_cache(cache_file, FLIGHT_CACHE_EXPIRY)
            if cached_result:
                return cached_result
        
        url = f"{self.base_url}/flights/{flight_number}/delays"
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            # Handle 204 No Content specifically
            if response.status_code == 204:
                print(f"  ⚠️ No historical data available for {flight_number} (API returned 204 No Content)")
                return None
            
            response.raise_for_status()
            print(f"  Successfully fetched historical data for {flight_number} from API")
            
            result = response.json()
            if use_cache:
                save_to_cache(cache_file, result)
            return result
        except requests.exceptions.HTTPError as http_err:
            print(f"  ⚠️ HTTP error fetching historical data for {flight_number}: {http_err}")
            return None
        except json.JSONDecodeError:
            print(f"  ⚠️ Could not parse API response for {flight_number} (empty or invalid JSON)")
            return None
        except Exception as e:
            print(f"  ⚠️ Error fetching historical data for {flight_number}: {e}")
            return None
    
    def get_recent_flights(self, flight_number, days_back=7, use_cache=True):
        """Fetch recent flight data for the past days."""
        from datetime import datetime, timedelta
        import os
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        # Create a more stable cache key that only changes weekly
        # Use the year and week number of the end date to create a weekly bucket
        end_year_week = end_date.strftime("%Y-%U")  # Format: YYYY-WW (year-week number)
        stable_cache_key = f"recent_{flight_number}_{end_year_week}"
        cache_file = get_cache_file_path(stable_cache_key, subdirectory="flights")
        
        # Track if we found any valid cache data - for potential fallback
        expired_cache_data = None
        
        # Check cache if enabled
        if use_cache:
            # First try normal cache with expiry check
            cached_result = load_cache(cache_file, FLIGHT_CACHE_EXPIRY)
            if cached_result:
                return cached_result
                
            # Store expired cache data (ignoring expiry)
            expired_cache_data = load_cache(cache_file, None)
                
            # If we don't have a cache hit with our primary key, check for cached files with other formats
            # First check if there are any existing cache files for this flight with older formats
            cache_dir = os.path.join(CACHE_BASE_DIR, "flights")
            if os.path.exists(cache_dir):
                # Look for any cached file that matches the flight number pattern (regardless of date)
                flight_pattern = f"recent_{flight_number}_"
                for filename in os.listdir(cache_dir):
                    if filename.startswith(flight_pattern) and filename.endswith(".pkl"):
                        old_cache_file = os.path.join(cache_dir, filename)
                        older_cached_data = load_cache(old_cache_file, FLIGHT_CACHE_EXPIRY)
                        if older_cached_data:
                            print(f"  Using cached data from {filename} for {flight_number}")
                            # Save this to our current cache bucket too for future use
                            save_to_cache(cache_file, older_cached_data)
                            return older_cached_data
                        elif not expired_cache_data:
                            # If we don't have valid cache yet, try loading any file without expiry check
                            expired_cache_data = load_cache(old_cache_file, None)
            
            # If we still don't have any cached data, try to use backup date ranges
            # Try a few different date ranges from recent weeks that might have cached data
            backup_weeks = 5  # Try up to 5 previous weeks
            for i in range(1, backup_weeks + 1):
                backup_date = end_date - timedelta(days=i * 7)
                backup_year_week = backup_date.strftime("%Y-%U")
                backup_cache_key = f"recent_{flight_number}_{backup_year_week}"
                backup_cache_file = get_cache_file_path(backup_cache_key, subdirectory="flights")
                
                backup_result = load_cache(backup_cache_file, FLIGHT_CACHE_EXPIRY)
                if backup_result:
                    print(f"  Using cached data from {backup_year_week} week for {flight_number}")
                    # Save this to our current cache bucket too
                    save_to_cache(cache_file, backup_result)
                    return backup_result
                elif not expired_cache_data:
                    # Try loading without expiry check for potential fallback
                    expired_cache_data = load_cache(backup_cache_file, None)
        
        # We didn't find any valid cache data, need to make an API call
        url = f"{self.base_url}/flights/number/{flight_number}/{start_str}/{end_str}?dateLocalRole=Both"
        
        # Check if we're already rate limited - if so, don't even try API call
        # This is a global flag that's set during this API session
        if hasattr(self, '_rate_limited') and self._rate_limited:
            print(f"  ⚠️ API already rate limited, skipping API call for {flight_number}")
            
            # If we have expired cache data, use it instead of returning empty list
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to rate limiting")
                # Save this to prevent future API calls
                save_to_cache(cache_file, expired_cache_data)
                return expired_cache_data
                
            # Create an empty cached result to prevent future API calls
            empty_result = []
            if use_cache:
                save_to_cache(cache_file, empty_result)
            return empty_result
        
        # Try just once - if rate limited, remember it and don't retry
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            # Handle 204 No Content specifically
            if response.status_code == 204:
                print(f"  ⚠️ No recent flights found for {flight_number} ({start_str} to {end_str}) (API returned 204 No Content)")
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} since API returned no content")
                    # Save this to prevent future API calls
                    save_to_cache(cache_file, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_to_cache(cache_file, empty_result)
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
                    save_to_cache(cache_file, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_to_cache(cache_file, empty_result)
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
                    save_to_cache(cache_file, expired_cache_data)
                    return expired_cache_data
                    
                if use_cache:
                    save_to_cache(cache_file, data)
                return data
            
            print(f"  Successfully fetched recent data for {flight_number} ({start_str} to {end_str}) from API")
            
            if use_cache:
                save_to_cache(cache_file, data)
            return data
            
        except requests.exceptions.HTTPError as http_err:
            if "429" in str(http_err):
                # Handle rate limiting exception - set flag to prevent future calls
                print(f"  ⚠️ Rate limit error for {flight_number}, will not retry")
                self._rate_limited = True
                
                # If we have expired cache data, use it instead of returning empty list
                if expired_cache_data:
                    print(f"  ⚠️ Using expired cache data for {flight_number} due to rate limiting")
                    # Save this to prevent future API calls
                    save_to_cache(cache_file, expired_cache_data)
                    return expired_cache_data
                    
                empty_result = []
                if use_cache:
                    save_to_cache(cache_file, empty_result)
                return empty_result
            
            print(f"  ⚠️ HTTP error fetching recent data for {flight_number}: {http_err}")
            
            # If we have expired cache data, use it as a fallback on any HTTP error
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to HTTP error")
                return expired_cache_data
                
            return None
            
        except json.JSONDecodeError:
            print(f"  ⚠️ Could not parse API response for {flight_number} (empty or invalid JSON)")
            
            # If we have expired cache data, use it as a fallback
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to JSON parsing error")
                return expired_cache_data
                
            return None
            
        except Exception as e:
            print(f"  ⚠️ Error fetching recent data for {flight_number}: {e}")
            
            # If we have expired cache data, use it as a fallback on any error
            if expired_cache_data:
                print(f"  ⚠️ Using expired cache data for {flight_number} due to error: {e}")
                return expired_cache_data
                
            return None