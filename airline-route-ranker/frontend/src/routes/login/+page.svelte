<script lang="ts">
  import { onMount } from 'svelte';
  import bestFlightsAuth from '$lib/auth';
  import LoginForm from '$lib/components/Auth/LoginForm.svelte';
  import StarryBackground from '$lib/components/StarryBackground.svelte';
  import Header from '$lib/components/Navigation/Header.svelte';
  import { goto } from '$app/navigation';

  // Check if already logged in
  onMount(async () => {
    const user = await bestFlightsAuth.getCurrentUser();
    if (user) {
      // Already logged in, redirect to profile
      goto('/profile');
    }
  });
</script>

<div class="relative min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed overflow-hidden">
  <!-- Add our animated starry background -->
  <StarryBackground starCount={150} bigStarCount={30} />
  
  <!-- Add navigation header -->
  <Header currentPage="home" />
  
  <div class="container mx-auto max-w-6xl px-4 py-8 relative z-10">
    <div class="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 class="text-3xl font-bold text-white mb-6 text-shadow-lg">Sign In to BestFlights</h1>
      <p class="text-white/80 mb-8 text-center max-w-md text-shadow">
        Sign in to your BestFlights account to save your favorite routes and access your flight search history.
      </p>
      
      <LoginForm />
    </div>
  </div>
</div>

<style>
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  }
</style> 