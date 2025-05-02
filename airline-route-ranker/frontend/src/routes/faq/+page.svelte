<script lang="ts">
  import AuthControls from '$lib/components/Auth/AuthControls.svelte';
  import { onMount } from 'svelte';
  
  let activeQuestion: number | null = null;
  let mobileMenuOpen = false;
  
  // Function to toggle accordion items
  function toggleQuestion(index: number): void {
    activeQuestion = activeQuestion === index ? null : index;
  }
  
  // Function to toggle mobile menu
  function toggleMobileMenu(): void {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  // FAQ data structure
  const faqItems = [
    {
      question: "How does Smart Ranking work?",
      answer: `Our Smart Ranking system evaluates flights based on three key factors that matter most to travelers:
      
      • Reliability (35%): Based on historical flight performance including delays and cancellations
      • Price (30%): The cost of the flight compared to other options on the same route
      • Duration (35%): Total travel time including connections
      
      A higher score indicates a better overall flight option, balancing reliability, price, and duration.`
    },
    {
      question: "How is Reliability calculated?",
      answer: `Our reliability score analyzes historical flight data for the specific route and aircraft, focusing on what matters most to travelers:
      
      • Recent on-time performance
      • Historical delay patterns and average delay time
      • Cancellation frequency
      • Seasonal performance variations
      • Airport-specific factors
      
      The algorithm provides route-specific reliability predictions rather than generic airline ratings.`
    },
    {
      question: "What does 'Limited historical data' mean?",
      answer: "This indication appears when we have less than optimal historical performance data for a specific route or airline. This could be due to new routes, seasonal flights, or limited reporting. In these cases, reliability scores should be considered estimates."
    },
    {
      question: "How often is flight data updated?",
      answer: "Our flight data is updated daily to provide the most current information on pricing, schedules, and reliability metrics. Historical performance data is aggregated from the past 90 days with emphasis on recent performance."
    },
    {
      question: "Do you have partnerships with any airlines?",
      answer: "No, we don't partner with any airline or show preference to any carrier. We simply provide unbiased data about airline performance, price, and reliability to help you make informed travel decisions."
    }
  ];
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Header (reused from main page with mobile improvements) -->
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
          <a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">About</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/faq" class="text-sky-accent transition-colors text-sm font-medium">FAQ</a>
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
        <!-- Hamburger icon for mobile menu with improved styling -->
        <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </button>
    </div>
    
    <!-- Mobile Menu (Slide down when open) -->
    {#if mobileMenuOpen}
      <div class="md:hidden bg-sky-dark/95 backdrop-blur-xl border-b border-white/10 animate-slideDown">
        <div class="container mx-auto py-4 px-5 flex flex-col space-y-3">
          <a href="/about" class="text-white/90 hover:text-sky-accent py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
            About
          </a>
          <a href="/faq" class="text-sky-accent py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium">
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
  
  <!-- FAQ Content -->
  <div class="container mx-auto p-4 pt-8 md:pt-12">
    <div class="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-lg border border-white/20">
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 text-center">Frequently Asked Questions</h1>
      
      <!-- Elegant accordion-style FAQ -->
      <div class="space-y-3 md:space-y-4">
        {#each faqItems as item, index}
          <div class="overflow-hidden rounded-lg transition-all duration-300 backdrop-blur-md border border-white/20">
            <!-- Question header (always visible) -->
            <button 
              class="w-full flex justify-between items-center p-3 md:p-5 text-left font-medium transition-colors {activeQuestion === index ? 'bg-sky-accent/30' : 'bg-white/10 hover:bg-white/15'}" 
              on:click={() => toggleQuestion(index)}
              aria-expanded={activeQuestion === index}
            >
              <span class="text-white text-sm md:text-base pr-2">{item.question}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-4 w-4 md:h-5 md:w-5 text-white/90 transition-transform duration-300 flex-shrink-0 {activeQuestion === index ? 'rotate-180' : ''}" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Answer panel (expandable) -->
            <div 
              class="bg-white/90 overflow-hidden transition-all duration-300 {activeQuestion === index ? 'max-h-[500px]' : 'max-h-0'}"
              aria-hidden={activeQuestion !== index}
            >
              <div class="p-3 md:p-5 text-gray-700 whitespace-pre-line text-sm md:text-base">
                {item.answer}
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Back to Home Button -->
      <div class="mt-6 md:mt-8 text-center">
        <a href="/" class="inline-block bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2 px-5 md:px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg text-sm md:text-base">
          Back to Flight Search
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any needed styles */
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s infinite;
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out forwards;
  }
  
  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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