"""
Main controller module that integrates route search and flight reliability analysis.
"""
from typing import List, Dict, Any, Optional
from .api.routes import get_flight_numbers_for_route
from .api.reliability import FlightDataAPI
from .models.reliability import FlightDataProcessor, FlightDataAnalyzer

class FlightAnalysisSystem:
    """Main controller class for the flight analysis system."""
    
    def __init__(self, api_key=None):
        """Initialize the flight analysis system."""
        self.reliability_api = FlightDataAPI(api_key)
    
    def analyze_flight(self, flight_number: str) -> Dict[str, Any]:
        """
        Analyze a single flight using both historical and recent data.
        
        Args:
            flight_number: Flight number to analyze
            
        Returns:
            dict: Combined flight analysis
        """
        print(f"\n--- Flight: {flight_number} ---")
        
        # Fetch data
        print(f"Historical data for {flight_number}:")
        historical_data = self.reliability_api.get_historical_delay_stats(flight_number)
        
        print(f"Recent data for {flight_number}:")
        recent_data = self.reliability_api.get_recent_flights(flight_number)
        
        # Process data
        processed_historical = FlightDataProcessor.process_historical_delay_stats(historical_data)
        processed_recent = FlightDataProcessor.process_recent_flight_data(recent_data)
        
        # Combine and analyze
        combined_data = FlightDataAnalyzer.combine_statistics(processed_historical, processed_recent)
        
        return combined_data
    
    def analyze_multiple_flights(self, flight_list: List[Dict[str, str]]) -> Dict[str, Dict[str, Any]]:
        """
        Analyze multiple flights.
        
        Args:
            flight_list: List of flight dictionaries with flight_number key
            
        Returns:
            dict: Dictionary of flight analyses keyed by flight number
        """
        results = {}
        
        print(f"\n===== Processing {len(flight_list)} flights =====")
        
        # Process each flight sequentially 
        for flight in flight_list:
            flight_number = flight["flight_number"]
            print(f"\n--- Flight: {flight_number} ({flight.get('airline', 'Unknown')}) ---")
            
            # Get historical data
            print(f"Historical data for {flight_number}:")
            historical_data = self.reliability_api.get_historical_delay_stats(flight_number)
            
            # Get recent data
            print(f"Recent data for {flight_number}:")
            recent_data = self.reliability_api.get_recent_flights(flight_number)
            
            # Process data
            processed_historical = FlightDataProcessor.process_historical_delay_stats(historical_data)
            processed_recent = FlightDataProcessor.process_recent_flight_data(recent_data)
            
            # Combine and analyze
            combined_data = FlightDataAnalyzer.combine_statistics(processed_historical, processed_recent)
            
            # Store results
            results[flight_number] = combined_data
            
        return results
    
    def get_ranked_flights_for_route(self, 
                                    origin: str, 
                                    destination: str, 
                                    date: Optional[str] = None, 
                                    max_routes: int = 5, 
                                    max_connections: int = 2, 
                                    use_cache: bool = True) -> Dict[str, Any]:
        """
        Find and analyze flights for a specific route, combining route and reliability data.
        
        Args:
            origin: Origin airport IATA code (e.g., "AMS")
            destination: Destination airport IATA code (e.g., "LHE")
            date: Optional specific date in YYYY-MM-DD format
            max_routes: Maximum number of routes to return 
            max_connections: Maximum number of connections allowed
            use_cache: Whether to use cached results
            
        Returns:
            dict: Dictionary with route options and their reliability analysis
        """
        # Step 1: Get flight routes for the desired origin/destination
        print(f"Finding route options from {origin} to {destination}...")
        route_results = get_flight_numbers_for_route(
            origin=origin,
            destination=destination,
            date=date,
            max_routes=max_routes,
            max_connections=max_connections,
            use_cache=use_cache
        )
        
        # Handle errors or empty results
        if "error" in route_results:
            return {"error": route_results["error"]}
        
        if not route_results.get("routes"):
            return {
                "query": route_results.get("query", {}),
                "routes": [],
                "message": "No flights found for this route."
            }
        
        # Step 2: Extract flight numbers and prepare for reliability analysis
        flight_list = []
        for route in route_results.get("routes", []):
            for flight_number in route.get("operating_flight_numbers", []):
                flight_list.append({
                    "flight_number": flight_number,
                    "airline": route.get("operating_airline", "Unknown"),
                })
        
        # Step 3: Analyze reliability of each flight
        print(f"Analyzing reliability for {len(flight_list)} flights...")
        reliability_results = self.analyze_multiple_flights(flight_list)
        
        # Step 4: Combine route and reliability data
        enhanced_routes = []
        
        for route in route_results.get("routes", []):
            enhanced_route = route.copy()
            
            # Calculate route reliability score (average of all flights in the route)
            flight_scores = []
            reliability_data = []
            
            for flight_number in route.get("operating_flight_numbers", []):
                if flight_number in reliability_results:
                    flight_data = reliability_results[flight_number]
                    reliability_score = FlightDataAnalyzer.calculate_reliability_score(flight_data)
                    flight_scores.append(reliability_score)
                    
                    # Get delay percentage
                    if flight_data.get("data_quality") == "complete":
                        delay_pct = flight_data.get("combined_statistics", {}).get("overall_delay_percentage")
                    elif flight_data.get("data_quality") == "missing_historical":
                        delay_stats = flight_data.get("delay_statistics", {}).get("arrival") or flight_data.get("delay_statistics", {}).get("departure", {})
                        delay_pct = delay_stats.get("delayed_percentage")
                    elif flight_data.get("data_quality") == "missing_recent":
                        delay_pct = flight_data.get("overall", {}).get("overall_delayed_percentage")
                    else:
                        delay_pct = None
                    
                    reliability_data.append({
                        "flight_number": flight_number,
                        "reliability_score": reliability_score,
                        "delay_percentage": delay_pct,
                        "data_quality": flight_data.get("data_quality", "unknown")
                    })
            
            # Calculate average reliability score for the route
            if flight_scores:
                avg_reliability = sum(flight_scores) / len(flight_scores)
                enhanced_route["reliability_score"] = round(avg_reliability)
            else:
                enhanced_route["reliability_score"] = None
            
            enhanced_route["reliability_data"] = reliability_data
            enhanced_routes.append(enhanced_route)
        
        # Sort routes by reliability score (if available), then by price
        sorted_routes = sorted(
            enhanced_routes,
            key=lambda r: (
                -(r.get("reliability_score") or 0),  # Higher reliability score first 
                float(r.get("price", {}).get("amount", "9999"))  # Lower price second
            )
        )
        
        # Construct final response
        return {
            "query": route_results.get("query", {}),
            "routes": sorted_routes
        }


def extract_flight_numbers_for_route(origin_iata: str, destination_iata: str) -> List[str]:
    """
    Utility function to get flight numbers for a route, for use in FastAPI.
    This is a simple wrapper around the route search functionality.
    
    Args:
        origin_iata: Origin airport IATA code
        destination_iata: Destination airport IATA code
    
    Returns:
        List of flight numbers operating on the route
    """
    from .api.routes import get_flight_numbers_for_route as get_route_flights
    
    route_results = get_route_flights(
        origin=origin_iata, 
        destination=destination_iata,
        max_routes=10,  # Get more routes to have a larger sample
        max_connections=2,
        use_cache=True
    )
    
    flight_numbers = []
    
    # Extract unique flight numbers from all returned routes
    for route in route_results.get("routes", []):
        for flight_number in route.get("operating_flight_numbers", []):
            if flight_number not in flight_numbers:
                flight_numbers.append(flight_number)
    
    return flight_numbers