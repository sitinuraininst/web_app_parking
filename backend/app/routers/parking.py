"""
Smart Parking UMSU — Parking Router

Endpoints for parking entry, exit, session history, and active parking.
"""

import math
from typing import Optional

from fastapi import APIRouter, Query

from app.dependencies import AdminUser, CurrentUser, SupabaseDep
from app.models.common import APIResponse, PaginatedResponse, PaginationMeta
from app.models.parking import (
    ActiveParkingItem,
    ParkingEntryResponse,
    ParkingExitResponse,
    ParkingScanRequest,
    ParkingSessionResponse,
)
from app.services.parking_service import ParkingService

router = APIRouter(prefix="/parking", tags=["Parking"])


# ── QR Scan (Entry or Exit) ───────────────────────────────

@router.post(
    "/scan",
    response_model=APIResponse,
    summary="Scan QR untuk masuk atau keluar parkiran",
    description=(
        "Endpoint universal untuk scan QR. "
        "Jika kendaraan belum parkir → masuk. "
        "Jika kendaraan sedang parkir → keluar."
    ),
)
async def scan_qr(request: ParkingScanRequest, db: SupabaseDep):
    """Handle QR code scan for parking entry or exit."""
    service = ParkingService(db)
    result = await service.handle_scan(
        qr_token=request.qr_token,
        gate=request.gate,
    )

    # Broadcast via WebSocket
    try:
        from app.routers.websocket import manager
        from app.core.constants import WSEventType

        event_type = (
            WSEventType.PARKING_ENTRY
            if result.get("type") == "entry"
            else WSEventType.PARKING_EXIT
        )
        await manager.broadcast({
            "type": event_type.value,
            "data": result,
        })
    except Exception:
        pass  # WebSocket broadcast is non-critical

    return APIResponse(
        message=result.get("message", "Scan berhasil."),
        data=result,
    )


# ── Active Parking (Realtime) ─────────────────────────────

@router.get(
    "/active",
    response_model=APIResponse[list[ActiveParkingItem]],
    summary="Kendaraan yang sedang parkir",
)
async def get_active_parking(
    admin: AdminUser,
    db: SupabaseDep,
    search: Optional[str] = Query(None, description="Cari plat nomor"),
):
    """Get all currently parked vehicles (admin dashboard)."""
    service = ParkingService(db)
    active = await service.get_active_parking(search=search)
    return APIResponse(
        message=f"{len(active)} kendaraan sedang parkir.",
        data=active,
    )


# ── Parking History ────────────────────────────────────────

@router.get(
    "/history",
    response_model=PaginatedResponse[ParkingSessionResponse],
    summary="Riwayat parkir",
)
async def get_parking_history(
    current_user: CurrentUser,
    db: SupabaseDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_from: Optional[str] = Query(None, description="Filter dari tanggal (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter sampai tanggal (YYYY-MM-DD)"),
):
    """Get parking history. Students see own history, admins see all."""
    service = ParkingService(db)
    sessions, total = await service.get_parking_history(
        user_id=current_user["id"],
        role=current_user.get("role", "student"),
        page=page,
        page_size=page_size,
        date_from=date_from,
        date_to=date_to,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedResponse(
        message="Riwayat parkir berhasil diambil.",
        data=sessions,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


# ── Single Session Detail ─────────────────────────────────

@router.get(
    "/sessions/{session_id}",
    response_model=APIResponse[ParkingSessionResponse],
    summary="Detail sesi parkir",
)
async def get_session_detail(
    session_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get details of a specific parking session."""
    service = ParkingService(db)
    session = await service.get_session_detail(session_id)
    return APIResponse(
        message="Detail sesi parkir berhasil diambil.",
        data=session,
    )
