from app.database import get_supabase_client

db = get_supabase_client()
response = db.table("users").select("*").limit(1).execute()

if response.data:
    print("User columns:", response.data[0].keys())
else:
    print("No users found.")
