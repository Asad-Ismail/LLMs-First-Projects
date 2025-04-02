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

## 📈 API Data Sources

The application integrates with multiple flight data providers:

- [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)
- [GoFlightLabs](https://www.goflightlabs.com/flights-schedules)
- [Amadeus](https://developers.amadeus.com/)
- [Duffel](https://duffel.com/docs)
- [Kiwi.com API](https://tequila.kiwi.com/)

## 📷 Screenshots

*Coming soon*

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.