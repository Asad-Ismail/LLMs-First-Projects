<script lang="ts">
  export let value: string;
  export let label = "Date";
  export let placeholder = "Select a date";
  export let classes = "";
  export let minDate: string | undefined = undefined;

  // Set default min date to today if not provided
  $: actualMinDate = minDate || getTodayFormatted();

  // Get today's date in YYYY-MM-DD format
  function getTodayFormatted(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Get a date 90 days from today for max date
  function getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split('T')[0];
  }
</script>

<div class="w-full">
  <label class="block mb-2 text-sm font-medium text-white" for={`date-input-${label.replace(/\s+/g, '-')}`}>{label}</label>
  <div class="relative">
    <input
      type="date"
      id={`date-input-${label.replace(/\s+/g, '-')}`}
      bind:value
      min={actualMinDate}
      max={getMaxDate()}
      class="w-full bg-white/10 backdrop-blur-sm border-white/30 border rounded-lg px-4 py-2.5 text-white 
             placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-sky-accent/50 {classes}"
      placeholder={placeholder}
    />
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
</div>