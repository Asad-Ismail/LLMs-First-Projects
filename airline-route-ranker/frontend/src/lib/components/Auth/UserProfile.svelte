<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase, getUserProfile, getSavedRoutes } from '$lib/supabase';
  import type { SavedRoute } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import type { User } from '@supabase/supabase-js';

  // Component state
  let profile: any = null;
  let savedRoutes: SavedRoute[] = [];
  let loading = true;
  let errorMessage = '';
  let searchHistory: any[] = [];
  let isLoadingHistory = false;

  onMount(async () => {
    await loadUserData();
  });

  // Load user data
  async function loadUserData() {
    loading = true;
    errorMessage = '';

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not logged in
        goto('/login');
        return;
      }

      // Load profile data
      profile = await getUserProfile();
      
      // Load saved routes
      savedRoutes = await getSavedRoutes();
      
      // Try to load search history
      await loadSearchHistory();
    } catch (err: any) {
      errorMessage = err.message || 'Failed to load profile data';
      console.error('Profile error:', err);
    } finally {
      loading = false;
    }
  }

  // Load search history
  async function loadSearchHistory() {
    isLoadingHistory = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      searchHistory = data || [];
    } catch (err: any) {
      console.error('Error loading search history:', err);
    } finally {
      isLoadingHistory = false;
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      goto('/');
    } catch (err: any) {
      errorMessage = err.message || 'Failed to log out';
      console.error('Logout error:', err);
    }
  }

  // Delete saved route
  async function deleteSavedRoute(routeId: string) {
    try {
      const { error } = await supabase
        .from('user_saved_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      // Refresh saved routes
      savedRoutes = savedRoutes.filter(route => route.id !== routeId);
    } catch (err: any) {
      errorMessage = err.message || 'Failed to delete saved route';
      console.error('Delete route error:', err);
    }
  }

  // Toggle favorite status
  async function toggleFavorite(route: SavedRoute) {
    try {
      const { error } = await supabase
        .from('user_saved_routes')
        .update({ is_favorite: !route.is_favorite })
        .eq('id', route.id);

      if (error) throw error;

      // Update local state
      savedRoutes = savedRoutes.map(r => 
        r.id === route.id 
          ? { ...r, is_favorite: !r.is_favorite } 
          : r
      );
    } catch (err: any) {
      errorMessage = err.message || 'Failed to update favorite status';
      console.error('Favorite toggle error:', err);
    }
  }
</script>

<div class="w-full rounded-lg overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center min-h-[300px]">
      <div class="animate-pulse flex space-x-4">
        <div class="rounded-full bg-slate-200/50 h-16 w-16"></div>
        <div class="flex-1 space-y-3 py-1">
          <div class="h-4 bg-slate-200/50 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-slate-200/50 rounded"></div>
            <div class="h-4 bg-slate-200/50 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Error Message -->
    {#if errorMessage}
      <div class="p-4 bg-flight-danger/20 border border-flight-danger/40 text-white rounded-md m-4">
        <h3 class="font-bold mb-1">Error</h3>
        <p>{errorMessage}</p>
        <button
          class="mt-2 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          on:click={() => goto('/login')}
        >
          Go to Login
        </button>
      </div>
    {/if}

    <!-- Profile Details -->
    {#if profile}
      <div class="bg-gradient-to-r from-sky-dark/70 to-flight-primary/70 p-6">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <!-- Profile Image -->
          <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30">
            {#if profile.avatar_url}
              <img src={profile.avatar_url} alt="Profile" class="w-full h-full object-cover" />
            {:else}
              <span class="text-3xl text-white font-bold">{profile.display_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}</span>
            {/if}
          </div>

          <!-- Profile Info -->
          <div class="flex-1 text-center md:text-left">
            <h2 class="text-2xl font-bold text-white">
              {profile.display_name || 'User'}
            </h2>
            <p class="text-white/80 mb-2">{profile.email}</p>
            
            <div class="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              <button
                class="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition duration-200"
                on:click={() => goto('/profile/edit')}
              >
                Edit Profile
              </button>
              
              <button
                class="px-4 py-2 bg-flight-danger/30 text-white rounded-md hover:bg-flight-danger/50 transition duration-200"
                on:click={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Saved Routes -->
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-accent" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd" />
          </svg>
          Your Saved Routes
        </h3>
        
        {#if savedRoutes.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each savedRoutes as route}
              <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:shadow-lg transition duration-200 group relative">
                <!-- Favorite icon -->
                <button 
                  class="absolute top-2 right-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                  on:click={() => toggleFavorite(route)}
                >
                  {#if route.is_favorite}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  {/if}
                </button>
                
                <!-- Route header -->
                <div class="flex items-center mb-3">
                  <div class="bg-gradient-to-r from-sky-accent/30 to-flight-primary/30 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-bold text-white text-lg">{route.origin_iata} → {route.destination_iata}</h4>
                    <div class="flex items-center text-white/70 text-xs">
                      <span>Saved on {formatDate(route.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Route details -->
                <div class="p-3 rounded-lg bg-white/5 mb-3 border border-white/10">
                  {#if route.route_data?.price?.amount}
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-white/70 text-sm">Price:</span>
                      <span class="text-white font-medium">${route.route_data.price.amount} {route.route_data.price.currency || 'USD'}</span>
                    </div>
                  {/if}
                  
                  {#if route.route_data?.total_duration}
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-white/70 text-sm">Duration:</span>
                      <span class="text-white font-medium">{route.route_data.total_duration}</span>
                    </div>
                  {/if}
                  
                  {#if route.route_data?.operating_airline}
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-white/70 text-sm">Airline:</span>
                      <span class="text-white font-medium">{route.route_data.operating_airline}</span>
                    </div>
                  {/if}
                  
                  {#if route.route_data?.connections !== undefined}
                    <div class="flex justify-between items-center">
                      <span class="text-white/70 text-sm">Connections:</span>
                      <span class="text-white font-medium">{route.route_data.connections || 'Direct'}</span>
                    </div>
                  {/if}
                </div>
                
                {#if route.notes}
                  <div class="p-3 rounded-lg bg-white/5 mb-3 border border-white/10">
                    <span class="text-white/70 text-sm">Notes:</span>
                    <p class="text-white text-sm mt-1">{route.notes}</p>
                  </div>
                {/if}
                
                <!-- Actions -->
                <div class="flex justify-between mt-4">
                  <button
                    class="py-1.5 px-3 bg-sky-accent/20 hover:bg-sky-accent/40 text-white rounded-md transition duration-200 text-sm flex items-center"
                    on:click={() => goto(`/?origin=${route.origin_iata}&destination=${route.destination_iata}`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Search Again
                  </button>
                  
                  <button
                    class="py-1.5 px-3 bg-flight-danger/20 hover:bg-flight-danger/40 text-white rounded-md transition duration-200 text-sm flex items-center"
                    on:click={() => deleteSavedRoute(route.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-white/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p class="text-white/80 mb-3">You haven't saved any routes yet. Search for flights and save your favorite routes!</p>
            <button
              class="px-4 py-2 bg-gradient-to-r from-flight-primary to-sky-accent text-white rounded-md hover:bg-sky-accent/90 transition duration-200"
              on:click={() => goto('/')}
            >
              Search Flights
            </button>
          </div>
        {/if}
        
        <!-- Recent Searches -->
        <h3 class="text-xl font-semibold text-white mt-8 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-accent" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          Recent Searches
        </h3>
        
        {#if isLoadingHistory}
          <div class="animate-pulse space-y-3">
            <div class="h-10 bg-white/10 rounded w-full"></div>
            <div class="h-10 bg-white/10 rounded w-full"></div>
            <div class="h-10 bg-white/10 rounded w-full"></div>
          </div>
        {:else if searchHistory.length > 0}
          <div class="space-y-3">
            {#each searchHistory as search}
              <div class="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors group">
                <div class="flex items-center">
                  <div class="mr-3 p-2 bg-white/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-white font-medium">{search.origin_iata} → {search.destination_iata}</div>
                    <div class="text-white/60 text-xs">{formatDate(search.created_at)}</div>
                  </div>
                </div>
                <button
                  class="opacity-0 group-hover:opacity-100 py-1 px-2 bg-white/10 text-white text-sm rounded transition-all hover:bg-white/20"
                  on:click={() => goto(`/?origin=${search.origin_iata}&destination=${search.destination_iata}${search.search_date ? `&date=${search.search_date}` : ''}`)}
                >
                  Search Again
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center">
            <p class="text-white/80">No recent searches found.</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-white/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-white/80 mb-4">User profile not found. Please log in again.</p>
        <button
          class="px-4 py-2 bg-gradient-to-r from-flight-primary to-sky-accent text-white rounded-md hover:shadow-lg transition duration-200"
          on:click={() => goto('/login')}
        >
          Go to Login
        </button>
      </div>
    {/if}
  {/if}
</div> 