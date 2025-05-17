<script lang="ts">
  import { onMount } from 'svelte';
  import bestFlightsAuth from '$lib/auth';
  import { goto } from '$app/navigation';
  import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
  import CreditStatus from '../Navigation/CreditStatus.svelte';
  
  // User state with proper typing
  let user: User | null = null;
  let loading = true;

  // Check user on mount
  onMount(() => {
    // Get initial auth state
    const fetchUser = async () => {
      user = await bestFlightsAuth.getCurrentUser();
      loading = false;
    };
    
    fetchUser();

    // Set up auth listener for changes
    const { data: { subscription } } = bestFlightsAuth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        user = session?.user || null;
      }
    );

    // Return cleanup function - ensure it matches expected type
    return () => {
      subscription.unsubscribe();
    };
  });

  // Handle logout
  async function handleLogout() {
    await bestFlightsAuth.signOut();
    goto('/');
  }
</script>

<!-- These styles are designed to blend with the existing header shown in the screenshot -->
{#if loading}
  <div class="animate-pulse h-5 w-16 bg-gray-400/30 rounded"></div>
{:else if user}
  <div class="flex items-center gap-4">
    <CreditStatus minimal={true} />
    
    <a href="/profile" class="text-white hover:text-blue-200 transition-colors flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      Profile
    </a>
    
    <button 
      on:click={handleLogout}
      class="text-white hover:text-red-300 transition-colors flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  </div>
{:else}
  <div class="flex items-center space-x-3">
    <a href="/login" class="text-white hover:text-blue-200 transition-colors">Login</a>
    <a href="/signup" class="text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      Sign Up
    </a>
  </div>
{/if} 