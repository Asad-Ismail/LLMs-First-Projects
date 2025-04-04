<script lang="ts">
  import { clickOutside } from '$lib/utils/clickOutside';
  import { searchAirports, formatAirportDisplay, getClosestAirportMatch } from '$lib/utils/airportSearch';
  import type { Airport } from '$lib/data/airports';

  export let label = '';
  export let value = ''; // Use bind:value in parent
  export let placeholder = '';
  export let icon = ''; // For takeoff/landing icons
  export let classes = ''; // Add support for additional classes
  
  let searchTerm = '';
  let suggestions: Airport[] = [];
  let showSuggestions = false;
  let inputElement: HTMLInputElement;
  let selectedSuggestionIndex = -1;
  let potentialMatch: Airport | null = null;
  
  // Safely select a suggestion, handling null case
  function safelySelectSuggestion(airport: Airport | null): void {
    if (airport !== null) {
      selectSuggestion(airport);
    }
  }
  
  function handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    
    // Allow both letters and numbers for searching, but final value will be uppercase letters only
    searchTerm = target.value;
    
    if (searchTerm.length >= 1) {
      suggestions = searchAirports(searchTerm);
      showSuggestions = suggestions.length > 0;
      selectedSuggestionIndex = -1;
      
      // Try to find a potential match for autocorrection
      potentialMatch = getClosestAirportMatch(searchTerm);
    } else {
      suggestions = [];
      showSuggestions = false;
      potentialMatch = null;
    }
    
    // Update the actual value only with valid IATA characters
    value = searchTerm.toUpperCase().replace(/[^A-Z]/g, '');
  }
  
  function selectSuggestion(airport: Airport): void {
    value = airport.iata;
    searchTerm = airport.iata;
    showSuggestions = false;
    suggestions = [];
    potentialMatch = null;
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  function handleKeydown(event: KeyboardEvent): void {
    if (!showSuggestions) return;
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else if (potentialMatch) {
          // Use our safe wrapper function
          safelySelectSuggestion(potentialMatch);
        }
        break;
      case 'Escape':
        event.preventDefault();
        showSuggestions = false;
        break;
    }
  }
  
  function handleBlur(): void {
    // Small delay to allow click events on suggestions
    setTimeout(() => {
      if (potentialMatch && searchTerm.length >= 2 && searchTerm !== value) {
        // Autocorrect when user leaves the field
        value = potentialMatch.iata;
        searchTerm = potentialMatch.iata;
      }
      showSuggestions = false;
    }, 200);
  }
  
  function handleFocus(): void {
    if (searchTerm.length >= 1 && suggestions.length > 0) {
      showSuggestions = true;
    }
  }
</script>

<div class="relative w-full" use:clickOutside={() => showSuggestions = false}>
  <label class="block text-white text-sm font-bold mb-2 text-center" for={label.replace(/\s+/g, '-')}>
    {label}
  </label>
  <div class="relative">
    {#if icon}
      <span class="absolute left-2 top-1/2 -translate-y-1/2">
        <img src={icon} alt={label} class="h-6 w-6" />
      </span>
    {/if}
    
    <input
      type="text"
      id={label.replace(/\s+/g, '-')}
      bind:this={inputElement}
      bind:value={searchTerm}
      placeholder={placeholder}
      class="shadow appearance-none border rounded w-full py-2 {icon ? 'pl-10' : 'pl-3'} pr-3 text-gray-700 bg-white/90 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent {classes}"
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
      autocomplete="off"
      aria-expanded={showSuggestions}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-controls={`${label.replace(/\s+/g, '-')}-suggestions`}
      role="combobox"
    />
    
    {#if potentialMatch && searchTerm.length >= 2 && searchTerm !== potentialMatch.iata && !showSuggestions}
      <button 
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-accent"
        on:click={() => safelySelectSuggestion(potentialMatch)}
        on:keydown={(e) => e.key === 'Enter' && safelySelectSuggestion(potentialMatch)}
      >
        Did you mean {potentialMatch.iata}?
      </button>
    {/if}
  </div>
  
  {#if showSuggestions && suggestions.length > 0}
    <div class="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white rounded-md shadow-lg">
      <ul 
        id={`${label.replace(/\s+/g, '-')}-suggestions`}
        role="listbox"
        aria-label="Airport suggestions"
        class="py-1"
      >
        {#each suggestions as airport, index}
          <button 
            role="option"
            aria-selected={index === selectedSuggestionIndex}
            class="px-3 py-2 cursor-pointer hover:bg-sky-50 {index === selectedSuggestionIndex ? 'bg-sky-100' : ''} w-full text-left block"
            on:click={() => selectSuggestion(airport)}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectSuggestion(airport);
              }
            }}
          >
            <div class="font-medium">{airport.iata}</div>
            <div class="text-sm text-gray-600">{airport.city} - {airport.name}</div>
          </button>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  /* Additional styling if needed */
</style>