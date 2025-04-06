#!/usr/bin/env python3
"""
Set up Supabase database tables for the Airline Route Ranker application.
This script reads the SQL schema file and executes it on the Supabase database.
"""
import os
import time
import psycopg2
from dotenv import load_dotenv
from supabase import create_client

def main():
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
        return False
    
    # Read the schema file
    schema_file = os.path.join(os.path.dirname(__file__), "supabase_schema.sql")
    if not os.path.exists(schema_file):
        print(f"❌ Error: Schema file not found: {schema_file}")
        return False
    
    with open(schema_file, "r") as f:
        schema_sql = f.read()
    
    print("🔄 Setting up Supabase database tables...")
    
    try:
        # Initialize Supabase connection
        supabase = create_client(supabase_url, supabase_key)
        
        # Use a raw SQL query to execute the schema
        # Note: For security, Supabase may require permission to run raw SQL
        # You may need to run this from the Supabase SQL editor instead
        result = supabase.table("_exec_sql").insert({"query": schema_sql}).execute()
        
        print("✅ Successfully set up Supabase database tables.")
        return True
    except Exception as e:
        print(f"❌ Error setting up Supabase database: {e}")
        print("\nIf you don't have permission to run raw SQL, please:")
        print("1. Go to the Supabase dashboard")
        print("2. Navigate to the SQL editor")
        print("3. Copy and paste the contents of supabase_schema.sql")
        print("4. Execute the SQL manually")
        return False

def setup_with_direct_connection():
    """
    Alternative method using direct PostgreSQL connection.
    This requires additional database connection details.
    """
    # Load environment variables
    load_dotenv()
    
    # Get database connection details
    # These would need to be available in your .env file
    db_host = os.environ.get("SUPABASE_DB_HOST")
    db_port = os.environ.get("SUPABASE_DB_PORT")
    db_name = os.environ.get("SUPABASE_DB_NAME")
    db_user = os.environ.get("SUPABASE_DB_USER")
    db_password = os.environ.get("SUPABASE_DB_PASSWORD")
    
    if not all([db_host, db_port, db_name, db_user, db_password]):
        print("❌ Error: Database connection details not fully provided.")
        return False
    
    # Read the schema file
    schema_file = os.path.join(os.path.dirname(__file__), "supabase_schema.sql")
    with open(schema_file, "r") as f:
        schema_sql = f.read()
    
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        
        # Execute the schema SQL
        with conn.cursor() as cursor:
            cursor.execute(schema_sql)
        
        # Commit the changes
        conn.commit()
        
        # Close the connection
        conn.close()
        
        print("✅ Successfully set up database tables via direct connection.")
        return True
    except Exception as e:
        print(f"❌ Error setting up database via direct connection: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Airline Route Ranker - Supabase Database Setup")
    print("------------------------------------------------")
    
    start_time = time.time()
    result = main()
    
    if not result:
        print("\nTrying alternative setup method...")
        setup_with_direct_connection()
    
    end_time = time.time()
    print(f"Setup completed in {end_time - start_time:.2f} seconds.")
    print("------------------------------------------------") 