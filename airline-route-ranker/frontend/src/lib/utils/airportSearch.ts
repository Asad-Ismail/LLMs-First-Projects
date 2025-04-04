import { airports, type Airport } from '$lib/data/airports';

// Calculate Levenshtein distance between two strings 
// (for fuzzy matching to handle misspellings)
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,        // deletion
        matrix[i][j - 1] + 1,        // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Search airports by IATA code, name, or city
// Returns a sorted list of matching airports with the best matches first
export function searchAirports(query: string): Airport[] {
  if (!query) return [];
  
  // Simple search for very short inputs (1-2 characters)
  if (query.length <= 2) {
    const normalizedQuery = query.toUpperCase();
    return airports.filter(airport => 
      airport.iata.startsWith(normalizedQuery) ||
      airport.name.toUpperCase().includes(normalizedQuery) ||
      airport.city.toUpperCase().includes(normalizedQuery)
    );
  }

  // For IATA code searches (exact 3 letter matches)
  if (query.length === 3) {
    const exactMatch = airports.find(airport => 
      airport.iata.toUpperCase() === query.toUpperCase()
    );
    
    if (exactMatch) {
      return [exactMatch];
    }
  }
  
  // For longer queries, use fuzzy matching
  const normalizedQuery = query.toUpperCase();
  
  // Calculate relevance scores for each airport
  const results = airports.map(airport => {
    // Check exact matches first (most relevant)
    const iataMatch = airport.iata.toUpperCase() === normalizedQuery;
    const nameStartMatch = airport.name.toUpperCase().startsWith(normalizedQuery);
    const cityStartMatch = airport.city.toUpperCase().startsWith(normalizedQuery);
    
    // Calculate fuzzy match scores (higher score = worse match)
    const iataDistance = levenshteinDistance(normalizedQuery, airport.iata.toUpperCase());
    const nameDistance = levenshteinDistance(normalizedQuery, airport.name.toUpperCase());
    const cityDistance = levenshteinDistance(normalizedQuery, airport.city.toUpperCase());
    
    // Lower score is better (0 is perfect match)
    const bestDistance = Math.min(iataDistance, nameDistance, cityDistance);
    
    // Calculate a relevance score (lower is better)
    let score = bestDistance;
    
    // Prioritize exact matches
    if (iataMatch) score -= 10;
    if (nameStartMatch) score -= 5;
    if (cityStartMatch) score -= 5;
    
    return { airport, score };
  });
  
  // Sort by score (lower is better) and filter out poor matches
  const maxDistance = query.length <= 3 ? 2 : Math.ceil(query.length / 2);
  const filteredResults = results
    .filter(result => result.score < maxDistance + 5) // Add some margin to maxDistance
    .sort((a, b) => a.score - b.score)
    .map(result => result.airport);
  
  return filteredResults.slice(0, 10); // Limit to top 10 matches
}

// Get the closest match for a given input
// Used for autocorrection when user inputs something close to an airport code
export function getClosestAirportMatch(input: string): Airport | null {
  if (!input || input.length < 2) return null;
  
  const matches = searchAirports(input);
  return matches.length > 0 ? matches[0] : null;
}

// Format airport display text
export function formatAirportDisplay(airport: Airport): string {
  return `${airport.iata} - ${airport.city} (${airport.name})`;
} 