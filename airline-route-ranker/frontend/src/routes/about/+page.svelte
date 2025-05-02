<script lang="ts">
  // No specific script functionality needed for this page
  import AuthControls from '$lib/components/Auth/AuthControls.svelte';
  
  // Add mobile menu functionality
  let mobileMenuOpen = false;
  
  function toggleMobileMenu(): void {
    mobileMenuOpen = !mobileMenuOpen;
  }
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Header with mobile support -->
  <header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex-1 flex justify-start">
        <div class="bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Home</a>
        </div>
      </div>
      
      <div class="flex items-center gap-2 md:gap-3 justify-center flex-1">
        <div class="bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-1.5 md:p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20">
          <img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-5 w-5 md:h-7 md:w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500" />
        </div>
        <h1 class="text-lg md:text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary">Flight</span> <span class="hidden xs:inline">Reliability Rankings</span>
        </h1>
      </div>
      
      <nav class="hidden md:flex gap-6 justify-end flex-1">
        <div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/about" class="text-sky-accent transition-colors text-sm font-medium">About</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">FAQ</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/contact" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Contact</a>
        </div>
        
        <!-- Auth Controls -->
        <div class="ml-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <AuthControls />
        </div>
      </nav>
      
      <button 
        class="md:hidden text-white flex-1 flex justify-end"
        aria-label="Toggle Mobile Menu"
        on:click={toggleMobileMenu}
      >
        <!-- Hamburger icon for mobile menu -->
        <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </button>
    </div>
    
    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden bg-sky-dark/95 backdrop-blur-xl border-b border-white/10 animate-slideDown">
        <div class="container mx-auto py-4 px-5 flex flex-col space-y-3">
          <a href="/about" class="text-sky-accent py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium">
            About
          </a>
          <a href="/faq" class="text-white/90 hover:text-sky-accent py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
            FAQ
          </a>
          <a href="/contact" class="text-white/90 hover:text-sky-accent py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
            Contact
          </a>
          <div class="pt-2 border-t border-white/10">
            <AuthControls />
          </div>
        </div>
      </div>
    {/if}
  </header>
  
  <!-- Main content -->
  <div class="container mx-auto p-4 flex flex-col items-center justify-start pt-8 md:pt-12" style="min-height: calc(100vh - 80px);">
    <!-- Title -->
    <div class="text-center mb-6 md:mb-10 max-w-3xl px-4 animate-[fadeIn_0.8s_ease-in-out]">
      <h2 class="text-white text-2xl md:text-4xl font-medium mb-2 md:mb-4 text-shadow-md">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold">About</span> Airline Route Ranker
      </h2>
      <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base">
        Data-driven flight reliability insights to improve your travel experience
      </p>
    </div>
    
    <!-- Content -->
    <div class="w-full max-w-3xl space-y-6">
      <!-- Combined About Section -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-5 md:p-7 border border-white/20 shadow-lg">
        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
          <span class="text-sky-accent mr-2">✈️</span> Our Mission
        </h3>
        
        <div class="prose prose-invert max-w-none text-sm md:text-base">
          <p>We created Airline Route Ranker to solve a critical travel problem: flight experiences vary drastically depending on specific routes, yet most booking platforms only show generic airline ratings or sort by price alone.</p>
          
          <p>Our platform analyzes <strong>route-specific performance data</strong> including historical delays, cancellations, and on-time records to provide reliability scores that matter to your exact journey - not just general airline reputation.</p>
          
          <h4 class="text-white font-medium mt-5 mb-2">What Makes Us Different</h4>
          
          <ul class="space-y-2">
            <li><strong>Route-Specific Focus:</strong> We analyze performance on your exact route, not just general airline ratings</li>
            <li><strong>Data-Driven Rankings:</strong> Our scores combine reliability, price and duration metrics</li>
            <li><strong>Complete Independence:</strong> No airline partnerships or paid placements influencing our rankings</li>
          </ul>
        </div>
      </div>
      
      <!-- How It Works - Simplified -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-5 md:p-7 border border-white/20 shadow-lg">
        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
          <span class="text-sky-accent mr-2">🔍</span> How It Works
        </h3>
        
        <div class="prose prose-invert max-w-none text-sm md:text-base">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-white/5 rounded-lg p-3 border border-white/10">
              <div class="font-bold text-white mb-1">1. Data Collection</div>
              <p class="m-0 text-white/80 text-sm leading-relaxed">We analyze historical and recent flight performance data for specific routes</p>
            </div>
            
            <div class="bg-white/5 rounded-lg p-3 border border-white/10">
              <div class="font-bold text-white mb-1">2. Smart Ranking</div>
              <p class="m-0 text-white/80 text-sm leading-relaxed">Our algorithm weighs reliability (35%), price (30%), and duration (35%)</p>
            </div>
            
            <div class="bg-white/5 rounded-lg p-3 border border-white/10">
              <div class="font-bold text-white mb-1">3. Clear Results</div>
              <p class="m-0 text-white/80 text-sm leading-relaxed">Reliability scores help you make informed decisions quickly</p>
            </div>
          </div>
          
          <p>By focusing on actual performance data rather than marketing claims, we help you spend less time delayed in airports and more time at your destination.</p>
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="flex justify-center p-4">
        <a href="/" class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2.5 px-6 rounded-lg
                   transition-all duration-300 ease-in-out shadow-lg flex items-center gap-2 text-sm md:text-base">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span>Find Reliable Flights</span>
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom animations and styles */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out forwards;
  }
  
  /* Apply a subtle parallax effect to the background */
  .min-h-screen {
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
    position: relative;
    isolation: isolate;
  }
  
  .min-h-screen::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.6) 100%);
    pointer-events: none;
  }
  
  /* Style the prose content */
  .prose {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .prose p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }
  
  .prose strong {
    color: #ffffff;
  }
  
  .prose ul {
    margin-left: 1rem;
  }
  
  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  /* Add custom media query class for very small screens */
  @media (min-width: 375px) {
    .xs\:inline {
      display: inline;
    }
  }
  
  @media (max-width: 374px) {
    .hidden.xs\:inline {
      display: none;
    }
  }
</style> 