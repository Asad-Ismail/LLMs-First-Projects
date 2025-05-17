<script lang="ts">
  import TwinklingStars from './TwinklingStars.svelte';
  import ShootingStars from './ShootingStars.svelte';
  
  // Twinkling stars props
  export let starCount = 100;
  export let bigStarCount = 25;
  export let shootingStarCount = 5;
  export let enableShootingStars = true;
  
  // Advanced customization options (with reasonable defaults)
  export let minStarSize = 1;
  export let maxStarSize = 3;
  export let minBigStarSize = 2;
  export let maxBigStarSize = 4;
</script>

<div class="starry-background">
  <!-- Regular twinkling stars -->
  <TwinklingStars 
    starCount={starCount} 
    minSize={minStarSize} 
    maxSize={maxStarSize} 
    minOpacity={0.1} 
    maxOpacity={0.7} 
    twinkleSpeed={4}
  />
  
  <!-- Brighter, larger twinkling stars -->
  <TwinklingStars 
    starCount={bigStarCount} 
    minSize={minBigStarSize} 
    maxSize={maxBigStarSize} 
    minOpacity={0.5} 
    maxOpacity={1} 
    twinkleSpeed={6}
  />
  
  <!-- Shooting stars (optional) -->
  {#if enableShootingStars}
    <ShootingStars count={shootingStarCount} />
  {/if}
</div>

<style>
  .starry-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    /* Make sure it's behind other content but above the background image */
    pointer-events: none; /* Don't interfere with clicks */
  }
</style> 