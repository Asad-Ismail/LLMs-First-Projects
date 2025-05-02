<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase, type CreditTransaction, type PaymentTransaction } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import StarryBackground from '$lib/components/StarryBackground.svelte';

  // Define interface for credit package
  interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    is_best_value: boolean;
  }

  // Credit state
  let credits = 0;
  let totalPurchased = 0;
  let creditTransactions: CreditTransaction[] = [];
  let paymentTransactions: PaymentTransaction[] = [];
  let creditPackages: CreditPackage[] = [];
  
  // UI state
  let loading = true;
  let purchaseInProgress = false;
  let errorMessage = '';
  let successMessage = '';
  let selectedPackage: string | null = null;
  
  onMount(async () => {
    await Promise.all([
      loadCreditInfo(),
      loadCreditTransactions(),
      loadPaymentTransactions(),
      loadCreditPackages()
    ]);
    loading = false;
  });
  
  async function loadCreditInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        goto('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits, total_credits_purchased')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      credits = data.credits || 0;
      totalPurchased = data.total_credits_purchased || 0;
    } catch (err: any) {
      console.error('Error loading credit info:', err);
      errorMessage = err.message || 'Failed to load credit information';
    }
  }
  
  async function loadCreditTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      creditTransactions = data || [];
    } catch (err: any) {
      console.error('Error loading credit transactions:', err);
    }
  }
  
  async function loadPaymentTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      paymentTransactions = data || [];
    } catch (err: any) {
      console.error('Error loading payment transactions:', err);
    }
  }
  
  async function loadCreditPackages() {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('credits', { ascending: true });
        
      if (error) throw error;
      
      creditPackages = data || [];
      
      // For demo purposes, if no packages exist in DB, create mock packages
      if (creditPackages.length === 0) {
        creditPackages = [
          {
            id: '1',
            name: 'Basic',
            credits: 5,
            price: 1.99,
            is_best_value: false
          },
          {
            id: '2',
            name: 'Standard',
            credits: 15,
            price: 4.99,
            is_best_value: true
          },
          {
            id: '3',
            name: 'Premium',
            credits: 50,
            price: 14.99,
            is_best_value: false
          }
        ];
      }
      
      if (creditPackages.length > 0) {
        selectedPackage = creditPackages[0].id;
      }
    } catch (err: any) {
      console.error('Error loading credit packages:', err);
    }
  }
  
  function selectPackage(packageId: string) {
    selectedPackage = packageId;
  }
  
  function getPackageById(packageId: string): CreditPackage | undefined {
    return creditPackages.find(pkg => pkg.id === packageId);
  }
  
  async function handlePurchase() {
    if (!selectedPackage) {
      errorMessage = 'Please select a credit package';
      return;
    }
    
    const packageToPurchase = getPackageById(selectedPackage);
    if (!packageToPurchase) {
      errorMessage = 'Invalid package selection';
      return;
    }
    
    try {
      purchaseInProgress = true;
      errorMessage = '';
      successMessage = '';
      
      // In a production application, this would integrate with a payment provider
      // For now, we'll simulate a successful purchase
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, just show success message
      // In production, this would handle real payment processing and call backend APIs
      successMessage = `Successfully purchased ${packageToPurchase.credits} credits!`;
      
      // Reload credit info to show updated balance
      await loadCreditInfo();
      await loadCreditTransactions();
      await loadPaymentTransactions();
      
    } catch (err: any) {
      console.error('Error purchasing credits:', err);
      errorMessage = err.message || 'Failed to process payment';
    } finally {
      purchaseInProgress = false;
    }
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
</script>

<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90 relative overflow-hidden">
  <StarryBackground starCount={100} bigStarCount={20} />
  
  <div class="container mx-auto px-4 py-6 relative z-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white text-shadow-md">Credits Management</h1>
      <p class="text-white/80 mt-2 text-shadow-sm">Purchase and manage your search credits</p>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center h-40">
        <div class="loader"></div>
      </div>
    {:else}
      <!-- Credit Balance Card -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
          <h2 class="text-xl font-semibold text-white mb-4">Your Credits</h2>
          
          <div class="flex items-center mb-6">
            <div class="bg-flight-primary/30 p-4 rounded-full mr-4 border border-flight-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-flight-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div class="text-4xl font-bold text-white">{credits}</div>
              <div class="text-white/60 text-sm">Available credits</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-white/10 rounded-lg p-3">
              <div class="text-2xl font-semibold text-white">{totalPurchased}</div>
              <div class="text-white/60 text-xs">Total purchased</div>
            </div>
            <div class="bg-white/10 rounded-lg p-3">
              <div class="text-2xl font-semibold text-white">{creditTransactions.length}</div>
              <div class="text-white/60 text-xs">Total transactions</div>
            </div>
          </div>
        </div>
        
        <!-- Purchase Credits -->
        <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
          <h2 class="text-xl font-semibold text-white mb-4">Purchase Credits</h2>
          
          <div class="space-y-4 mb-6">
            {#if creditPackages.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each creditPackages as pkg}
                  <button 
                    class={`p-4 rounded-lg border transition-all ${selectedPackage === pkg.id ? 'bg-flight-primary/30 border-flight-primary/60' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
                    on:click={() => selectPackage(pkg.id)}
                  >
                    <div class="text-xl font-bold text-white">{pkg.credits} Credits</div>
                    <div class="text-white/80 text-sm">${pkg.price.toFixed(2)}</div>
                    {#if pkg.is_best_value}
                      <div class="mt-1 text-xs inline-block bg-flight-success/20 text-flight-success px-2 py-0.5 rounded-full">Best Value</div>
                    {/if}
                  </button>
                {/each}
              </div>
            {:else}
              <div class="text-white/80 text-center p-4">No credit packages available</div>
            {/if}
          </div>
          
          {#if errorMessage}
            <div class="bg-flight-danger/20 border border-flight-danger/40 text-white p-3 rounded-lg mb-4">
              {errorMessage}
            </div>
          {/if}
          
          {#if successMessage}
            <div class="bg-flight-success/20 border border-flight-success/40 text-white p-3 rounded-lg mb-4">
              {successMessage}
            </div>
          {/if}
          
          <button 
            on:click={handlePurchase}
            disabled={purchaseInProgress || !selectedPackage}
            class="w-full py-3 px-4 bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary 
                   text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if purchaseInProgress}
              <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              Processing...
            {:else}
              Purchase Credits
            {/if}
          </button>
          
          <div class="mt-4 text-xs text-white/60 text-center">
            Secure payment processing. Credits are added instantly to your account.
          </div>
        </div>
      </div>
      
      <!-- Transaction History -->
      <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg mb-8">
        <h2 class="text-xl font-semibold text-white mb-4">Credit History</h2>
        
        {#if creditTransactions.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-white">
              <thead>
                <tr class="border-b border-white/20">
                  <th class="px-4 py-3 text-left">Date</th>
                  <th class="px-4 py-3 text-left">Type</th>
                  <th class="px-4 py-3 text-right">Amount</th>
                  <th class="px-4 py-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each creditTransactions as transaction}
                  <tr class="border-b border-white/10 hover:bg-white/5">
                    <td class="px-4 py-3">{formatDate(transaction.created_at)}</td>
                    <td class="px-4 py-3">
                      <span class={transaction.transaction_type === 'purchase' 
                        ? 'bg-flight-success/20 text-flight-success px-2 py-0.5 rounded-full text-xs'
                        : 'bg-flight-warning/20 text-flight-warning px-2 py-0.5 rounded-full text-xs'}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <span class={transaction.amount > 0 ? 'text-flight-success' : 'text-flight-warning'}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </td>
                    <td class="px-4 py-3">{transaction.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-white/80 text-center p-6 bg-white/5 rounded-lg">
            No credit transactions yet
          </div>
        {/if}
      </div>
      
      <!-- Payment History -->
      <div class="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
        <h2 class="text-xl font-semibold text-white mb-4">Payment History</h2>
        
        {#if paymentTransactions.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-white">
              <thead>
                <tr class="border-b border-white/20">
                  <th class="px-4 py-3 text-left">Date</th>
                  <th class="px-4 py-3 text-left">Status</th>
                  <th class="px-4 py-3 text-right">Amount</th>
                  <th class="px-4 py-3 text-left">Credits</th>
                </tr>
              </thead>
              <tbody>
                {#each paymentTransactions as transaction}
                  <tr class="border-b border-white/10 hover:bg-white/5">
                    <td class="px-4 py-3">{formatDate(transaction.created_at)}</td>
                    <td class="px-4 py-3">
                      <span class={
                        transaction.status === 'completed' 
                          ? 'bg-flight-success/20 text-flight-success px-2 py-0.5 rounded-full text-xs'
                          : transaction.status === 'pending' 
                            ? 'bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-xs'
                            : 'bg-flight-danger/20 text-flight-danger px-2 py-0.5 rounded-full text-xs'
                      }>
                        {transaction.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      {transaction.currency} {transaction.amount}
                    </td>
                    <td class="px-4 py-3">+{transaction.credits_awarded}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-white/80 text-center p-6 bg-white/5 rounded-lg">
            No payment transactions yet
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .loader {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 3px solid #fff;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .text-shadow-md {
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  }
  
  .text-shadow-sm {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
</style> 