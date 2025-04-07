"""
Routes API functionality for finding flight options between airports.
"""
import os
import re
import json
import pickle
from datetime import datetime, timedelta
from pathlib import Path
import requests
import time
from dotenv import load_dotenv

# Replace pickle cache import with Supabase client import
from ..utils.supabase_client import get_flight_route_data, save_flight_route_data, ROUTE_CACHE_EXPIRY


def get_flight_numbers_for_route(origin, destination, date=None, max_routes=5, max_connections=2, use_cache=True):
    """
    Find flight routes between two airports with configurable parameters.
    
    Args:
        origin (str): Origin airport IATA code (e.g., "AMS")
        destination (str): Destination airport IATA code (e.g., "LHE")
        date (str, optional): Specific date in YYYY-MM-DD format. If None, uses a date 4 weeks ahead.
        max_routes (int, optional): Maximum number of unique routes to return. Defaults to 5.
        max_connections (int, optional): Maximum number of connections. Defaults to 2.
        use_cache (bool, optional): Whether to use cached results if available. Defaults to True.
        
    Returns:
        dict: Structured data containing the best unique flight routes
    """
    # Set target date
    if date is None:
        # Use a date 4 weeks in the future if none provided
        target_date = (datetime.now() + timedelta(days=28)).strftime("%Y-%m-%d")
    else:
        # Use provided date
        target_date = date
    
    # Cache handling using Supabase
    cache_key = f"{origin.upper()}-{destination.upper()}-{target_date}"
    
    # Check cache first if enabled
    if use_cache:
        cached_result = get_flight_route_data(origin.upper(), destination.upper(), target_date)
        if cached_result:
            # If we have cached results, we can apply the max_routes filter here
            if 'routes' in cached_result and isinstance(cached_result['routes'], list):
                cached_result['routes'] = cached_result['routes'][:max_routes]
                if len(cached_result.get('query', {}).get('filters_applied', [])) >= 4:
                    cached_result['query']['filters_applied'][-1] = f"Selected Top {max_routes}"
            return cached_result

    # --- Helper Functions ---
    
    def parse_duration(duration_str):
        """Parses ISO 8601 duration string (like PT13H55M) into total minutes."""
        if not duration_str or not duration_str.startswith('PT'):
            return 0
    
        hours = 0
        minutes = 0
    
        hour_match = re.search(r'(\d+)H', duration_str)
        minute_match = re.search(r'(\d+)M', duration_str)
    
        if hour_match:
            hours = int(hour_match.group(1))
        if minute_match:
            minutes = int(minute_match.group(1))
    
        return (hours * 60) + minutes
    
    def format_duration(minutes):
        """Formats minutes into a human-readable duration (Xh Ym)."""
        hours = minutes // 60
        mins = minutes % 60
        
        if mins == 0:
            return f"{hours}h"
        else:
            return f"{hours}h {mins}m"
    
    def get_operating_details(segment):
        """Determines the operating airline and flight number for a segment."""
        marketing_airline = segment.get('carrierCode')
        marketing_number = segment.get('number')
    
        if not marketing_airline or not marketing_number:
            return None
    
        operating_info = segment.get('operating')
        if operating_info and isinstance(operating_info, dict) and 'carrierCode' in operating_info:
            operating_airline = operating_info['carrierCode']
            operating_flight_number = f"{operating_airline}{marketing_number}"
        else:
            operating_airline = marketing_airline
            operating_flight_number = f"{marketing_airline}{marketing_number}"
    
        return {
            "airline": operating_airline,
            "flight_number": operating_flight_number
        }
    
    def is_self_operated(segment):
        """Checks if the marketing carrier is also the operating carrier."""
        marketing_airline = segment.get('carrierCode')
        operating_info = segment.get('operating')
    
        if operating_info and isinstance(operating_info, dict) and 'carrierCode' in operating_info:
            operating_airline = operating_info['carrierCode']
            return marketing_airline == operating_airline
        elif operating_info is None:
            return True
        else:
            print(f"Warning: Malformed operating info in segment: {segment.get('id', 'N/A')}")
            return False
    
    # --- Amadeus API Authentication ---
    
    # Get API credentials
    load_dotenv()
    api_key = os.environ.get("AMADUS_KEY")
    api_secret = os.environ.get("AMADUS_SECRET")
    
    if not api_key or not api_secret:
        print("Warning: API credentials not set correctly. Please check environment variables.")
        return {"error": "API credentials not configured"}
    
    # Visual indicator for API call start
    print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 MAKING API CALL FOR AMADEUS AUTHENTICATION 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
    print(f"Requesting Amadeus Authentication Token...")
    auth_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    auth_data = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": api_secret
    }
    
    access_token = None
    try:
        auth_response = requests.post(auth_url, data=auth_data, timeout=10)
        auth_response.raise_for_status()
        access_token = auth_response.json().get("access_token")
        print("Authentication Successful.")
        # Visual indicator for API call end
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 COMPLETED API CALL FOR AMADEUS AUTHENTICATION 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
    except requests.exceptions.RequestException as e:
        # Visual indicator for API call end with error
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR AMADEUS AUTHENTICATION 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        print(f"Error during authentication: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Response body: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Response body (non-JSON): {e.response.text}")
        return {"error": f"Authentication failed: {str(e)}"}
    except json.JSONDecodeError:
        # Visual indicator for API call end with error
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR AMADEUS AUTHENTICATION 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        print("Error decoding authentication response.")
        return {"error": "Authentication response decode error"}
    
    if not access_token:
        print("Failed to retrieve access token.")
        return {"error": "No access token received"}
    
    # --- Flight Search API Call ---
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "currencyCode": "USD",
        "originDestinations": [
            {
                "id": "1",
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDateTimeRange": {
                    "date": target_date
                }
            }
        ],
        "travelers": [{"id": "1", "travelerType": "ADULT"}],
        "sources": ["GDS"],
        "searchCriteria": {
            "maxFlightOffers": 100,
            "flightFilters": {
                "connectionRestriction": {
                    "maxNumberOfConnections": max_connections
                }
            }
        }
    }
    
    # Visual indicator for API call start
    print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 MAKING API CALL FOR AMADEUS FLIGHT SEARCH 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
    print(f"Searching flights from {origin} to {destination} on {target_date}...")
    
    search_url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    try:
        search_response = requests.post(search_url, json=payload, headers=headers, timeout=15)
        # Visual indicator for API call end
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 COMPLETED API CALL FOR AMADEUS FLIGHT SEARCH 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        search_response.raise_for_status()
        search_data = search_response.json()
    except requests.exceptions.RequestException as e:
        # Visual indicator for API call end with error
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR AMADEUS FLIGHT SEARCH 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        print(f"Error during flight search: {e}")
        
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_response = e.response.json()
                print(f"Response error: {error_response}")
                
                if "errors" in error_response and len(error_response["errors"]) > 0:
                    error_title = error_response["errors"][0].get("title", "Unknown error")
                    error_detail = error_response["errors"][0].get("detail", "No details available")
                    return {"error": f"Flight search failed: {error_title} - {error_detail}"}
            except json.JSONDecodeError:
                print(f"Response body (non-JSON): {e.response.text}")
        
        return {"error": f"Flight search failed: {str(e)}"}
    except json.JSONDecodeError:
        # Visual indicator for API call end with error
        print(f"🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 API CALL FAILED FOR AMADEUS FLIGHT SEARCH 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢")
        print("Error decoding flight search response.")
        return {"error": "Flight search response decode error"}
    
    # --- Process Search Results ---
    
    # Check if data contains flight offers
    if 'data' not in search_data or not isinstance(search_data['data'], list):
        print("No flight offers found in the response.")
        return {
            "query": {
                "origin": origin.upper(),
                "destination": destination.upper(),
                "date": target_date,
                "max_connections": max_connections,
                "max_routes": max_routes
            },
            "routes": [],
            "message": "No flights found for this route"
        }
    
    flight_offers = search_data['data']
    print(f"Found {len(flight_offers)} flight offers. Processing...")
    
    routes = []
    for offer in flight_offers:
        if 'itineraries' not in offer or not offer['itineraries']:
            continue
        
        # We only care about the outbound journey (first itinerary)
        itinerary = offer['itineraries'][0]
        
        if 'segments' not in itinerary or not itinerary['segments']:
            continue
        
        segments = itinerary['segments']
        segment_count = len(segments)
        
        # Create a route object
        route = {
            "total_duration": parse_duration(itinerary.get('duration', 'PT0H0M')),
            "formatted_duration": format_duration(parse_duration(itinerary.get('duration', 'PT0H0M'))),
            "segments": segment_count,
            "connections": segment_count - 1,
            "connection_airports": [],
            "operating_airlines": [],
            "operating_flight_numbers": [],
            "departure_time": None,
            "arrival_time": None,
        }
        
        # Extract price information from the offer
        if 'price' in offer and offer['price']:
            price_info = offer['price']
            try:
                # Try to convert to float and format with two decimal places
                price_value = float(price_info.get('total', '800'))
                route["price"] = {
                    "amount": f"{price_value:.2f}",
                    "currency": price_info.get('currency', 'USD')
                }
            except (ValueError, TypeError):
                # If conversion fails, use the raw value
                route["price"] = {
                    "amount": price_info.get('total', '800'),
                    "currency": price_info.get('currency', 'USD')
                }
        else:
            # Default price if not available
            route["price"] = {
                "amount": "800.00", 
                "currency": "USD"
            }
        
        # Process segments to extract details
        for i, segment in enumerate(segments):
            # Get departure and arrival times
            if i == 0:  # First segment
                route["departure_time"] = segment.get('departure', {}).get('at')
                route["first_departure_airport"] = segment.get('departure', {}).get('iataCode')
            
            if i == segment_count - 1:  # Last segment
                route["arrival_time"] = segment.get('arrival', {}).get('at')
                route["last_arrival_airport"] = segment.get('arrival', {}).get('iataCode')
            
            # Add connection airports (excluding origin and final destination)
            if i < segment_count - 1:  # Not the last segment
                connection = segment.get('arrival', {}).get('iataCode')
                if connection:
                    route["connection_airports"].append(connection)
            
            # Add operating details
            operating = get_operating_details(segment)
            if operating:
                airline = operating["airline"]
                flight_number = operating["flight_number"]
                
                if airline and airline not in route["operating_airlines"]:
                    route["operating_airlines"].append(airline)
                
                if flight_number and flight_number not in route["operating_flight_numbers"]:
                    route["operating_flight_numbers"].append(flight_number)
        
        # Format the connection airports into a readable string
        if route["connection_airports"]:
            route["connection_string"] = " → ".join(route["connection_airports"])
        else:
            route["connection_string"] = "Direct"
            
        # For now, select the first airline as the primary
        if route["operating_airlines"]:
            route["operating_airline"] = route["operating_airlines"][0]
        else:
            route["operating_airline"] = "Unknown"
        
        # Add the route to our list
        routes.append(route)
    
    # Sort routes by total duration
    sorted_routes = sorted(routes, key=lambda x: x["total_duration"])
    
    # Add a secondary sort by price to ensure consistent ordering
    # when multiple routes have the same duration
    sorted_routes = sorted(sorted_routes, 
                           key=lambda x: (
                               x["total_duration"],  # Primary: duration (lowest first)
                               float(x.get("price", {}).get("amount", "9999")),  # Secondary: price (lowest first) 
                               "-".join(x.get("operating_flight_numbers", []))  # Tertiary: flight numbers (for stability)
                           ))
    
    # Limit to the requested number of routes
    top_routes = sorted_routes[:max_routes]
    
    # Build the final result
    result = {
        "query": {
            "origin": origin.upper(),
            "destination": destination.upper(),
            "date": target_date,
            "filters_applied": [
                f"Max {max_connections} connections",
                f"Sorted by shortest duration",
                f"Selected Top {max_routes}"
            ]
        },
        "routes": top_routes,
        "count": len(top_routes),
        "retrieved_at": datetime.now().isoformat()
    }
    
    # Save to Supabase
    if top_routes:
        save_flight_route_data(origin.upper(), destination.upper(), target_date, result)
    
    return result


def extract_flight_numbers_for_route(origin_iata: str, destination_iata: str) -> list:
    """
    Extract all flight numbers that operate on a specific route based on cached results.
    
    Args:
        origin_iata: Origin airport IATA code (e.g., "AMS")
        destination_iata: Destination airport IATA code (e.g., "LHE")
        
    Returns:
        List of unique flight numbers
    """
    # We need to get this from Supabase
    from ..utils.supabase_client import get_cached_dates_for_route
    
    flight_numbers = []
    
    # Get all cached dates for this route
    dates = get_cached_dates_for_route(origin_iata, destination_iata)
    
    if not dates:
        print(f"No cached data found for route {origin_iata}-{destination_iata}")
        return []
    
    # Use the most recent date
    most_recent_date = sorted(dates)[-1]
    route_data = get_flight_route_data(origin_iata, destination_iata, most_recent_date)
    
    if route_data and 'routes' in route_data:
        for route in route_data['routes']:
            if 'operating_flight_numbers' in route:
                flight_numbers.extend(route['operating_flight_numbers'])
    
    # Remove duplicates
    unique_flight_numbers = list(set(flight_numbers))
    
    return unique_flight_numbers