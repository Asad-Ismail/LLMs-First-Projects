-- Credit System for BestFlights
-- This file adds the credit system tables and policies to the existing user authentication schema
-- Execute this file separately from user_setup.sql

-- ===== Update user_profiles table =====
-- Add credit-related columns to the existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 2 NOT NULL,
ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN user_profiles.credits IS 'Available search credits for the user';
COMMENT ON COLUMN user_profiles.total_credits_purchased IS 'Total credits purchased by the user over time';

-- ===== USER CREDIT TRANSACTIONS TABLE =====
-- Tracks all credit-related transactions
CREATE TABLE IF NOT EXISTS user_credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('search_used', 'signup_bonus', 'purchase', 'refund', 'admin_adjustment')),
    description TEXT,
    search_id UUID REFERENCES user_search_history(id) ON DELETE SET NULL,
    payment_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_user_credit_transactions_user_id ON user_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_transactions_created_at ON user_credit_transactions(created_at);

-- Create RLS policies for user_credit_transactions
ALTER TABLE user_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own credit transactions
CREATE POLICY "Users can view their own credit transactions"
ON user_credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own credit transactions (for client-side credit usage)
CREATE POLICY "Users can insert their own credit transactions"
ON user_credit_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id AND transaction_type = 'search_used');

-- Policy: Admin service can insert any credit transactions
CREATE POLICY "Service role can insert any credit transactions"
ON user_credit_transactions FOR INSERT
WITH CHECK (auth.jwt() ? 'claims_admin');

-- ===== USER PAYMENT TRANSACTIONS TABLE =====
-- Tracks payment transactions
CREATE TABLE IF NOT EXISTS user_payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    credits_purchased INTEGER NOT NULL,
    package_name VARCHAR(100),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_user_payment_transactions_user_id ON user_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_transactions_created_at ON user_payment_transactions(created_at);

-- Create RLS policies for user_payment_transactions
ALTER TABLE user_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own payment transactions
CREATE POLICY "Users can view their own payment transactions"
ON user_payment_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only service role can insert/update payment transactions
CREATE POLICY "Service role can manage payment transactions"
ON user_payment_transactions FOR ALL
USING (auth.jwt() ? 'claims_admin');

-- ===== CREDIT PACKAGES TABLE =====
-- Defines available credit packages for purchase
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_best_value BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for credit_packages
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active credit packages
CREATE POLICY "Anyone can view active credit packages"
ON credit_packages FOR SELECT
USING (is_active = TRUE);

-- Policy: Only service role can manage credit packages
CREATE POLICY "Service role can manage credit packages"
ON credit_packages FOR ALL
USING (auth.jwt() ? 'claims_admin');

-- Insert default credit packages
INSERT INTO credit_packages (name, display_name, description, credits, price, currency, is_best_value, sort_order)
VALUES 
('basic', 'Basic', '5 search credits', 5, 1.99, 'USD', FALSE, 1),
('standard', 'Standard', '15 search credits - best value!', 15, 4.99, 'USD', TRUE, 2),
('premium', 'Premium', '50 search credits', 50, 14.99, 'USD', FALSE, 3)
ON CONFLICT DO NOTHING;

-- Update trigger functions
CREATE TRIGGER update_user_payment_transactions_updated_at
BEFORE UPDATE ON user_payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packages_updated_at
BEFORE UPDATE ON credit_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to add signup bonus
CREATE OR REPLACE FUNCTION public.add_signup_credit_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Add credit transaction record
  INSERT INTO public.user_credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    description
  )
  VALUES (
    new.id, 
    2, 
    'signup_bonus', 
    'Signup bonus credits'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add signup bonus after profile creation
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.add_signup_credit_bonus();

-- Function to record credit usage and deduct from balance
CREATE OR REPLACE FUNCTION public.use_search_credit()
RETURNS TRIGGER AS $$
BEGIN
  -- First check if user has enough credits
  DECLARE
    available_credits INTEGER;
  BEGIN
    SELECT credits INTO available_credits
    FROM public.user_profiles
    WHERE id = NEW.user_id;
    
    IF available_credits < 1 THEN
      RAISE EXCEPTION 'Not enough credits to perform this search';
    END IF;
  END;
  
  -- Deduct the credit from user_profiles
  UPDATE public.user_profiles 
  SET credits = credits - 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credits explained
COMMENT ON TABLE credit_packages IS 'Available credit packages for purchase';
COMMENT ON TABLE user_credit_transactions IS 'History of all credit transactions (usage, purchases, etc.)';
COMMENT ON TABLE user_payment_transactions IS 'History of payment transactions for credit purchases'; 