<script lang="ts">
  import { onMount } from 'svelte';
  import AirportInput from '$lib/components/AirportInput.svelte';
  import FlightCard from '$lib/components/FlightCard.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';

  // Define types for your data
  type FlightRanking = {
    flight_number: string;
    // Add other properties that would be in your flight data
    airline?: string;
    departure_time?: string;
    arrival_time?: string;
    reliability_score?: number;
    on_time_percentage?: number;
    cancellation_rate?: number;
    // Add more as needed
  };

  let origin = '';
  let destination = '';
  let rankings: FlightRanking[] = [];
  let isLoading = false;
  let error: string | null = null;
  let searchedRoute = ''; // To display "Results for LHR -> JFK"

  // Backend API URL (use environment variables for production)
  const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend URL

  async function fetchRankings() {
    if (!origin || !destination || origin.length !== 3 || destination.length !== 3) {
      error = 'Please enter valid 3-letter IATA codes for origin and destination.';
      rankings = [];
      searchedRoute = '';
      return;
    }

    isLoading = true;
    error = null;
    rankings = [];
    searchedRoute = `${origin.toUpperCase()} → ${destination.toUpperCase()}`; // Set route display string

    try {
      const response = await fetch(`${API_BASE_URL}/api/rankings/${origin.toUpperCase()}/${destination.toUpperCase()}`);

      if (!response.ok) {
        let errorDetail = `HTTP error ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (e) { /* Ignore if response body isn't JSON */ }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      rankings = data;

      if (rankings.length === 0) {
          error = `No flight data found for the route ${searchedRoute}. Check airports or try later.`;
      }

    } catch (err: unknown) {
      console.error("Fetch error:", err);
      error = `Failed to fetch rankings: ${err instanceof Error ? err.message : 'Unknown error'}. Is the backend running?`;
      rankings = []; // Clear rankings on error
    } finally {
      isLoading = false;
    }
  }

  function handleSearch() {
      // Basic validation before fetching
      if (origin.length === 3 && destination.length === 3) {
          fetchRankings();
      } else {
          error = 'Please enter valid 3-letter IATA codes (e.g., LHR, JFK).';
      }
  }

  // Optional: Check backend health on load
  onMount(async () => {
      try {
          const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
          if (!healthResponse.ok) {
              console.warn("Backend health check failed or backend not running.");
          } else {
              const healthData = await healthResponse.json();
              if (!healthData.system_initialized) {
                  console.warn("Backend system not fully initialized (API key issue?).");
              }
          }
      } catch (e) {
          console.warn("Could not reach backend for health check.");
      }
  });

</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed">
  <!-- Header & Navigation -->
  <header class="py-4 bg-sky-dark/80 backdrop-blur-sm border-b border-sky-accent/20 sticky top-0 z-10">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex-1"></div>
      <div class="flex items-center gap-2 justify-center flex-1">
        <img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-8 w-8" />
        <h1 class="text-2xl font-bold text-white">Flight Reliability Rankings</h1>
      </div>
      <nav class="hidden md:flex gap-6 justify-end flex-1">
        <a href="/" class="text-white hover:text-sky-accent transition">Home</a>
        <a href="/about" class="text-white hover:text-sky-accent transition">About</a>
        <a href="/faq" class="text-white hover:text-sky-accent transition">FAQ</a>
      </nav>
      <button class="md:hidden text-white flex-1 flex justify-end">
        <!-- Hamburger icon for mobile menu -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </div>
  </header>
  
  <!-- Main Content with Centered Search Form -->
  <div class="container mx-auto p-4 flex flex-col items-center justify-center" style="min-height: calc(100vh - 80px);">
    <!-- Redesigned Search Form -->
    <div class="w-full max-w-3xl p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <div class="flex flex-col gap-8">
        <!-- Airport Inputs Row -->
        <div class="flex flex-col md:flex-row gap-6 items-center justify-center">
          <!-- Origin Airport Input with Take-off Icon -->
          <div class="w-full md:w-5/12 relative">
            <label class="block text-white text-sm font-bold mb-2 text-center">Origin Airport</label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2">
                <img src="/plane-takeoff.svg" alt="Origin" class="h-6 w-6" />
              </span>
              <input
                type="text"
                bind:value={origin}
                placeholder="E.G., LHR"
                maxlength="3"
                class="uppercase shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 bg-white/90 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
                on:input={(e) => {
                  const target = e.target as HTMLInputElement;
                  origin = target.value.toUpperCase().replace(/[^A-Z]/g, '');
                }}
              />
            </div>
          </div>
          
          <!-- Route Connection Indicator -->
          <div class="flex flex-col justify-center items-center">
            <div class="h-6 md:h-0"></div> <!-- Spacer for mobile -->
            <div class="flex items-center justify-center md:mt-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
          
          <!-- Destination Airport Input with Landing Icon -->
          <div class="w-full md:w-5/12 relative">
            <label class="block text-white text-sm font-bold mb-2 text-center">Destination Airport</label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2">
                <img src="/plane-landing.svg" alt="Destination" class="h-6 w-6" />
              </span>
              <input
                type="text"
                bind:value={destination}
                placeholder="E.G., JFK"
                maxlength="3"
                class="uppercase shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 bg-white/90 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
                on:input={(e) => {
                  const target = e.target as HTMLInputElement;
                  destination = target.value.toUpperCase().replace(/[^A-Z]/g, '');
                }}
              />
            </div>
          </div>
        </div>
        
        <!-- Search Button -->
        <div class="flex justify-center">
          <button
            on:click={handleSearch}
            disabled={isLoading || origin.length !== 3 || destination.length !== 3}
            class="bg-flight-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg 
                   transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2 shadow-md"
          >
            {#if isLoading}
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
              Search Flights
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="mt-8">
        <Loader />
      </div>
    {/if}

    <!-- Error Message -->
    {#if error && !isLoading}
      <div class="mt-8 w-full max-w-3xl">
        <ErrorMessage message={error} />
      </div>
    {/if}

    <!-- Results -->
    {#if rankings.length > 0 && !isLoading}
      <div class="mt-8 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg w-full max-w-3xl">
        <h2 class="text-2xl font-semibold mb-4 text-white text-center">
          Results for {searchedRoute}
        </h2>
        <div class="space-y-4">
          {#each rankings as flight, index (flight.flight_number)}
            <FlightCard rank={index + 1} flightData={flight} />
          {/each}
        </div>
      </div>
    {:else if !isLoading && searchedRoute && !error}
        <!-- Handled by the error message now if rankings are empty -->
    {/if}
  </div>
</div>

<style>
  /* Add any global page-specific styles here if needed, */
  /* but prefer Tailwind utilities */
</style>