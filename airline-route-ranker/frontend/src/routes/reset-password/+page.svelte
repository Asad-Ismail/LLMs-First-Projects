<script lang="ts">
  import { onMount } from 'svelte';
  import bestFlightsAuth from '$lib/auth';
  import StarryBackground from '$lib/components/StarryBackground.svelte';
  import Header from '$lib/components/Navigation/Header.svelte';
  import { goto } from '$app/navigation';

  // Form state
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let errorMessage = '';
  let successMessage = '';
  let accessToken = '';
  let type = '';
  let isValidLink = false;

  // Form validation
  $: passwordsMatch = password === confirmPassword;
  $: isFormValid = password.length >= 6 && passwordsMatch;

  onMount(() => {
    // Get the hash from the URL
    const hash = window.location.hash.substring(1); // Remove the # character
    
    // Extract the access token and type from the URL hash
    const hashParams = new URLSearchParams(hash);
    accessToken = hashParams.get('access_token') || '';
    type = hashParams.get('type') || '';
    
    // If there's no access token or type is not recovery, show an error
    if (!accessToken || type !== 'recovery') {
      errorMessage = 'Invalid or expired password reset link. Please request a new password reset.';
    } else {
      isValidLink = true;
    }
  });

  // Reset password function
  async function handleReset() {
    if (!isFormValid) return;

    loading = true;
    errorMessage = '';
    successMessage = '';

    try {
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Set the new password using the access token from the URL
      const { error } = await bestFlightsAuth.updatePassword(password);

      if (error) throw error;

      // Password reset successful
      successMessage = 'Your password has been reset successfully! You will be redirected to login shortly.';
      setTimeout(() => {
        goto('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      errorMessage = err.message || 'Failed to reset password. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Send password reset email again
  async function sendResetEmail() {
    const email = prompt('Please enter your email address:');
    
    if (!email) return;
    
    loading = true;
    errorMessage = '';
    
    try {
      const { error } = await bestFlightsAuth.resetPassword(email);
      
      if (error) throw error;
      
      alert('If an account exists with this email, you will receive a password reset link shortly.');
    } catch (err: any) {
      console.error('Error sending password reset:', err);
      errorMessage = err.message || 'Failed to send password reset email';
    } finally {
      loading = false;
    }
  }
</script>

<div class="relative min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed overflow-hidden">
  <!-- Add our animated starry background -->
  <StarryBackground starCount={150} bigStarCount={30} />
  
  <!-- Add navigation header -->
  <Header currentPage="home" />
  
  <div class="container mx-auto max-w-md relative z-10 p-4 flex items-center justify-center" style="min-height: 100vh;">
    <div class="flex flex-col items-center justify-center w-full">
      <h1 class="text-3xl font-bold text-white mb-6 text-center text-shadow-lg">Reset Your BestFlights Password</h1>
      
      <div class="w-full max-w-md rounded-lg overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
        <div class="bg-gradient-to-r from-sky-dark/70 to-flight-primary/70 p-4">
          <h2 class="text-xl font-bold text-white">Create New Password</h2>
          <p class="text-white/80 text-sm">Please enter your new BestFlights password below</p>
        </div>
        
        <div class="p-6">
          <!-- Error Message -->
          {#if errorMessage}
            <div class="p-4 bg-flight-danger/20 border border-flight-danger/40 text-white rounded-md mb-6">
              <h3 class="font-bold mb-1">Error</h3>
              <p>{errorMessage}</p>
              
              {#if errorMessage.includes('Invalid or expired')}
                <button 
                  on:click={sendResetEmail}
                  class="mt-3 px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition duration-200 text-sm"
                >
                  Request New Reset Link
                </button>
              {/if}
            </div>
          {/if}

          <!-- Success Message -->
          {#if successMessage}
            <div class="p-4 bg-green-500/20 border border-green-500/40 text-white rounded-md mb-6">
              <h3 class="font-bold mb-1">Success</h3>
              <p>{successMessage}</p>
              <div class="mt-3 flex justify-center">
                <div class="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
              </div>
            </div>
          {/if}

          <!-- Reset Password Form -->
          {#if isValidLink && !successMessage}
            <form on:submit|preventDefault={handleReset} class="space-y-5">
              <!-- New Password -->
              <div>
                <label for="password" class="block text-white font-medium mb-2">New Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your new password"
                  class="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-accent"
                  bind:value={password}
                  required
                  minlength="6"
                  disabled={loading}
                />
                <p class="text-sm text-white/60 mt-1">Password must be at least 6 characters</p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="block text-white font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  class="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-accent {!passwordsMatch && confirmPassword ? 'border-flight-danger' : ''}"
                  bind:value={confirmPassword}
                  required
                  disabled={loading}
                />
                {#if !passwordsMatch && confirmPassword}
                  <p class="text-sm text-flight-danger mt-1">Passwords do not match</p>
                {/if}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full py-2.5 px-4 bg-gradient-to-r from-flight-primary to-sky-accent text-white font-semibold rounded-md hover:from-sky-accent hover:to-flight-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isFormValid || loading}
              >
                {#if loading}
                  <span class="inline-block animate-spin mr-2">⟳</span> 
                  Resetting...
                {:else}
                  Reset Password
                {/if}
              </button>
            </form>
          {/if}

          <!-- Back to Login Link -->
          <div class="text-center mt-6">
            <a href="/login" class="text-white hover:text-sky-accent transition-colors">
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  }
</style> 