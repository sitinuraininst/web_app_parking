"""
Smart Parking UMSU — File Upload Router

Endpoints for uploading STNK and vehicle photos to Supabase Storage.
"""

from fastapi import APIRouter, File, UploadFile

from app.dependencies import CurrentUser, SupabaseDep
from app.models.common import APIResponse
from app.services.upload_service import UploadService

router = APIRouter(prefix="/uploads", tags=["File Uploads"])


# ── Upload STNK ───────────────────────────────────────────

@router.post(
    "/stnk/{vehicle_id}",
    response_model=APIResponse[dict],
    summary="Upload foto STNK",
    description="Upload foto STNK kendaraan. Format: JPEG, PNG, atau WebP. Maksimal 5MB.",
)
async def upload_stnk(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
    file: UploadFile = File(..., description="Foto STNK kendaraan"),
):
    """Upload STNK document for a registered vehicle."""
    service = UploadService(db)
    result = await service.upload_stnk(
        vehicle_id=vehicle_id,
        user_id=current_user["id"],
        file=file,
    )
    return APIResponse(
        message="STNK berhasil diupload.",
        data=result,
    )


# ── Upload Vehicle Photo ──────────────────────────────────

@router.post(
    "/foto-kendaraan/{vehicle_id}",
    response_model=APIResponse[dict],
    summary="Upload foto kendaraan",
    description="Upload foto kendaraan. Format: JPEG, PNG, atau WebP. Maksimal 5MB.",
)
async def upload_vehicle_photo(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
    file: UploadFile = File(..., description="Foto kendaraan"),
):
    """Upload a photo of the registered vehicle."""
    service = UploadService(db)
    result = await service.upload_vehicle_photo(
        vehicle_id=vehicle_id,
        user_id=current_user["id"],
        file=file,
    )
    return APIResponse(
        message="Foto kendaraan berhasil diupload.",
        data=result,
    )


# ── Get Upload Info ────────────────────────────────────────

@router.get(
    "/vehicle/{vehicle_id}",
    response_model=APIResponse[list[dict]],
    summary="Daftar dokumen kendaraan",
)
async def get_vehicle_documents(
    vehicle_id: str,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Get all uploaded documents for a vehicle."""
    service = UploadService(db)
    docs = await service.get_vehicle_documents(
        vehicle_id=vehicle_id,
        user_id=current_user["id"],
    )
    return APIResponse(
        message="Daftar dokumen berhasil diambil.",
        data=docs,
    )
