from app.database import get_supabase_client

db = get_supabase_client()
response = db.table("vehicles").select("*, users(nama_lengkap, email)", count="exact").execute()

print(f"Total Vehicles: {response.count}")
print("Vehicles Data:")
for row in response.data:
    print(row)
