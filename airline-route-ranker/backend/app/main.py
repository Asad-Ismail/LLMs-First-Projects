"""
FastAPI backend for the Airline Route Ranker application.
"""
from fastapi import FastAPI, HTTPException, Path, Query, Body, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import glob
from pathlib import Path as PathLib
from pydantic import BaseModel, EmailStr, Field
import uuid
import json

from .controller import FlightAnalysisSystem, extract_flight_numbers_for_route
from .utils.email import send_contact_email
from .utils.supabase_client import supabase, supabase_admin
from .utils.payments import create_payment_link, handle_webhook_event, get_db_client
from .utils.paypal import create_paypal_payment_link, process_paypal_successful_payment
from .utils.config import ACTIVE_PAYMENT_PROVIDER, FRONTEND_URL

# Load environment variables
load_dotenv()

# Get API key from environment (default to a development key if not set)
API_KEY = os.getenv("API_KEY", "dev-api-key-change-in-production")

# Initialize FastAPI app
app = FastAPI(
    title="Airline Route Ranker API",
    description="API for analyzing and ranking flights by reliability on specific routes",
    version="1.0.0"
)

# Configure CORS to allow requests from frontend
origins = [
    "http://localhost:5173",  # Default SvelteKit dev port
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Additional Vite dev ports
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",  # Common development port
    "http://127.0.0.1:3000",
    # Production URLs
    "https://airline-route-ranker.onrender.com",  # Production frontend on Render
    "https://flights-reliablity-fe.onrender.com",  # Actual frontend domain
    "https://*.onrender.com",  # Wildcard for any Render subdomain
    # Custom domain
    "https://www.bestflighs.org",  # Note: "flighs" not "flights" (typo in domain name)
    "https://bestflighs.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple API key middleware
@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # Log request info to help debug
    print(f"Incoming request: {request.method} {request.url.path}")
    print(f"Request origin: {request.headers.get('origin')}")
    print(f"API Key Header present: {'X-API-Key' in request.headers}")
    
    # Get the origin for CORS
    origin = request.headers.get("origin")
    
    # Setup CORS headers based on the origin
    cors_headers = {}
    if origin:
        # Check if origin is allowed
        is_allowed = origin in origins
        
        # Check wildcard matches (like *.onrender.com)
        is_allowed_by_wildcard = False
        for allowed_origin in origins:
            if "*" in allowed_origin:
                # Convert wildcard pattern to a domain suffix
                pattern = allowed_origin.replace("*", "")
                if origin.endswith(pattern):
                    is_allowed_by_wildcard = True
                    print(f"✅ Origin {origin} matches wildcard pattern {allowed_origin}")
                    break
        
        if is_allowed:
            print(f"✅ Origin {origin} is explicitly allowed")
            cors_headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "X-API-Key, Accept, Authorization, Content-Type, X-Requested-With"
            }
        elif is_allowed_by_wildcard:
            print(f"✅ Origin {origin} is allowed by wildcard")
            cors_headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "X-API-Key, Accept, Authorization, Content-Type, X-Requested-With"
            }
        else:
            print(f"⚠️ WARNING: Request from unauthorized origin: {origin}")
            print(f"Allowed origins: {origins}")
    else:
        print("⚠️ No origin header in request")
    
    # Skip authentication for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        print(f"🔄 Handling OPTIONS request with CORS headers: {cors_headers}")
        return JSONResponse(
            status_code=200,
            content={"detail": "OK"},
            headers=cors_headers
        )
    
    # Skip authentication for health endpoint and webhook endpoint
    if request.url.path == "/api/health" or request.url.path == "/api/payment/webhook" or request.url.path == "/api/payment/paypal-success":
        response = await call_next(request)
        # Add CORS headers to the response
        for key, value in cors_headers.items():
            response.headers[key] = value
        return response
    
    # Get API key from header
    api_key = request.headers.get("X-API-Key")
    
    # Print API key for debugging (redact in production)
    if api_key:
        print(f"Received API key: {api_key[:5]}... vs Expected: {API_KEY[:5]}...")
    else:
        print("No API key provided in request")
    
    # Validate API key (allow API calls if the key matches)
    if not api_key or api_key != API_KEY:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing API key"},
            headers=cors_headers
        )
    
    # If API key is valid, proceed with the request
    response = await call_next(request)
    
    # Add CORS headers to the response
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    return response

