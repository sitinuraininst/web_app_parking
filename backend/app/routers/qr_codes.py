"""
Smart Parking UMSU — QR Code Router

Endpoints for QR code generation and retrieval.
"""

from fastapi import APIRouter

from app.dependencies import CurrentUser, SupabaseDep
from app.models.common import APIResponse
from app.models.qr_code import QRCodeImageResponse, QRCodeResponse
from app.services.qr_service import QRService

router = APIRouter(prefix="/qr-codes", tags=["QR Codes"])


# ── Generate QR Code ───────────────────────────────────────

@router.post(
    "/generate/{vehicle_id}",
    response_model=APIResponse[QRCodeResponse],
    status_code=201,
    summary="Generate QR Code untuk kendaraan",
    description=(
        "Generate QR Code permanen untuk kendaraan yang sudah terdaftar. "
        "QR Code hanya di-generate satu kali per kendaraan."
    ),
)
async def generate_qr_code(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Generate a permanent QR code for a registered vehicle."""
    service = QRService(db)
    qr = await service.generate_qr_code(vehicle_id, current_user["id"])
    return APIResponse(
        message="QR Code berhasil di-generate.",
        data=qr,
    )


# ── Get QR Code ────────────────────────────────────────────

@router.get(
    "/vehicle/{vehicle_id}",
    response_model=APIResponse[QRCodeResponse],
    summary="Ambil QR Code kendaraan",
)
async def get_qr_code(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get the QR code for a specific vehicle."""
    service = QRService(db)
    qr = await service.get_qr_code(vehicle_id, current_user["id"])
    return APIResponse(
        message="QR Code berhasil diambil.",
        data=qr,
    )


# ── Get QR Code Image ─────────────────────────────────────

@router.get(
    "/vehicle/{vehicle_id}/image",
    response_model=APIResponse[QRCodeImageResponse],
    summary="Ambil QR Code sebagai gambar (base64)",
)
async def get_qr_image(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get the QR code as a base64-encoded PNG image."""
    service = QRService(db)
    qr_image = await service.get_qr_image(vehicle_id, current_user["id"])
    return APIResponse(
        message="QR Code image berhasil diambil.",
        data=qr_image,
    )


# ── List My QR Codes ──────────────────────────────────────

@router.get(
    "/me",
    response_model=APIResponse[list[QRCodeResponse]],
    summary="Semua QR Code milik user",
)
async def list_my_qr_codes(
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """List all QR codes for the current user's vehicles."""
    service = QRService(db)
    qr_codes = await service.list_user_qr_codes(current_user["id"])
    return APIResponse(
        message="Daftar QR Code berhasil diambil.",
        data=qr_codes,
    )
