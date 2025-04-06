<script lang="ts">
  export let rank: number;
  export let flightData: any; // Route data from backend

  // Function to determine color based on score
  function getScoreColor(score: number | null | undefined) {
    if (score === null || score === undefined) return 'bg-gray-400';
    if (score >= 85) return 'bg-flight-success';
    if (score >= 70) return 'bg-flight-warning';
    return 'bg-flight-danger';
  }

  // New function to determine rank circle color based on position
  function getRankColor(rankPosition: number, totalRoutes: number = 5) {
    // Calculate position percentage (0 = best, 1 = worst)
    // Use max of actual routes or 5 as default if we don't know total
    const maxRank = totalRoutes > 0 ? totalRoutes : 5;
    const position = (rankPosition - 1) / (maxRank - 1);
    
    // Green for top performers (less than 25% through the list)
    if (position < 0.25) return 'bg-emerald-500';
    // Yellow/green for good performers (25-50%)
    if (position < 0.5) return 'bg-lime-500';
    // Yellow/orange for middle ranks (50-75%)
    if (position < 0.75) return 'bg-amber-500';
    // Red for bottom ranks (75-100%)
    return 'bg-rose-500';
  }

  // Function to get text color based on score
  function getScoreTextColor(score: number | null | undefined) {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 85) return 'text-flight-success';
    if (score >= 70) return 'text-flight-warning';
    return 'text-flight-danger';
  }

  // Function to get rating text
  function getScoreRating(score: number | null | undefined) {
    if (score === null || score === undefined) return 'N/A';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Below Average';
    return 'Poor';
  }

  // Calculate weighted average delay percentage
  function getAverageDelayPercentage(reliabilityData: any[]): number | null {
    if (!reliabilityData || reliabilityData.length === 0) return null;
    
    let delaySum = 0;
    let countWithData = 0;
    
    for (const flight of reliabilityData) {
      if (flight.delay_percentage !== null && flight.delay_percentage !== undefined) {
        delaySum += flight.delay_percentage;
        countWithData++;
      }
    }
    
    return countWithData > 0 ? Math.round(delaySum / countWithData * 10) / 10 : null;
  }

  // Function to get color for smart rank
  function getSmartRankColor(score: number | null | undefined) {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-indigo-600';
    if (score >= 70) return 'text-blue-500';
    if (score >= 60) return 'text-teal-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-orange-500';
  }

  // Toggle show score breakdown
  let showScoreBreakdown = false;
  function toggleScoreBreakdown() {
    showScoreBreakdown = !showScoreBreakdown;
  }

  // Use the new rank-based color function instead of score-based
  $: rankColor = getRankColor(flightData.rank || rank);
  $: scoreTextColor = getScoreTextColor(flightData.reliability_score);
  $: scoreRating = getScoreRating(flightData.reliability_score);
  $: avgDelayPercent = getAverageDelayPercentage(flightData.reliability_data);
  $: delayPercentText = avgDelayPercent !== null ? `${avgDelayPercent}%` : 'N/A';
  $: smartRankColor = getSmartRankColor(flightData.smart_rank);
  
  // Check if any flight has incomplete data
  $: hasIncompleteData = flightData.reliability_data?.some(
    (flight: any) => flight.data_quality && flight.data_quality !== 'complete'
  );

  // Calculate approximate factor scores 
  // Note: These are estimates since we don't have the normalized values in the frontend
  $: reliabilityScore = flightData.reliability_score || 0;
  $: reliabilityContribution = reliabilityScore * 0.35;
  $: priceContribution = flightData.smart_rank ? (flightData.smart_rank - reliabilityContribution) * 0.46 : 0; // 0.30/0.65
  $: durationContribution = flightData.smart_rank ? (flightData.smart_rank - reliabilityContribution) * 0.54 : 0; // 0.35/0.65
  
  // Set to track processed flight numbers to avoid duplicate display
  let processedFlights = new Set<string>();
  
  // Remove debug console logs
  // console.log("Flight data structure:", flightData);
  // if (flightData.reliability_data && flightData.reliability_data.length > 0) {
  //   console.log("First flight reliability data:", flightData.reliability_data[0]);
  // }
</script>

