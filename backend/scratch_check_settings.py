from app.database import get_supabase_client
from app.services.settings_service import SettingsService

db = get_supabase_client()
service = SettingsService(db)
settings = service.get_settings()

print(f"Max Parking Capacity (DB): {settings.max_parking_capacity}")
print(f"Scan Cooldown (DB): {settings.scan_cooldown_seconds}")

response = db.table("parking_config").select("*").execute()
print("Raw DB rows:")
for row in response.data:
    print(row)
