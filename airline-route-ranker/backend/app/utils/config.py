"""
Application configuration settings
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Payment provider configuration
ACTIVE_PAYMENT_PROVIDER = os.getenv("ACTIVE_PAYMENT_PROVIDER", "paypal").lower()  # Options: "stripe", "paypal"

# Stripe configuration (kept for future use)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# PayPal configuration
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_EMAIL = os.getenv("PAYPAL_EMAIL")  # Your PayPal email address
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")  # sandbox or live

# URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip('/')
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip('/') 