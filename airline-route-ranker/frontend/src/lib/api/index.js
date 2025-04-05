// Re-export everything from the API file
export * from '../api.js';

// If for some reason the API_BASE_URL isn't set through environment variables,
// make sure we have a hardcoded fallback that will definitely work
import { API_BASE_URL } from '../api.js';

if (!API_BASE_URL || API_BASE_URL === 'http://localhost:8000') {
  console.warn('API_BASE_URL not properly set through environment variables, using hardcoded fallback');
  // @ts-ignore - Override the API_BASE_URL if it's not set
  window.API_BASE_URL_OVERRIDE = 'https://airline-route-reliability.onrender.com';
} 