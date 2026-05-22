"""
Smart Parking UMSU — Vehicle Router

Endpoints for vehicle registration, listing, and management.
"""

import math
from typing import Optional

from fastapi import APIRouter, Query

from app.dependencies import AdminUser, CurrentUser, StudentUser, SuperAdminUser, SupabaseDep
from app.models.common import APIResponse, PaginatedResponse, PaginationMeta
from app.models.vehicle import (
    VehicleDetailResponse,
    VehicleListItem,
    VehicleRegisterRequest,
    VehicleResponse,
    VehicleUpdateRequest,
    VehicleWithOwner,
)
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


# ── Register Vehicle ───────────────────────────────────────

@router.post(
    "",
    response_model=APIResponse[VehicleResponse],
    status_code=201,
    summary="Daftarkan kendaraan baru",
    description="Mahasiswa mendaftarkan kendaraan dengan plat nomor, merek, model, warna, dan jenis.",
)
async def register_vehicle(
    request: VehicleRegisterRequest,
    current_user: StudentUser,
    db: SupabaseDep,
):
    """Register a new vehicle for the current student."""
    service = VehicleService(db)
    vehicle = await service.register_vehicle(
        user_id=current_user["id"],
        plat_nomor=request.plat_nomor,
        merek=request.merek,
        model=request.model,
        warna=request.warna,
        jenis=request.jenis.value,
    )
    return APIResponse(
        message="Kendaraan berhasil didaftarkan.",
        data=vehicle,
    )


# ── List My Vehicles ──────────────────────────────────────

@router.get(
    "/me",
    response_model=APIResponse[list[VehicleListItem]],
    summary="Daftar kendaraan milik user",
)
async def list_my_vehicles(current_user: CurrentUser, db: SupabaseDep):
    """List all vehicles registered by the current user."""
    service = VehicleService(db)
    vehicles = await service.list_user_vehicles(current_user["id"])
    return APIResponse(
        message="Daftar kendaraan berhasil diambil.",
        data=vehicles,
    )


# ── Get Vehicle Detail ─────────────────────────────────────

@router.get(
    "/{vehicle_id}",
    response_model=APIResponse[VehicleResponse],
    summary="Detail kendaraan",
)
async def get_vehicle(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get details of a specific vehicle."""
    service = VehicleService(db)
    # Admin can view any vehicle, students only their own
    user_id = None if current_user.get("role") == "admin" else current_user["id"]
    vehicle = await service.get_vehicle(vehicle_id, user_id)
    return APIResponse(
        message="Detail kendaraan berhasil diambil.",
        data=vehicle,
    )


# ── Update Vehicle ─────────────────────────────────────────

@router.patch(
    "/{vehicle_id}",
    response_model=APIResponse[VehicleResponse],
    summary="Update data kendaraan",
)
async def update_vehicle(
    vehicle_id: str,
    request: VehicleUpdateRequest,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Update a vehicle's details."""
    service = VehicleService(db)
    updates = request.model_dump(exclude_none=True)
    # Convert enum to value if present
    if "jenis" in updates and updates["jenis"]:
        updates["jenis"] = updates["jenis"].value
    vehicle = await service.update_vehicle(vehicle_id, current_user["id"], updates)
    return APIResponse(
        message="Kendaraan berhasil diupdate.",
        data=vehicle,
    )


# ── Delete Vehicle ─────────────────────────────────────────

@router.delete(
    "/{vehicle_id}",
    response_model=APIResponse,
    summary="Hapus kendaraan",
)
async def delete_vehicle(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Soft-delete a vehicle (set status to INACTIVE)."""
    service = VehicleService(db)
    await service.delete_vehicle(vehicle_id, current_user["id"])
    return APIResponse(message="Kendaraan berhasil dihapus.")


# ── Admin: Vehicle Detail with Owner ──────────────────────

@router.get(
    "/{vehicle_id}/detail",
    response_model=APIResponse[VehicleDetailResponse],
    summary="[Admin] Detail kendaraan dengan info pemilik",
)
async def get_vehicle_detail(
    vehicle_id: str,
    admin: AdminUser,
    db: SupabaseDep,
):
    """Get vehicle details with full owner profile (admin/super_admin only)."""
    service = VehicleService(db)
    vehicle = await service.get_vehicle_with_owner(vehicle_id)
    return APIResponse(
        message="Detail kendaraan berhasil diambil.",
        data=vehicle,
    )


# ── Super Admin: Permanent Delete Vehicle ─────────────────

@router.delete(
    "/{vehicle_id}/permanent",
    response_model=APIResponse,
    summary="[Super Admin] Hapus permanen kendaraan",
)
async def hard_delete_vehicle(
    vehicle_id: str,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Permanently delete a vehicle and deactivate its QR codes (super_admin only)."""
    service = VehicleService(db)
    await service.hard_delete_vehicle(
        vehicle_id=vehicle_id,
        deleted_by=super_admin["id"],
    )
    return APIResponse(message="Kendaraan berhasil dihapus permanen.")


# ── Admin: List All Vehicles ──────────────────────────────

@router.get(
    "",
    response_model=PaginatedResponse[VehicleWithOwner],
    summary="[Admin] Semua kendaraan terdaftar",
)
async def list_all_vehicles(
    admin: AdminUser,
    db: SupabaseDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Cari berdasarkan plat nomor"),
    jenis: Optional[str] = Query(None, description="Filter jenis kendaraan"),
):
    """List all registered vehicles with owner info (admin only)."""
    service = VehicleService(db)
    vehicles, total = await service.list_all_vehicles(
        page=page,
        page_size=page_size,
        search=search,
        jenis=jenis,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedResponse(
        message="Daftar kendaraan berhasil diambil.",
        data=vehicles,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )
