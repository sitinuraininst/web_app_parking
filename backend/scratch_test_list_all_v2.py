import asyncio
import traceback
from app.database import get_supabase_client
from app.services.vehicle_service import VehicleService

async def main():
    try:
        print("Starting test...")
        db = get_supabase_client()
        service = VehicleService(db)
        print("Calling list_all_vehicles...")
        vehicles, total = await service.list_all_vehicles(page=1, page_size=20)
        print(f"Total returned by service: {total}")
        print(f"Number of vehicles in list: {len(vehicles)}")
        for v in vehicles:
            print(f"- {v.get('plat_nomor')} (Owner: {v.get('owner_nama')})")
    except Exception as e:
        print(f"ERROR occurred: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
