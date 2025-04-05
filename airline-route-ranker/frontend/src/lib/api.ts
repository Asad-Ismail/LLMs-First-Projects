/**
 * API interface for the Airline Route Ranker backend
 */

// The backend API URL (use environment variables for production)
let apiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

// TEMPORARILY HARDCODED API KEY FOR TESTING
// Remove this hardcoding after confirming it works
const apiKey = '84c8ebf0be891caf5da18af655c8ba18';  // Hardcoded production API key

// Debug logging - don't show the full key
console.log('Using API key from hardcoded value (first 5 chars):', apiKey.substring(0, 5) + '...');
console.log('API key length:', apiKey.length);

// Remove any quotes that might be included in the URL string
if (typeof apiBaseUrl === 'string') {
  // This handles both cases:
  // 1. When the URL has quotes around it: "https://example.com"
  // 2. Or when the URL is already clean: https://example.com
  // The regex only replaces if there are quotes at beginning and end
  apiBaseUrl = apiBaseUrl.replace(/^["'](.+)["']$/, '$1');
}

export const API_BASE_URL = apiBaseUrl;

console.log('API_BASE_URL from env:', import.meta.env.PUBLIC_API_BASE_URL);
console.log('Final API_BASE_URL being used:', API_BASE_URL);

// Default headers to use for all API requests
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'X-API-Key': apiKey
};

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
  // Set max_routes to 5 (default backend value)
  params.append('max_routes', '5');
  
  // Add params to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  console.log(`Fetching data from: ${url}`);

  try {
    // Make the API request
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: DEFAULT_HEADERS
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Handle HTTP errors
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
    
    // Parse and return the data
    const data = await response.json();
    console.log("Received data:", data);
    return data;
  } catch (error: unknown) {
    console.error(`Error fetching from ${url}:`, error);
    throw new Error(`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch health status from the backend API
 * 
 * @returns Promise with the health status response
 */
export async function fetchHealthStatus(): Promise<{status: string, system_initialized: boolean}> {
  try {
    const url = `${API_BASE_URL}/api/health`;
    console.log(`Checking health status at: ${url}`);
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: DEFAULT_HEADERS
    });
    
    console.log(`Health check response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Health check data:", data);
    return data;
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
  
  console.log(`Fetching available dates from: ${url}`);
  console.log(`Using API key: ${apiKey.substring(0, 5)}...`);
  console.log(`Request headers:`, DEFAULT_HEADERS);
  
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: DEFAULT_HEADERS
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // If unauthorized, log more details about the API key issue
    if (response.status === 401) {
      console.error('API Key authentication failed. Check that the API key matches between frontend and backend.');
      return [];
    }
    
    // Handle any status code (including 404) since we modified the backend
    // to always return a valid response with available_dates array
    const data = await response.json();
    return data.available_dates || [];
  } catch (error) {
    console.warn('Error fetching available dates:', error);
    // Check if error is related to CORS
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('CORS error: This is likely a CORS policy issue. Check that the backend is properly configured to allow requests from this origin.');
    }
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
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        ...DEFAULT_HEADERS,
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