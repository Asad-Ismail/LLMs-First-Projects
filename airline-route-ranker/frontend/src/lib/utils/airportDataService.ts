import { airports as localAirports, type Airport } from '$lib/data/airports';

// This service abstracts the data source for airport data
// Currently uses local data, but can be extended to use Supabase or any other backend

// Flag to control whether to use local data or Supabase
// In production, this would be controlled by environment variables
const USE_LOCAL_DATA = true; 

/**
 * Get all airports
 * In the future, this could fetch from Supabase
 */
export async function getAllAirports(): Promise<Airport[]> {
  if (USE_LOCAL_DATA) {
    // Return local data with a small artificial delay to simulate API
    return new Promise(resolve => {
      setTimeout(() => resolve(localAirports), 100);
    });
  } else {
    // TODO: When Supabase is integrated, fetch from there
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('airports')
    //   .select('*')
    //   .order('iata');
    
    // if (error) throw new Error(`Error fetching airports: ${error.message}`);
    // return data as Airport[];
    
    // For now, return local data
    return Promise.resolve(localAirports);
  }
}

/**
 * Search airports by query
 * This is a placeholder for future Supabase text search
 */
export async function searchAirportsFromDB(query: string): Promise<Airport[]> {
  if (!query) return [];
  
  if (USE_LOCAL_DATA) {
    // Use the local data and filter in memory
    const normalizedQuery = query.toUpperCase();
    const results = localAirports.filter(airport => 
      airport.iata.includes(normalizedQuery) ||
      airport.name.toUpperCase().includes(normalizedQuery) ||
      airport.city.toUpperCase().includes(normalizedQuery)
    );
    
    // Add artificial delay to simulate API
    return new Promise(resolve => {
      setTimeout(() => resolve(results), 100);
    });
  } else {
    // TODO: When Supabase is integrated, use text search
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('airports')
    //   .select('*')
    //   .or(`iata.ilike.%${query}%, name.ilike.%${query}%, city.ilike.%${query}%`)
    //   .order('iata')
    //   .limit(10);
    
    // if (error) throw new Error(`Error searching airports: ${error.message}`);
    // return data as Airport[];
    
    // For now, filter local data
    const normalizedQuery = query.toUpperCase();
    const results = localAirports.filter(airport => 
      airport.iata.includes(normalizedQuery) ||
      airport.name.toUpperCase().includes(normalizedQuery) ||
      airport.city.toUpperCase().includes(normalizedQuery)
    );
    
    return Promise.resolve(results);
  }
}

/**
 * Get a single airport by IATA code
 */
export async function getAirportByCode(iataCode: string): Promise<Airport | null> {
  if (!iataCode) return null;
  
  const normalizedCode = iataCode.toUpperCase();
  
  if (USE_LOCAL_DATA) {
    const airport = localAirports.find(a => a.iata === normalizedCode);
    return Promise.resolve(airport || null);
  } else {
    // TODO: When Supabase is integrated, fetch by code
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('airports')
    //   .select('*')
    //   .eq('iata', normalizedCode)
    //   .single();
    
    // if (error && error.code !== 'PGRST116') {
    //   throw new Error(`Error fetching airport: ${error.message}`);
    // }
    
    // return data as Airport || null;
    
    // For now, use local data
    const airport = localAirports.find(a => a.iata === normalizedCode);
    return Promise.resolve(airport || null);
  }
}

/**
 * Initialize the service, preloading data if needed
 */
export async function initAirportService(): Promise<void> {
  if (!USE_LOCAL_DATA) {
    // This would be a good place to initialize Supabase
    // Or preload data into stores/cache
    console.log('Airport service initialized with external data source');
  }
  
  return Promise.resolve();
} 