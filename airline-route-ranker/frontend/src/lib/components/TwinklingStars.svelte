<script lang="ts">
  // Twinkle star component - creates a beautiful twinkling stars effect
  import { onMount } from 'svelte';
  
  // Star type definition
  interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
    animationDelay: number;
    animationDuration: number;
  }
  
  // Props
  export let starCount = 100; // Number of stars to create
  export let minSize = 1; // Minimum star size in pixels
  export let maxSize = 3; // Maximum star size in pixels
  export let minOpacity = 0.1; // Minimum opacity
  export let maxOpacity = 1; // Maximum opacity
  export let twinkleSpeed = 4; // Speed of twinkling animation (seconds)
  
  let stars: Star[] = [];
  
  // Create stars with random positions, sizes, and animation delays
  onMount(() => {
    stars = Array(starCount).fill(0).map(() => {
      return {
        x: Math.random() * 100, // % position
        y: Math.random() * 100, // % position
        size: minSize + Math.random() * (maxSize - minSize),
        opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
        animationDelay: Math.random() * twinkleSpeed,
        animationDuration: (twinkleSpeed - 1) + Math.random() * 2
      };
    });
  });
</script>

<div class="twinkle-container">
  {#each stars as star}
    <div
      class="star"
      style="
        left: {star.x}%;
        top: {star.y}%;
        width: {star.size}px;
        height: {star.size}px;
        opacity: {star.opacity};
        animation-delay: {star.animationDelay}s;
        animation-duration: {star.animationDuration}s;
      "
    ></div>
  {/each}
</div>

<style>
  .twinkle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none; /* Allow clicks to pass through to elements beneath */
    z-index: 1; /* Make sure it's above the background but below the content */
  }
  
  .star {
    position: absolute;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px 1px rgba(255, 255, 255, 0.4);
    animation: twinkle linear infinite;
  }
  
  @keyframes twinkle {
    0% {
      opacity: 0.2;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
    100% {
      opacity: 0.2;
      transform: scale(0.8);
    }
  }
</style> 