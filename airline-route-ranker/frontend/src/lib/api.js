/**
 * API interface for the Airline Route Ranker backend
 */

// The backend API URL (use environment variables for production)
// First try window.API_BASE_URL_OVERRIDE (set by index.js if needed)
// Then try environment variable, then fallback to localhost
export const API_BASE_URL = 
  (typeof window !== 'undefined' && window.API_BASE_URL_OVERRIDE) || 
  import.meta.env.PUBLIC_API_BASE_URL || 
  'http://localhost:8000';

console.log('API_BASE_URL from env:', import.meta.env.PUBLIC_API_BASE_URL);
console.log('Final API_BASE_URL being used:', API_BASE_URL);

/**
 * Fetch route rankings from the backend API
 * 
 * @param {string} origin Origin airport IATA code
 * @param {string} destination Destination airport IATA code
 * @param {string} [date] Optional specific date in YYYY-MM-DD format
 * @returns {Promise<Object>} Promise with the route ranking response
 */
export async function fetchRouteRankings(origin, destination, date) {
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

  console.log(`Fetching data from: ${url}`);

  try {
    // Make the API request
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
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
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw new Error(`Failed to fetch: ${error.message}`);
  }
}

/**
 * Fetch health status from the backend API
 * 
 * @returns {Promise<Object>} Promise with the health status response
 */
export async function fetchHealthStatus() {
  try {
    const url = `${API_BASE_URL}/api/health`;
    console.log(`Checking health status at: ${url}`);
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
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
 * @param {string} origin Origin airport IATA code
 * @param {string} destination Destination airport IATA code
 * @returns {Promise<Array<string>>} Promise with an array of available dates in YYYY-MM-DD format
 */
export async function fetchAvailableDates(origin, destination) {
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
 * @param {Object} formData The contact form data
 * @returns {Promise<Object>} Promise with the contact form response
 */
export async function submitContactForm(formData) {
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