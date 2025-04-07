<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import bestFlightsAuth from '$lib/auth';
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';
  import type { User } from '@supabase/supabase-js';

  // Define the auth store type
  type AuthStore = {
    user: User | null;
    loading: boolean;
  };

  // Create a store for auth state that can be used by components
  export const authStore = writable<AuthStore>({
    user: null,
    loading: true
  });

  // Handle logout
  export async function handleLogout() {
    await bestFlightsAuth.signOut();
    goto('/');
  }

  // Check user on mount
  onMount(() => {
    const initializeAuth = async () => {
      // Get initial auth state
      const currentUser = await bestFlightsAuth.getCurrentUser();
      authStore.update(state => ({ ...state, user: currentUser, loading: false }));

      // Set up auth listener for changes
      const { data: { subscription } } = bestFlightsAuth.onAuthStateChange((event, session) => {
        authStore.update(state => ({ ...state, user: session?.user || null }));
      });

      // Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    // Execute initialization and store the promise
    const cleanup = initializeAuth();
    
    // Return cleanup function that waits for the async initialization to complete
    return () => {
      cleanup.then(cleanupFn => cleanupFn());
    };
  });
</script>

<!-- Just render the child components without adding additional structure -->
<slot /> 