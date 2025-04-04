<script lang="ts">
  import { submitContactForm } from '$lib/api';
  
  // Form data
  let name = '';
  let email = '';
  let subject = '';
  let message = '';
  
  // Form state
  let isSubmitting = false;
  let isSuccess = false;
  let error: string | null = null;
  
  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Individual field validation
  $: isNameValid = name.trim().length >= 2;
  $: isEmailValid = emailRegex.test(email);
  $: isSubjectValid = subject.trim().length >= 3;
  $: isMessageValid = message.trim().length >= 10;
  
  // Form validation
  $: isFormValid = isNameValid && isEmailValid && isSubjectValid && isMessageValid;
  
  // Keep the debug variable for console logging, but comment it out from the UI
  $: debugValidation = `Form valid: ${isFormValid} | Name: ${isNameValid} | Email: ${isEmailValid} | Subject: ${isSubjectValid} | Message: ${isMessageValid} | Submitting: ${isSubmitting}`;
  
  console.log("Contact form component loaded");
  
  // Handle form submission
  async function handleSubmit() {
    console.log("Attempting form submission");
    console.log(debugValidation);
    
    if (!isFormValid || isSubmitting) {
      console.log("Form submission prevented - validation failed or already submitting");
      return;
    }
    
    isSubmitting = true;
    error = null;
    
    try {
      console.log("Sending contact form data to API");
      const result = await submitContactForm({
        name,
        email,
        subject,
        message
      });
      
      console.log("API response:", result);
      
      if (result.status === 'success') {
        isSuccess = true;
        // Reset form
        name = '';
        email = '';
        subject = '';
        message = '';
      } else {
        error = result.message;
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90">
  <!-- Header (reused from +page.svelte) -->
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
      
      <button class="md:hidden text-white flex-1 flex justify-end">
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
    <!-- Contact Title -->
    <div class="text-center mb-10 max-w-2xl px-4 animate-[fadeIn_0.8s_ease-in-out]">
      <h2 class="text-white text-2xl md:text-4xl font-medium mb-4 text-shadow-md">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold">Get in Touch</span>
      </h2>
      <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base mb-6">
        Have questions or feedback? We'd love to hear from you!
      </p>
    </div>
    
    {#if isSuccess}
      <!-- Success message -->
      <div class="w-full max-w-lg p-8 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)] animate-[fadeIn_0.5s_ease-in-out]">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="bg-flight-success/20 p-4 rounded-full border border-flight-success/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-flight-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white">Message Sent!</h3>
          <p class="text-white/80">Thank you for your message. We'll get back to you soon!</p>
          <button
            on:click={() => isSuccess = false}
            class="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-300"
          >
            Send Another Message
          </button>
        </div>
      </div>
    {:else}
      <!-- Contact form -->
      <div class="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Name input -->
          <div>
            <label for="name" class="block text-sm font-medium text-white mb-1">
              Your Name {#if name.length > 0}<span class={isNameValid ? "text-green-400" : "text-red-400"}>({isNameValid ? '✓' : 'min 2 chars'})</span>{/if}
            </label>
            <input
              type="text"
              id="name"
              bind:value={name}
              required
              minlength="2"
              class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white
                    placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50"
              placeholder="Enter your name"
            />
          </div>
          
          <!-- Email input -->
          <div>
            <label for="email" class="block text-sm font-medium text-white mb-1">
              Email Address {#if email.length > 0}<span class={isEmailValid ? "text-green-400" : "text-red-400"}>({isEmailValid ? '✓' : 'valid email required'})</span>{/if}
            </label>
            <input
              type="email"
              id="email"
              bind:value={email}
              required
              class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white
                    placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50"
              placeholder="your@email.com"
            />
          </div>
          
          <!-- Subject input -->
          <div>
            <label for="subject" class="block text-sm font-medium text-white mb-1">
              Subject {#if subject.length > 0}<span class={isSubjectValid ? "text-green-400" : "text-red-400"}>({isSubjectValid ? '✓' : 'min 3 chars'})</span>{/if}
            </label>
            <input
              type="text"
              id="subject"
              bind:value={subject}
              required
              minlength="3"
              class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white
                    placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50"
              placeholder="What's this about?"
            />
          </div>
          
          <!-- Message input -->
          <div>
            <label for="message" class="block text-sm font-medium text-white mb-1">
              Message {#if message.length > 0}<span class={isMessageValid ? "text-green-400" : "text-red-400"}>({isMessageValid ? '✓' : 'min 10 chars'})</span>{/if}
            </label>
            <textarea
              id="message"
              bind:value={message}
              required
              minlength="10"
              rows="5"
              class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white
                    placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50 resize-none"
              placeholder="Your message here..."
            ></textarea>
          </div>
          
          <!-- Error message -->
          {#if error}
            <div class="p-3 bg-flight-danger/20 border border-flight-danger/40 rounded-lg">
              <p class="text-white text-sm">{error}</p>
            </div>
          {/if}
          
          <!-- Submit button -->
          <div class="flex justify-center pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2.5 px-8 rounded-lg
                    transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2 shadow-lg"
            >
              {#if isSubmitting}
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Send Message</span>
              {/if}
            </button>
          </div>
        </form>
      </div>
    {/if}
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
</style> 