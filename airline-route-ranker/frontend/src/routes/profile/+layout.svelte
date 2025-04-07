<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import bestFlightsAuth from '$lib/auth';
  import StarryBackground from '$lib/components/StarryBackground.svelte';
  import Header from '$lib/components/Navigation/Header.svelte';

  let loading = true;
  let isAuthenticated = false;

  onMount(async () => {
    const user = await bestFlightsAuth.getCurrentUser();
    isAuthenticated = !!user;
    
    if (!isAuthenticated) {
      goto('/login?returnUrl=/profile');
    }
    
    loading = false;
  });
</script>

<div class="relative min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed overflow-hidden">
  <!-- Add our animated starry background -->
  <StarryBackground starCount={150} bigStarCount={30} shootingStarCount={3} />
  
  <!-- Add navigation header -->
  <Header currentPage="profile" />
  
  {#if loading}
    <div class="flex justify-center items-center min-h-screen relative z-10">
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
  {:else if isAuthenticated}
    <div class="relative z-10">
      <slot />
    </div>
  {/if}
</div> 