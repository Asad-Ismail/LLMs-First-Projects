"""
Cache utilities for airline route data.
"""
import os
import time
import pickle
from datetime import datetime
from pathlib import Path as PathLib

# Cache configuration
ROUTE_CACHE_EXPIRY = 35 * 24 * 60 * 60  # 35 days in seconds
FLIGHT_CACHE_EXPIRY = 35 * 24 * 60 * 60  # 35 days in seconds
CACHE_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cache")


def get_base_cache_dir():
    """Get the base cache directory as a Path object."""
    return PathLib(CACHE_BASE_DIR)


def get_cache_file_path(cache_key, base_dir=CACHE_BASE_DIR, subdirectory=None):
    """Get the full path to the cache file for a given key."""
    cache_dir = base_dir
    if subdirectory:
        cache_dir = os.path.join(base_dir, subdirectory)
    
    PathLib(cache_dir).mkdir(parents=True, exist_ok=True)
    return os.path.join(cache_dir, f"{cache_key}.pkl")


def load_cache(cache_file, expiry_seconds):
    """Load data from cache file if valid and not expired."""
    # Log the cache file we're checking
    filename = os.path.basename(cache_file)
    print(f"Checking cache file: {filename}")
    
    if not os.path.exists(cache_file):
        print(f"Cache file not found: {filename}")
        return None
    
    try:
        with open(cache_file, 'rb') as f:
            cached_data = pickle.load(f)
        
        # Check if cache is expired
        cache_timestamp = cached_data.get('timestamp')
        if not cache_timestamp:
            print(f"Invalid cache format (no timestamp): {filename}")
            return None
            
        try:
            cache_age = time.time() - cache_timestamp
            cache_age_days = cache_age / (24 * 60 * 60)  # Convert to days
            if cache_age > expiry_seconds:
                print(f"Cache expired for {filename} (age: {cache_age_days:.2f} days)")
                return None
                
            cache_datetime = datetime.fromtimestamp(cache_timestamp)
            print(f"✅ Using cached data from {cache_datetime.strftime('%Y-%m-%d %H:%M:%S')} ({cache_age_days:.2f} days old)")
        except TypeError as e:
            print(f"⚠️ Warning: Type error processing cache timestamp: {e}")
            print(f"Cache timestamp type: {type(cache_timestamp)}")
            # If we can't process the timestamp, assume the cache is valid but log a warning
            print(f"✅ Using cached data (timestamp validation skipped)")
            
        # Validate result exists
        result = cached_data.get('result')
        if result is None:
            print(f"❌ Cache file has no result data: {filename}")
            return None
            
        return result
    except Exception as e:
        print(f"❌ Error reading cache: {e}")
        # Additional debug info
        if 'float' in str(e) and 'NoneType' in str(e):
            print(f"DEBUG: This is likely a comparison issue between float and None values")
            print(f"       Check any numerical calculations involving potentially None values")
        return None


def save_to_cache(cache_file, result):
    """Save results to cache with current timestamp."""
    try:
        filename = os.path.basename(cache_file)
        print(f"Saving data to cache: {filename}")
        
        cache_data = {
            'timestamp': time.time(),
            'result': result
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        
        with open(cache_file, 'wb') as f:
            pickle.dump(cache_data, f)
        print(f"✅ Successfully cached results to {filename}")
        return True
    except Exception as e:
        print(f"❌ Error writing to cache: {e}")
        return False