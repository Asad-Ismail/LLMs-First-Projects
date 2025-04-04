"""
Data processing and analysis models for flight reliability data.
"""
import re
from datetime import datetime
from functools import lru_cache

# Weighting constants for analysis
HISTORICAL_WEIGHT = 0.6  # Weight for historical data
RECENT_WEIGHT = 0.4      # Weight for recent data


class FlightDataProcessor:
    """Process raw API responses into structured data."""
    
    @staticmethod
    def show_historical_flight_count(flight_data):
        """Display the number of flights analyzed in the historical data."""
        if not flight_data:
            return
            
        # Check if this is a cached empty result
        if isinstance(flight_data, dict) and flight_data.get('empty') == True:
            return
            
        # Extract and sum up flights from all origins and destinations
        total_origin_flights = sum(origin.get('numConsideredFlights', 0) for origin in flight_data.get('origins', []))
        total_dest_flights = sum(dest.get('numConsideredFlights', 0) for dest in flight_data.get('destinations', []))
        
        total_flights = total_origin_flights + total_dest_flights
        print(f"  Historical flight count: {total_flights}")
    
    @staticmethod
    def process_historical_delay_stats(flight_data):
        """
        Process historical delay statistics from API response,
        prioritizing arrival (destination) delays when available.
        """
        if not flight_data:
            return None
            
        # Check if this is a cached empty result with metadata
        if isinstance(flight_data, dict) and flight_data.get('empty') == True:
            reason = flight_data.get('reason', 'unknown')
            message = flight_data.get('message', 'No historical data available')
            print(f"  ⓘ Using cached empty result for historical data: {message} (reason: {reason})")
            return None
        
        # Extract flight number
        flight_number = flight_data.get('number')
        
        # Initialize results dictionary
        results = {
            'flight_number': flight_number,
            'departure_options': [],
            'arrival_options': [],
            'overall': {}
        }
        
        # Process departure data (origins)
        departure_total_flights = 0
        departure_all_from_dates = []
        departure_all_to_dates = []
        departure_weighted_delay_sum = 0
        
        for origin in flight_data.get('origins', []):
            airport = origin.get('airportIcao')
            hour = origin.get('scheduledHourUtc')
            flights_analyzed = origin.get('numConsideredFlights', 0)
            departure_total_flights += flights_analyzed
            
            # Extract date range
            from_date = origin.get('fromUtc')
            to_date = origin.get('toUtc')
            if from_date:
                departure_all_from_dates.append(from_date)
            if to_date:
                departure_all_to_dates.append(to_date)
            
            # Calculate delay percentages
            on_time_percentage = 0
            slight_delay = 0   # 15-30 minutes
            moderate_delay = 0  # 30-60 minutes
            severe_delay = 0   # > 60 minutes
            
            for bracket in origin.get('numFlightsDelayedBrackets', []):
                delayed_from = bracket.get('delayedFrom')
                delayed_to = bracket.get('delayedTo')
                percentage = bracket.get('percentage', 0)
                
                # On-time flights (-15 min to +15 min)
                if delayed_from == '-00:15:00' and delayed_to == '00:15:00':
                    on_time_percentage = percentage * 100
                # Slight delay (15-30 min)
                elif delayed_from == '00:15:00' and delayed_to == '00:30:00':
                    slight_delay = percentage * 100
                # Moderate delay (30-60 min)
                elif delayed_from == '00:30:00' and delayed_to == '01:00:00':
                    moderate_delay = percentage * 100
                # Severe delay (60+ min)
                elif delayed_from == '01:00:00' and delayed_to == '02:00:00':
                    severe_delay += percentage * 100
                # Extreme delay (2+ hours)
                elif delayed_from == '02:00:00':
                    severe_delay += percentage * 100
            
            # Calculate total delayed percentage (flights delayed > 15 min)
            delayed_percentage = 100 - on_time_percentage
            departure_weighted_delay_sum += delayed_percentage * flights_analyzed
            
            # Get the median delay and 90th percentile
            median_delay = origin.get('medianDelay', 'Unknown')
            percentile_90 = next((p.get('delay') for p in origin.get('delayPercentiles', []) 
                                 if p.get('percentile') == 90), 'Unknown')
            
            # Add to results
            results['departure_options'].append({
                'airport': airport,
                'hour_utc': hour,
                'flights_analyzed': flights_analyzed,
                'date_range': f"{from_date} to {to_date}",
                'delayed_percentage': round(delayed_percentage, 1),
                'on_time_percentage': round(on_time_percentage, 1),
                'delay_buckets': {
                    'slight_delay_15_30min': round(slight_delay, 1),
                    'moderate_delay_30_60min': round(moderate_delay, 1),
                    'severe_delay_60min_plus': round(severe_delay, 1)
                },
                'median_delay': median_delay,
                '90th_percentile_delay': percentile_90
            })
        
        # Process arrival data (destinations)
        arrival_total_flights = 0
        arrival_all_from_dates = []
        arrival_all_to_dates = []
        arrival_weighted_delay_sum = 0
        
        for destination in flight_data.get('destinations', []):
            airport = destination.get('airportIcao')
            hour = destination.get('scheduledHourUtc')
            flights_analyzed = destination.get('numConsideredFlights', 0)
            arrival_total_flights += flights_analyzed
            
            # Extract date range
            from_date = destination.get('fromUtc')
            to_date = destination.get('toUtc')
            if from_date:
                arrival_all_from_dates.append(from_date)
            if to_date:
                arrival_all_to_dates.append(to_date)
            
            # Calculate delay percentages
            on_time_percentage = 0
            slight_delay = 0   # 15-30 minutes
            moderate_delay = 0  # 30-60 minutes
            severe_delay = 0   # > 60 minutes
            
            for bracket in destination.get('numFlightsDelayedBrackets', []):
                delayed_from = bracket.get('delayedFrom')
                delayed_to = bracket.get('delayedTo')
                percentage = bracket.get('percentage', 0)
                
                # On-time flights (-15 min to +15 min)
                if delayed_from == '-00:15:00' and delayed_to == '00:15:00':
                    on_time_percentage = percentage * 100
                # Slight delay (15-30 min)
                elif delayed_from == '00:15:00' and delayed_to == '00:30:00':
                    slight_delay = percentage * 100
                # Moderate delay (30-60 min)
                elif delayed_from == '00:30:00' and delayed_to == '01:00:00':
                    moderate_delay = percentage * 100
                # Severe delay (60+ min)
                elif delayed_from == '01:00:00' and delayed_to == '02:00:00':
                    severe_delay += percentage * 100
                # Extreme delay (2+ hours)
                elif delayed_from == '02:00:00':
                    severe_delay += percentage * 100
            
            # Calculate total delayed percentage (flights delayed > 15 min)
            delayed_percentage = 100 - on_time_percentage
            arrival_weighted_delay_sum += delayed_percentage * flights_analyzed
            
            # Get the median delay and 90th percentile
            median_delay = destination.get('medianDelay', 'Unknown')
            percentile_90 = next((p.get('delay') for p in destination.get('delayPercentiles', []) 
                                 if p.get('percentile') == 90), 'Unknown')
            
            # Add to results
            results['arrival_options'].append({
                'airport': airport,
                'hour_utc': hour,
                'flights_analyzed': flights_analyzed,
                'date_range': f"{from_date} to {to_date}",
                'delayed_percentage': round(delayed_percentage, 1),
                'on_time_percentage': round(on_time_percentage, 1),
                'delay_buckets': {
                    'slight_delay_15_30min': round(slight_delay, 1),
                    'moderate_delay_30_60min': round(moderate_delay, 1),
                    'severe_delay_60min_plus': round(severe_delay, 1)
                },
                'median_delay': median_delay,
                '90th_percentile_delay': percentile_90
            })
        
        # Calculate overall statistics - PRIORITIZE ARRIVAL DATA WHEN AVAILABLE
        has_arrival_data = len(arrival_all_from_dates) > 0
        
        if has_arrival_data:
            # Use arrival data for overall metrics when available
            earliest_date = min(arrival_all_from_dates) if arrival_all_from_dates else "Unknown"
            latest_date = max(arrival_all_to_dates) if arrival_all_to_dates else "Unknown"
            overall_delayed_percentage = (arrival_weighted_delay_sum / arrival_total_flights) if arrival_total_flights > 0 else 0
            
            results['overall'] = {
                'total_flights_analyzed': arrival_total_flights,
                'overall_date_range': f"{earliest_date} to {latest_date}",
                'overall_delayed_percentage': round(overall_delayed_percentage, 1),
                'data_type': 'arrival',  # Indicate we're using arrival data
                'departure_flights_analyzed': departure_total_flights  # Include departure count for reference
            }
        else:
            # Fall back to departure data if no arrival data exists
            earliest_date = min(departure_all_from_dates) if departure_all_from_dates else "Unknown"
            latest_date = max(departure_all_to_dates) if departure_all_to_dates else "Unknown"
            overall_delayed_percentage = (departure_weighted_delay_sum / departure_total_flights) if departure_total_flights > 0 else 0
            
            results['overall'] = {
                'total_flights_analyzed': departure_total_flights,
                'overall_date_range': f"{earliest_date} to {latest_date}",
                'overall_delayed_percentage': round(overall_delayed_percentage, 1),
                'data_type': 'departure'  # Indicate we're using departure data
            }
        
        return results
    
    @staticmethod
    def process_recent_flight_data(flight_data, include_predictions=True):
        """
        Process recent flight data from API response.
        
        This method handles both direct API responses and cached data which
        may have different structures.
        """
        # Initial data validation
        if flight_data is None or flight_data == []:
            print("  ⚠️ No recent flight data to process (empty or None)")
            return None
        
        # Detect and handle possible cache structure formats
        # Sometimes we get {'result': [...flights...], 'timestamp': 123456789}
        if isinstance(flight_data, dict) and 'result' in flight_data and isinstance(flight_data['result'], list):
            print(f"  Detected cached data structure with {len(flight_data['result'])} flights")
            flight_data = flight_data['result']
        
        # Ensure we have a list of flight objects
        if not isinstance(flight_data, list):
            print(f"  ⚠️ Unexpected flight data format: {type(flight_data)}, expected list")
            return None
        
        # Check if the list is empty
        if len(flight_data) == 0:
            print("  ⚠️ Flight data list is empty")
            return None
        
        print(f"  Processing {len(flight_data)} recent flights")
            
        # Extract flight number from first record
        flight_number = flight_data[0].get("number", "Unknown") 
        airline_name = flight_data[0].get("airline", {}).get("name", "Unknown") 
        
        # Extract route information
        departure_airport = flight_data[0].get("departure", {}).get("airport", {})
        arrival_airport = flight_data[0].get("arrival", {}).get("airport", {})
        route = f"{departure_airport.get('iata', '')} → {arrival_airport.get('iata', '')}"
        
        # Initialize result dictionary
        result = {
            "flight_number": flight_number,
            "airline": airline_name,
            "route": route,
            "total_flights": len(flight_data),
            "date_range": "",
            "individual_flights": [],
            "delay_statistics": {
                "departure": {
                    "average_delay_minutes": 0,
                    "median_delay_minutes": 0,
                    "on_time_percentage": 0,
                    "delayed_percentage": 0,
                    "delay_buckets": {
                        "slight_delay_15_30min": 0,
                        "moderate_delay_30_60min": 0,
                        "severe_delay_60min_plus": 0
                    }
                },
                "arrival": {
                    "average_delay_minutes": 0,
                    "median_delay_minutes": 0,
                    "on_time_percentage": 0,
                    "delayed_percentage": 0,
                    "delay_buckets": {
                        "slight_delay_15_30min": 0,
                        "moderate_delay_30_60min": 0,
                        "severe_delay_60min_plus": 0
                    }
                }
            }
        }
        
        # Calculate date range
        dates = []
        departure_delays = []
        arrival_delays = []
        
        # Process each flight
        for flight in flight_data:
            try:
                # Extract required data
                flight_info = FlightDataProcessor._extract_flight_info(flight, include_predictions)
                
                # Add to collections for statistics
                if flight_info['scheduled_date']:
                    dates.append(flight_info['scheduled_date'])
                
                if flight_info['departure_delay_minutes'] is not None:
                    departure_delays.append(flight_info['departure_delay_minutes'])
                
                if flight_info['arrival_delay_minutes'] is not None and (not flight_info['is_arrival_predicted'] or include_predictions):
                    arrival_delays.append(flight_info['arrival_delay_minutes'])
                
                # Add to individual flights list
                result["individual_flights"].append({
                    "date": flight_info['scheduled_date'].strftime("%Y-%m-%d") if flight_info['scheduled_date'] else "Unknown",
                    "status": flight_info['status'],
                    "departure": {
                        "airport": flight_info['departure_airport'],
                        "scheduled": flight_info['departure_scheduled_local'],
                        "actual": flight_info['departure_actual_local'],
                        "delay_minutes": round(flight_info['departure_delay_minutes'], 1) if flight_info['departure_delay_minutes'] is not None else 0,
                        "terminal": flight_info['departure_terminal'],
                        "gate": flight_info['departure_gate']
                    },
                    "arrival": {
                        "airport": flight_info['arrival_airport'],
                        "scheduled": flight_info['arrival_scheduled_local'],
                        "actual": f"{flight_info['arrival_actual_local']}{'(predicted)' if flight_info['is_arrival_predicted'] else ''}",
                        "delay_minutes": round(flight_info['arrival_delay_minutes'], 1) if flight_info['arrival_delay_minutes'] is not None else 0,
                        "terminal": flight_info['arrival_terminal']
                    },
                    "aircraft": flight_info['aircraft_info']
                })
                
            except Exception as e:
                # Skip flights with parsing errors
                print(f"  ⚠️ Error processing flight: {e}")
                continue
        
        # Verify we have processed data
        if not result["individual_flights"]:
            print(f"  ⚠️ Failed to process any flights from the data")
        else:
            print(f"  Successfully processed {len(result['individual_flights'])} flights")
            
        # Calculate date range
        if dates:
            min_date = min(dates).strftime("%Y-%m-%d")
            max_date = max(dates).strftime("%Y-%m-%d")
            result["date_range"] = f"{min_date} to {max_date}"
        
        # Calculate departure delay statistics
        if departure_delays:
            result["delay_statistics"]["departure"] = FlightDataProcessor._calculate_delay_statistics(departure_delays)
        
        # Calculate arrival delay statistics
        if arrival_delays:
            result["delay_statistics"]["arrival"] = FlightDataProcessor._calculate_delay_statistics(arrival_delays)
        
        return result
    
    @staticmethod
    def _extract_flight_info(flight, include_predictions=True):
        """Extract and format information from a single flight record."""
        # Initialize result dictionary with default values
        result = {
            'scheduled_date': None,
            'status': flight.get('status', 'Unknown'),
            'departure_airport': '',
            'departure_scheduled_local': '',
            'departure_actual_local': '',
            'departure_delay_minutes': None,
            'departure_terminal': '',
            'departure_gate': '',
            'arrival_airport': '',
            'arrival_scheduled_local': '',
            'arrival_actual_local': '',
            'arrival_delay_minutes': None,
            'arrival_terminal': '',
            'is_arrival_predicted': False,
            'aircraft_info': ''
        }
        
        # Helper function to safely get nested values
        def safe_get(data, keys, default=None):
            current = data
            for key in keys:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                else:
                    return default
            return current
        
        # Extract departure information
        departure_info = flight.get('departure', {})
        arrival_info = flight.get('arrival', {})
        
        # Get scheduled departure time
        departure_scheduled = safe_get(flight, ['departure', 'scheduledTime', 'utc'])
        if departure_scheduled:
            scheduled_dt = FlightDataProcessor._parse_time(departure_scheduled)
            if scheduled_dt:
                result['scheduled_date'] = scheduled_dt.date()
        
        # Get actual departure time
        actual_departure = None
        if safe_get(flight, ['departure', 'runwayTime', 'utc']):
            actual_departure = safe_get(flight, ['departure', 'runwayTime', 'utc'])
        elif safe_get(flight, ['departure', 'revisedTime', 'utc']):
            actual_departure = safe_get(flight, ['departure', 'revisedTime', 'utc'])
        
        # Calculate departure delay
        if departure_scheduled and actual_departure:
            scheduled_dt = FlightDataProcessor._parse_time(departure_scheduled)
            actual_dt = FlightDataProcessor._parse_time(actual_departure)
            if scheduled_dt and actual_dt:
                departure_delay = actual_dt - scheduled_dt
                result['departure_delay_minutes'] = departure_delay.total_seconds() / 60
        
        # Extract arrival information
        scheduled_arrival = safe_get(flight, ['arrival', 'scheduledTime', 'utc'])
        
        # Get actual arrival time
        actual_arrival = None
        if safe_get(flight, ['arrival', 'runwayTime', 'utc']):
            actual_arrival = safe_get(flight, ['arrival', 'runwayTime', 'utc'])
        elif safe_get(flight, ['arrival', 'revisedTime', 'utc']):
            actual_arrival = safe_get(flight, ['arrival', 'revisedTime', 'utc'])
        elif safe_get(flight, ['arrival', 'predictedTime', 'utc']):
            actual_arrival = safe_get(flight, ['arrival', 'predictedTime', 'utc'])
            result['is_arrival_predicted'] = True
        
        # Calculate arrival delay
        if scheduled_arrival and actual_arrival:
            scheduled_dt = FlightDataProcessor._parse_time(scheduled_arrival)
            actual_dt = FlightDataProcessor._parse_time(actual_arrival)
            if scheduled_dt and actual_dt:
                arrival_delay = actual_dt - scheduled_dt
                result['arrival_delay_minutes'] = arrival_delay.total_seconds() / 60
        
        # Format airport names
        result['departure_airport'] = f"{safe_get(departure_info, ['airport', 'iata'], '')} ({safe_get(departure_info, ['airport', 'name'], '')})"
        result['arrival_airport'] = f"{safe_get(arrival_info, ['airport', 'iata'], '')} ({safe_get(arrival_info, ['airport', 'name'], '')})"
        
        # Get local time strings
        result['departure_scheduled_local'] = safe_get(flight, ['departure', 'scheduledTime', 'local'], '')
        result['departure_actual_local'] = (
            safe_get(flight, ['departure', 'runwayTime', 'local']) or 
            safe_get(flight, ['departure', 'revisedTime', 'local'], '')
        )
        
        result['arrival_scheduled_local'] = safe_get(flight, ['arrival', 'scheduledTime', 'local'], '')
        result['arrival_actual_local'] = (
            safe_get(flight, ['arrival', 'runwayTime', 'local']) or 
            safe_get(flight, ['arrival', 'revisedTime', 'local']) or
            safe_get(flight, ['arrival', 'predictedTime', 'local'], '')
        )
        
        # Additional info
        result['departure_terminal'] = departure_info.get('terminal', '')
        result['departure_gate'] = departure_info.get('gate', '')
        result['arrival_terminal'] = arrival_info.get('terminal', '')
        
        # Aircraft details
        aircraft_model = safe_get(flight, ['aircraft', 'model'], '')
        aircraft_reg = safe_get(flight, ['aircraft', 'reg'], '')
        result['aircraft_info'] = f"{aircraft_model}{f' ({aircraft_reg})' if aircraft_reg else ''}"
        
        return result
    
    @staticmethod
    def _parse_time(time_str):
        """Parse a time string to a datetime object, handling different formats."""
        if not time_str:
            return None
        
        # Remove Z suffix if present
        if time_str.endswith('Z'):
            time_str = time_str[:-1]
        
        # Try different datetime formats
        formats = [
            "%Y-%m-%d %H:%M",  # 2025-01-01 07:55
            "%Y-%m-%d %H:%M:%S"  # 2025-01-01 07:55:00
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(time_str, fmt)
            except ValueError:
                continue
        
        return None
    
    @staticmethod
    def _calculate_delay_statistics(delays):
        """Calculate statistics for a list of delays."""
        if not delays:
            return {
                "average_delay_minutes": 0,
                "median_delay_minutes": 0,
                "on_time_percentage": 0,
                "delayed_percentage": 0,
                "delay_buckets": {
                    "slight_delay_15_30min": 0,
                    "moderate_delay_30_60min": 0,
                    "severe_delay_60min_plus": 0
                }
            }
        
        # Sort delays for percentile calculations
        sorted_delays = sorted(delays)
        
        # Average delay
        avg_delay = sum(delays) / len(delays)
        
        # Median delay
        middle = len(sorted_delays) // 2
        if len(sorted_delays) % 2 == 0:
            med_delay = (sorted_delays[middle-1] + sorted_delays[middle]) / 2
        else:
            med_delay = sorted_delays[middle]
        
        # On-time percentage (less than 15 minutes delay)
        on_time_count = sum(1 for delay in delays if delay < 15)
        on_time_pct = on_time_count / len(delays) * 100
        delayed_pct = 100 - on_time_pct
        
        # Delay buckets
        slight_delay = sum(1 for delay in delays if 15 <= delay < 30)
        moderate_delay = sum(1 for delay in delays if 30 <= delay < 60)
        severe_delay = sum(1 for delay in delays if delay >= 60)
        
        slight_delay_pct = slight_delay / len(delays) * 100
        moderate_delay_pct = moderate_delay / len(delays) * 100
        severe_delay_pct = severe_delay / len(delays) * 100
        
        return {
            "average_delay_minutes": round(avg_delay, 1),
            "median_delay_minutes": round(med_delay, 1),
            "on_time_percentage": round(on_time_pct, 1),
            "delayed_percentage": round(delayed_pct, 1),
            "delay_buckets": {
                "slight_delay_15_30min": round(slight_delay_pct, 1),
                "moderate_delay_30_60min": round(moderate_delay_pct, 1),
                "severe_delay_60min_plus": round(severe_delay_pct, 1)
            }
        }


class FlightDataAnalyzer:
    """Analyze flight data and calculate combined metrics."""
    
    @staticmethod
    def combine_statistics(historical_data, recent_data):
        """
        Combine historical and recent flight data into a unified format.
        
        Args:
            historical_data: Processed historical statistics
            recent_data: Processed recent flight data
            
        Returns:
            dict: Combined flight data with data quality indicator
        """
        # Handle cases where both are None or empty
        if (historical_data is None or historical_data == []) and (recent_data is None or recent_data == []):
            print("  ⚠️ Both historical and recent data are missing or empty, using default reliability")
            return {
                "data_quality": "insufficient_data",
                "message": "No reliable data available for this flight"
            }
        
        # Handle the case where recent_data is an empty list (cached empty result)
        if recent_data == []:
            print("  ⚠️ Recent data is an empty cached list (likely from rate limiting)")
            recent_data = None
        
        # Case 1: Only historical data is available (missing recent)
        if historical_data and (recent_data is None or recent_data == []):
            print("  ⚠️ Only historical data available (recent data missing or rate-limited)")
            # Get historical flight count for logging
            total_hist_flights = historical_data.get("overall", {}).get("total_flights_analyzed", 0)
            print(f"  Historical flight count: {total_hist_flights}")
            return {
                "data_quality": "missing_recent",
                "overall": historical_data.get("overall", {}),
                "departure_options": historical_data.get("departure_options", []),
                "arrival_options": historical_data.get("arrival_options", [])
            }
        
        # Case 2: Only recent data is available (missing historical)
        if (historical_data is None or historical_data == []) and recent_data:
            # No historical data
            print("  ⚠️ No historical data available, using only recent statistics")
            # Capture total flights count from recent data for logging
            total_recent_flights = len(recent_data.get("individual_flights", []))
            print(f"  Recent flight count: {total_recent_flights}")
            
            return {
                "data_quality": "missing_historical",
                "delay_statistics": recent_data.get("delay_statistics", {}),
                "individual_flights": recent_data.get("individual_flights", []),
                "total_flights": recent_data.get("total_flights", 0)
            }
        
        # Create a new results dictionary for the case where we have both data sources
        combined = {
            "flight_number": historical_data.get("flight_number") or recent_data.get("flight_number"),
            "airline": recent_data.get("airline", "Unknown"),
            "route": recent_data.get("route", "Unknown"),
            "data_quality": "complete",  # Add data quality flag
            "data_sources": {
                "historical": {
                    "total_flights": historical_data.get("overall", {}).get("total_flights_analyzed", 0),
                    "date_range": historical_data.get("overall", {}).get("overall_date_range", "Unknown"),
                },
                "recent": {
                    "total_flights": recent_data.get("total_flights", 0),
                    "date_range": recent_data.get("date_range", "Unknown"),
                }
            },
            "combined_statistics": {},
            "individual_flights": recent_data.get("individual_flights", [])
        }
        
        # Combine delay metrics
        # Check what type of historical data we have (arrival or departure)
        historical_data_type = historical_data.get("overall", {}).get("data_type", "departure")
        
        # Extract historical delay percentage based on data type
        if historical_data_type == "arrival":
            historical_delay = historical_data.get("overall", {}).get("overall_delayed_percentage", 0)
            print(f"  Using historical ARRIVAL delays ({historical_delay}%)")
        else:
            historical_delay = historical_data.get("overall", {}).get("overall_delayed_percentage", 0)
            print(f"  Using historical DEPARTURE delays ({historical_delay}%)")
        
        # Extract delay percentages from recent data - always prioritize arrival
        recent_arrival_delay = recent_data.get("delay_statistics", {}).get("arrival", {}).get("delayed_percentage", 0)
        
        # If arrival data is missing, use departure as fallback
        if recent_arrival_delay == 0 and "departure" in recent_data.get("delay_statistics", {}):
            recent_overall_delay = recent_data.get("delay_statistics", {}).get("departure", {}).get("delayed_percentage", 0)
            print(f"  Using recent DEPARTURE delays ({recent_overall_delay}%)")
        else:
            recent_overall_delay = recent_arrival_delay
            print(f"  Using recent ARRIVAL delays ({recent_overall_delay}%)")
        
        # Apply weights
        weighted_delay = (historical_delay * HISTORICAL_WEIGHT + recent_overall_delay * RECENT_WEIGHT)
        
        # Extract delay buckets
        hist_buckets = {}
        
        # Choose between arrival and departure metrics for historical data
        if historical_data_type == "arrival" and historical_data.get("arrival_options"):
            # Use arrival options when available
            print("  Using historical arrival delay buckets")
            for option in historical_data.get("arrival_options", []):
                for bucket_key, value in option.get("delay_buckets", {}).items():
                    if bucket_key not in hist_buckets:
                        hist_buckets[bucket_key] = 0
                    hist_buckets[bucket_key] += value * option.get("flights_analyzed", 0)
                    
            # Normalize historical buckets by total flights
            total_hist_flights = historical_data.get("overall", {}).get("total_flights_analyzed", 0)
            
            # Log historical flight count for information
            print(f"  Historical flight count: {total_hist_flights}")
            
        else:
            # Fall back to departure options
            print("  Using historical departure delay buckets")
            for option in historical_data.get("departure_options", []):
                for bucket_key, value in option.get("delay_buckets", {}).items():
                    if bucket_key not in hist_buckets:
                        hist_buckets[bucket_key] = 0
                    hist_buckets[bucket_key] += value * option.get("flights_analyzed", 0)
            
            # Normalize historical buckets by total flights
            total_hist_flights = historical_data.get("overall", {}).get("total_flights_analyzed", 0)
        
        # Normalize historical buckets
        if total_hist_flights > 0:
            for key in hist_buckets:
                hist_buckets[key] = hist_buckets[key] / total_hist_flights
        
        # Get recent buckets - prioritize arrival buckets
        if recent_data.get("delay_statistics", {}).get("arrival", {}).get("delay_buckets"):
            print("  Using recent arrival delay buckets")
            recent_buckets = recent_data.get("delay_statistics", {}).get("arrival", {}).get("delay_buckets", {})
        else:
            print("  Using recent departure delay buckets")
            recent_buckets = recent_data.get("delay_statistics", {}).get("departure", {}).get("delay_buckets", {})
        
        # Calculate combined buckets
        combined_buckets = {}
        for key in hist_buckets:
            recent_value = recent_buckets.get(key, 0)
            combined_buckets[key] = hist_buckets[key] * HISTORICAL_WEIGHT + recent_value * RECENT_WEIGHT
        
        # Build combined statistics
        combined["combined_statistics"] = {
            "overall_delay_percentage": round(weighted_delay, 1),
            "delay_buckets": {k: round(v, 1) for k, v in combined_buckets.items()},
            "recent_metrics": {
                "departure": recent_data.get("delay_statistics", {}).get("departure", {}),
                "arrival": recent_data.get("delay_statistics", {}).get("arrival", {})
            },
            "historical_metrics": {
                "overall_delayed_percentage": historical_delay
            }
        }
        
        return combined
    
    @staticmethod
    def calculate_reliability_score(combined_data):
        """
        Calculate an overall reliability score from 0-100.
        
        Args:
            combined_data: Combined flight statistics
            
        Returns:
            int: Reliability score from 0-100, or None if data quality is insufficient
        """
        if not combined_data:
            # Instead of returning 0, return a neutral score for no data
            return 50
        
        # Check data quality
        data_quality = combined_data.get("data_quality", "unknown")
        
        # Handle case where we have insufficient data
        if data_quality == "insufficient_data":
            print("  ⚠️ Insufficient data for reliable scoring, using neutral score")
            return 50
            
        # Handle different data quality scenarios
        if data_quality == "missing_historical":
            # For missing historical data, use recent data with a confidence penalty
            # We'll cap the reliability score at 85 to indicate limited historical context
            print("  ⚠️ Reliability calculation uses only recent data (limited historical context)")
            
            if "delay_statistics" in combined_data:
                # Get number of flights to check data reliability
                # Check both individual_flights list and total_flights field
                num_flights = len(combined_data.get("individual_flights", []))
                # If individual_flights count is 0 but total_flights field has a value, use that instead
                if num_flights == 0:
                    num_flights = combined_data.get("total_flights", 0)
                
                print(f"  Flight count used for reliability calculation: {num_flights}")
                
                if num_flights < 3:
                    print(f"  ⚠️ Very limited data sample: Only {num_flights} recent flights")
                    # For very limited data, use a minimum baseline score
                    base_score = 60
                else:
                    base_score = 70
                
                # Use arrival delay percentage if available, otherwise use departure
                arrival_stats = combined_data.get("delay_statistics", {}).get("arrival", {})
                if arrival_stats:
                    print("  Using arrival statistics for reliability score")
                    
                    # Consider flights delayed by less than 15 minutes as on-time
                    on_time_pct = 100 - arrival_stats.get("delayed_percentage", 0)
                    on_time_within_15min = arrival_stats.get("delay_buckets", {}).get("on_time_within_15min", 0)
                    
                    # Add the percentage of flights that were slightly delayed (within 15 min) to on-time percentage
                    adjusted_on_time_pct = on_time_pct + on_time_within_15min
                    
                    # Get severity buckets from arrival
                    delay_buckets = arrival_stats.get("delay_buckets", {})
                    slight_delay = delay_buckets.get("slight_delay_15_30min", 0)
                    moderate_delay = delay_buckets.get("moderate_delay_30_60min", 0)
                    severe_delay = delay_buckets.get("severe_delay_60min_plus", 0)
                else:
                    print("  Using departure statistics for reliability score (no arrival data)")
                    departure_stats = combined_data.get("delay_statistics", {}).get("departure", {})
                    
                    # Consider flights delayed by less than 15 minutes as on-time
                    on_time_pct = 100 - departure_stats.get("delayed_percentage", 0)
                    on_time_within_15min = departure_stats.get("delay_buckets", {}).get("on_time_within_15min", 0)
                    
                    # Add the percentage of flights that were slightly delayed (within 15 min) to on-time percentage
                    adjusted_on_time_pct = on_time_pct + on_time_within_15min
                    
                    # Get severity buckets from departure
                    delay_buckets = departure_stats.get("delay_buckets", {})
                    slight_delay = delay_buckets.get("slight_delay_15_30min", 0)
                    moderate_delay = delay_buckets.get("moderate_delay_30_60min", 0)
                    severe_delay = delay_buckets.get("severe_delay_60min_plus", 0)
                
                # Calculate raw score with reduced penalties
                # Use adjusted on-time percentage that includes flights within 15 min tolerance
                # Reduce the penalty for slight delays (15-30min)
                severity_penalty = (slight_delay * 0.3 + moderate_delay * 1.0 + severe_delay * 2.5) / 100
                raw_score = adjusted_on_time_pct - (severity_penalty * 10)
                
                # Add explanation for very low scores
                if raw_score <= 20:
                    print(f"  ⚠️ Low reliability score due to: {100 - adjusted_on_time_pct}% delayed flights with severity breakdown: slight {slight_delay}%, moderate {moderate_delay}%, severe {severe_delay}%")
                
                # Apply confidence cap and minimum base score for missing historical data
                return min(85, max(base_score, round(raw_score)))
            else:
                # No arrival stats, very limited confidence
                print("  ⚠️ Cannot calculate reliable score - insufficient arrival data")
                return 60  # Neutral score indicating uncertainty but better than 0
        
        elif data_quality == "missing_recent":
            # Missing recent data - use historical with lowered confidence
            print("  ⚠️ Reliability calculation uses only historical data (no recent flights)")
            
            # Check historical data type
            historical_data_type = combined_data.get("overall", {}).get("data_type", "departure")
            
            # Get historical delay percentage 
            overall_delay = combined_data.get("overall", {}).get("overall_delayed_percentage", 0)
            
            if historical_data_type == "arrival" and combined_data.get("arrival_options"):
                print("  Using historical ARRIVAL data for reliability calculation")
                
                # Find the most recent arrival option for buckets
                arrival_options = combined_data.get("arrival_options", [])
                if arrival_options:
                    # Sort by date range to find most recent
                    sorted_options = sorted(
                        arrival_options, 
                        key=lambda x: x.get("date_range", "").split(" to ")[-1],
                        reverse=True
                    )
                    
                    # Get buckets from most recent option
                    delay_buckets = sorted_options[0].get("delay_buckets", {})
                    slight_delay = delay_buckets.get("slight_delay_15_30min", 0)
                    moderate_delay = delay_buckets.get("moderate_delay_30_60min", 0)
                    severe_delay = delay_buckets.get("severe_delay_60min_plus", 0)
                    
                    # Calculate with higher confidence (cap at 90)
                    on_time_pct = 100 - overall_delay
                    severity_penalty = (slight_delay * 0.5 + moderate_delay * 1.5 + severe_delay * 3) / 100
                    raw_score = on_time_pct - (severity_penalty * 10)
                    
                    return min(90, max(0, round(raw_score)))
                else:
                    # No detailed metrics
                    on_time_pct = 100 - overall_delay
                    return min(85, max(0, round(on_time_pct)))
            else:
                print("  Using historical DEPARTURE data for reliability calculation")
                
                # Find the most recent departure option for buckets
                departure_options = combined_data.get("departure_options", [])
                if departure_options:
                    # Sort by date range to find most recent
                    sorted_options = sorted(
                        departure_options, 
                        key=lambda x: x.get("date_range", "").split(" to ")[-1],
                        reverse=True
                    )
                    
                    # Get buckets from most recent option
                    delay_buckets = sorted_options[0].get("delay_buckets", {})
                    slight_delay = delay_buckets.get("slight_delay_15_30min", 0)
                    moderate_delay = delay_buckets.get("moderate_delay_30_60min", 0)
                    severe_delay = delay_buckets.get("severe_delay_60min_plus", 0)
                    
                    # Calculate with lower confidence (cap at 85)
                    on_time_pct = 100 - overall_delay
                    severity_penalty = (slight_delay * 0.5 + moderate_delay * 1.5 + severe_delay * 3) / 100
                    raw_score = on_time_pct - (severity_penalty * 10)
                    
                    return min(85, max(0, round(raw_score)))
                else:
                    # No detailed metrics
                    on_time_pct = 100 - overall_delay
                    return min(80, max(0, round(on_time_pct)))
        
        # For complete data, calculate normally
        overall_delay = combined_data.get("combined_statistics", {}).get("overall_delay_percentage", 0)
        
        # Get severity buckets
        delay_buckets = combined_data.get("combined_statistics", {}).get("delay_buckets", {})
        on_time_within_15min = delay_buckets.get("on_time_within_15min", 0)
        slight_delay = delay_buckets.get("slight_delay_15_30min", 0)
        moderate_delay = delay_buckets.get("moderate_delay_30_60min", 0)
        severe_delay = delay_buckets.get("severe_delay_60min_plus", 0)
        
        # Calculate weighted score with adjusted on-time percentage
        on_time_pct = 100 - overall_delay
        
        # Add flights within 15 min to on-time percentage
        adjusted_on_time_pct = on_time_pct + on_time_within_15min
        
        # Apply reduced penalties for more severe delays
        severity_penalty = (slight_delay * 0.3 + moderate_delay * 1.0 + severe_delay * 2.5) / 100
        
        # Calculate final score (0-100 scale)
        raw_score = adjusted_on_time_pct - (severity_penalty * 10)
        
        # Ensure score is in 0-100 range and never below 10 if we have any data
        return max(10, min(100, round(raw_score)))