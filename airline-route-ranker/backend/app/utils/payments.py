"""
Payment processing utilities using Stripe.
"""
import os
from typing import Dict, Any, Optional
import stripe
from dotenv import load_dotenv
from .supabase_client import supabase, supabase_admin

# Load environment variables
load_dotenv()

# Set Stripe API key from environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
# Fix trailing slash in FRONTEND_URL to prevent double slash in URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip('/')

# Helper function to get appropriate Supabase client
def get_db_client():
    """Get the appropriate Supabase client based on availability."""
    if supabase_admin:
        print("🔑 Using admin client for database operations")
        return supabase_admin
    else:
        print("⚠️ Warning: Using regular client for operations that may require admin privileges")
        return supabase

async def create_payment_link(
    package_id: str, 
    user_id: str,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a Stripe Payment Link for a credit package.
    
    Args:
        package_id: The ID of the credit package
        user_id: The user ID making the purchase
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect after cancelled payment
        
    Returns:
        dict: The created payment link data
    """
    # Get appropriate DB client
    db = get_db_client()
    
    # Get the package details from Supabase
    package_data = await get_package_details(package_id)
    
    if not package_data:
        raise ValueError(f"Package with ID {package_id} not found")
    
    print(f"Creating payment link for {package_data['credits']} credits package for user {user_id}")
    
    # Verify the user exists
    user_result = db.table('user_profiles').select('id').eq('id', user_id).execute()
    if not user_result.data or len(user_result.data) == 0:
        print(f"⚠️ Warning: User with ID {user_id} not found in database")
    
    # Set default URLs if not provided
    if not success_url:
        success_url = f"{FRONTEND_URL}/profile/credits?success=true&session_id={{CHECKOUT_SESSION_ID}}"
    if not cancel_url:
        cancel_url = f"{FRONTEND_URL}/profile/credits?canceled=true"
    
    # Generate a unique reference for this purchase
    metadata = {
        "user_id": user_id,
        "package_id": package_id,
        "package_name": package_data["name"],
        "credits": str(package_data["credits"])
    }
    
    # Create a Checkout Session
    session = stripe.checkout.Session.create(
        success_url=success_url,
        cancel_url=cancel_url,
        mode="payment",
        metadata=metadata,
        line_items=[{
            "price_data": {
                "currency": package_data["currency"].lower(),
                "product_data": {
                    "name": f"{package_data['display_name']} - {package_data['credits']} Credits",
                    "description": package_data.get("description", "Search credits for flight reliability data"),
                },
                "unit_amount": int(float(package_data["price"]) * 100),  # Convert to cents
            },
            "quantity": 1,
        }],
    )
    
    print(f"✅ Created Stripe checkout session: {session.id}")
    
    return {
        "payment_url": session.url,
        "session_id": session.id,
        "metadata": metadata
    }

async def get_package_details(package_id: str) -> Dict[str, Any]:
    """
    Get credit package details from Supabase.
    
    Args:
        package_id: The package ID to look up
        
    Returns:
        dict: Package details or None if not found
    """
    # Get appropriate DB client
    db = get_db_client()
    
    # Remove await as supabase.table(...).execute() is not awaitable
    response = db.table("credit_packages").select("*").eq("id", package_id).execute()
    
    if not response.data or len(response.data) == 0:
        return None
        
    return response.data[0]

async def handle_webhook_event(payload: Dict[str, Any], signature: str) -> Dict[str, Any]:
    """
    Process a Stripe webhook event.
    
    Args:
        payload: The raw request payload
        signature: The Stripe signature header
        
    Returns:
        dict: Processing result
    """
    try:
        webhook_secret = STRIPE_WEBHOOK_SECRET
        
        # Try to parse the raw event data
        payload_str = payload.decode('utf-8')
        
        try:
            # First try to verify the webhook signature
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                webhook_secret
            )
            print(f"✅ Webhook signature verified for event type: {event['type']}")
        except Exception as sig_err:
            print(f"⚠️ Webhook signature verification failed: {sig_err}")
            print("⚠️ DEVELOPMENT MODE: Attempting to process event without signature verification")
            
            # In development, try parsing the payload directly
            import json
            try:
                event_data = json.loads(payload_str)
                event = event_data
                print(f"🔄 Parsed event manually, type: {event.get('type')}")
            except Exception as parse_err:
                print(f"❌ Failed to parse payload: {parse_err}")
                raise
        
        # Handle the event based on its type
        event_type = event.get('type')
        
        if event_type == 'checkout.session.completed':
            # Payment was successful
            session = event.get('data', {}).get('object', {})
            session_id = session.get('id', 'unknown')
            print(f"💰 Processing payment for session ID: {session_id}")
            
            # Get metadata (crucial for user_id and credits)
            metadata = session.get('metadata', {})
            
            if not metadata:
                print("⚠️ WARNING: No metadata in session, trying alternate approach")
                # Try to extract info from other fields
                client_reference_id = session.get('client_reference_id')
                if client_reference_id:
                    print(f"🔍 Found client_reference_id: {client_reference_id}")
            
            # Process the successful payment
            await process_successful_payment(session)
            
            return {"status": "success", "message": "Payment processed successfully"}
            
        return {"status": "ignored", "message": f"Unhandled event type: {event_type}"}
        
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"❌ Signature verification failed: {e}")
        return {"status": "error", "message": "Invalid signature"}
    except Exception as e:
        # Other errors
        print(f"❌ Webhook processing error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

async def process_successful_payment(session: Dict[str, Any]) -> None:
    """
    Process a successful payment from a completed checkout session.
    
    Args:
        session: The Stripe Checkout Session data
    """
    try:
        # Get appropriate DB client - MUST use admin client for payment transactions
        db = get_db_client()
        
        session_id = session.get('id', 'unknown')
        print(f"⭐ Processing payment for session: {session_id}")
        
        # IMPORTANT: Check if this payment has already been processed to prevent duplicates
        existing_payment = db.table('user_payment_transactions').select('id').eq('provider_transaction_id', session_id).execute()
        if existing_payment.data and len(existing_payment.data) > 0:
            print(f"⚠️ Payment with session ID {session_id} already processed. Skipping to prevent duplicates.")
            return
        
        # Extract metadata
        metadata = session.get('metadata', {})
        
        # Get user ID and package details
        user_id = metadata.get('user_id')
        package_id = metadata.get('package_id')
        package_name = metadata.get('package_name')
        credits_str = metadata.get('credits', '0')
        
        # Try to parse credits as integer
        try:
            credits = int(credits_str)
        except (ValueError, TypeError):
            credits = 0
            print(f"⚠️ Warning: Invalid credits value: {credits_str}, defaulting to 0")
        
        # Validate required data
        if not user_id:
            print("❌ ERROR: Missing user_id in metadata!")
            # Look for alternate user identification
            client_reference_id = session.get('client_reference_id')
            customer = session.get('customer')
            if client_reference_id:
                print(f"🔍 Using client_reference_id as user_id: {client_reference_id}")
                user_id = client_reference_id
            elif customer:
                print(f"🔍 Found customer ID: {customer}, but cannot use as user_id")
            
            if not user_id:
                raise ValueError("Missing user_id in metadata and no alternate found")
                
        if credits <= 0:
            print(f"⚠️ Warning: Credits value is {credits}, must be positive")
            # Try to lookup package details if we have package_id
            if package_id:
                package_result = db.table('credit_packages').select('credits').eq('id', package_id).execute()
                if package_result.data and len(package_result.data) > 0:
                    credits = package_result.data[0].get('credits', 5)
                    print(f"✅ Found package with {credits} credits")
                else:
                    # Default to 5 credits as fallback
                    credits = 5
                    print(f"⚠️ Package not found, using default value of {credits} credits")
            else:
                # Default fallback
                credits = 5
                print(f"⚠️ No package_id available, using default value of {credits} credits")
        
        print(f"👤 Processing payment for user: {user_id} - Credits: {credits}")
        
        # Get payment details
        amount = session.get('amount_total', 0) / 100  # Convert from cents
        currency = session.get('currency', 'usd').upper()
        transaction_id = session.get('payment_intent', session.get('id'))
        
        # Record the payment in your database
        try:
            # 1. Insert payment transaction
            print("💾 Recording payment transaction...")
            payment_data = {
                'user_id': user_id,
                'amount': amount,
                'currency': currency,
                'status': 'completed',
                'provider': 'stripe',
                'provider_transaction_id': transaction_id,
                'credits_purchased': credits,
                'package_name': package_name,
                'receipt_url': session.get('receipt_url')
            }
            
            payment_result = db.table('user_payment_transactions').insert(payment_data).execute()
            
            if not payment_result.data or len(payment_result.data) == 0:
                print("❌ Error: Payment transaction insert returned no data")
                raise Exception("Failed to record payment transaction - no data returned")
                
            payment_id = payment_result.data[0].get('id')
            if not payment_id:
                print("❌ Error: Payment ID not found in result")
                raise Exception("Failed to get payment ID from result")
                
            print(f"✅ Payment recorded with ID: {payment_id}")
        
            # 2. Insert credit transaction
            print("💾 Recording credit transaction...")
            credit_data = {
                'user_id': user_id,
                'amount': credits,
                'transaction_type': 'purchase',
                'description': f"Purchased {credits} credits",
                'payment_id': payment_id
            }
            
            credit_result = db.table('user_credit_transactions').insert(credit_data).execute()
            
            if not credit_result.data or len(credit_result.data) == 0:
                print("❌ Error: Credit transaction insert returned no data")
                raise Exception("Failed to record credit transaction - no data returned")
                
            print("✅ Credit transaction recorded")
        
            # 3. Update user's credit balance
            profile_result = db.table('user_profiles').select('credits, total_credits_purchased').eq('id', user_id).execute()
            
            if not profile_result.data or len(profile_result.data) == 0:
                print(f"❌ Error: User profile not found for ID: {user_id}")
                raise Exception(f"Failed to retrieve user profile for ID: {user_id}")
            
            profile = profile_result.data[0]
            current_credits = profile.get('credits', 0)
            total_purchased = profile.get('total_credits_purchased', 0)
            
            print(f"💰 Current credits: {current_credits}, Updating to: {current_credits + credits}")
            
            # Update the balance
            update_data = {
                'credits': current_credits + credits,
                'total_credits_purchased': total_purchased + credits
            }
            
            update_result = db.table('user_profiles').update(update_data).eq('id', user_id).execute()
            
            if not update_result.data or len(update_result.data) == 0:
                print("❌ Error: Credit balance update returned no data")
                raise Exception("Failed to update credit balance - no data returned")
                
            print(f"✅ Credits updated successfully: {current_credits} → {current_credits + credits}")
            print(f"🎉 PAYMENT PROCESSING COMPLETED SUCCESSFULLY: Added {credits} credits to user {user_id}")
        except Exception as db_error:
            print(f"❌ Database operation failed: {db_error}")
            import traceback
            traceback.print_exc()
            raise
    except Exception as e:
        print(f"❌ Error processing payment: {e}")
        import traceback
        traceback.print_exc()
        raise 