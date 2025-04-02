# Airline Route Ranker

![Flight Reliability Rankings](./frontend/static/plane-takeoff.svg)

A modern web application that helps travelers make informed decisions by providing route-specific flight reliability rankings.

## 📊 Key Features

- **Route-Specific Analysis**: Find the most reliable airlines for your specific route
- **Reliability Scores**: Compare flights based on comprehensive reliability metrics
- **Daily Updates**: Data refreshed regularly to provide current information
- **User-Friendly Interface**: Clean, intuitive design for quick route comparisons

## 🔍 Why Route-Based Rankings?

Research shows airlines offer significantly different levels of service depending on the route. Variations exist in:

- **Aircraft Types**: Routes may use different planes with varying amenities
- **Cabin Services**: Premium features often differ between long-haul and domestic routes
- **Reliability Factors**: On-time performance and cancellation rates vary by route
- **Competition Levels**: Routes with more competition often have better service quality

This application focuses on route-specific data rather than general airline ratings, giving you the information that matters for your particular journey.

## 🛠️ Tech Stack

- **Frontend**: SvelteKit with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Data Sources**: Integration with multiple flight data APIs

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- npm or yarn

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at http://localhost:5173

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requrirements.txt

# Start the backend server
uvicorn app.main:app --reload
```
API will be available at http://localhost:8000


### Backend Setup Details
  1. Install Dependencies

  First, install the required dependencies using pip:

  cd /home/asad/dev/LLMs-First-Projects/airline-route-ranker/backend
  pip install -r requirements.txt

  2. Set Up Environment Variables

  Create a .env file in the backend directory with your API keys:

  cd /home/asad/dev/LLMs-First-Projects/airline-route-ranker/backend

  Create a .env file with the following content (replace with your actual
  API keys):

  AMADUS_KEY=your_amadeus_api_key
  AMADUS_SECRET=your_amadeus_api_secret
  RAPIDAPI_KEY=your_rapidapi_key

  You'll need:
  - Amadeus API credentials for flight route searches (get from
  https://developers.amadeus.com/)
  - RapidAPI key for AeroDataBox access (get from
  https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

  3. Run the Backend Server

  Start the FastAPI server with Uvicorn:

  cd /home/asad/dev/LLMs-First-Projects/airline-route-ranker/backend
  uvicorn app.main:app --reload

  The server will start on http://localhost:8000 by default.

  4. Testing the API Endpoints

  You can test the API endpoints using:

  1. Web Browser: For simple GET requests
  2. Curl: For command-line testing
  3. FastAPI's Swagger UI: Available at http://localhost:8000/docs
  4. Postman: For more advanced testing

  Here are some example test requests:

  Health Check Endpoint

  curl http://localhost:8000/api/health

  Expected response:
  {"status":"ok","system_initialized":true}

  Flight Rankings for a Route

  curl http://localhost:8000/api/rankings/AMS/LHE

  This will return flight rankings from Amsterdam (AMS) to Lahore (LHE).
  You can try other airport pairs too.

  Individual Flight Reliability

  curl http://localhost:8000/api/flight/TK714

  This will return reliability data for Turkish Airlines flight TK714.

  5. Testing with the Frontend

  To test with the frontend:

  1. Make sure the backend is running on port 8000
  2. Start the frontend development server:

  cd /home/asad/dev/LLMs-First-Projects/airline-route-ranker/frontend
  npm run dev

  3. Open your browser to http://localhost:5173
  4. Use the search form to find flights between airports (e.g., AMS to
  LHE)

  6. Troubleshooting Tips

  - If you get API key errors, double-check your .env file
  - If the server won't start, make sure all dependencies are installed
  - For API response errors, check the backend terminal for detailed logs
  - The first request for a route may be slow as it needs to fetch data;
  subsequent requests will use the cache

  7. Development Notes

  - Any code changes will automatically reload thanks to the --reload flag
  - Cache files are stored in the backend/cache directory
  - The API has rate limits, so don't make too many requests in quick
  succession


## 📈 API Data Sources

The application integrates with multiple flight data providers:

- [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)
- [GoFlightLabs](https://www.goflightlabs.com/flights-schedules)
- [Amadeus](https://developers.amadeus.com/)
- [Duffel](https://duffel.com/docs)
- [Kiwi.com API](https://tequila.kiwi.com/)

## 📷 Screenshots

*Coming soon*


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.