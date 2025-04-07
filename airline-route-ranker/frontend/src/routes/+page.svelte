<script lang="ts">
  import { onMount } from 'svelte';
  import AirportInput from '$lib/components/AirportInput.svelte';
  import DateInput from '$lib/components/DateInput.svelte';
  import FlightCard from '$lib/components/FlightCard.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { fetchRouteRankings, fetchHealthStatus, fetchAvailableDates, type RouteRankingResponse, type RouteData } from '$lib/api';
  import { recordSearch } from '$lib/supabase';
  import AuthControls from '$lib/components/Auth/AuthControls.svelte';

  // Prefill origin and destination with default values
  let origin = 'AMS';
  let destination = 'LHE';
  
  // Calculate default date (28 days from today, matching backend logic)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 28);
  let travelDate = defaultDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  // Airport name variables
  let originAirportName = "Amsterdam Airport Schiphol";
  let destinationAirportName = "Lahore Allama Iqbal International";
  
  // Helper function to transform raw route data to the expected FlightCard format
  function transformRouteData(rawRouteData: RouteRankingResponse | null) {
    if (!rawRouteData || !rawRouteData.routes) return rawRouteData;
    
    // Transform each route
    const transformedRoutes = rawRouteData.routes.map((route: RouteData, index: number) => {
      // Create a complete route path that includes connections
      let routePath = rawRouteData.query.origin;
      
      // Add connection airports if available
      if (route.connection_airports && route.connection_airports.length > 0) {
        route.connection_airports.forEach((airport: string) => {
          routePath += ` → ${airport}`;
        });
      }
      
      // Add the destination
      routePath += ` → ${rawRouteData.query.destination}`;
      
      // Format airline name - use the airline code and add full name if available
      let airlineName = route.operating_airline || 'Unknown';
      let airlineDisplay = airlineName;
      
      // Map common airline codes to full names
      const airlineFullNames: Record<string, string> = {
        'TK': 'TURKISH AIRLINES',
        'EK': 'EMIRATES',
        'QR': 'QATAR AIRWAYS',
        'LH': 'LUFTHANSA',
        'BA': 'BRITISH AIRWAYS',
        'AF': 'AIR FRANCE',
        'KL': 'KLM ROYAL DUTCH AIRLINES',
        'SK': 'SCANDINAVIAN AIRLINES',
        'UA': 'UNITED AIRLINES',
        'AA': 'AMERICAN AIRLINES',
        'DL': 'DELTA AIR LINES',
        'CX': 'CATHAY PACIFIC',
        'SQ': 'SINGAPORE AIRLINES',
        'EY': 'ETIHAD AIRWAYS',
        'LX': 'SWISS INTERNATIONAL AIR LINES',
        'OS': 'AUSTRIAN AIRLINES',
        'AY': 'FINNAIR',
        'IB': 'IBERIA',
        'JL': 'JAPAN AIRLINES',
        'NH': 'ALL NIPPON AIRWAYS',
        'OZ': 'ASIANA AIRLINES',
        'AC': 'AIR CANADA',
        'SU': 'AEROFLOT',
        'ET': 'ETHIOPIAN AIRLINES'
      };
      
      // If we have the full name, add it in parentheses
      if (airlineFullNames[airlineName]) {
        airlineDisplay = `${airlineName} (${airlineFullNames[airlineName]})`;
      }
      
      // Format duration from minutes to hours and minutes (e.g., 755 -> 12h 35m)
      let formattedDuration = route.formatted_duration || route.total_duration || '';
      
      // If we have raw minutes, convert to hours and minutes format
      if (route.duration_raw_minutes && (!formattedDuration || formattedDuration.match(/^\d+$/))) {
        const minutes = Number(route.duration_raw_minutes);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        formattedDuration = `${hours}h ${mins}m`;
      } else if (formattedDuration.match(/^\d+$/)) {
        // If total_duration is just a number (like "755"), convert it to hours/minutes
        const minutes = Number(formattedDuration);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        formattedDuration = `${hours}h ${mins}m`;
      }
      
      // Format price - use actual price if available
      let priceAmount = '800'; // Default placeholder
      let priceCurrency = 'USD';
      
      // Handle different price formats that might come from Supabase or API
      if (typeof route.price === 'object' && route.price !== null) {
        // Standard format from the interface - object with amount property
        if (route.price.amount) {
          priceAmount = route.price.amount;
          priceCurrency = route.price.currency || 'USD';
        }
      } else if (typeof route.price === 'string') {
        // If it's a string price (e.g., "252.00")
        priceAmount = route.price;
      } else if (typeof route.price === 'number') {
        // If it's a numeric price
        priceAmount = String(route.price);
      }
      
      // Debug log to see what we're getting
      console.log(`Route ${index+1} price data:`, route.price);
      console.log(`Route ${index+1} reliability data:`, route.reliability_score, route.reliability_data);
      
      // Try to parse from route_data if available and price is still the default placeholder
      if (priceAmount === '800' && route.route_data) {
        try {
          // Route data might be a string that needs parsing
          const routeData = typeof route.route_data === 'string' 
            ? JSON.parse(route.route_data) 
            : route.route_data;
            
          // Check if there's a price field in the parsed data
          if (routeData.price) {
            priceAmount = typeof routeData.price === 'object' 
              ? (routeData.price.amount || '800')
              : String(routeData.price);
          }
        } catch (e) {
          console.warn('Error parsing route_data for price:', e);
        }
      }
      
      // Inspect deeper into the object structure from Supabase CSV data
      // This is a backup approach checking every property for price information
      if (priceAmount === '800') {
        // Recursively search for price-related properties
        const findPrice = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Direct checks for common price properties
          if (obj.price) {
            if (typeof obj.price === 'object' && obj.price.amount) {
              return obj.price.amount;
            } else if (typeof obj.price === 'string' || typeof obj.price === 'number') {
              return String(obj.price);
            }
          }
          
          // Check for properties that might contain "price" in the name
          for (const key in obj) {
            if (
              key.toLowerCase().includes('price') || 
              key.toLowerCase().includes('cost') || 
              key.toLowerCase().includes('fare')
            ) {
              const value = obj[key];
              if (typeof value === 'string' || typeof value === 'number') {
                return String(value);
              } else if (typeof value === 'object' && value !== null) {
                if (value.amount) return String(value.amount);
                if (value.value) return String(value.value);
              }
            }
            
            // Recursive search for nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const result = findPrice(obj[key]);
              if (result) return result;
            }
          }
          
          return null;
        };
        
        const foundPrice = findPrice(route);
        if (foundPrice) priceAmount = foundPrice;
      }
      
      // Process the reliability data
      // IMPORTANT: Use the backend's actual reliability data, NEVER generate random scores
      // If reliability_data is missing, create an empty array as fallback
      const reliabilityData = route.reliability_data || [];
      
      // Create a properly formatted route object with all required fields
      return {
        // Keep original properties
        ...route,
        // Add missing properties expected by FlightCard
        rank: route.rank || (index + 1),
        route_path: routePath,
        operating_airline: airlineDisplay,
        operating_flight_numbers: route.operating_flight_numbers || [],
        total_duration: formattedDuration,
        price: {
          amount: priceAmount,
          currency: priceCurrency
        },
        // Use the actual reliability data from the backend
        reliability_score: route.reliability_score || 0,
        reliability_data: reliabilityData,
        smart_rank: route.smart_rank || 0
      };
    });
    
    // Make sure routes maintain the rank order from the backend
    // This is critical for consistent user experience
    const sortedRoutes = transformedRoutes.sort((a, b) => {
      // First by rank assigned by backend
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      // Then by smart rank (higher score first)
      return (b.smart_rank || 0) - (a.smart_rank || 0);
    });
    
    return {
      ...rawRouteData,
      routes: sortedRoutes
    };
  }
  
  // Common airport lookup (add more as needed)
  const airportNames: Record<string, string> = {
    // Major International Hubs
    'AMS': 'Amsterdam Airport Schiphol',
    'LHR': 'London Heathrow',
    'CDG': 'Paris Charles de Gaulle',
    'FRA': 'Frankfurt Airport',
    'JFK': 'New York John F. Kennedy',
    'LAX': 'Los Angeles International',
    'ORD': 'Chicago O\'Hare International',
    'ATL': 'Atlanta Hartsfield-Jackson',
    'DXB': 'Dubai International',
    'HKG': 'Hong Kong International',
    'SIN': 'Singapore Changi',
    'ICN': 'Seoul Incheon International',
    'PEK': 'Beijing Capital International',
    'PVG': 'Shanghai Pudong International',
    'NRT': 'Tokyo Narita International',
    'HND': 'Tokyo Haneda International',
    'SYD': 'Sydney Kingsford Smith',
    'MEL': 'Melbourne Airport',
    'IST': 'Istanbul Airport',
    'MUC': 'Munich Airport',
    'BCN': 'Barcelona El Prat',
    'MAD': 'Madrid Barajas',
    'FCO': 'Rome Fiumicino',
    'LGW': 'London Gatwick',
    'MXP': 'Milan Malpensa',
    'BRU': 'Brussels Airport',
    'VIE': 'Vienna International',
    'ZRH': 'Zurich Airport',
    'CPH': 'Copenhagen Airport',
    'ARN': 'Stockholm Arlanda',
    'OSL': 'Oslo Gardermoen',
    'HEL': 'Helsinki Vantaa',
    
    // Middle East & Africa
    'LHE': 'Lahore Allama Iqbal International',
    'KHI': 'Karachi Jinnah International',
    'ISB': 'Islamabad International',
    'DEL': 'Delhi Indira Gandhi International',
    'BOM': 'Mumbai Chhatrapati Shivaji',
    'MAA': 'Chennai International',
    'BLR': 'Bengaluru Kempegowda International',
    'CCU': 'Kolkata Netaji Subhas Chandra Bose',
    'HYD': 'Hyderabad Rajiv Gandhi International',
    'DOH': 'Doha Hamad International',
    'AUH': 'Abu Dhabi International',
    'RUH': 'Riyadh King Khalid International',
    'JED': 'Jeddah King Abdulaziz International',
    'CAI': 'Cairo International',
    'JNB': 'Johannesburg O.R. Tambo',
    'CPT': 'Cape Town International',
    'NBO': 'Nairobi Jomo Kenyatta',
    'ADD': 'Addis Ababa Bole International',
    'LOS': 'Lagos Murtala Muhammed',
    
    // Asia Pacific
    'BKK': 'Bangkok Suvarnabhumi',
    'DMK': 'Bangkok Don Mueang',
    'KUL': 'Kuala Lumpur International',
    'CGK': 'Jakarta Soekarno-Hatta',
    'MNL': 'Manila Ninoy Aquino International',
    'SGN': 'Ho Chi Minh City Tan Son Nhat',
    'HAN': 'Hanoi Noi Bai International',
    'TPE': 'Taipei Taiwan Taoyuan',
    'CAN': 'Guangzhou Baiyun International',
    'CTU': 'Chengdu Shuangliu International',
    'XIY': 'Xi\'an Xianyang International',
    'PNH': 'Phnom Penh International',
    'REP': 'Siem Reap International',
    'HKT': 'Phuket International',
    'DPS': 'Bali Ngurah Rai International',
    'AKL': 'Auckland Airport',
    'CHC': 'Christchurch International',
    'WLG': 'Wellington International',
    'BNE': 'Brisbane International',
    'PER': 'Perth Airport',
    'ADL': 'Adelaide Airport',
    
    // North America
    'YYZ': 'Toronto Pearson International',
    'YVR': 'Vancouver International',
    'YUL': 'Montreal Trudeau International',
    'YYC': 'Calgary International',
    'SFO': 'San Francisco International',
    'DFW': 'Dallas/Fort Worth International',
    'MIA': 'Miami International',
    'SEA': 'Seattle-Tacoma International',
    'BOS': 'Boston Logan International',
    'IAD': 'Washington Dulles International',
    'DCA': 'Washington Reagan National',
    'EWR': 'Newark Liberty International',
    'IAH': 'Houston George Bush Intercontinental',
    'PHX': 'Phoenix Sky Harbor International',
    'MSP': 'Minneapolis−Saint Paul International',
    'DTW': 'Detroit Metropolitan Wayne County',
    'PHL': 'Philadelphia International',
    'CLT': 'Charlotte Douglas International',
    'LAS': 'Las Vegas Harry Reid International',
    'DEN': 'Denver International',
    'SAN': 'San Diego International',
    'TPA': 'Tampa International',
    'MCO': 'Orlando International',
    'PDX': 'Portland International',
    'MEX': 'Mexico City International',
    'CUN': 'Cancún International',
    'GDL': 'Guadalajara International',
    
    // Latin America & Caribbean
    'GRU': 'São Paulo Guarulhos International',
    'EZE': 'Buenos Aires Ezeiza International',
    'SCL': 'Santiago International',
    'BOG': 'Bogotá El Dorado International',
    'LIM': 'Lima Jorge Chávez International',
    'PTY': 'Panama City Tocumen International',
    'MDE': 'Medellín José María Córdova',
    'UIO': 'Quito Mariscal Sucre International',
    'MVD': 'Montevideo Carrasco International',
    'CCS': 'Caracas Simón Bolívar International',
    'GIG': 'Rio de Janeiro Galeão International',
    'BSB': 'Brasília International',
    'CNF': 'Belo Horizonte Tancredo Neves',
    'HAV': 'Havana José Martí International',
    'SJU': 'San Juan Luis Muñoz Marín',
    'SJO': 'San José Juan Santamaría',
    'MBJ': 'Montego Bay Sangster International',
    'PUJ': 'Punta Cana International',
    'AUA': 'Aruba Queen Beatrix International',
    'CUR': 'Curaçao International',
    
    // European Regional
    'LIS': 'Lisbon Humberto Delgado',
    'OPO': 'Porto Francisco Sá Carneiro',
    'DUB': 'Dublin Airport',
    'ATH': 'Athens Eleftherios Venizelos',
    'SKG': 'Thessaloniki Macedonia',
    'WAW': 'Warsaw Chopin',
    'KRK': 'Kraków John Paul II',
    'PRG': 'Prague Václav Havel',
    'BUD': 'Budapest Ferenc Liszt',
    'OTP': 'Bucharest Henri Coandă',
    'SOF': 'Sofia Airport',
    'KEF': 'Reykjavík Keflavík',
    'RIX': 'Riga International',
    'TLL': 'Tallinn Lennart Meri',
    'VNO': 'Vilnius International',
    'KBP': 'Kyiv Boryspil International',
    'LED': 'St. Petersburg Pulkovo',
    'SVO': 'Moscow Sheremetyevo',
    'DME': 'Moscow Domodedovo',
    'ZAG': 'Zagreb International',
    'BEG': 'Belgrade Nikola Tesla',
    'TXL': 'Berlin Tegel (historical)',
    'BER': 'Berlin Brandenburg',
    'HAM': 'Hamburg Airport',
    'DUS': 'Düsseldorf Airport',
    'STR': 'Stuttgart Airport',
    'PMI': 'Palma de Mallorca',
    'IBZ': 'Ibiza Airport',
    'AGP': 'Málaga-Costa del Sol',
    'NCE': 'Nice Côte d\'Azur',
    'MRS': 'Marseille Provence',
    'LYS': 'Lyon–Saint-Exupéry',
    'TLS': 'Toulouse–Blagnac',
    'EDI': 'Edinburgh Airport',
    'GLA': 'Glasgow Airport',
    'BHX': 'Birmingham Airport',
    'MAN': 'Manchester Airport',
    'BRS': 'Bristol Airport',
    'LBA': 'Leeds Bradford',
    'BFS': 'Belfast International',
    'ORK': 'Cork Airport',
    'SNN': 'Shannon Airport',
    'NAP': 'Naples International',
    'PSA': 'Pisa International',
    'VCE': 'Venice Marco Polo',
    'BLQ': 'Bologna Guglielmo Marconi',
    'CTA': 'Catania-Fontanarossa',
  };
  
  // Update airport names when codes change
  $: if (origin) {
    const upperOrigin = origin.toUpperCase();
    originAirportName = airportNames[upperOrigin] || `Airport ${upperOrigin}`;
  }
  
  $: if (destination) {
    const upperDest = destination.toUpperCase();
    destinationAirportName = airportNames[upperDest] || `Airport ${upperDest}`;
  }
  
  // Form state variables
  let isSubmitting = false;
  let hasError = false;
  let errorMessage = '';
  let routeData: RouteRankingResponse | null = null;
  let healthStatus = { status: '', system_initialized: false };
  let availableDates: string[] = [];
  
  // Transform the route data when it's fetched
  $: transformedRouteData = transformRouteData(routeData);
  
  // Variables for available dates
  let isCheckingDates = false;
  let selectedCachedDate: string | null = null;
  let lastCheckedRoute = ""; // Track the last checked route

  // Modify the reactive statement to only run in the browser
  let isMounted = false;
  
  // Move reactive statement inside onMount
  $: if (isMounted && origin?.length === 3 && destination?.length === 3) {
    const routeKey = `${origin}-${destination}`;
    // Only check if this is a different route than we last checked
    if (routeKey !== lastCheckedRoute) {
      lastCheckedRoute = routeKey;
      checkAvailableDates(origin, destination);
    }
  }
  
  // Function to check for available cached dates
  async function checkAvailableDates(originCode: string, destCode: string) {
    // Don't check if already checking
    if (isCheckingDates) return;
    
    isCheckingDates = true;
    try {
      const dates = await fetchAvailableDates(originCode, destCode);
      
      // Filter to only future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      availableDates = dates.filter(date => {
        const dateObj = new Date(date);
        return dateObj >= today;
      }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      if (availableDates.length > 0) {
        // Select the most future date
        selectedCachedDate = availableDates[availableDates.length - 1];
        
        // Update the travel date but don't automatically search
        travelDate = selectedCachedDate;
      } else {
        // No available dates found
        selectedCachedDate = null;
      }
    } catch (err) {
      console.warn('Error checking available dates:', err);
      selectedCachedDate = null;
      availableDates = [];
    } finally {
      isCheckingDates = false;
    }
  }

  async function handleSearch() {
    // Basic validation before fetching
    if (!origin || !destination || origin.length !== 3 || destination.length !== 3) {
      errorMessage = 'Please enter valid 3-letter IATA codes for origin and destination.';
      routeData = null;
      return;
    }

    isSubmitting = true;
    hasError = false;
    routeData = null;

    try {
      // Fetch routes with optional date
      const result = await fetchRouteRankings(
        origin.toUpperCase(), 
        destination.toUpperCase(),
        travelDate || undefined
      );
      
      routeData = result;
      
      // Debug log to check number of routes received
      console.log(`Received ${result.routes?.length || 0} routes from backend`);
      
      // Check if we received routes
      if (!routeData.routes || routeData.routes.length === 0) {
        errorMessage = `No flight data found for the route ${origin.toUpperCase()} → ${destination.toUpperCase()}. Check airports or try later.`;
      }
      
      // Record search history for logged-in users
      try {
        await recordSearch(
          origin.toUpperCase(),
          destination.toUpperCase(),
          travelDate,
          { 
            searchDate: new Date().toISOString(),
            routesFound: result.routes?.length || 0
          }
        );
      } catch (err) {
        // Non-critical error, just log it
        console.warn('Failed to record search history:', err);
      }
    } catch (err: unknown) {
      console.error("Fetch error:", err);
      errorMessage = `Failed to fetch rankings: ${err instanceof Error ? err.message : 'Unknown error'}. Is the backend running?`;
      routeData = null;
    } finally {
      isSubmitting = false;
    }
  }

  // Check backend health on load and initialize reactive dependencies
  onMount(async () => {
    // Set mounted flag to true
    isMounted = true;
    
    try {
      const healthData = await fetchHealthStatus();
      healthStatus = healthData;
      
      if (!healthStatus.system_initialized) {
        console.warn("Backend system not fully initialized (API key issue?).");
      }
      
      // If we already have valid airport codes, check for dates
      if (origin?.length === 3 && destination?.length === 3) {
        const routeKey = `${origin}-${destination}`;
        lastCheckedRoute = routeKey;
        checkAvailableDates(origin, destination);
      }
    } catch (e) {
      console.warn("Could not reach backend for health check.");
      healthStatus = { status: 'unavailable', system_initialized: false };
    }
  });
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Enhanced Header & Navigation with Glass Morphism -->
  <header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex-1 flex justify-start">
        <div class="hidden md:flex bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Home</a>
        </div>
      </div>
      
      <div class="flex items-center gap-3 justify-center flex-1">
        <div class="bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20">
          <img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-7 w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500" />
        </div>
        <h1 class="text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary">Flight</span> Reliability Rankings
        </h1>
      </div>
      
      <!-- Navigation -->
      <nav class="hidden md:flex gap-6 justify-end flex-1">
        <div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">About</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">FAQ</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/contact" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Contact</a>
        </div>
        
        <!-- Auth Controls -->
        <div class="ml-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <AuthControls />
        </div>
      </nav>
      
      <button class="md:hidden text-white flex-1 flex justify-end">
        <!-- Hamburger icon for mobile menu with improved styling -->
        <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </button>
    </div>
  </header>
  
  <!-- Main Content with Centered Search Form -->
  <div class="container mx-auto p-4 flex flex-col items-center justify-start pt-12" style="min-height: calc(100vh - 80px);">
    <!-- Simplified Tagline Section - More Focused -->
    <div class="text-center mb-10 max-w-2xl px-4 animate-[fadeIn_0.8s_ease-in-out]" style="animation: fadeIn 0.8s ease-in-out;">
      <h2 class="text-white text-2xl md:text-4xl font-medium mb-4 text-shadow-md">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold">Know</span> Before You Go
      </h2>
      <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base mb-6">
        Find the most reliable flights for your route
      </p>
      
      <!-- Feature Badges with Better Readability -->
      <div class="flex flex-wrap justify-center gap-2 mt-5">
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Route-Specific</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Daily Updates</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Avoid Delays</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Includes Connections</span>
        </div>
      </div>
    </div>
    
    <!-- Improved Search Form with Date -->
    <div class="w-full max-w-2xl p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div class="flex flex-col gap-4">
        <!-- Simplified Form - No Additional Explanation Text -->
        <div class="text-center">
          <h3 class="text-white font-semibold text-xl text-shadow-sm">Compare Route Reliability</h3>
        </div>
      
        <!-- Airports and Date Inputs -->
        <div class="flex flex-col md:flex-row gap-4 items-start justify-center">
          <!-- Origin Airport Input -->
          <div class="w-full md:w-5/12 relative">
            <AirportInput 
              label="From"
              bind:value={origin}
              placeholder="Airport Code (e.g., AMS)"
              icon="/plane-takeoff.svg"
              classes="shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow"
            />
            <div class="text-[10px] text-white/70 text-center mt-1">{originAirportName}</div>
          </div>
          
          <!-- Simple Arrow with Perfect Alignment -->
          <div class="hidden md:flex justify-center items-center w-10 h-10 mt-7">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <!-- Destination Airport Input -->
          <div class="w-full md:w-5/12 relative">
            <AirportInput 
              label="To"
              bind:value={destination}
              placeholder="Airport Code (e.g., LHE)"
              icon="/plane-landing.svg"
              classes="shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow"
            />
            <div class="text-[10px] text-white/70 text-center mt-1">{destinationAirportName}</div>
          </div>
        </div>

        <!-- Integrated Date Input (More Compact) -->
        <div class="flex flex-col items-center -mt-3">
          <div class="w-full max-w-[140px]">
            <div class="text-[10px] text-white/70 mb-0.5 text-center">Date (Optional)</div>
            <input
              type="date"
              bind:value={travelDate}
              min={new Date().toISOString().split('T')[0]}
              max={(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().split('T')[0] })()}
              class="w-full py-1 px-1.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white text-xs
                    focus:outline-none focus:ring-1 focus:ring-sky-accent/50 shadow-sm [color-scheme:dark]"
            />
          </div>
          
          <!-- Date selection info - Enhanced to be more visible -->
          {#if isCheckingDates}
            <div class="text-xs text-white/90 mt-2 text-center px-2 py-1 bg-white/10 rounded-md backdrop-blur-sm">
              <div class="animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Checking for cached routes...
              </div>
            </div>
          {:else if selectedCachedDate}
            <div class="text-xs text-white mt-2 text-center px-2 py-1 bg-sky-accent/20 border border-sky-accent/40 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sky-accent">Cached date auto-selected:</span>
              <span class="font-medium ml-1">
                {new Date(selectedCachedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
              </span>
            </div>
          {/if}
          
          <!-- Available dates dropdown - Enhanced -->
          {#if availableDates.length > 1}
            <div class="mt-2 text-xs text-white/80 text-center px-3 py-2 bg-white/10 rounded-md backdrop-blur-sm">
              <div class="font-medium mb-1">Other cached dates available:</div>
              <div class="flex flex-wrap justify-center gap-1 max-w-[300px]">
                {#each availableDates.filter(d => d !== selectedCachedDate) as date}
                  <button 
                    class="bg-white/10 hover:bg-white/20 rounded px-2 py-0.5 text-[10px] backdrop-blur-sm transition-colors"
                    on:click={() => {
                      travelDate = date;
                      selectedCachedDate = date;
                    }}
                  >
                    {new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Backend Status Indicator -->
        {#if !healthStatus.system_initialized}
          <div class="w-full rounded-lg bg-flight-danger/20 border border-flight-danger/40 p-2 text-center mt-0">
            <p class="text-white text-sm">
              ⚠️ Backend service appears to be unavailable. Results may not load correctly.
            </p>
          </div>
        {/if}
        
        <!-- Search Button -->
        <div class="flex justify-center mt-1">
          <button
            on:click={handleSearch}
            disabled={isSubmitting || origin.length !== 3 || destination.length !== 3}
            class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2.5 px-8 rounded-lg
                   transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2 shadow-lg"
          >
            {#if isSubmitting}
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Searching</span>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
              <span>Find Reliable Routes</span>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Simple Loading State -->
    {#if isSubmitting}
      <div class="mt-8">
        <Loader />
      </div>
    {/if}

    <!-- Simple Error Message -->
    {#if errorMessage && !isSubmitting}
      <div class="mt-8 w-full max-w-2xl">
        <ErrorMessage message={errorMessage} />
      </div>
    {/if}

    <!-- Results Section -->
    {#if routeData && routeData.routes && routeData.routes.length > 0 && !isSubmitting}
      <div class="mt-8 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg w-full max-w-3xl">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white text-center md:text-left">
            Best Routes: <span class="text-sky-accent">{origin.toUpperCase()} → {destination.toUpperCase()}</span>
          </h2>
          
          <!-- Travel date badge -->
          {#if routeData.query.date}
            <div class="mt-2 md:mt-0 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(routeData.query.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
            </div>
          {/if}
        </div>
        
        <!-- Filters applied -->
        {#if routeData && routeData.routes && routeData.routes.length > 0}
          <div class="mb-4 text-xs text-white/70">
            <span class="font-medium">Showing top {routeData.routes.length} results</span>
          </div>
          <!-- Debug information -->
          <div class="mb-4 text-xs text-white/70 hidden">
            <span class="font-medium">Debug - Routes in data: {routeData.routes.length}</span>
          </div>
        {/if}
        
        <!-- Route Cards -->
        <div class="space-y-4">
          {#if transformedRouteData && transformedRouteData.routes}
            {#each transformedRouteData.routes as route, index (index)}
              <div>
                <FlightCard flightData={route} rank={route.rank ?? (index + 1)} />
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom animations and styles */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(56, 189, 248, 0.3); }
    50% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.6); }
    100% { box-shadow: 0 0 5px rgba(56, 189, 248, 0.3); }
  }

  /* Apply a subtle parallax effect to the background */
  .min-h-screen {
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
    position: relative;
    isolation: isolate;
  }
  
  .min-h-screen::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.6) 100%);
    pointer-events: none;
  }
</style>