<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import bestFlightsAuth from '$lib/auth';
  import StarryBackground from '$lib/components/StarryBackground.svelte';
  import Header from '$lib/components/Navigation/Header.svelte';

  let loading = true;
  let isAuthenticated = false;
  
  // Tab styles
  const activeTabClass = "text-white border-b-2 border-sky-accent";
  const normalTabClass = "text-white/70 hover:text-white border-b-2 border-transparent hover:border-white/20";

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
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-stretch bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden mb-6">
          <a href="/profile" class={`px-4 py-3 font-medium flex items-center gap-2 transition duration-200 ${$page.url.pathname === '/profile' ? activeTabClass : normalTabClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Overview
          </a>
          
          <a href="/profile/credits" class={`px-4 py-3 font-medium flex items-center gap-2 transition duration-200 ${$page.url.pathname === '/profile/credits' ? activeTabClass : normalTabClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Credits
          </a>
          
          <a href="/profile/edit" class={`px-4 py-3 font-medium flex items-center gap-2 transition duration-200 ${$page.url.pathname === '/profile/edit' ? activeTabClass : normalTabClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </a>
        </div>
      </div>
      <slot />
    </div>
  {/if}
</div> 