<script lang="ts">
  import UserProfile from '$lib/components/Auth/UserProfile.svelte';
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <h1 class="text-3xl font-bold text-white mb-6 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-sky-accent" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
    </svg>
    Your Profile
  </h1>
  <UserProfile />
</div> 