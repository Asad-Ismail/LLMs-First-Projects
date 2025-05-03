# Payment System Setup Guide

This guide explains how to set up and configure the payment system for the Airline Route Ranker application.

## Overview

The payment system uses Stripe Checkout to process payments for credit packages with minimal transaction fees. For low-cost items like our $0.99 credits, Stripe offers a good balance of ease of use and reasonable fees.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. API keys from your Stripe Dashboard
3. Environment variables properly configured

## Setup Instructions

### 1. Install Dependencies

Make sure you have the required dependencies:

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create or update your `.env` file with the following Stripe-related variables:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://your-frontend-url.com
```

**Important:** 
- For development, use Stripe test keys which begin with `sk_test_` and `pk_test_`
- For production, use live keys which begin with `sk_live_` and `pk_live_`

### 3. Set Up Stripe Webhook

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://your-backend-url.com/api/payment/webhook`
4. Select the following events to listen for:
   - `checkout.session.completed`
5. Get your webhook signing secret and add it to your `.env` file

### 4. Set Up Frontend Environment Variables

In your frontend project, add these variables to your `.env` file:

```
VITE_API_URL=http://localhost:8000
VITE_API_KEY=your_api_key
```

## Pricing Considerations

### Stripe Fees
- **Standard rate**: 2.9% + $0.30 per successful transaction
- **For $0.99 transactions**: Fees are approximately $0.33 (33% of your revenue)

### Fee Mitigation Strategies

To reduce the impact of fees on your revenue:

1. **Bundle credits**: Instead of selling 2 credits for $0.99, consider selling 5 credits for $1.99 or 15 for $4.99 to reduce the per-credit fee impact.

2. **Use Stripe Checkout**: This implementation already uses Stripe Checkout, which provides the best UX with minimal development effort.

3. **Consider alternative pricing models**:
   - Subscription model: If users regularly need credits, a monthly subscription might reduce overall fees
   - Higher price points: Slightly increasing prices can offset fees while remaining affordable

4. **Explore payment aggregation**:
   - Consider implementing a "wallet" system where users can add funds to their account less frequently but in larger amounts

## Testing

1. Use Stripe test mode to simulate payments
2. Use these test card numbers:
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 0002`
   - Authentication required: `4000 0025 0000 3155`

## Going to Production

Before going live:

1. Update to production Stripe API keys
2. Set up proper webhook URLs and secrets
3. Test the complete payment flow
4. Monitor your transactions in the Stripe Dashboard

## Troubleshooting

- **Webhook errors**: Ensure your webhook secret is correctly set
- **Payment failures**: Check Stripe logs for detailed error information
- **Missing credits**: Verify that the webhook is receiving and processing events

For additional help, refer to [Stripe's documentation](https://stripe.com/docs). 