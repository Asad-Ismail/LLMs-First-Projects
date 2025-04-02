<script lang="ts">
  import { onMount } from 'svelte';
  import AirportInput from '$lib/components/AirportInput.svelte';
  import DateInput from '$lib/components/DateInput.svelte';
  import FlightCard from '$lib/components/FlightCard.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { fetchRouteRankings, fetchHealthStatus, type RouteRankingResponse, type RouteData } from '$lib/api';

  let origin = '';
  let destination = '';
  let routeData: RouteRankingResponse | null = null;
  let isLoading = false;
  let error: string | null = null;
  let searchedRoute = ''; // To display "Results for LHR -> JFK"
  let backendHealthy = true;

  async function handleSearch() {
    // Basic validation before fetching
    if (!origin || !destination || origin.length !== 3 || destination.length !== 3) {
      error = 'Please enter valid 3-letter IATA codes for origin and destination.';
      routeData = null;
      searchedRoute = '';
      return;
    }

    isLoading = true;
    error = null;
    routeData = null;
    searchedRoute = `${origin.toUpperCase()} → ${destination.toUpperCase()}`; // Set route display string

    try {
      // Fetch routes without a date
      const result = await fetchRouteRankings(
        origin.toUpperCase(), 
        destination.toUpperCase()
      );
      
      routeData = result;
      
      // Check if we received routes
      if (!routeData.routes || routeData.routes.length === 0) {
        error = `No flight data found for the route ${searchedRoute}. Check airports or try later.`;
      }
    } catch (err: unknown) {
      console.error("Fetch error:", err);
      error = `Failed to fetch rankings: ${err instanceof Error ? err.message : 'Unknown error'}. Is the backend running?`;
      routeData = null;
    } finally {
      isLoading = false;
    }
  }

  // Check backend health on load
  onMount(async () => {
    try {
      const healthData = await fetchHealthStatus();
      backendHealthy = healthData.status === 'ok' && healthData.system_initialized;
      
      if (!backendHealthy) {
        console.warn("Backend system not fully initialized (API key issue?).");
      }
    } catch (e) {
      console.warn("Could not reach backend for health check.");
      backendHealthy = false;
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
      
      <nav class="hidden md:flex gap-6 justify-end flex-1">
        <div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">About</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">FAQ</a>
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
      <div class="flex flex-wrap justify-center gap-4 mt-5">
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Route-Specific</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Daily Updates</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Avoid Delays</span>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Includes Connections</span>
        </div>
      </div>
    </div>
    
    <!-- Improved Search Form with Date -->
    <div class="w-full max-w-2xl p-6 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div class="flex flex-col gap-6">
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
              placeholder="Airport Code (e.g., LHR)"
              icon="/plane-takeoff.svg"
              classes="shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow"
            />
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
              placeholder="Airport Code (e.g., JFK)"
              icon="/plane-landing.svg"
              classes="shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow"
            />
          </div>
        </div>
        
        <!-- Backend Status Indicator -->
        {#if !backendHealthy}
          <div class="w-full rounded-lg bg-flight-danger/20 border border-flight-danger/40 p-3 text-center">
            <p class="text-white text-sm">
              ⚠️ Backend service appears to be unavailable. Results may not load correctly.
            </p>
          </div>
        {/if}
        
        <!-- Simplified Search Button -->
        <div class="flex justify-center mt-2">
          <button
            on:click={handleSearch}
            disabled={isLoading || origin.length !== 3 || destination.length !== 3}
            class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-3 px-8 rounded-lg
                   transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2 shadow-lg"
          >
            {#if isLoading}
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
    {#if isLoading}
      <div class="mt-8">
        <Loader />
      </div>
    {/if}

    <!-- Simple Error Message -->
    {#if error && !isLoading}
      <div class="mt-8 w-full max-w-2xl">
        <ErrorMessage message={error} />
      </div>
    {/if}

    <!-- Results Section -->
    {#if routeData && routeData.routes && routeData.routes.length > 0 && !isLoading}
      <div class="mt-8 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg w-full max-w-3xl">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white text-center md:text-left">
            Best Routes: <span class="text-sky-accent">{searchedRoute}</span>
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
        {#if routeData.query.filters_applied && routeData.query.filters_applied.length > 0}
          <div class="mb-4 text-xs text-white/70">
            <span class="font-medium">Filters:</span> {routeData.query.filters_applied.join(' • ')}
          </div>
        {/if}
        
        <!-- Route Cards -->
        <div class="space-y-4">
          {#each routeData.routes as route (route.source_offer_id)}
            <div>
              <FlightCard flightData={route} rank={route.rank} />
            </div>
          {/each}
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