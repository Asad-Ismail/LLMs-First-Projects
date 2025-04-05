"""
FastAPI backend for the Airline Route Ranker application.
"""
from fastapi import FastAPI, HTTPException, Path, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import glob
from pathlib import Path as PathLib
from pydantic import BaseModel, EmailStr, Field

from .controller import FlightAnalysisSystem, extract_flight_numbers_for_route
from .utils.email import send_contact_email

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
    "https://airline-route-ranker.onrender.com",  # Production frontend on Render
    "https://flights-reliablity-fe.onrender.com",  # Actual frontend domain
    "https://*.onrender.com",  # Wildcard for any Render subdomain
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


# Contact form model for validation
class ContactForm(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(...)
    subject: str = Field(..., min_length=3, max_length=100)
    message: str = Field(..., min_length=10, max_length=5000)


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "system_initialized": flight_system is not None}


@app.post("/api/contact")
async def submit_contact_form(contact: ContactForm = Body(...)):
    """
    Handle a contact form submission.
    
    Args:
        contact: The contact form data
        
    Returns:
        Status of the submission
    """
    try:
        # Send email - using the imported function directly
        success = send_contact_email(
            name=contact.name,
            email=contact.email,
            subject=contact.subject,
            message=contact.message
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email. Please try again later.")
            
        return {
            "status": "success", 
            "message": "Thank you for your message! We'll get back to you soon."
        }
        
    except Exception as e:
        print(f"Error processing contact form: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/api/rankings/{origin_iata}/{destination_iata}")
async def get_flight_rankings(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    max_routes: int = Query(5, ge=1, le=10),
    max_connections: int = Query(2, ge=0, le=3),
    use_cache: bool = Query(True, description="Whether to use cached results if available")
):
    """
    Get ranked flight reliability data for a specific route.
    
    Args:
        origin_iata: Origin airport IATA code (e.g., "LHR")
        destination_iata: Destination airport IATA code (e.g., "JFK")
        date: Optional specific date in YYYY-MM-DD format
        max_routes: Maximum number of routes to return (default: 5)
        max_connections: Maximum number of connections (default: 2)
        use_cache: Whether to use cached results (default: True)
        
    Returns:
        List of ranked flights with reliability scores
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    print(f"Received request for route: {origin_iata} -> {destination_iata}")
    
    # Log the date parameter
    if date:
        print(f"User specified date: {date}")
    else:
        print("No date specified, will use default date")

    try:
        # Check if we have cached results for this route before making the API call
        if use_cache:
            from .utils.cache import get_base_cache_dir
            route_cache_dir = get_base_cache_dir() / "routes"
            # We'll check for existing cache files for this route
            pattern = f"{origin_iata.upper()}-{destination_iata.upper()}-*.json"
            cache_files = list(route_cache_dir.glob(pattern))
            
            if cache_files:
                cache_dates = []
                for cache_file in cache_files:
                    try:
                        # Extract date from filename (FORMAT: ORIGIN-DESTINATION-YYYY-MM-DD.json)
                        filename = cache_file.name
                        parts = filename.split('-')
                        if len(parts) >= 3:
                            date_part = parts[2].split('.')[0]
                            if len(parts) > 3:
                                date_part = '-'.join(parts[2:]).split('.')[0]
                            cache_dates.append(date_part)
                    except Exception:
                        continue
                
                if cache_dates:
                    print(f"Found cached results for route {origin_iata}-{destination_iata} with dates: {', '.join(cache_dates)}")
                    # If user specified a date, check if it's cached
                    if date and date in cache_dates:
                        print(f"Will use cached data for the requested date: {date}")
                    # If no date specified and we have cache, will use the most recent cached date
                    elif not date:
                        print(f"Will use cache with available dates: {', '.join(cache_dates)}")
        
        # Get flight rankings from the analysis system
        result = flight_system.get_ranked_flights_for_route(
            origin=origin_iata,
            destination=destination_iata,
            date=date,
            max_routes=max_routes,
            max_connections=max_connections,
            use_cache=use_cache
        )
        
        # Log what date was actually used in the response
        if result and "query" in result and "date" in result["query"]:
            used_date = result["query"]["date"]
            if date and used_date == date:
                print(f"Used user-specified date: {used_date}")
            else:
                print(f"Used date in response: {used_date}")
                if date and date != used_date:
                    print(f"NOTE: This differs from user-requested date: {date}")
        
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
    flight_number: str = Path(..., regex="^[A-Z0-9]{2,8}$"),
    use_cache: bool = Query(True, description="Whether to use cached results if available")
):
    """
    Get reliability data for a specific flight number.
    
    Args:
        flight_number: The flight number to analyze (e.g., "BA123")
        use_cache: Whether to use cached results (default: True)
        
    Returns:
        Flight reliability data
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    try:
        flight_data = flight_system.analyze_flight(flight_number, use_cache=use_cache)
        
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


@app.get("/api/cache/dates/{origin_iata}/{destination_iata}")
async def get_available_cached_dates(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
):
    """
    Retrieve available dates for cached route data.
    
    Args:
        origin_iata: Origin airport IATA code
        destination_iata: Destination airport IATA code
        
    Returns:
        List of available dates in the cache for this route
    """
    try:
        # Get cache directory for routes
        from .utils.cache import get_base_cache_dir
        
        base_dir = get_base_cache_dir() / "routes"
        
        # Look for cache files with this route pattern
        pattern = f"{origin_iata.upper()}-{destination_iata.upper()}-*.json"
        cache_files = list(base_dir.glob(pattern))
        
        available_dates = []
        for cache_file in cache_files:
            # Extract date from filename (FORMAT: ORIGIN-DESTINATION-YYYY-MM-DD.json)
            try:
                # The filename structure should be ORIGIN-DEST-DATE.json
                filename = cache_file.name
                parts = filename.split('-')
                
                # Make sure we have at least 3 parts (origin, dest, and date)
                if len(parts) >= 3:
                    # Last part is DATE.json, so extract the date portion
                    date_part = parts[2].split('.')[0]
                    
                    # Handle combined date format (could be more parts)
                    if len(parts) > 3:
                        date_part = '-'.join(parts[2:]).split('.')[0]
                        
                    available_dates.append(date_part)
            except Exception as e:
                print(f"Error parsing date from cache file {cache_file}: {e}")
                continue
        
        # Return empty list instead of raising 404 when no dates found
        return {"available_dates": available_dates}
    
    except Exception as e:
        print(f"Error retrieving cached dates for {origin_iata}-{destination_iata}: {e}")
        return {"available_dates": []}