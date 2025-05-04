import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Initialize Supabase client
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);

// Types for user data
export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  preferences: any;
  travel_class: string;
  credits: number;
  total_credits_purchased: number;
  created_at: string;
  updated_at: string;
}

export interface SavedRoute {
  id: string;
  user_id: string;
  origin_iata: string;
  destination_iata: string;
  route_data: any;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  origin_iata: string;
  destination_iata: string;
  search_date: string | null;
  search_params: any;
  created_at: string;
}

// New interfaces for credit system
export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'search_used' | 'signup_bonus' | 'purchase' | 'refund' | 'admin_adjustment';
  description: string;
  payment_reference?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  provider_transaction_id?: string;
  credits_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  credits: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Function to get the current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Function to get the user's profile
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
}

// Function to save a route
export async function saveRoute(
  origin: string,
  destination: string,
  routeData: any,
  notes: string = '',
  isFavorite: boolean = false
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to save a route');
  }
  
  const { data, error } = await supabase
    .from('user_saved_routes')
    .insert({
      user_id: user.id,
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
      route_data: routeData,
      notes,
      is_favorite: isFavorite
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving route:', error);
    throw error;
  }
  
  return data;
}

// Function to get saved routes
export async function getSavedRoutes() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_saved_routes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching saved routes:', error);
    return [];
  }
  
  return data as SavedRoute[];
}

// Function to record search history
export async function recordSearch(
  origin: string,
  destination: string,
  searchDate: string | null,
  searchParams: any = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Don't record for anonymous users
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_search_history')
    .insert({
      user_id: user.id,
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
      search_date: searchDate,
      search_params: searchParams
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error recording search history:', error);
    return null;
  }
  
  return data;
}

// Function to get search history
export async function getSearchHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_search_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching search history:', error);
    return [];
  }
  
  return data as SearchHistory[];
}

// Credit System Functions

// Function to get user's credit balance
export async function getUserCredits() {
  const profile = await getUserProfile();
  return profile?.credits || 0;
}

// Function to check if the user has enough credits
export async function hasEnoughCredits(requiredCredits: number = 1) {
  const credits = await getUserCredits();
  return credits >= requiredCredits;
}

// Function to check if a search requires a credit
// Returns true if the search is not in cache and would require a credit
export async function doesSearchRequireCredit(
  origin: string,
  destination: string,
  date: string | null
) {
  // Query to check if this search is already in cache
  const { count, error } = await supabase
    .from('user_search_history')
    .select('*', { count: 'exact', head: true })
    .eq('origin_iata', origin.toUpperCase())
    .eq('destination_iata', destination.toUpperCase())
    .eq('search_date', date);
  
  if (error) {
    console.error('Error checking if search requires credit:', error);
    // Default to requiring a credit if we can't check
    return true;
  }
  
  // If count is 0, this search is not in cache and requires a credit
  return count === 0;
}

// Function to use a credit for a search
export async function useCredit(
  searchId: string,
  description: string = 'Credit used for flight search'
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to use credits');
  }
  
  // Start a transaction to deduct credit and record transaction
  // In Supabase we don't have true transactions, so we'll do this in steps
  
  // 1. Record the credit transaction
  const { data: transactionData, error: transactionError } = await supabase
    .from('user_credit_transactions')
    .insert({
      user_id: user.id,
      amount: -1, // Negative for usage
      transaction_type: 'search_used',
      description,
      search_id: searchId
    })
    .select()
    .single();
    
  if (transactionError) {
    console.error('Error recording credit transaction:', transactionError);
    throw new Error('Failed to use credit: Transaction error');
  }
  
  // 2. Update the user's credit balance
  // First get the current profile
  const { data: currentProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('id', user.id)
    .single();
    
  if (fetchError) {
    console.error('Error fetching user profile:', fetchError);
    throw new Error('Failed to update credit balance');
  }
  
  // Then update with the new value
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update({ 
      credits: currentProfile.credits - 1
    })
    .eq('id', user.id)
    .select()
    .single();
    
  if (profileError) {
    console.error('Error updating user credits:', profileError);
    throw new Error('Failed to update credit balance');
  }
  
  return { transactionData, profileData };
}

// Function to get available credit packages
export async function getCreditPackages() {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
    
  if (error) {
    console.error('Error fetching credit packages:', error);
    return [];
  }
  
  return data as CreditPackage[];
}

// Function to record a payment transaction
// This would normally be called after a successful payment via Stripe/PayPal
export async function recordPayment(
  amount: number,
  currency: string,
  provider: string,
  providerTransactionId: string,
  creditsPurchased: number,
  packageName: string,
  receiptUrl?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to purchase credits');
  }
  
  // 1. Record the payment transaction
  const { data: paymentData, error: paymentError } = await supabase
    .from('user_payment_transactions')
    .insert({
      user_id: user.id,
      amount,
      currency,
      status: 'completed',
      provider,
      provider_transaction_id: providerTransactionId,
      credits_purchased: creditsPurchased,
      package_name: packageName,
      receipt_url: receiptUrl
    })
    .select()
    .single();
    
  if (paymentError) {
    console.error('Error recording payment transaction:', paymentError);
    throw new Error('Failed to record payment');
  }
  
  // 2. Record the credit transaction
  const { data: transactionData, error: transactionError } = await supabase
    .from('user_credit_transactions')
    .insert({
      user_id: user.id,
      amount: creditsPurchased,
      transaction_type: 'purchase',
      description: `Purchased ${creditsPurchased} credits`,
      payment_id: paymentData.id
    })
    .select()
    .single();
    
  if (transactionError) {
    console.error('Error recording credit transaction:', transactionError);
    throw new Error('Failed to record credit purchase');
  }
  
  // 3. Update the user's credit balance and total purchased
  // First get the current profile
  const { data: currentProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('credits, total_credits_purchased')
    .eq('id', user.id)
    .single();
    
  if (fetchError) {
    console.error('Error fetching user profile:', fetchError);
    throw new Error('Failed to update credit balance');
  }
  
  // Then update with the new values
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update({ 
      credits: currentProfile.credits + creditsPurchased,
      total_credits_purchased: currentProfile.total_credits_purchased + creditsPurchased
    })
    .eq('id', user.id)
    .select()
    .single();
    
  if (profileError) {
    console.error('Error updating user credits:', profileError);
    throw new Error('Failed to update credit balance');
  }
  
  return { paymentData, transactionData, profileData };
}

// Function to get user's credit transaction history
export async function getCreditTransactions(limit: number = 10) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching credit transactions:', error);
    return [];
  }
  
  return data as CreditTransaction[];
}

// Function to get user's payment history
export async function getPaymentHistory(limit: number = 10) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_payment_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
  
  return data as PaymentTransaction[];
} 