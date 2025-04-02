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

from ..utils.cache import get_cache_file_path, load_cache, save_to_cache, ROUTE_CACHE_EXPIRY


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
    
    # Cache handling
    cache_key = f"{origin.upper()}-{destination.upper()}-{target_date}"
    cache_file = get_cache_file_path(cache_key, subdirectory="routes")
    
    # Check cache first if enabled
    if use_cache:
        cached_result = load_cache(cache_file, ROUTE_CACHE_EXPIRY)
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
    except requests.exceptions.RequestException as e:
        print(f"Error during authentication: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Response body: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Response body (non-JSON): {e.response.text}")
        return {"error": f"Authentication failed: {str(e)}"}
    except json.JSONDecodeError:
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
    
    print(f"Requesting Flight Offers for {target_date} from {origin} to {destination}...")
    url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    data = None
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        print("Flight Offers Received.")
    except requests.exceptions.RequestException as e:
        print(f"Error during flight offers search: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Response body: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Response body (non-JSON): {e.response.text}")
        return {"error": f"Flight search failed: {str(e)}"}
    except json.JSONDecodeError:
        print("Error decoding flight offers response.")
        return {"error": "Flight offers response decode error"}
    
    # --- Filtering and Processing Results ---
    
    unique_routes = {}
    
    if not data or 'data' not in data:
        print("No flight offers found or invalid response structure.")
        error_result = {
            "query": {
                "origin": origin,
                "destination": destination,
                "date": target_date,
                "filters_applied": [
                    "Self-Operated Flights Only",
                    "Unique Routes",
                    "Sorted by Price (Ascending), then Duration (Ascending)",
                    f"Selected Top {max_routes}"
                ],
                "status": "No valid offers found in API response"
            },
            "routes": []
        }
        
        # Cache even empty results to prevent repeated API calls for routes with no data
        if use_cache:
            save_to_cache(cache_file, error_result)
            
        return error_result
    
    print("Processing and Filtering Offers...")
    for offer in data['data']:
        if not offer.get('itineraries'):
            continue
    
        itinerary = offer['itineraries'][0]
        segments = itinerary.get('segments', [])
    
        # 1. Check for Self-Operation
        all_segments_self_operated = True
        for segment in segments:
            if not is_self_operated(segment):
                all_segments_self_operated = False
                break
    
        if not all_segments_self_operated:
            continue
    
        # 2. Identify Unique Route Key & Extract Details
        route_parts = []
        operating_airlines = []
        operating_flight_numbers = []
        route_path_airports = []
    
        if not segments:
            continue
    
        # Add origin airport
        route_path_airports.append(segments[0].get('departure', {}).get('iataCode', '?'))
    
        valid_route = True
        for i, segment in enumerate(segments):
            op_details = get_operating_details(segment)
            departure_code = segment.get('departure', {}).get('iataCode', '?')
            arrival_code = segment.get('arrival', {}).get('iataCode', '?')
    
            if not op_details or departure_code == '?' or arrival_code == '?':
                valid_route = False
                print(f"Warning: Skipping segment due to missing details. Offer ID: {offer.get('id')}")
                break
    
            operating_airlines.append(op_details['airline'])
            operating_flight_numbers.append(op_details['flight_number'])
            route_parts.append(f"{departure_code}({op_details['airline']})")
            route_path_airports.append(arrival_code)
    
            if i == len(segments) - 1:
                route_parts.append(arrival_code)
    
        if not valid_route:
            continue
    
        route_key = "-".join(route_parts)
        route_path_str = " -> ".join(route_path_airports)
    
        # Extract price and duration
        try:
            price_info = offer.get('price', {})
            current_price = float(price_info.get('total', 'inf'))
            currency = price_info.get('currency', 'N/A')
            current_duration_str = itinerary.get('duration')
            current_duration_minutes = parse_duration(current_duration_str)
        except (ValueError, TypeError) as e:
            print(f"Warning: Error parsing price/duration for Offer ID {offer.get('id')}: {e}")
            continue
    
        # 3. Store or Update Unique Offer
        if route_key not in unique_routes:
            unique_routes[route_key] = {
                "route_path": route_path_str,
                "operating_airline_codes": operating_airlines,
                "operating_flight_numbers": operating_flight_numbers,
                "total_duration_str": current_duration_str,
                "duration_minutes": current_duration_minutes,
                "price_amount": current_price,
                "currency": currency,
                "source_offer_id": offer.get('id')
            }
        else:
            existing_offer = unique_routes[route_key]
            if current_price < existing_offer['price_amount'] or \
               (current_price == existing_offer['price_amount'] and current_duration_minutes < existing_offer['duration_minutes']):
                unique_routes[route_key] = {
                    "route_path": route_path_str,
                    "operating_airline_codes": operating_airlines,
                    "operating_flight_numbers": operating_flight_numbers,
                    "total_duration_str": current_duration_str,
                    "duration_minutes": current_duration_minutes,
                    "price_amount": current_price,
                    "currency": currency,
                    "source_offer_id": offer.get('id')
                }
    
    # 4. Sort and Select Top Routes
    sorted_routes = sorted(unique_routes.values(), key=lambda x: (x['price_amount'], x['duration_minutes']))
    top_routes = sorted_routes[:max_routes]  # Apply the max_routes configuration
    
    # 5. Format Output
    top_routes_output = []
    carrier_dict = data.get('dictionaries', {}).get('carriers', {})
    
    for i, route_info in enumerate(top_routes):
        primary_op_airline_code = route_info['operating_airline_codes'][0] if route_info['operating_airline_codes'] else 'N/A'
        primary_op_airline_str = f"{primary_op_airline_code} ({carrier_dict.get(primary_op_airline_code, 'Unknown Name')})"
        
        # Format duration in hours and minutes
        formatted_duration = format_duration(route_info['duration_minutes'])
    
        top_routes_output.append({
            "rank": i + 1,
            "route_path": route_info['route_path'],
            "operating_airline": primary_op_airline_str,
            "operating_flight_numbers": route_info['operating_flight_numbers'],
            "total_duration": formatted_duration,
            "duration_raw_minutes": route_info['duration_minutes'],
            "price": {
                "amount": f"{route_info['price_amount']:.2f}",
                "currency": route_info['currency']
            },
            "source_offer_id": route_info['source_offer_id']
        })
    
    # Construct final JSON
    final_result = {
        "query": {
            "origin": origin,
            "destination": destination,
            "date": target_date,
            "filters_applied": [
                "Self-Operated Flights Only",
                "Unique Routes",
                "Sorted by Price (Ascending), then Duration (Ascending)",
                f"Selected Top {max_routes}"
            ]
        },
        "routes": top_routes_output
    }
    
    # Cache the results if caching is enabled
    if use_cache:
        save_to_cache(cache_file, final_result)
    
    return final_result