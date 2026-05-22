import asyncio
from app.database import get_supabase_client
from app.services.vehicle_service import VehicleService

async def main():
    db = get_supabase_client()
    service = VehicleService(db)
    vehicles, total = await service.list_all_vehicles(page=1, page_size=20)
    print(f"Total: {total}")
    print(f"Vehicles: {vehicles}")

asyncio.run(main())