# Initialize the flight analysis system
try:
    flight_system = FlightAnalysisSystem()
except ValueError as e:
    print(f"ERROR initializing FlightAnalysisSystem: {e}")
    flight_system = None


# Contact form model for validation
class ContactForm(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(...)
    subject: str = Field(..., min_length=3, max_length=100)
    message: str = Field(..., min_length=10, max_length=5000)


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "system_initialized": flight_system is not None}


@app.post("/api/admin/initialize-db")
async def initialize_db(request: Request):
    """
    Initialize the Supabase database with the schema.
    This endpoint requires admin API key.
    
    Note: This should only be used once to set up the database or during development.
    """
    # Validate admin API key
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing admin API key")
    
    try:
        # Import the setup module
        from supabase.setup_script import main as setup_db
        
        # Run the setup
        success = setup_db()
        
        if not success:
            raise HTTPException(status_code=500, detail="Database initialization failed. Check server logs.")
            
        return {
            "status": "success", 
            "message": "Supabase database initialized successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database initialization error: {str(e)}")


@app.post("/api/contact")
async def submit_contact_form(contact: ContactForm = Body(...)):
    """
    Handle a contact form submission.
    
    Args:
        contact: The contact form data
        
    Returns:
        Status of the submission
    """
    try:
        # Send email - using the imported function directly
        success = send_contact_email(
            name=contact.name,
            email=contact.email,
            subject=contact.subject,
            message=contact.message
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email. Please try again later.")
            
        return {
            "status": "success", 
            "message": "Thank you for your message! We'll get back to you soon."
        }
        
    except Exception as e:
        print(f"Error processing contact form: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/api/rankings/{origin_iata}/{destination_iata}")
async def get_flight_rankings(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    max_routes: int = Query(5, ge=1, le=10),
    max_connections: int = Query(2, ge=0, le=3),
    use_cache: bool = Query(True, description="Whether to use cached results if available")
):
    """
    Get ranked flight reliability data for a specific route.
    
    Args:
        origin_iata: Origin airport IATA code (e.g., "LHR")
        destination_iata: Destination airport IATA code (e.g., "JFK")
        date: Optional specific date in YYYY-MM-DD format
        max_routes: Maximum number of routes to return (default: 5)
        max_connections: Maximum number of connections (default: 2)
        use_cache: Whether to use cached results (default: True)
        
    Returns:
        List of ranked flights with reliability scores
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    print(f"Received request for route: {origin_iata} -> {destination_iata}")
    
    # Log the date parameter
    if date:
        print(f"User specified date: {date}")
    else:
        print("No date specified, will use default date")

    try:
        # Check if we have cached results for this route before making the API call
        if use_cache:
            from .utils.cache import get_base_cache_dir
            route_cache_dir = get_base_cache_dir() / "routes"
            # We'll check for existing cache files for this route
            pattern = f"{origin_iata.upper()}-{destination_iata.upper()}-*.json"
            cache_files = list(route_cache_dir.glob(pattern))
            
            if cache_files:
                cache_dates = []
                for cache_file in cache_files:
                    try:
                        # Extract date from filename (FORMAT: ORIGIN-DESTINATION-YYYY-MM-DD.json)
                        filename = cache_file.name
                        parts = filename.split('-')
                        if len(parts) >= 3:
                            date_part = parts[2].split('.')[0]
                            if len(parts) > 3:
                                date_part = '-'.join(parts[2:]).split('.')[0]
                            cache_dates.append(date_part)
                    except Exception:
                        continue
                
                if cache_dates:
                    print(f"Found cached results for route {origin_iata}-{destination_iata} with dates: {', '.join(cache_dates)}")
                    # If user specified a date, check if it's cached
                    if date and date in cache_dates:
                        print(f"Will use cached data for the requested date: {date}")
                    # If no date specified and we have cache, will use the most recent cached date
                    elif not date:
                        print(f"Will use cache with available dates: {', '.join(cache_dates)}")
        
        # Get flight rankings from the analysis system
        result = flight_system.get_ranked_flights_for_route(
            origin=origin_iata,
            destination=destination_iata,
            date=date,
            max_routes=max_routes,
            max_connections=max_connections,
            use_cache=use_cache
        )
        
        # Log what date was actually used in the response
        if result and "query" in result and "date" in result["query"]:
            used_date = result["query"]["date"]
            if date and used_date == date:
                print(f"Used user-specified date: {used_date}")
            else:
                print(f"Used date in response: {used_date}")
                if date and date != used_date:
                    print(f"NOTE: This differs from user-requested date: {date}")
        
        # Handle errors
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result

    except Exception as e:
        print(f"Error processing route {origin_iata} -> {destination_iata}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred processing the request: {e}")


@app.get("/api/flight/{flight_number}")
async def get_flight_reliability(
    flight_number: str = Path(..., regex="^[A-Z0-9]{2,8}$"),
    use_cache: bool = Query(True, description="Whether to use cached results if available")
):
    """
    Get reliability data for a specific flight number.
    
    Args:
        flight_number: The flight number to analyze (e.g., "BA123")
        use_cache: Whether to use cached results (default: True)
        
    Returns:
        Flight reliability data
    """
    if flight_system is None:
        raise HTTPException(status_code=503, detail="Backend system not initialized (check API key)")

    try:
        flight_data = flight_system.analyze_flight(flight_number, use_cache=use_cache)
        
        if not flight_data:
            raise HTTPException(status_code=404, detail=f"No data found for flight {flight_number}")
            
        # Add reliability score
        from .models.reliability import FlightDataAnalyzer
        reliability_score = FlightDataAnalyzer.calculate_reliability_score(flight_data)
        flight_data["reliability_score"] = reliability_score
        
        return flight_data
        
    except Exception as e:
        print(f"Error analyzing flight {flight_number}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred processing the request: {e}")


@app.get("/api/cache/dates/{origin_iata}/{destination_iata}")
async def get_available_cached_dates(
    origin_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
    destination_iata: str = Path(..., min_length=3, max_length=3, regex="^[A-Z]{3}$"),
):
    """
    Retrieve available dates for cached route data.
    
    Args:
        origin_iata: Origin airport IATA code
        destination_iata: Destination airport IATA code
        
    Returns:
        List of available dates in the cache for this route
    """
    try:
        # Get cache directory for routes
        from .utils.cache import get_base_cache_dir
        
        base_dir = get_base_cache_dir() / "routes"
        
        # Look for cache files with this route pattern
        pattern = f"{origin_iata.upper()}-{destination_iata.upper()}-*.json"
        cache_files = list(base_dir.glob(pattern))
        
        available_dates = []
        for cache_file in cache_files:
            # Extract date from filename (FORMAT: ORIGIN-DESTINATION-YYYY-MM-DD.json)
            try:
                # The filename structure should be ORIGIN-DEST-DATE.json
                filename = cache_file.name
                parts = filename.split('-')
                
                # Make sure we have at least 3 parts (origin, dest, and date)
                if len(parts) >= 3:
                    # Last part is DATE.json, so extract the date portion
                    date_part = parts[2].split('.')[0]
                    
                    # Handle combined date format (could be more parts)
                    if len(parts) > 3:
                        date_part = '-'.join(parts[2:]).split('.')[0]
                        
                    available_dates.append(date_part)
            except Exception as e:
                print(f"Error parsing date from cache file {cache_file}: {e}")
                continue
        
        # Return empty list instead of raising 404 when no dates found
        return {"available_dates": available_dates}
    
    except Exception as e:
        print(f"Error retrieving cached dates for {origin_iata}-{destination_iata}: {e}")
        return {"available_dates": []}

# Payment model for validation
class PaymentRequest(BaseModel):
    package_id: str = Field(..., description="The ID of the credit package")
    user_id: str = Field(..., description="The ID of the user making the purchase")
    success_url: Optional[str] = Field(None, description="URL to redirect after successful payment")
    cancel_url: Optional[str] = Field(None, description="URL to redirect after cancelled payment")
    provider: Optional[str] = Field(None, description="Payment provider (stripe or paypal)")


@app.post("/api/payment/create-link")
async def create_payment(
    payment: PaymentRequest = Body(...),
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """
    Create a payment link for purchasing credits.
    
    Args:
        payment: Payment request with package and user details
        
    Returns:
        Payment link URL and session ID
    """
    try:
        # Validate API key
        if not x_api_key or x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
        
        # Determine payment provider
        provider = payment.provider or ACTIVE_PAYMENT_PROVIDER
        
        if provider == 'stripe':
            # Create Stripe payment link
            payment_data = await create_payment_link(
                package_id=payment.package_id,
                user_id=payment.user_id,
                success_url=payment.success_url,
                cancel_url=payment.cancel_url
            )
        else:
            # Default to PayPal
            payment_data = await create_paypal_payment_link(
                package_id=payment.package_id,
                user_id=payment.user_id,
                success_url=payment.success_url,
                cancel_url=payment.cancel_url
            )
        
        return payment_data
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating payment link: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment link")


@app.post("/api/payment/webhook")
async def webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Handle Stripe webhook events for payment processing.
    
    Args:
        request: The raw HTTP request
        stripe_signature: Stripe signature header
        
    Returns:
        Processing result
    """
    try:
        print(f"🔔 Received webhook request with signature: {stripe_signature[:10]}...")
        
        # Get the raw request payload
        payload = await request.body()
        
        # Validate signature
        if not stripe_signature:
            print("❌ Missing Stripe signature header")
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Process the webhook
        print("⏳ Processing webhook event...")
        result = await handle_webhook_event(payload, stripe_signature)
        print(f"✅ Webhook processed: {result}")
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Webhook processing error")


@app.get("/api/payment/paypal-success")
async def paypal_success(
    package_id: str = Query(..., description="The package ID from the PayPal return URL"),
    user_id: str = Query(..., description="The user ID from the PayPal return URL"),
    credits: int = Query(..., description="The number of credits from the PayPal return URL"),
    success: str = Query("true", description="Success indicator")
):
    """
    Handle PayPal success redirect and process the payment.
    
    This endpoint is called when a user is redirected back from PayPal after a successful payment.
    Note: To avoid double processing, we now let the IPN (POST) handle the actual payment processing.
    """
    try:
        # Only proceed if success is true
        if success.lower() != "true":
            return {"status": "error", "message": "Payment not successful"}
        
        print(f"✅ PayPal success redirect received for user {user_id}, package {package_id}, credits {credits}")
        print(f"ℹ️ Redirecting to frontend - actual payment processing will be handled by IPN webhook")
        
        # Simply redirect to the frontend with success parameters
        # The actual payment processing will happen via the PayPal IPN (POST) notification
        redirect_url = f"{FRONTEND_URL}/profile/credits?success=true&credits={credits}"
        return {"status": "redirect", "redirect": redirect_url}
    
    except Exception as e:
        print(f"❌ Error in PayPal success redirect: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.post("/api/payment/paypal-success")
async def paypal_success_post(
    request: Request
):
    """
    Handle PayPal IPN (Instant Payment Notification) via POST.
    This endpoint receives PayPal's POST callbacks after payment.
    """
    try:
        # Get the form data or JSON from the request
        try:
            form_data = await request.form()
            # Try to extract data from form fields
            data = dict(form_data)
        except:
            # If not form data, try JSON
            body = await request.json()
            data = body
            
        print(f"🔔 Received PayPal POST callback with data: {data}")
        
        # Try to extract custom data which may contain our parameters
        custom_data = {}
        if 'custom' in data:
            try:
                custom_data = json.loads(data['custom'])
                print(f"📦 Extracted custom data: {custom_data}")
            except:
                print("⚠️ Could not parse custom data as JSON")
        
        # Combine data sources to get required parameters
        user_id = data.get('user_id') or custom_data.get('user_id')
        package_id = data.get('package_id') or custom_data.get('package_id')
        credits = data.get('credits') or custom_data.get('credits')
        session_id = data.get('session_id') or custom_data.get('session_id') or str(uuid.uuid4())
        
        if not all([user_id, package_id, credits]):
            print("⚠️ Missing required parameters in PayPal callback")
            # Log the full data for debugging
            print(f"📝 Full data received: {data}")
            return {"status": "error", "message": "Missing required parameters"}
        
        # Convert credits to integer
        try:
            credits = int(credits)
        except:
            print(f"⚠️ Invalid credits value: {credits}")
            credits = 0
        
        # Process the payment
        payment_data = {
            "user_id": user_id,
            "package_id": package_id,
            "credits": credits,
            "session_id": session_id
        }
        
        print(f"💳 Processing PayPal payment with data: {payment_data}")
        result = await process_paypal_successful_payment(payment_data)
        return result
    
    except Exception as e:
        print(f"❌ Error processing PayPal POST callback: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.get("/api/payment/confirm-success")
async def confirm_success(
    user_id: str = Query(..., description="User ID to update credits for"),
    session_id: str = Query(..., description="Stripe session ID from the successful payment"),
    credits: int = Query(5, description="Number of credits to add")
):
    """
    Manual confirmation endpoint for successful payments.
    Use this as a fallback if webhooks aren't triggering proper credit updates.
    """
    try:
        # Get admin client for database operations
        db = get_db_client()
        
        print(f"🚨 MANUAL PAYMENT CONFIRMATION: User {user_id}, Session {session_id}, Credits {credits}")
        
        # 1. Check if payment was already processed
        payment_result = db.table('user_payment_transactions').select('*').eq('provider_transaction_id', session_id).execute()
        
        if payment_result.data and len(payment_result.data) > 0:
            # Payment already processed
            return {
                "status": "already_processed",
                "message": "This payment was already processed",
                "payment": payment_result.data[0]
            }
        
        # 2. Get current credits
        profile_result = db.table('user_profiles').select('credits, total_credits_purchased').eq('id', user_id).execute()
        
        if not profile_result.data or len(profile_result.data) == 0:
            return {"status": "error", "message": f"User not found: {user_id}"}
        
        profile = profile_result.data[0]
        current_credits = profile.get('credits', 0)
        total_purchased = profile.get('total_credits_purchased', 0)
        
        print(f"💰 Current credits: {current_credits}, Adding: {credits}")
        
        # 3. Insert payment record
        payment_data = {
            'user_id': user_id,
            'amount': credits * 0.40,  # Approximate dollar value
            'currency': 'USD',
            'status': 'completed',
            'provider': 'stripe',
            'provider_transaction_id': session_id,
            'credits_purchased': credits,
            'package_name': 'Manual confirmation'
        }
        
        payment_result = db.table('user_payment_transactions').insert(payment_data).execute()
        
        if not payment_result.data:
            return {"status": "error", "message": "Failed to record payment transaction"}
            
        payment_id = payment_result.data[0]['id']
        
        # 4. Insert credit transaction
        credit_data = {
            'user_id': user_id,
            'amount': credits,
            'transaction_type': 'purchase',
            'description': f"Purchased {credits} credits (manual confirmation)",
            'payment_id': payment_id
        }
        
        credit_result = db.table('user_credit_transactions').insert(credit_data).execute()
        
        if not credit_result.data:
            return {"status": "error", "message": "Failed to record credit transaction"}
        
        # 5. Update user's credit balance
        update_data = {
            'credits': current_credits + credits,
            'total_credits_purchased': total_purchased + credits
        }
        
        update_result = db.table('user_profiles').update(update_data).eq('id', user_id).execute()
        
        if not update_result.data:
            return {"status": "error", "message": "Failed to update credit balance"}
            
        return {
            "status": "success", 
            "message": f"Manually added {credits} credits to user {user_id}",
            "previous_credits": current_credits,
            "new_credits": current_credits + credits
        }
        
    except Exception as e:
        print(f"🔧 MANUAL CONFIRMATION ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}