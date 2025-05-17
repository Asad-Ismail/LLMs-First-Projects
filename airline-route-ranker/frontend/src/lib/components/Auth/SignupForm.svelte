<script lang="ts">
  import bestFlightsAuth from '$lib/auth';
  import { goto } from '$app/navigation';

  // Form state
  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let errorMessage = '';
  let successMessage = '';

  // Form validation
  $: passwordsMatch = password === confirmPassword;
  $: isFormValid = 
    name.trim() !== '' && 
    email.trim() !== '' && 
    password.length >= 6 && 
    passwordsMatch;

  // Registration function
  async function handleSignup() {
    if (!isFormValid) return;

    loading = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Create the user
      const { data, error } = await bestFlightsAuth.signUp(email, password, { name });

      if (error) throw error;

      // Registration successful
      successMessage = 'Registration successful! Please check your email to verify your BestFlights account.';
      setTimeout(() => {
        goto('/login');
      }, 2000);
    } catch (err: any) {
      errorMessage = err.message || 'Failed to register';
      console.error('Signup error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md p-6 bg-white/90 rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-center text-sky-dark mb-3">Create BestFlights Account</h2>
  
  <!-- Credit promotion banner -->
  <div class="mb-5 p-3 bg-gradient-to-r from-sky-accent/20 to-flight-primary/20 rounded-lg border border-sky-accent/30">
    <div class="flex items-center">
      <div class="mr-3 bg-white/80 p-2 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 class="font-bold text-sky-dark text-sm">Free Search Credits!</h3>
        <p class="text-xs text-gray-600">Get 2 search credits when you sign up today</p>
      </div>
    </div>
  </div>

  <!-- Signup Form -->
  <form on:submit|preventDefault={handleSignup} class="space-y-4">
    <!-- Error Message -->
    {#if errorMessage}
      <div class="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
        {errorMessage}
      </div>
    {/if}

    <!-- Success Message -->
    {#if successMessage}
      <div class="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
        {successMessage}
      </div>
    {/if}

    <!-- Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
      <input
        type="text"
        id="name"
        placeholder="John Doe"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
        bind:value={name}
        required
        disabled={loading}
      />
    </div>

    <!-- Email -->
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input
        type="email"
        id="email"
        placeholder="your@email.com"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
        bind:value={email}
        required
        disabled={loading}
      />
    </div>

    <!-- Password -->
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <input
        type="password"
        id="password"
        placeholder="********"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
        bind:value={password}
        required
        min="6"
        disabled={loading}
      />
      <p class="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
    </div>

    <!-- Confirm Password -->
    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
      <input
        type="password"
        id="confirmPassword"
        placeholder="********"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent {!passwordsMatch && confirmPassword ? 'border-red-500' : ''}"
        bind:value={confirmPassword}
        required
        disabled={loading}
      />
      {#if !passwordsMatch && confirmPassword}
        <p class="text-xs text-red-500 mt-1">Passwords do not match</p>
      {/if}
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      class="w-full py-2 px-4 bg-flight-success hover:bg-green-600 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isFormValid || loading}
    >
      {loading ? 'Creating account...' : 'Create Account'}
    </button>

    <!-- Sign In Link -->
    <div class="text-center mt-4">
      <span class="text-gray-600">Already have an account?</span>
      <a href="/login" class="ml-1 text-sky-accent hover:underline">Sign in</a>
    </div>
  </form>
</div> 