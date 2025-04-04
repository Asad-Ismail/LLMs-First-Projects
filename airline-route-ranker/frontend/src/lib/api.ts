/**
 * API interface for the Airline Route Ranker backend
 */

// The backend API URL (use environment variables for production)
export const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';
console.log('API_BASE_URL:', API_BASE_URL);

// Flight reliability data for a single flight in a route
export interface FlightReliabilityData {
  flight_number: string;
  reliability_score: number;
  delay_percentage: number | null;
  data_quality: 'complete' | 'missing_historical' | 'missing_recent' | 'unknown';
  historical_flight_count?: number;
  recent_flight_count?: number;
}

// Price information
export interface PriceInfo {
  amount: string;
  currency: string;
}

// Route information with reliability data
export interface RouteData {
  rank: number;
  route_path: string;
  operating_airline: string;
  operating_flight_numbers: string[];
  total_duration: string;
  duration_raw_minutes: number;
  price: PriceInfo;
  source_offer_id: string;
  reliability_score: number;
  reliability_data: FlightReliabilityData[];
}

// Query information
export interface QueryInfo {
  origin: string;
  destination: string;
  date: string;
  filters_applied: string[];
}

// Complete route ranking response
export interface RouteRankingResponse {
  query: QueryInfo;
  routes: RouteData[];
  error?: string;
  message?: string;
}

// Contact form data
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Contact form response
export interface ContactFormResponse {
  status: 'success' | 'error';
  message: string;
}

/**
 * Fetch route rankings from the backend API
 * 
 * @param origin Origin airport IATA code
 * @param destination Destination airport IATA code
 * @param date Optional specific date in YYYY-MM-DD format
 * @returns Promise with the route ranking response
 */
export async function fetchRouteRankings(
  origin: string, 
  destination: string, 
  date?: string
): Promise<RouteRankingResponse> {
  // Build the URL with optional date parameter
  let url = `${API_BASE_URL}/api/rankings/${origin.toUpperCase()}/${destination.toUpperCase()}`;
  
  // Add query parameters
  const params = new URLSearchParams();
  if (date) {
    params.append('date', date);
  }
  // Set max_routes to 10 instead of default 5
  params.append('max_routes', '10');
  
  // Add params to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  // Make the API request
  const response = await fetch(url);
  
  // Handle HTTP errors
  if (!response.ok) {
    let errorDetail = `HTTP error ${response.status}`;
    try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
    } catch (e) { /* Ignore if response body isn't JSON */ }
    throw new Error(errorDetail);
  }
  
  // Parse and return the data
  return await response.json();
}

/**
 * Fetch health status from the backend API
 * 
 * @returns Promise with the health status response
 */
export async function fetchHealthStatus(): Promise<{status: string, system_initialized: boolean}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Health check failed:', error);
    return { status: 'error', system_initialized: false };
  }
}

/**
 * Check for available cached dates for a route
 * 
 * @param origin Origin airport IATA code
 * @param destination Destination airport IATA code
 * @returns Promise with an array of available dates in YYYY-MM-DD format
 */
export async function fetchAvailableDates(
  origin: string,
  destination: string
): Promise<string[]> {
  const url = `${API_BASE_URL}/api/cache/dates/${origin.toUpperCase()}/${destination.toUpperCase()}`;
  
  try {
    const response = await fetch(url);
    
    // Handle any status code (including 404) since we modified the backend
    // to always return a valid response with available_dates array
    const data = await response.json();
    return data.available_dates || [];
  } catch (error) {
    console.warn('Error fetching available dates:', error);
    return [];
  }
}

/**
 * Submit a contact form to the backend API
 * 
 * @param formData The contact form data
 * @returns Promise with the contact form response
 */
export async function submitContactForm(
  formData: ContactFormData
): Promise<ContactFormResponse> {
  const url = `${API_BASE_URL}/api/contact`;
  
  console.log(`Submitting contact form to: ${url}`);
  console.log("Form data:", JSON.stringify(formData));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorDetail = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        console.error("Error response data:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (e) { 
        console.error("Failed to parse error JSON:", e);
      }
      throw new Error(errorDetail);
    }
    
    const result = await response.json();
    console.log("Response data:", result);
    return result;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}