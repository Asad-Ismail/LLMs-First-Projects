<script lang="ts">
  import AuthControls from '$lib/components/Auth/AuthControls.svelte';
  import { onMount } from 'svelte';
  
  // Optional prop to highlight the current page
  export let currentPage: 'home' | 'about' | 'faq' | 'contact' | 'profile' = 'home';
  
  // Add state for mobile menu
  let mobileMenuOpen = false;
  
  // Toggle mobile menu function with explicit debug
  function toggleMobileMenu() {
    console.log('Toggle mobile menu clicked');
    mobileMenuOpen = !mobileMenuOpen;
    console.log('Mobile menu is now:', mobileMenuOpen ? 'OPEN' : 'CLOSED');
  }

  // Ensure menu closes when clicking links
  function closeMenu() {
    mobileMenuOpen = false;
  }

  // Handle keyboard events
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileMenuOpen) {
      mobileMenuOpen = false;
    }
  }

  onMount(() => {
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeydown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} />

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
      <div class="plane-icon-container bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20">
        <img src="/plane-takeoff.svg" alt="Flight Ranking" class="plane-icon h-7 w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500" />
      </div>
      <h1 class="text-xl md:text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90">
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
    
    <!-- Mobile hamburger button - simplified with direct on:click handler -->
    <button 
      on:click={toggleMobileMenu} 
      class="md:hidden text-white flex-1 flex justify-end"
    >
      <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </div>
    </button>
  </div>
</header>

<!-- Mobile menu as a separate component outside the header -->
{#if mobileMenuOpen}
  <div class="mobile-menu md:hidden fixed inset-0 bg-sky-dark/95 z-50 pt-16">
    <div class="container mx-auto px-6">
      <!-- Close button -->
      <button 
        on:click={toggleMobileMenu}
        class="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Mobile navigation links -->
      <div class="flex flex-col space-y-6 items-center text-center pt-8">
        <a 
          href="/" 
          on:click={closeMenu}
          class={`text-xl font-medium ${currentPage === 'home' ? 'text-sky-accent' : 'text-white'} hover:text-sky-accent transition-colors py-2`}
        >
          Home
        </a>
        <a 
          href="/about" 
          on:click={closeMenu}
          class={`text-xl font-medium ${currentPage === 'about' ? 'text-sky-accent' : 'text-white'} hover:text-sky-accent transition-colors py-2`}
        >
          About
        </a>
        <a 
          href="/faq" 
          on:click={closeMenu}
          class={`text-xl font-medium ${currentPage === 'faq' ? 'text-sky-accent' : 'text-white'} hover:text-sky-accent transition-colors py-2`}
        >
          FAQ
        </a>
        <a 
          href="/contact" 
          on:click={closeMenu}
          class={`text-xl font-medium ${currentPage === 'contact' ? 'text-sky-accent' : 'text-white'} hover:text-sky-accent transition-colors py-2`}
        >
          Contact
        </a>
        
        <!-- Mobile auth controls -->
        <div class="w-full max-w-xs bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 mt-4">
          <AuthControls />
        </div>
      </div>
    </div>
  </div>
{/if}

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
  
  /* Mobile menu styles */
  .mobile-menu {
    display: block;
    animation: fadeIn 0.3s ease-in-out;
    backdrop-filter: blur(8px);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style> 