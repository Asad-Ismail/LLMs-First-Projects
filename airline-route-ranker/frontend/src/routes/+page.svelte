<script>
  import { onMount } from 'svelte';
  import AirportInput from '$lib/components/AirportInput.svelte';
  import FlightCard from '$lib/components/FlightCard.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';

  let origin = '';
  let destination = '';
  let rankings = [];
  let isLoading = false;
  let error = null;
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

    } catch (err) {
      console.error("Fetch error:", err);
      error = `Failed to fetch rankings: ${err.message}. Is the backend running?`;
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

<div class="container mx-auto p-4 md:p-8 max-w-4xl">
  <h1 class="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
    Flight Reliability Rankings
  </h1>

  <!-- Route Selection Form -->
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <AirportInput label="Origin Airport (IATA)" bind:value={origin} placeholder="e.g., LHR" />
      <AirportInput label="Destination Airport (IATA)" bind:value={destination} placeholder="e.g., JFK" />
      <button
        on:click={handleSearch}
        disabled={isLoading || origin.length !== 3 || destination.length !== 3}
        class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          Searching...
        {:else}
          Search Flights
        {/if}
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <Loader />
  {/if}

  <!-- Error Message -->
  {#if error && !isLoading}
    <ErrorMessage message={error} />
  {/if}

  <!-- Results -->
  {#if rankings.length > 0 && !isLoading}
    <h2 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
      Results for {searchedRoute}
    </h2>
    <div class="space-y-4">
      {#each rankings as flight, index (flight.flight_number)}
        <FlightCard rank={index + 1} flightData={flight} />
      {/each}
    </div>
  {:else if !isLoading && searchedRoute && !error}
      <!-- Handled by the error message now if rankings are empty -->
  {/if}

</div>

<style>
  /* Add any global page-specific styles here if needed, */
  /* but prefer Tailwind utilities */
</style>