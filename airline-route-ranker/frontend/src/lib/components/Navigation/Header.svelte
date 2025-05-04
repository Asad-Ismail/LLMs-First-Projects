<script lang="ts">
  import AuthControls from '$lib/components/Auth/AuthControls.svelte';
  
  // Optional prop to highlight the current page
  export let currentPage: 'home' | 'about' | 'faq' | 'contact' | 'profile' = 'home';
</script>

<!-- Enhanced Header & Navigation with Glass Morphism -->
<header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
  <div class="container mx-auto px-4 flex justify-between items-center">
    <div class="flex-1 flex justify-start">
      <div class="hidden md:flex bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
        <a 
          href="/" 
          class={`text-${currentPage === 'home' ? 'sky-accent' : 'white/90'} hover:text-sky-accent transition-colors text-sm font-medium`}
        >
          Home
        </a>
      </div>
    </div>
    
    <div class="flex items-center gap-3 justify-center flex-1">
      <div class="bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20">
        <img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-7 w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500" />
      </div>
      <h1 class="text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary">Flight</span> Reliability Rankings
      </h1>
    </div>
    
    <!-- Navigation -->
    <nav class="hidden md:flex gap-6 justify-end flex-1">
      <div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
        <a 
          href="/about" 
          class={`text-${currentPage === 'about' ? 'sky-accent' : 'white/90'} hover:text-sky-accent transition-colors text-sm font-medium`}
        >
          About
        </a>
        <span class="text-sky-accent/50">|</span>
        <a 
          href="/faq" 
          class={`text-${currentPage === 'faq' ? 'sky-accent' : 'white/90'} hover:text-sky-accent transition-colors text-sm font-medium`}
        >
          FAQ
        </a>
        <span class="text-sky-accent/50">|</span>
        <a 
          href="/contact" 
          class={`text-${currentPage === 'contact' ? 'sky-accent' : 'white/90'} hover:text-sky-accent transition-colors text-sm font-medium`}
        >
          Contact
        </a>
      </div>
      
      <!-- Auth Controls -->
      <div class="ml-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
        <AuthControls />
      </div>
    </nav>
    
    <button class="md:hidden text-white flex-1 flex justify-end">
      <!-- Hamburger icon for mobile menu with improved styling -->
      <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </div>
    </button>
  </div>
</header>

<style>
  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style> 