"""
Smart Parking UMSU — Vehicle Schemas

Pydantic models for vehicle registration, updates, and responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.core.constants import VehicleStatus, VehicleType


# ── Vehicle Registration ───────────────────────────────────

class VehicleRegisterRequest(BaseModel):
    """Register a new vehicle."""

    plat_nomor: str = Field(..., min_length=3, max_length=15)
    merek: str = Field(..., min_length=1, max_length=50)  # e.g., Honda
    model: str = Field(..., min_length=1, max_length=50)  # e.g., Scoopy
    warna: str = Field(..., min_length=1, max_length=30)
    jenis: VehicleType

    @field_validator("plat_nomor")
    @classmethod
    def validate_plat(cls, v: str) -> str:
        """Normalize plate number to uppercase."""
        return v.strip().upper()

    @field_validator("merek", "model", "warna")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        """Strip whitespace from text fields."""
        return v.strip()


class VehicleUpdateRequest(BaseModel):
    """Update an existing vehicle's details."""

    merek: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    warna: Optional[str] = Field(None, min_length=1, max_length=30)
    jenis: Optional[VehicleType] = None


# ── Vehicle Response ───────────────────────────────────────

class VehicleResponse(BaseModel):
    """Vehicle data returned in API responses."""

    id: str
    user_id: str
    plat_nomor: str
    merek: str
    model: str
    warna: str
    jenis: VehicleType
    foto_url: Optional[str] = None
    stnk_url: Optional[str] = None
    status: VehicleStatus = VehicleStatus.ACTIVE
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime


class VehicleWithOwner(VehicleResponse):
    """Vehicle data with owner information (for admin views)."""

    owner_nama: Optional[str] = None
    owner_npm: Optional[str] = None
    owner_email: Optional[str] = None


class VehicleDetailResponse(VehicleResponse):
    """Vehicle data with full owner profile (for admin detail view)."""

    owner_nama: Optional[str] = None
    owner_npm: Optional[str] = None
    owner_email: Optional[str] = None
    owner_prodi: Optional[str] = None
    owner_phone: Optional[str] = None


class VehicleListItem(BaseModel):
    """Simplified vehicle data for list views."""

    id: str
    plat_nomor: str
    merek: str
    model: str
    warna: str
    jenis: VehicleType
    status: VehicleStatus
    is_verified: bool
    has_qr: bool = False
