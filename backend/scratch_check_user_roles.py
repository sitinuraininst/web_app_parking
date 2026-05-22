from app.database import get_supabase_client

db = get_supabase_client()
response = db.table("users").select("id, email, nama_lengkap, role").execute()

print("Users roles:")
for row in response.data:
    print(row)
