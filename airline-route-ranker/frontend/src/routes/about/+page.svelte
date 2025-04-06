<script>
  // No specific script functionality needed for this page
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Header (reused) -->
  <header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex-1 flex justify-start">
        <div class="hidden md:flex bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Home</a>
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
      
      <nav class="hidden md:flex gap-6 justify-end flex-1">
        <div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">About</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">FAQ</a>
          <span class="text-sky-accent/50">|</span>
          <a href="/contact" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Contact</a>
        </div>
      </nav>
      
      <button class="md:hidden text-white flex-1 flex justify-end" aria-label="Open navigation menu">
        <div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </button>
    </div>
  </header>
  
  <!-- Main content -->
  <div class="container mx-auto p-4 flex flex-col items-center justify-start pt-12" style="min-height: calc(100vh - 80px);">
    <!-- Title -->
    <div class="text-center mb-10 max-w-3xl px-4 animate-[fadeIn_0.8s_ease-in-out]">
      <h2 class="text-white text-2xl md:text-4xl font-medium mb-4 text-shadow-md">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold">About</span> Airline Route Ranker
      </h2>
      <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base mb-6">
        The story behind the most useful flight reliability tool you never knew you needed
      </p>
    </div>
    
    <!-- Content -->
    <div class="w-full max-w-4xl space-y-8">
      <!-- The Story -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-white mb-4 flex items-center">
          <span class="text-sky-accent mr-2">✈️</span> From Frustration to Focus: The Airline Route Ranker Story
        </h3>
        
        <div class="prose prose-invert max-w-none">
          <p>Air travel planning often feels like a gamble. We choose airlines based on reputation, price, or past experiences, yet the reality of our journey can feel completely unpredictable. That feeling of uncertainty – wondering if this specific flight will be the one delayed for hours, or if the service will match the marketing hype – is something we believe travelers shouldn't have to accept.</p>
          
          <p>The "aha!" moment came when we noticed a recurring pattern: a traveler's experience with an airline could dramatically shift depending purely on the route they were flying. Why? Because airline operations aren't uniform. An airline might perform exceptionally well on short-haul, highly competitive European routes where regulations demand punctuality, yet struggle with consistency and service quality on complex long-haul flights to regions like Southeast Asia. General airline ratings simply couldn't capture this vital, route-specific nuance.</p>
          
          <p>This crucial insight is why Airline Route Ranker was born. We decided to tackle the problem head-on by creating a platform dedicated to revealing the true performance of specific flight routes.</p>
          
          <p><strong>Our Approach: Data, Not Hype</strong><br>
          We delve into the hard data: historical flight records, delay statistics, cancellation rates, and on-time performance metrics for individual routes. Our ratings are unbiased and based purely on documented, historical performance, giving you a clear picture of what to actually expect on your chosen path.</p>
          
          <p><strong>Empowering Your Journey:</strong><br>
          Using Airline Route Ranker means you can:</p>
          
          <ul>
            <li><strong>See Beyond the Brand:</strong> Compare flights based on how they actually operate on your specific route.</li>
            <li><strong>Prioritize Reliability:</strong> Easily identify flights with a stronger track record for punctuality.</li>
            <li><strong>Reduce Travel Stress:</strong> Make choices backed by data, increasing your confidence in your travel plans.</li>
          </ul>
          
          <p><strong>Looking Ahead: The Full Picture</strong><br>
          While reliability is crucial, we know it's only part of the story. Our vision extends to providing comprehensive, route-specific ratings that encompass the entire passenger experience – from the quality of in-flight service and amenities to the efficiency of airport procedures and transit connections. We want you to know what the journey feels like, not just when it's scheduled to arrive.</p>
          
          <p>Airline Route Ranker is more than just a tool; it's a commitment to transparency in air travel. We aim to equip millions of travelers worldwide with the insights needed to make smarter booking decisions, fostering a more reliable and pleasant flying experience for everyone.</p>
        </div>
      </div>
      
      <!-- How It Works -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-white mb-4 flex items-center">
          <span class="text-sky-accent mr-2">🔍</span> How It Works
        </h3>
        
        <div class="prose prose-invert max-w-none">
          <p>Our data-driven approach analyzes flight performance across multiple routes to provide you with reliability rankings that are both meaningful and actionable.</p>
          
          <ol>
            <li><strong>Historical Performance Analysis:</strong> We analyze data from the past year to identify long-term patterns of reliability on specific routes.</li>
            <li><strong>Recent Performance Tracking:</strong> Our system incorporates recent flight data to capture current performance trends and seasonal factors.</li>
            <li><strong>Comprehensive Ranking System:</strong> We evaluate the factors that matter most to passengers, prioritizing on-time performance, flight duration, and price.</li>
            <li><strong>Clear, Actionable Results:</strong> Our easy-to-understand reliability scores present complex data in a straightforward format to support informed decision-making.</li>
          </ol>
          
          <p>The result? You make smarter flight choices based on actual performance data, spending less time delayed in airports and more time at your destination.</p>
        </div>
      </div>
      
      <!-- Why Trust Us -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-white mb-4 flex items-center">
          <span class="text-sky-accent mr-2">🛡️</span> Why Trust Us?
        </h3>
        
        <div class="prose prose-invert max-w-none">
          <p>Our team combines expertise in data science and aviation with firsthand experience of flight delays and disruptions. We created this tool because we needed it ourselves.</p>
          
          <p><strong>Complete Independence:</strong> Unlike many travel sites, we have no financial relationships with airlines or booking platforms. Our rankings are based solely on performance data, not advertising dollars.</p>
          
          <p><strong>Transparent Methodology:</strong> When a flight shows a high reliability score on our platform, it's because the data supports it—not because an airline paid for placement.</p>
          
          <p>Our mission is to make air travel more transparent and accountable. By empowering travelers with objective data, we aim to reduce travel stress while encouraging airlines to improve their performance. Better information leads to better choices and, ultimately, a better travel experience for everyone. 🛡️</p>
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="flex justify-center p-4">
        <a href="/" class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-3 px-8 rounded-lg
                   transition-all duration-300 ease-in-out shadow-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span>Start Finding Reliable Flights</span>
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
    line-height: 1.7;
  }
  
  .prose strong {
    color: #7dd3fc; /* sky-300 */
  }
  
  .prose ol {
    margin-left: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .prose li {
    margin-bottom: 0.5rem;
  }
  
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
</style> 