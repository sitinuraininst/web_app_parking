"""
Smart Parking UMSU — Parking Session Schemas

Pydantic models for parking entry, exit, sessions, and statistics.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.core.constants import ParkingStatus


# ── Parking Entry / Exit ───────────────────────────────────

class ParkingScanRequest(BaseModel):
    """Request body for QR scan (entry or exit)."""

    qr_token: str = Field(..., description="UUID token from QR code")
    gate: Optional[str] = Field(None, description="Gate identifier")


class ParkingEntryResponse(BaseModel):
    """Response after successful parking entry."""

    session_id: str
    vehicle_id: str
    plat_nomor: str
    merek: str
    model: str
    warna: str
    jenis: str
    owner_nama: str
    waktu_masuk: datetime
    status: ParkingStatus = ParkingStatus.PARKED
    message: str = "Kendaraan berhasil masuk parkiran."


class ParkingExitResponse(BaseModel):
    """Response after successful parking exit."""

    session_id: str
    vehicle_id: str
    plat_nomor: str
    merek: str
    model: str
    warna: str
    jenis: str
    owner_nama: str
    waktu_masuk: datetime
    waktu_keluar: datetime
    durasi_menit: float
    durasi_formatted: str  # e.g., "2 jam 15 menit"
    status: ParkingStatus = ParkingStatus.COMPLETED
    message: str = "Kendaraan berhasil keluar parkiran."


# ── Parking Session ────────────────────────────────────────

class ParkingSessionResponse(BaseModel):
    """Full parking session record."""

    id: str
    vehicle_id: str
    qr_code_id: str
    waktu_masuk: datetime
    waktu_keluar: Optional[datetime] = None
    durasi_menit: Optional[float] = None
    durasi_formatted: Optional[str] = None
    status: ParkingStatus
    gate_masuk: Optional[str] = None
    gate_keluar: Optional[str] = None
    created_at: datetime

    # Joined vehicle info
    plat_nomor: Optional[str] = None
    merek: Optional[str] = None
    model: Optional[str] = None
    warna: Optional[str] = None
    jenis: Optional[str] = None
    owner_nama: Optional[str] = None
    owner_npm: Optional[str] = None


class ActiveParkingItem(BaseModel):
    """Currently parked vehicle (for realtime dashboard)."""

    session_id: str
    vehicle_id: str
    plat_nomor: str
    merek: str
    model: str
    warna: str
    jenis: str
    owner_nama: str
    owner_npm: Optional[str] = None
    waktu_masuk: datetime
    durasi_menit: float  # calculated from now


# ── Statistics ─────────────────────────────────────────────

class ParkingStatistics(BaseModel):
    """Parking statistics overview."""

    total_hari_ini: int = 0
    sedang_parkir: int = 0
    keluar_hari_ini: int = 0
    kapasitas_terisi: int = 0
    kapasitas_total: int = 500
    persentase_terisi: float = 0.0
    rata_rata_durasi_menit: Optional[float] = None
    kendaraan_motor: int = 0
    kendaraan_mobil: int = 0


class DailyStatItem(BaseModel):
    """Single day parking statistics (for charts)."""

    tanggal: str  # YYYY-MM-DD
    total_masuk: int = 0
    total_keluar: int = 0
    rata_rata_durasi: Optional[float] = None


class HourlyStatItem(BaseModel):
    """Hourly parking distribution (for charts)."""

    jam: int  # 0-23
    total_masuk: int = 0
    total_keluar: int = 0
