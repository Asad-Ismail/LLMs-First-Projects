<!-- src/lib/components/ErrorMessage.svelte -->
<script lang="ts">
  export let message: string;
</script>

<div class="p-4 rounded-lg bg-white/10 backdrop-blur-md border border-flight-danger/30 text-white shadow-md">
  <div class="flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-flight-danger mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{message}</span>
  </div>
</div>