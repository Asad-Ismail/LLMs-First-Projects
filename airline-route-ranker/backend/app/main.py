# backend/app/main.py (Simplified Example)
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware # To allow frontend requests
import os
from typing import List, Dict, Any

# Assume your classes are importable
from .controller import FlightAnalysisSystem
from .utils import get_flight_numbers_for_route # You need to implement this!
# from .models import FlightRankingResponse # Define Pydantic models for good practice

app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
# Allows your frontend (running on a different port/domain) to call the backend
origins = [
    "http://localhost:5173", # Default SvelteKit dev port
    "http://127.0.0.1:5173",
    # Add your production frontend URL here later
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your system (consider dependency injection for cleaner code)
# Ensure API key is loaded correctly (e.g., via .env file)
try:
    flight_system = FlightAnalysisSystem()
except ValueError as e:
    print(f"ERROR initializing FlightAnalysisSystem: {e}")
    # Handle missing API key gracefully if needed, maybe disable endpoint
    flight_system = None

@app.get("/api/rankings/{origin_iata}/{destination_iata}", response_model=List[Dict[str, Any]]) # Use a Pydantic model ideally
async def get_flight_rankings(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$")
):
    """
    Gets ranked flight reliability data for a specific route.
    """
    if flight_system is None:
         raise HTTPException(status_code=503, detail="Backend system not initialized (check API key?)")

    print(f"Received request for route: {origin_iata} -> {destination_iata}")

    try:
        # 1. Get flight numbers for the route (Implement this!)
        flight_numbers_on_route = get_flight_numbers_for_route(origin_iata, destination_iata)
        print(f"Found flight numbers: {flight_numbers_on_route}")

        if not flight_numbers_on_route:
            return [] # Return empty list if no flights found for the route

        # 2. Prepare flight list for batch analysis
        flight_list = [{"flight_number": fn} for fn in flight_numbers_on_route]

        # 3. Analyze flights using your existing system
        # Consider running analyze_multiple_flights potentially async if it's I/O bound
        # For simplicity now, running it synchronously
        analyzed_data = flight_system.analyze_multiple_flights(flight_list)
        print(f"Analyzed {len(analyzed_data)} flights.")

        # 4. Add reliability score and prepare results
        results = []
        for flight_num, data in analyzed_data.items():
            if data: # Ensure data was successfully retrieved and processed
                score = FlightDataAnalyzer.calculate_reliability_score(data)
                # Select key info for the frontend summary card
                summary = {
                    "flight_number": data.get("flight_number", flight_num),
                    "airline": data.get("airline", "Unknown"),
                    "route": data.get("route", f"{origin_iata} -> {destination_iata}"), # Add route info if missing
                    "reliability_score": score,
                    "overall_delay_percentage": data.get("combined_statistics", {}).get("overall_delay_percentage", None),
                     # Add more fields as needed for the card (e.g., data quality)
                    "data_quality": data.get("data_quality", "unknown"),
                    # Optionally include full data for a details view
                    # "full_data": data
                }
                results.append(summary)
            else:
                 print(f"No combined data found for {flight_num}")


        # 5. Sort results by reliability score (descending)
        ranked_results = sorted(results, key=lambda x: x.get('reliability_score', 0), reverse=True)

        return ranked_results

    except Exception as e:
        print(f"Error processing route {origin_iata} -> {destination_iata}: {e}")
        # Log the full error traceback for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred processing the request: {e}")

# Add a simple health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "system_initialized": flight_system is not None}

# Remember to implement get_flight_numbers_for_route in utils.py!
# Example (very basic, replace with real logic):
# def get_flight_numbers_for_route(origin, dest):
#     mapping = {
#         "LHR-JFK": ["BA177", "VS3", "AA101", "DL1"],
#         "SFO-LAX": ["UA555", "AA222", "DL888"]
#     }
#     return mapping.get(f"{origin}-{dest}", [])