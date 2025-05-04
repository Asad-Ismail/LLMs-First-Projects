<script lang="ts">
  // Shooting stars component that adds occasional shooting stars to the background
  import { onMount } from 'svelte';
  
  // Settings
  export let count = 5; // Number of shooting stars
  export let minDuration = 4; // Minimum animation duration in seconds
  export let maxDuration = 8; // Maximum animation duration in seconds
  export let minDelay = 1; // Minimum delay between animations
  export let maxDelay = 15; // Maximum delay between animations
  export const color = "#ffffff"; // Color of shooting stars (for external reference)
  
  interface ShootingStar {
    top: number;
    left: number;
    width: number;
    angle: number;
    duration: number;
    delay: number;
  }
  
  let stars: ShootingStar[] = [];
  
  onMount(() => {
    // Create randomly positioned shooting stars
    stars = Array(count).fill(0).map(() => {
      return {
        top: Math.random() * 70, // % from top (keep away from bottom edge)
        left: Math.random() * 70, // % from left (keep away from right edge)
        width: 100 + Math.random() * 150, // length of shooting star
        angle: -15 - Math.random() * 30, // angle of shooting star (degrees)
        duration: minDuration + Math.random() * (maxDuration - minDuration),
        delay: minDelay + Math.random() * (maxDelay - minDelay)
      };
    });
  });
</script>

<div class="shooting-stars-container">
  {#each stars as star, i}
    <div
      class="shooting-star"
      style="
        top: {star.top}%;
        left: {star.left}%;
        width: {star.width}px;
        transform: rotate({star.angle}deg);
        animation-duration: {star.duration}s;
        animation-delay: {star.delay}s;
      "
    ></div>
  {/each}
</div>

<style>
  .shooting-stars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none; /* Allow clicks to pass through */
    z-index: 1;
  }
  
  .shooting-star {
    position: absolute;
    height: 1px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%);
    animation: shoot linear infinite;
    opacity: 0;
  }
  
  .shooting-star::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 1px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%);
    transform: translateX(100%);
    border-radius: 50%;
    box-shadow: 0 0 8px 1px rgba(255, 255, 255, 0.7);
  }
  
  @keyframes shoot {
    0% {
      opacity: 0;
      transform: translateX(0) rotate(0);
    }
    5% {
      opacity: 1;
    }
    10% {
      transform: translateX(calc(2000px * -1)) rotate(0);
    }
    100% {
      opacity: 0;
    }
  }
</style> 