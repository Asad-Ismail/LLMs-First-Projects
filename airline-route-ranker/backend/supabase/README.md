# BestFlights Supabase Setup Guide

This directory contains SQL files for setting up the Supabase database for the BestFlights application.

## Setup Files

1. `user_setup.sql` - Base schema for user accounts, profiles, saved routes, and search history
2. `credit_system.sql` - Credit system extensions for implementing the freemium model

## Installation Order

For a new project, execute the files in the Supabase SQL Editor in this order:

1. First execute `user_setup.sql` to set up the basic user account system
2. Then execute `credit_system.sql` to add credit-related tables and functionality

## Credit System Overview

The credit system implements a freemium model with these features:

- Users get 2 free credits upon signing up
- Credits are used for searches that aren't already in the cache
- Users can purchase additional credits through predefined packages
- Complete transaction history is tracked for both credits and payments

### Credit Tables

- `user_profiles` (updated with credits and total_credits_purchased columns)
- `user_credit_transactions` (records all credit usages, purchases, refunds, etc.)
- `user_payment_transactions` (records all payment details for credit purchases)
- `credit_packages` (defines available credit packages for purchase)

## After Installation

After executing the SQL files, check in the Supabase web interface to confirm:

1. The tables are created correctly (check the Table Editor)
2. The credit packages are populated (should see 3 default packages)
3. RLS policies are set up correctly (check the Auth > Policies section)

If you need to reset the credit system, you can drop the tables and re-run the `credit_system.sql` file. 