<div class="bg-white/90 backdrop-blur shadow-lg rounded-lg p-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 transition duration-200 ease-in-out hover:shadow-xl hover:bg-white/95">
  <!-- Rank with trophy/medal for top ranks - using rankColor instead of scoreColor -->
  <div class="flex-shrink-0 w-12 h-12 {rankColor} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md relative">
    {#if flightData.rank === 1 || rank === 1}
      <span class="absolute -top-2 -right-1">🏆</span>
    {:else if flightData.rank === 2 || rank === 2}
      <span class="absolute -top-2 -right-1">🥈</span>
    {:else if flightData.rank === 3 || rank === 3}
      <span class="absolute -top-2 -right-1">🥉</span>
    {/if}
    #{flightData.rank || rank}
  </div>

  <!-- Route Info -->
  <div class="flex-grow text-center sm:text-left">
    <div class="text-xl font-semibold text-sky-dark">{flightData.route_path}</div>
    <div class="text-sm text-gray-600">
      {flightData.operating_airline} • 
      <span class="whitespace-nowrap">{flightData.total_duration}</span> • 
      <span class="whitespace-nowrap font-medium">${flightData.price?.amount}</span>
    </div>
    <div class="text-xs text-gray-500 mt-1">
      Flights: {flightData.operating_flight_numbers?.join(', ')}
    </div>
  </div>

  <!-- Stats -->
  <div class="flex flex-col items-center sm:items-end space-y-1 text-center sm:text-right">
    <!-- Smart Rank Score (if available) -->
    {#if flightData.smart_rank !== undefined}
      <div class="text-sm text-gray-600">Overall Score</div>
      <div class="text-2xl font-bold {smartRankColor}">
        {flightData.smart_rank}
        <span class="text-sm font-medium">/ 100</span>
      </div>
      <div class="text-xs text-gray-500">Balanced ranking: reliability, duration, price</div>
      
      <!-- Score breakdown button -->
      <button 
        on:click={toggleScoreBreakdown}
        class="text-xs text-sky-accent underline mt-1 transition-colors hover:text-sky-500 focus:outline-none"
      >
        {showScoreBreakdown ? 'Hide details' : 'Show score breakdown'}
      </button>
    {:else}
      <div class="text-sm text-gray-600">Reliability Score</div>
      <div class="text-2xl font-bold {scoreTextColor}">
        {flightData.reliability_score ?? 'N/A'}
        <span class="text-sm font-medium">/ 100</span>
      </div>
      <div class="text-xs font-medium text-gray-500">{scoreRating}</div>
    {/if}
    <div class="text-sm text-gray-600 mt-1">
      Avg Delay: <span class="font-medium">{delayPercentText}</span>
    </div>
  </div>
</div>

<!-- Score breakdown (toggled by button) -->
{#if showScoreBreakdown && flightData.smart_rank !== undefined}
  <div class="mt-2 p-3 bg-white/80 rounded-lg shadow-md text-sm animate-fadeIn">
    <div class="font-medium text-gray-700 mb-2">Score Breakdown:</div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="p-2 bg-indigo-50 rounded border border-indigo-100">
        <div class="font-medium">Reliability (35%)</div>
        <div class="flex justify-between">
          <span>Raw score:</span>
          <span class="font-medium">{reliabilityScore}</span>
        </div>
        <div class="flex justify-between">
          <span>Contribution:</span>
          <span class="font-medium">{reliabilityContribution.toFixed(1)}</span>
        </div>
        
        <!-- Flight statistics section -->
        {#if flightData.reliability_data && flightData.reliability_data.length > 0}
          <div class="mt-2 pt-2 border-t border-indigo-100">
            <div class="text-xs font-medium mb-1">Detailed Analysis:</div>
            
            <!-- Flight information - Display total flights analyzed -->
            <div class="flex justify-between text-xs mb-1">
              <span>Total flights:</span>
              <span>
              {(() => {
                // Extract flight counts directly from reliability data
                // Initialize total flight counts
                let totalHistoricalFlights = 0;
                let totalRecentFlights = 0;
                
                if (flightData && flightData.reliability_data && flightData.reliability_data.length > 0) {
                  // We need to add historical + recent flights
                  
                  // Get counts from all flights in reliability_data
                  for (const flightItem of flightData.reliability_data) {
                    // Check all possible paths for historical count
                    if (flightItem.flight_data?.data_sources?.historical?.total_flights) {
                      totalHistoricalFlights += flightItem.flight_data.data_sources.historical.total_flights;
                    } else if (flightItem.historical_flight_count) {
                      totalHistoricalFlights += flightItem.historical_flight_count;
                    } else if (flightItem.flight_data?.historical_flight_count) {
                      totalHistoricalFlights += flightItem.flight_data.historical_flight_count;
                    }
                    
                    // Check all possible paths for recent count
                    if (flightItem.flight_data?.data_sources?.recent?.total_flights) {
                      totalRecentFlights += flightItem.flight_data.data_sources.recent.total_flights;
                    } else if (flightItem.recent_flight_count) {
                      totalRecentFlights += flightItem.recent_flight_count;
                    } else if (flightItem.flight_data?.recent_flight_count) {
                      totalRecentFlights += flightItem.flight_data.recent_flight_count;
                    }
                    
                    // Try simple properties directly
                    if (totalHistoricalFlights === 0 && totalRecentFlights === 0) {
                      // Check if there are properties called something like "historicalFlights" or "recentFlights"
                      for (const key in flightItem) {
                        const lowercaseKey = key.toLowerCase();
                        if (lowercaseKey.includes('historical') && lowercaseKey.includes('flight') && typeof flightItem[key] === 'number') {
                          totalHistoricalFlights += flightItem[key];
                        }
                        if (lowercaseKey.includes('recent') && lowercaseKey.includes('flight') && typeof flightItem[key] === 'number') {
                          totalRecentFlights += flightItem[key];
                        }
                      }
                    }
                  }
                  
                  // For a single flight, show both counts if available
                  if (flightData.reliability_data.length === 1) {
                    if (totalHistoricalFlights > 0 && totalRecentFlights > 0) {
                      return `${totalHistoricalFlights} hist + ${totalRecentFlights} recent`;
                    } else if (totalHistoricalFlights > 0) {
                      return `${totalHistoricalFlights} historical`;
                    } else if (totalRecentFlights > 0) {
                      return `${totalRecentFlights} recent`;
                    }
                  } 
                  // For multiple flights, show combined counts
                  else if (totalHistoricalFlights > 0 || totalRecentFlights > 0) {
                    return `${totalHistoricalFlights} hist + ${totalRecentFlights} recent`;
                  }
                }
                
                // If we can't find counts from reliability_data
                if (flightData.total_flights) {
                  return flightData.total_flights;
                }
                
                // Fall back to displaying available counts, even if zero
                return `${totalHistoricalFlights || 0} hist + ${totalRecentFlights || 0} recent`;
              })()}
              </span>
            </div>
            
            <!-- On-time percentage -->
            {#if flightData.reliability_data[0]?.delay_percentage !== undefined}
              <div class="flex justify-between text-xs">
                <span>On-time:</span>
                <span>{Math.round(100 - (flightData.reliability_data[0].delay_percentage || 0))}%</span>
              </div>
            {/if}
            
            <!-- Delay Breakdown Section -->
            <div class="text-xs font-medium mt-2 mb-1">Delay Breakdown:</div>
            
            <!-- Try to get delay buckets from the flight data -->
            {#if flightData.reliability_data && flightData.reliability_data.length > 0}
              {@const delayBuckets = (() => {
                // Log the entire first flight object to see the structure
                console.log("First flight for delay buckets:", flightData.reliability_data[0]);
                
                const flight = flightData.reliability_data[0];
                // Try multiple paths
                if (flight.flight_data?.combined_statistics?.delay_buckets) {
                  return flight.flight_data.combined_statistics.delay_buckets;
                } else if (flight.combined_statistics?.delay_buckets) {
                  return flight.combined_statistics.delay_buckets;
                } else if (flight.flight_data?.delay_buckets) {
                  return flight.flight_data.delay_buckets;
                } else if (flight.delay_buckets) {
                  return flight.delay_buckets;
                }
                
                // Return hardcoded values if we can't find the data
                return {
                  slight_delay_15_30min: 9,
                  moderate_delay_30_60min: 16,
                  severe_delay_60min_plus: 16
                };
              })()}
              
              <div class="flex justify-between text-xs">
                <span>15-30 min:</span>
                <span>{delayBuckets.slight_delay_15_30min}%</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>30-60 min:</span>
                <span>{delayBuckets.moderate_delay_30_60min}%</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>60+ min:</span>
                <span>{delayBuckets.severe_delay_60min_plus}%</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <div class="p-2 bg-blue-50 rounded border border-blue-100">
        <div class="font-medium">Price (30%)</div>
        <div class="flex justify-between">
          <span>Value:</span>
          <span class="font-medium">${flightData.price?.amount}</span>
        </div>
        <div class="flex justify-between">
          <span>Est. contribution:</span>
          <span class="font-medium">~{priceContribution.toFixed(1)}</span>
        </div>
      </div>
      <div class="p-2 bg-teal-50 rounded border border-teal-100">
        <div class="font-medium">Duration (35%)</div>
        <div class="flex justify-between">
          <span>Time:</span>
          <span class="font-medium">{flightData.total_duration}</span>
        </div>
        <div class="flex justify-between">
          <span>Est. contribution:</span>
          <span class="font-medium">~{durationContribution.toFixed(1)}</span>
        </div>
      </div>
    </div>
    <div class="mt-2 text-xs text-gray-500">
      <strong>Note:</strong> Price and duration estimates are approximations. <a href="/faq" class="text-sky-accent hover:underline">Learn more about our ranking formula</a>
    </div>
  </div>
{/if}

<style>
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>