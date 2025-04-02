"""
FastAPI backend for the Airline Route Ranker application.
"""
from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from .controller import FlightAnalysisSystem, extract_flight_numbers_for_route

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Airline Route Ranker API",
    description="API for analyzing and ranking flights by reliability on specific routes",
    version="1.0.0"
)

# Configure CORS to allow requests from frontend
origins = [
    "http://localhost:5173",  # Default SvelteKit dev port
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Additional Vite dev ports
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",  # Common development port
    "http://127.0.0.1:3000",
    # Add production URLs here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the flight analysis system
try:
    flight_system = FlightAnalysisSystem()
except ValueError as e:
    print(f"ERROR initializing FlightAnalysisSystem: {e}")
    flight_system = None


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "system_initialized": flight_system is not None}


@app.get("/api/rankings/{origin_iata}/{destination_iata}")
async def get_flight_rankings(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    max_routes: int = Query(5, ge=1, le=10),
    max_connections: int = Query(2, ge=0, le=3)
):
    """
    Get ranked flight reliability data for a specific route.
    
    Args:
        origin_iata: Origin airport IATA code (e.g., "LHR")
        destination_iata: Destination airport IATA code (e.g., "JFK")
        date: Optional specific date in YYYY-MM-DD format
        max_routes: Maximum number of routes to return (default: 5)
        max_connections: Maximum number of connections (default: 2)
        
    Returns:
        List of ranked flights with reliability scores
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    print(f"Received request for route: {origin_iata} -> {destination_iata}")

    try:
        # Get flight rankings from the analysis system
        result = flight_system.get_ranked_flights_for_route(
            origin=origin_iata,
            destination=destination_iata,
            date=date,
            max_routes=max_routes,
            max_connections=max_connections
        )
        
        # Handle errors
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result

    except Exception as e:
        print(f"Error processing route {origin_iata} -> {destination_iata}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred processing the request: {e}")


@app.get("/api/flight/{flight_number}")
async def get_flight_reliability(
    flight_number: str = Path(..., regex="^[A-Z0-9]{2,8}$")
):
    """
    Get reliability data for a specific flight number.
    
    Args:
        flight_number: The flight number to analyze (e.g., "BA123")
        
    Returns:
        Flight reliability data
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    try:
        flight_data = flight_system.analyze_flight(flight_number)
        
        if not flight_data:
            raise HTTPException(status_code=404, detail=f"No data found for flight {flight_number}")
            
        # Add reliability score
        from .models.reliability import FlightDataAnalyzer
        reliability_score = FlightDataAnalyzer.calculate_reliability_score(flight_data)
        flight_data["reliability_score"] = reliability_score
        
        return flight_data
        
    except Exception as e:
        print(f"Error analyzing flight {flight_number}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred processing the request: {e}")