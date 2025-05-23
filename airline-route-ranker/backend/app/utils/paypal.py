"""
PayPal processing utilities using Personal PayPal account.
"""
import os
from typing import Dict, Any, Optional
import json
import requests
from urllib.parse import urlencode
from .config import PAYPAL_EMAIL, PAYPAL_MODE, FRONTEND_URL, BACKEND_URL
from .supabase_client import supabase, supabase_admin

# Helper function to get the appropriate Supabase client
def get_db_client():
    """Get the appropriate Supabase client based on availability."""
    if supabase_admin:
        print("🔑 Using admin client for database operations")
        return supabase_admin
    else:
        print("⚠️ Warning: Using regular client for operations that may require admin privileges")
        return supabase

async def create_paypal_payment_link(
    package_id: str,
    user_id: str,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a PayPal payment link for a credit package.
    
    For personal PayPal accounts, we use a simple redirect to PayPal's payment page.
    
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
    package_result = db.table("credit_packages").select("*").eq("id", package_id).execute()
    
    if not package_result.data or len(package_result.data) == 0:
        raise ValueError(f"Package with ID {package_id} not found")
    
    package_data = package_result.data[0]
    print(f"Creating PayPal payment link for {package_data['credits']} credits package for user {user_id}")
    
    # Verify the user exists
    user_result = db.table('user_profiles').select('id').eq('id', user_id).execute()
    if not user_result.data or len(user_result.data) == 0:
        print(f"⚠️ Warning: User with ID {user_id} not found in database")
    
    # Set default URLs if not provided
    if not success_url:
        # Use BACKEND_URL for PayPal success callback
        backend_success_url = f"{BACKEND_URL}/api/payment/paypal-success?success=true&package_id={package_id}&user_id={user_id}&credits={package_data['credits']}"
        # This is where user will be redirected after PayPal processes the payment
        success_url = backend_success_url
        print(f"🔗 Using backend success URL: {success_url}")
    if not cancel_url:
        cancel_url = f"{FRONTEND_URL}/profile/credits?canceled=true"
    
    # Generate a unique reference for this purchase
    payment_reference = f"FLIGHT-{user_id[:8]}-{package_data['credits']}"
    
    # Generate a unique ID for this session to track it
    import uuid
    session_id = str(uuid.uuid4())
    
    # Create a basic PayPal personal payment URL
    paypal_base_url = "https://www.paypal.com/cgi-bin/webscr" if PAYPAL_MODE == "live" else "https://www.sandbox.paypal.com/cgi-bin/webscr"
    
    # Setup PayPal parameters
    paypal_params = {
        'cmd': '_xclick',
        'business': PAYPAL_EMAIL,
        'item_name': f"{package_data['display_name']} - {package_data['credits']} Credits",
        'amount': str(package_data['price']),
        'currency_code': package_data['currency'],
        'return': success_url,
        'cancel_return': cancel_url,
        'custom': json.dumps({
            'user_id': user_id,
            'package_id': package_id,
            'credits': package_data['credits'],
            'session_id': session_id
        }),
        'no_shipping': '1',
        'no_note': '1',
        # Add IPN notification URL to receive POST notifications
        'notify_url': f"{BACKEND_URL}/api/payment/paypal-success"
    }
    
    # Build the URL
    paypal_url = f"{paypal_base_url}?{urlencode(paypal_params)}"
    
    # Record pending payment in database for tracking
    try:
        payment_data = {
            'user_id': user_id,
            'amount': package_data['price'],
            'currency': package_data['currency'],
            'status': 'pending',
            'provider': 'paypal',
            'provider_transaction_id': session_id,
            'credits_purchased': package_data['credits'],
            'package_name': package_data['name'],
        }
        
        db.table('user_payment_transactions').insert(payment_data).execute()
        print(f"✅ Recorded pending PayPal payment with session ID: {session_id}")
    except Exception as e:
        print(f"⚠️ Warning: Failed to record pending payment: {e}")
    
    return {
        "payment_url": paypal_url,
        "session_id": session_id,
        "metadata": {
            "user_id": user_id,
            "package_id": package_id,
            "package_name": package_data["name"],
            "credits": str(package_data["credits"])
        }
    }

async def process_paypal_successful_payment(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a successful PayPal payment.
    
    Args:
        data: The payment data including user_id, package_id, and credits
        
    Returns:
        dict: Processing result
    """
    try:
        # Get appropriate DB client - MUST use admin client for payment transactions
        db = get_db_client()
        
        # Extract the payment data
        user_id = data.get('user_id')
        package_id = data.get('package_id')
        credits = int(data.get('credits', 0))
        session_id = data.get('session_id', 'unknown')
        
        print(f"⭐ Processing PayPal payment for session: {session_id}")
        
        # IMPORTANT: Check if this payment has already been processed to prevent duplicates
        # Check for BOTH completed AND pending payments to avoid double processing
        existing_payment_query = db.table('user_payment_transactions').select('id, status') \
            .eq('provider_transaction_id', session_id) \
            .execute()
            
        if existing_payment_query.data and len(existing_payment_query.data) > 0:
            # If payment exists in ANY status, we should handle it carefully
            existing_payment = existing_payment_query.data[0]
            
            if existing_payment.get('status') == 'completed':
                print(f"⚠️ PayPal payment with session ID {session_id} already COMPLETED. Skipping to prevent duplicates.")
                return {"status": "already_processed", "message": "Payment already processed"}
            
            # If it's pending, we'll update it below and continue processing
            print(f"ℹ️ Found existing payment record in status: {existing_payment.get('status')}") 
        
        # Get package details for verification
        package_result = db.table('credit_packages').select('*').eq('id', package_id).execute()
        if package_result.data and len(package_result.data) > 0:
            package_data = package_result.data[0]
            print(f"✅ Verified package: {package_data['name']} with {package_data['credits']} credits")
        else:
            print(f"⚠️ Package with ID {package_id} not found")
        
        # Validate credits
        if credits <= 0:
            print(f"⚠️ Warning: Invalid credits value ({credits}). Using default from package if available.")
            credits = package_data['credits'] if package_result.data else 5
        
        print(f"👤 Processing payment for user: {user_id} - Credits: {credits}")
        
        # Check AGAIN for any payment records to prevent race conditions
        # This will find any records with this session ID, whether pending, completed, or other status
        payment_exists_query = db.table('user_credit_transactions').select('id') \
            .eq('description', f"Purchased {credits} credits via PayPal") \
            .eq('user_id', user_id) \
            .limit(1) \
            .execute()
            
        if payment_exists_query.data and len(payment_exists_query.data) > 0:
            print(f"⚠️ Credit transaction for this purchase already exists! Preventing duplicate.")
            return {"status": "already_processed", "message": "Credit transaction already exists"}
        
        # Update any pending payment records first
        pending_payment = db.table('user_payment_transactions') \
            .select('id') \
            .eq('provider_transaction_id', session_id) \
            .eq('status', 'pending') \
            .execute()
            
        if pending_payment.data and len(pending_payment.data) > 0:
            payment_id = pending_payment.data[0]['id']
            db.table('user_payment_transactions') \
                .update({'status': 'completed'}) \
                .eq('id', payment_id) \
                .execute()
            print(f"✅ Updated pending payment {payment_id} to completed")
        else:
            # Create a new payment record if no pending payment found
            payment_data = {
                'user_id': user_id,
                'amount': package_data['price'] if package_result.data else credits * 0.40,
                'currency': package_data['currency'] if package_result.data else 'USD',
                'status': 'completed',
                'provider': 'paypal',
                'provider_transaction_id': session_id,
                'credits_purchased': credits,
                'package_name': package_data['name'] if package_result.data else 'PayPal purchase'
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
        
        # Insert credit transaction
        print("💾 Recording credit transaction...")
        credit_data = {
            'user_id': user_id,
            'amount': credits,
            'transaction_type': 'purchase',
            'description': f"Purchased {credits} credits via PayPal",
            'payment_id': payment_id
        }
        
        credit_result = db.table('user_credit_transactions').insert(credit_data).execute()
        
        if not credit_result.data or len(credit_result.data) == 0:
            print("❌ Error: Credit transaction insert returned no data")
            raise Exception("Failed to record credit transaction - no data returned")
            
        print("✅ Credit transaction recorded")
    
        # Update user's credit balance
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
        
        return {
            "status": "success",
            "message": f"Successfully processed PayPal payment and added {credits} credits",
            "user_id": user_id,
            "credits_added": credits,
            "new_balance": current_credits + credits
        }
        
    except Exception as e:
        print(f"❌ Error processing PayPal payment: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)} 