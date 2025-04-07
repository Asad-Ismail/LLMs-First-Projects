<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import type { UserProfile } from '$lib/supabase';
  import { goto } from '$app/navigation';

  // Form state
  let profile: UserProfile | null = null;
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Form fields
  let displayName = '';
  let travelClass = 'ECONOMY';
  let emailNotifications = false;
  
  // Available travel classes
  const travelClasses = [
    { value: 'ECONOMY', label: 'Economy' },
    { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'FIRST', label: 'First Class' }
  ];
  
  onMount(async () => {
    await loadProfile();
  });
  
  // Load user profile data
  async function loadProfile() {
    try {
      loading = true;
      errorMessage = '';
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        goto('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      profile = data as UserProfile;
      
      // Populate form fields
      displayName = profile.display_name || '';
      travelClass = profile.travel_class || 'ECONOMY';
      emailNotifications = profile.preferences?.emailNotifications || false;
      
    } catch (err: any) {
      console.error('Error loading profile:', err);
      errorMessage = err.message || 'Failed to load profile data';
    } finally {
      loading = false;
    }
  }
  
  // Save profile updates
  async function saveProfile() {
    try {
      saving = true;
      errorMessage = '';
      successMessage = '';
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        goto('/login');
        return;
      }
      
      // Prepare the data to update
      const updates = {
        id: user.id,
        display_name: displayName.trim(),
        travel_class: travelClass,
        preferences: {
          emailNotifications
        },
        updated_at: new Date().toISOString()
      };
      
      // Update the profile
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      successMessage = 'Profile updated successfully!';
      
      // Refresh the profile data
      await loadProfile();
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      errorMessage = err.message || 'Failed to update profile';
    } finally {
      saving = false;
    }
  }
  
  // Handle form submission
  function handleSubmit() {
    saveProfile();
  }
  
  // Handle password change redirection
  function goToChangePassword() {
    goto('/reset-password');
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="w-full rounded-lg overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
    <div class="bg-gradient-to-r from-sky-dark/70 to-flight-primary/70 p-6">
      <h1 class="text-2xl font-bold text-white">Edit Profile</h1>
      <p class="text-white/80">Update your personal information and preferences</p>
    </div>
    
    <div class="p-6">
      {#if loading}
        <div class="flex justify-center items-center min-h-[300px]">
          <div class="animate-pulse flex space-x-4">
            <div class="rounded-full bg-slate-200/50 h-16 w-16"></div>
            <div class="flex-1 space-y-3 py-1">
              <div class="h-4 bg-slate-200/50 rounded w-3/4"></div>
              <div class="space-y-2">
                <div class="h-4 bg-slate-200/50 rounded"></div>
                <div class="h-4 bg-slate-200/50 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        {#if errorMessage}
          <div class="p-4 bg-flight-danger/20 border border-flight-danger/40 text-white rounded-md mb-6">
            <h3 class="font-bold mb-1">Error</h3>
            <p>{errorMessage}</p>
          </div>
        {/if}
        
        {#if successMessage}
          <div class="p-4 bg-green-500/20 border border-green-500/40 text-white rounded-md mb-6">
            <h3 class="font-bold mb-1">Success</h3>
            <p>{successMessage}</p>
          </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Display Name -->
          <div>
            <label for="displayName" class="block text-white font-medium mb-2">Display Name</label>
            <input 
              type="text" 
              id="displayName" 
              bind:value={displayName}
              class="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-accent"
              placeholder="Your display name"
            />
          </div>
          
          <!-- Email -->
          <div>
            <label class="block text-white font-medium mb-2">Email Address</label>
            <div class="w-full p-3 bg-white/5 border border-white/10 rounded-md text-white/80">
              {profile?.email}
              <span class="text-xs ml-2 text-white/60">(cannot be changed)</span>
            </div>
          </div>
          
          <!-- Travel Class Preference -->
          <div>
            <label for="travelClass" class="block text-white font-medium mb-2">Preferred Travel Class</label>
            <select 
              id="travelClass" 
              bind:value={travelClass}
              class="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-accent"
            >
              {#each travelClasses as classOption}
                <option value={classOption.value}>{classOption.label}</option>
              {/each}
            </select>
          </div>
          
          <!-- Email Notifications -->
          <div class="flex items-center">
            <input 
              type="checkbox" 
              id="emailNotifications" 
              bind:checked={emailNotifications}
              class="h-5 w-5 text-sky-accent border-white/20 focus:ring-sky-accent rounded"
            />
            <label for="emailNotifications" class="ml-2 block text-white">
              Receive email notifications about flight deals and updates
            </label>
          </div>
          
          <!-- Password Change -->
          <div class="border-t border-white/10 pt-6">
            <h3 class="text-xl font-semibold text-white mb-4">Password</h3>
            <p class="text-white/80 mb-4">
              Want to change your password? You can reset it using the button below.
            </p>
            <button
              type="button"
              on:click={goToChangePassword}
              class="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition duration-200"
            >
              Reset Password
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex justify-between pt-6 border-t border-white/10">
            <button
              type="button"
              on:click={() => goto('/profile')}
              class="px-5 py-2.5 bg-white/20 text-white rounded-md hover:bg-white/30 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 bg-gradient-to-r from-flight-primary to-sky-accent text-white rounded-md hover:from-sky-accent hover:to-flight-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {#if saving}
                <span class="inline-block animate-spin mr-2">⟳</span> 
                Saving...
              {:else}
                Save Changes
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div> 