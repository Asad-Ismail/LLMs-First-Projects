<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import type { UserProfile } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { fetchRouteRankings } from '$lib/api';
  import FlightCard from '$lib/components/FlightCard.svelte';
  import Loader from '$lib/components/Loader.svelte';
  
  interface SavedRoute {
    id: string;
    user_id: string;
    origin_iata: string;
    destination_iata: string;
    route_data: any;
    notes: string | null;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
  }
  
  interface SearchHistory {
    id: string;
    user_id: string;
    origin_iata: string;
    destination_iata: string;
    search_date: string | null;
    search_params: any;
    created_at: string;
  }
  
  // User state
  let profile: UserProfile | null = null;
  let savedRoutes: SavedRoute[] = [];
  let searchHistory: SearchHistory[] = [];
  let loading = true;
  let creditsLoading = true;
  let credits = 0;
  
  // Search results state
  let selectedSearchResults: any = null;
  let selectedSearchRoute: string | null = null;
  let isLoadingSearchResults = false;
  let searchResultsError: string | null = null;
  
  onMount(async () => {
    await loadProfile();
    await loadSavedRoutes();
    await loadSearchHistory();
    loading = false;
  });
  
  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        goto('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      profile = data as UserProfile;
      credits = profile?.credits || 0;
      creditsLoading = false;
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }
  
  async function loadSavedRoutes() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_saved_routes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Saved routes data:", data);
      savedRoutes = data;
    } catch (err) {
      console.error('Error loading saved routes:', err);
    }
  }
  
  async function loadSearchHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      console.log("Search history data:", data);
      searchHistory = data;
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  function goToRoute(origin: string, destination: string, date: string | null = null): void {
    const dateParam = date ? `&date=${date}` : '';
    goto(`/?from=${origin}&to=${destination}${dateParam}`);
  }
  
  // Function to show search results for a specific search history item
  async function showSearchResults(search: SearchHistory): Promise<void> {
    // Clear previous results and set loading state
    selectedSearchResults = null;
    searchResultsError = null;
    isLoadingSearchResults = true;
    
    try {
      // Set the selected route for UI display
      selectedSearchRoute = `${search.origin_iata} → ${search.destination_iata}`;
      
      // Fetch route rankings from the API
      const results = await fetchRouteRankings(
        search.origin_iata,
        search.destination_iata,
        search.search_date || undefined
      );
      
      // Store the results
      selectedSearchResults = results;
      
      // Scroll to the results section
      setTimeout(() => {
        const resultsSection = document.getElementById('search-results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching search results:', error);
      searchResultsError = error instanceof Error ? error.message : 'Failed to load search results';
    } finally {
      isLoadingSearchResults = false;
    }
  }
  
  // Helper function to transform raw route data (copied from main page)
  function transformRouteData(rawRouteData: any): any {
    if (!rawRouteData || !rawRouteData.routes) return rawRouteData;
    
    // Transform each route with necessary formatting
    const transformedRoutes = rawRouteData.routes.map((route: any, index: number) => {
      return {
        ...route,
        rank: route.rank || (index + 1)
      };
    });
    
    // Sort routes by rank
    const sortedRoutes = transformedRoutes.sort((a: any, b: any) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return (b.smart_rank || 0) - (a.smart_rank || 0);
    });
    
    return {
      ...rawRouteData,
      routes: sortedRoutes
    };
  }
  
  // Compute transformed route data
  $: transformedSearchResults = transformRouteData(selectedSearchResults);
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <h1 class="text-3xl font-bold text-white mb-6 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-sky-accent" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
    </svg>
    Your Profile
  </h1>

  <!-- User profile information -->
  <div class="mb-8">
    <div class="md:flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-white mb-2 md:mb-0">
        Welcome, {profile?.display_name || 'User'}!
      </h2>
      
      <div class="flex items-center space-x-3">
        <a href="/profile/credits" class="flex items-center bg-white/10 hover:bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-300 border border-white/20 shadow-sm">
          <div class="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="text-white font-medium">
              {#if creditsLoading}
                Loading...
              {:else}
                {credits} Credits
              {/if}
            </span>
          </div>
        </a>
        
        <a href="/profile/edit" class="flex items-center bg-white/10 hover:bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-300 border border-white/20 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="text-white">Edit Profile</span>
        </a>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col">
          <span class="text-white/60 text-sm mb-1">Email</span>
          <span class="text-white">{profile?.email || 'No email'}</span>
        </div>
        
        
        <div class="flex flex-col">
          <span class="text-white/60 text-sm mb-1">Credits</span>
          <div class="flex items-center">
            <span class="text-white">
              {#if creditsLoading}
                Loading...
              {:else}
                {credits} available
              {/if}
            </span>
            <a href="/profile/credits" class="text-sky-accent hover:underline ml-2 text-sm">
              Manage
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Saved Routes -->
  <div class="mb-8">
    <h2 class="text-xl font-bold text-white mb-4 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      Saved Routes
    </h2>
    
    {#if savedRoutes.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each savedRoutes as route}
          <button 
            class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg hover:from-white/20 hover:to-white/10 transition-all cursor-pointer text-left w-full"
            on:click={() => goToRoute(route.origin_iata, route.destination_iata)}
            on:keydown={(e) => e.key === 'Enter' && goToRoute(route.origin_iata, route.destination_iata)}
            aria-label={`View route from ${route.origin_iata} to ${route.destination_iata}`}
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex flex-col">
                <div class="text-lg font-bold text-white flex items-center">
                  <span>{route.origin_iata}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-2 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span>{route.destination_iata}</span>
                </div>
                <span class="text-white/60 text-sm">Saved on {formatDate(route.created_at)}</span>
              </div>
              {#if route.is_favorite}
                <div class="bg-yellow-400/20 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              {/if}
            </div>
            
            {#if route.notes}
              <div class="text-white/80 text-sm bg-white/5 p-2 rounded-md">
                {route.notes}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {:else}
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
        <p class="text-white/80">You haven't saved any routes yet.</p>
        <p class="text-white/60 text-sm mt-2">When you find a flight route you like, save it for easy access later.</p>
      </div>
    {/if}
  </div>
  
  <!-- Recent Search History -->
  <div class="mb-8">
    <h2 class="text-xl font-bold text-white mb-4 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Recent Searches
    </h2>
    
    {#if searchHistory.length > 0}
      <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-white/10">
            <thead class="bg-white/5">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Route</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Searched On</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              {#each searchHistory as search}
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-white font-medium">{search.origin_iata} → {search.destination_iata}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-white/80">{search.search_date || 'Any date'}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-white/60 text-sm">{formatDate(search.created_at)}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right space-x-3">
                    <button 
                      class="text-sky-accent hover:text-white transition-colors"
                      on:click={() => showSearchResults(search)}
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
        <p class="text-white/80">No search history yet.</p>
        <p class="text-white/60 text-sm mt-2">Your recent flight searches will appear here.</p>
      </div>
    {/if}
  </div>
  
  <!-- Search Results Section -->
  {#if isLoadingSearchResults || selectedSearchResults || searchResultsError}
    <div id="search-results-section" class="mt-8 mb-8">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Search Results
      </h2>
      
      {#if isLoadingSearchResults}
        <div class="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div class="flex flex-col items-center">
            <Loader />
            <p class="text-white/80 mt-4">Loading search results...</p>
          </div>
        </div>
      {:else if searchResultsError}
        <div class="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-red-400/20 shadow-lg">
          <div class="text-center text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="font-medium mb-1">Error loading search results</p>
            <p class="text-sm">{searchResultsError}</p>
          </div>
        </div>
      {:else if transformedSearchResults && transformedSearchResults.routes && transformedSearchResults.routes.length > 0}
        <div class="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div class="flex flex-col md:flex-row justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white text-center md:text-left mb-3 md:mb-0">
              Best Routes: <span class="text-sky-accent">{selectedSearchRoute}</span>
            </h3>
            
            <!-- Date badge if available -->
            {#if transformedSearchResults.query.date}
              <div class="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white flex items-center gap-2 border border-white/10 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(transformedSearchResults.query.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
              </div>
            {/if}
          </div>
          
          <!-- Flight cards -->
          <div class="space-y-4">
            {#each transformedSearchResults.routes as route, index}
              <div>
                <FlightCard flightData={route} rank={route.rank ?? (index + 1)} />
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div class="text-center text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-white/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="font-medium mb-1">No flight routes found</p>
            <p class="text-sm">Try searching again with different parameters</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div> 