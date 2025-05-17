<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  export let minimal = false; // For compact display in header
  let credits = 0;
  let loading = true;
  
  onMount(async () => {
    await loadCreditInfo();
  });
  
  async function loadCreditInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      credits = data.credits || 0;
    } catch (err) {
      console.error('Error loading credit info:', err);
    } finally {
      loading = false;
    }
  }
</script>

{#if minimal}
  <div class="flex items-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {#if loading}
      <span class="text-xs">...</span>
    {:else}
      <span class="text-xs text-yellow-300 font-medium">{credits}</span>
    {/if}
  </div>
{:else}
  <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10 shadow-sm">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    
    {#if loading}
      <span class="text-xs">Loading...</span>
    {:else}
      <span class="text-xs">{credits} Credits</span>
      <a href="/profile/credits" class="text-sky-accent hover:underline text-xs ml-1">
        Get More
      </a>
    {/if}
  </div>
{/if} 