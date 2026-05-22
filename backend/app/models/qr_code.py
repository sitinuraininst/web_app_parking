"""
Smart Parking UMSU — QR Code Schemas

Pydantic models for QR code generation and responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ── QR Code Response ───────────────────────────────────────

class QRCodeResponse(BaseModel):
    """QR code data returned to the user."""

    id: str
    vehicle_id: str
    qr_token: str  # the UUID payload encoded in the QR
    is_active: bool = True
    generated_at: datetime
    plat_nomor: Optional[str] = None
    merek: Optional[str] = None
    model: Optional[str] = None


class QRCodeImageResponse(BaseModel):
    """QR code with base64-encoded image data."""

    qr_token: str
    image_base64: str  # PNG image encoded as base64
    vehicle_id: str
    plat_nomor: str


class QRValidationResult(BaseModel):
    """Result of QR code validation."""

    is_valid: bool
    qr_token: Optional[str] = None
    vehicle_id: Optional[str] = None
    user_id: Optional[str] = None
    plat_nomor: Optional[str] = None
    owner_nama: Optional[str] = None
    is_currently_parked: bool = False
    error_message: Optional[str] = None
