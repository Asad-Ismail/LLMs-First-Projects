<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import SignupForm from '$lib/components/Auth/SignupForm.svelte';
  import { goto } from '$app/navigation';

  // Check if already logged in
  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Already logged in, redirect to profile
      goto('/profile');
    }
  });
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <h1 class="text-3xl font-bold text-sky-dark mb-6">Create Your Account</h1>
    <p class="text-gray-600 mb-8 text-center max-w-md">
      Join Airline Route Ranker to save your favorite routes, get personalized recommendations, and access your flight search history.
    </p>
    
    <SignupForm />
  </div>
</div> 