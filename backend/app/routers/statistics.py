"""
Smart Parking UMSU — Statistics Router

Endpoints for parking statistics and analytics.
"""

from typing import Optional

from fastapi import APIRouter, Query

from app.dependencies import AdminUser, CurrentUser, SupabaseDep
from app.models.common import APIResponse
from app.models.parking import DailyStatItem, HourlyStatItem, ParkingStatistics
from app.services.statistics_service import StatisticsService

router = APIRouter(prefix="/statistics", tags=["Statistics"])


# ── Overview Statistics ────────────────────────────────────

@router.get(
    "/overview",
    response_model=APIResponse[ParkingStatistics],
    summary="Statistik parkir hari ini",
)
async def get_overview_stats(
    admin: AdminUser,
    db: SupabaseDep,
):
    """Get today's parking statistics overview (admin only)."""
    service = StatisticsService(db)
    stats = await service.get_overview()
    return APIResponse(
        message="Statistik hari ini berhasil diambil.",
        data=stats,
    )


# ── Daily Statistics ───────────────────────────────────────

@router.get(
    "/daily",
    response_model=APIResponse[list[DailyStatItem]],
    summary="Statistik harian",
)
async def get_daily_stats(
    admin: AdminUser,
    db: SupabaseDep,
    days: int = Query(7, ge=1, le=90, description="Jumlah hari ke belakang"),
):
    """Get daily parking statistics for the last N days."""
    service = StatisticsService(db)
    stats = await service.get_daily_stats(days=days)
    return APIResponse(
        message="Statistik harian berhasil diambil.",
        data=stats,
    )


# ── Hourly Distribution ───────────────────────────────────

@router.get(
    "/hourly",
    response_model=APIResponse[list[HourlyStatItem]],
    summary="Distribusi per jam hari ini",
)
async def get_hourly_stats(
    admin: AdminUser,
    db: SupabaseDep,
    date: Optional[str] = Query(None, description="Tanggal (YYYY-MM-DD), default hari ini"),
):
    """Get hourly parking distribution for a specific date."""
    service = StatisticsService(db)
    stats = await service.get_hourly_stats(date=date)
    return APIResponse(
        message="Distribusi per jam berhasil diambil.",
        data=stats,
    )


# ── Student Personal Stats ────────────────────────────────

@router.get(
    "/me",
    response_model=APIResponse[dict],
    summary="Statistik parkir mahasiswa",
)
async def get_my_stats(
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get personal parking statistics for the current student."""
    service = StatisticsService(db)
    stats = await service.get_student_stats(current_user["id"])
    return APIResponse(
        message="Statistik personal berhasil diambil.",
        data=stats,
    )
