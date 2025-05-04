<script lang="ts">
  import bestFlightsAuth from '$lib/auth';
  import { goto } from '$app/navigation';

  // Form state
  let email = '';
  let password = '';
  let loading = false;
  let errorMessage = '';
  let successMessage = '';

  // Form validation
  $: isFormValid = email.trim() !== '' && password.length >= 6;

  // Login function
  async function handleLogin() {
    if (!isFormValid) return;

    loading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const { data, error } = await bestFlightsAuth.signIn(email, password);

      if (error) throw error;

      // Login successful
      successMessage = 'Login successful!';
      setTimeout(() => {
        goto('/');
      }, 1000);
    } catch (err: any) {
      errorMessage = err.message || 'Failed to login';
      console.error('Login error:', err);
    } finally {
      loading = false;
    }
  }

  // Password reset
  async function requestPasswordReset() {
    if (!email) {
      errorMessage = 'Please enter your email address';
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      const { error } = await bestFlightsAuth.resetPassword(email);

      if (error) throw error;

      successMessage = 'Password reset instructions sent to your email';
    } catch (err: any) {
      errorMessage = err.message || 'Failed to send reset instructions';
      console.error('Password reset error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md p-6 bg-white/90 rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-center text-sky-dark mb-6">Sign In to BestFlights</h2>

  <!-- Login Form -->
  <form on:submit|preventDefault={handleLogin} class="space-y-4">
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
        disabled={loading}
      />
    </div>

    <!-- Forgot Password Link -->
    <div class="text-right">
      <button 
        type="button" 
        class="text-sm text-sky-accent hover:underline"
        on:click={requestPasswordReset}
        disabled={loading}
      >
        Forgot Password?
      </button>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      class="w-full py-2 px-4 bg-flight-success hover:bg-green-600 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isFormValid || loading}
    >
      {loading ? 'Signing in...' : 'Sign in'}
    </button>

    <!-- Sign Up Link -->
    <div class="text-center mt-4">
      <span class="text-gray-600">Don't have an account?</span>
      <a href="/signup" class="ml-1 text-sky-accent hover:underline">Sign up</a>
    </div>
  </form>
</div> 