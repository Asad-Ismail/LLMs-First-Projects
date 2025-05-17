/**
 * BestFlights Authentication Service
 * This provides authentication functions with customized branding for BestFlights.
 * Internally, it uses Supabase for the actual authentication functionality.
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

/**
 * BestFlights Auth Service
 * Provides authentication methods with BestFlights branding
 */
export const bestFlightsAuth = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, userData: any) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    return supabase.auth.signOut();
  },

  /**
   * Request a password reset email
   */
  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  },

  /**
   * Set a new password after reset
   */
  async updatePassword(password: string) {
    return supabase.auth.updateUser({
      password
    });
  },

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Set up an auth state change listener
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * Helper function to determine if a user is logged in
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await bestFlightsAuth.getCurrentUser();
  return !!user;
}

export default bestFlightsAuth; 