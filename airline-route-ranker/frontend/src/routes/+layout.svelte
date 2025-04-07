<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';

  // Create a store for auth state that can be used by components
  export const authStore = writable({
    user: null,
    loading: true
  });

  // Handle logout
  export async function handleLogout() {
    await supabase.auth.signOut();
    goto('/');
  }

  // Check user on mount
  onMount(async () => {
    // Get initial auth state
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    authStore.update(state => ({ ...state, user: currentUser, loading: false }));

    // Set up auth listener for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authStore.update(state => ({ ...state, user: session?.user || null }));
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  });
</script>

<!-- Just render the child components without adding additional structure -->
<slot /> 