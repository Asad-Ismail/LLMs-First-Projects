"""
Cache utilities for airline route data.
"""
import os
import time
import pickle
from datetime import datetime
from pathlib import Path

# Cache configuration
ROUTE_CACHE_EXPIRY = 30 * 24 * 60 * 60  # 30 days in seconds
FLIGHT_CACHE_EXPIRY = 30 * 24 * 60 * 60  # 30 days in seconds
CACHE_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cache")


def get_cache_file_path(cache_key, base_dir=CACHE_BASE_DIR, subdirectory=None):
    """Get the full path to the cache file for a given key."""
    cache_dir = base_dir
    if subdirectory:
        cache_dir = os.path.join(base_dir, subdirectory)
    
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    return os.path.join(cache_dir, f"{cache_key}.pkl")


def load_cache(cache_file, expiry_seconds):
    """Load data from cache file if valid and not expired."""
    if not os.path.exists(cache_file):
        return None
    
    try:
        with open(cache_file, 'rb') as f:
            cached_data = pickle.load(f)
        
        # Check if cache is expired
        cache_timestamp = cached_data.get('timestamp')
        if not cache_timestamp:
            return None
            
        if time.time() - cache_timestamp > expiry_seconds:
            print(f"Cache expired for {os.path.basename(cache_file)}")
            return None
            
        cache_datetime = datetime.fromtimestamp(cache_timestamp)
        print(f"Using cached data from {cache_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        return cached_data.get('result')
    except Exception as e:
        print(f"Error reading cache: {e}")
        return None


def save_to_cache(cache_file, result):
    """Save results to cache with current timestamp."""
    try:
        cache_data = {
            'timestamp': time.time(),
            'result': result
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        
        with open(cache_file, 'wb') as f:
            pickle.dump(cache_data, f)
        print(f"Cached results to {os.path.basename(cache_file)}")
        return True
    except Exception as e:
        print(f"Error writing to cache: {e}")
        return False