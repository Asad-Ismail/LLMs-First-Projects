<script>
  // No script logic needed for this page
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Header (reused from main page) -->
  <header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex-1 flex justify-start">
        <div class="bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md">
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
          <a href="/faq" class="text-sky-accent transition-colors text-sm font-medium">FAQ</a>
        </div>
      </nav>
    </div>
  </header>
  
  <!-- FAQ Content -->
  <div class="container mx-auto p-4 pt-12">
    <div class="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20">
      <h1 class="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h1>
      
      <div class="space-y-8">
        <!-- Smart Ranking Formula Section -->
        <div class="bg-white/90 rounded-lg p-5 shadow-md">
          <h2 class="text-xl font-bold text-sky-dark mb-4">Smart Ranking Formula</h2>
          
          <p class="text-gray-700 mb-4">
            Our Smart Ranking system evaluates flights based on three key factors:
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h3 class="font-bold text-indigo-700 mb-2">Reliability (40%)</h3>
              <p class="text-gray-600 text-sm">
                Based on historical and recent flight performance data, including delays, cancellations, and other reliability metrics.
              </p>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 class="font-bold text-blue-700 mb-2">Price (35%)</h3>
              <p class="text-gray-600 text-sm">
                The cost of the flight, normalized against other options on the same route to provide fair comparison.
              </p>
            </div>
            
            <div class="bg-teal-50 rounded-lg p-4 border border-teal-100">
              <h3 class="font-bold text-teal-700 mb-2">Duration (25%)</h3>
              <p class="text-gray-600 text-sm">
                Total travel time including connections, normalized against other options for the same route.
              </p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <h3 class="font-medium text-gray-700 mb-2">How the score is calculated:</h3>
            <p class="text-gray-600 mb-2">
              Each factor is normalized on a scale of 0-100 and combined with the appropriate weights:
            </p>
            <div class="bg-white rounded p-3 border border-gray-300 font-mono text-sm">
              Smart Rank = (Reliability Score × 0.4) + (Price Score × 0.35) + (Duration Score × 0.25)
            </div>
          </div>
          
          <p class="text-gray-600 text-sm">
            The resulting Smart Rank score provides a balanced evaluation that prioritizes reliability while also considering price and travel time. A higher score indicates a better overall flight option.
          </p>
        </div>
        
        <!-- How Reliability is Calculated -->
        <div class="bg-white/90 rounded-lg p-5 shadow-md">
          <h2 class="text-xl font-bold text-sky-dark mb-4">How is Reliability Calculated?</h2>
          
          <p class="text-gray-700 mb-4">
            Our reliability score analyzes historical flight data for the specific route and aircraft, with an emphasis on:
          </p>
          
          <ul class="list-disc pl-5 text-gray-600 space-y-2 mb-4">
            <li>Recent on-time performance (weighted more heavily)</li>
            <li>Historical delay patterns and average delay time</li>
            <li>Cancellation frequency</li>
            <li>Seasonal performance variations</li>
            <li>Airport-specific delay factors</li>
          </ul>
          
          <p class="text-gray-600 text-sm">
            The reliability algorithm also accounts for flight-specific factors, such as aircraft type and airline operational history on the particular route. This provides a more accurate prediction than generic airline ratings.
          </p>
        </div>
        
        <!-- Other Questions -->
        <div class="bg-white/90 rounded-lg p-5 shadow-md">
          <h2 class="text-xl font-bold text-sky-dark mb-4">Other Questions</h2>
          
          <div class="space-y-5">
            <div>
              <h3 class="font-bold text-sky-dark mb-1">What does "Limited historical data" mean?</h3>
              <p class="text-gray-600 text-sm">
                This indication appears when we have less than optimal historical performance data for a specific route or airline. This could be due to new routes, seasonal flights, or limited reporting. In these cases, reliability scores should be considered estimates.
              </p>
            </div>
            
            <div>
              <h3 class="font-bold text-sky-dark mb-1">How often is flight data updated?</h3>
              <p class="text-gray-600 text-sm">
                Our flight data is updated daily to provide the most current information on pricing, schedules, and reliability metrics. Historical performance data is aggregated from the past 90 days with emphasis on recent performance.
              </p>
            </div>
            
            <div>
              <h3 class="font-bold text-sky-dark mb-1">What does "Self-Operated Flights Only" filter do?</h3>
              <p class="text-gray-600 text-sm">
                This filter shows only flights that are operated by the same airline that sells the ticket, avoiding codeshare flights which are marketed by one airline but operated by another. Some travelers prefer this for more consistent service experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Back to Home Button -->
      <div class="mt-8 text-center">
        <a href="/" class="inline-block bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg">
          Back to Flight Search
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any needed styles here */
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s infinite;
  }
  
  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style> 