"""
Reliability API functionality for flight reliability analysis.
"""
import os
import json
import time
from dotenv import load_dotenv
import requests
from ..utils.cache import get_cache_file_path, load_cache, save_to_cache, FLIGHT_CACHE_EXPIRY


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
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        cache_key = f"recent_{flight_number}_{start_str}_{end_str}"
        cache_file = get_cache_file_path(cache_key, subdirectory="flights")
        
        # Check cache if enabled
        if use_cache:
            cached_result = load_cache(cache_file, FLIGHT_CACHE_EXPIRY)
            if cached_result:
                return cached_result
        
        url = f"{self.base_url}/flights/number/{flight_number}/{start_str}/{end_str}?dateLocalRole=Both"
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            # Handle 204 No Content specifically
            if response.status_code == 204:
                print(f"  ⚠️ No recent flights found for {flight_number} ({start_str} to {end_str}) (API returned 204 No Content)")
                return None
            
            response.raise_for_status()
            
            # Check if we got an empty array
            data = response.json()
            if isinstance(data, list) and len(data) == 0:
                print(f"  ⚠️ No recent flights found for {flight_number} ({start_str} to {end_str}) (empty array returned)")
                return None
            
            print(f"  Successfully fetched recent data for {flight_number} ({start_str} to {end_str}) from API")
            
            if use_cache:
                save_to_cache(cache_file, data)
            return data
        except requests.exceptions.HTTPError as http_err:
            print(f"  ⚠️ HTTP error fetching recent data for {flight_number}: {http_err}")
            return None
        except json.JSONDecodeError:
            print(f"  ⚠️ Could not parse API response for {flight_number} (empty or invalid JSON)")
            return None
        except Exception as e:
            print(f"  ⚠️ Error fetching recent data for {flight_number}: {e}")
            return None