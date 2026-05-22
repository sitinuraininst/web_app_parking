"""
Smart Parking UMSU — Admin Management Router

Endpoints for super_admin to manage admin/operator accounts.
"""

import math
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, EmailStr

from app.dependencies import SuperAdminUser, SupabaseDep
from app.models.common import APIResponse, PaginatedResponse, PaginationMeta
from app.services.admin_management_service import AdminManagementService
from app.core.exceptions import ValidationError
from app.core.security import verify_password

router = APIRouter(prefix="/admin", tags=["Admin Management"])


# ── Request Models ─────────────────────────────────────────

class ClearLogsRequest(BaseModel):
    """Request body for clearing activity logs."""
    password: str


class CreateAdminRequest(BaseModel):
    """Request body for creating an admin account."""
    nama_lengkap: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UpdateAdminRequest(BaseModel):
    """Request body for updating an admin account."""
    nama_lengkap: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


# ── List Admins ────────────────────────────────────────────

@router.get(
    "/users",
    response_model=PaginatedResponse[dict],
    summary="Daftar semua admin",
)
async def list_admins(
    super_admin: SuperAdminUser,
    db: SupabaseDep,
    search: Optional[str] = Query(None, description="Cari nama atau email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all admin and super_admin accounts (super_admin only)."""
    service = AdminManagementService(db)
    admins, total = await service.list_admins(
        search=search, page=page, page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        message=f"{total} admin ditemukan.",
        data=admins,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


# ── Create Admin ───────────────────────────────────────────

@router.post(
    "/users",
    response_model=APIResponse[dict],
    summary="Buat akun admin baru",
)
async def create_admin(
    request: CreateAdminRequest,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Create a new admin account (super_admin only)."""
    service = AdminManagementService(db)
    admin = await service.create_admin(
        nama_lengkap=request.nama_lengkap,
        email=request.email,
        password=request.password,
        phone=request.phone,
        created_by=super_admin["id"],
    )
    return APIResponse(
        message="Akun admin berhasil dibuat.",
        data=admin,
    )


# ── Get Admin Detail ──────────────────────────────────────

@router.get(
    "/users/{admin_id}",
    response_model=APIResponse[dict],
    summary="Detail admin",
)
async def get_admin(
    admin_id: str,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Get admin account details (super_admin only)."""
    service = AdminManagementService(db)
    admin = await service.get_admin(admin_id)
    return APIResponse(
        message="Detail admin berhasil diambil.",
        data=admin,
    )


# ── Update Admin ──────────────────────────────────────────

@router.patch(
    "/users/{admin_id}",
    response_model=APIResponse[dict],
    summary="Update akun admin",
)
async def update_admin(
    admin_id: str,
    request: UpdateAdminRequest,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Update an admin account (super_admin only)."""
    service = AdminManagementService(db)
    admin = await service.update_admin(
        admin_id=admin_id,
        updates=request.model_dump(exclude_none=True),
        updated_by=super_admin["id"],
    )
    return APIResponse(
        message="Akun admin berhasil diperbarui.",
        data=admin,
    )


# ── Deactivate Admin ──────────────────────────────────────

@router.post(
    "/users/{admin_id}/deactivate",
    response_model=APIResponse[dict],
    summary="Nonaktifkan akun admin",
)
async def deactivate_admin(
    admin_id: str,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Deactivate an admin account (super_admin only)."""
    service = AdminManagementService(db)
    admin = await service.deactivate_admin(
        admin_id=admin_id,
        deactivated_by=super_admin["id"],
    )
    return APIResponse(
        message="Akun admin berhasil dinonaktifkan.",
        data=admin,
    )


# ── Activate Admin ────────────────────────────────────────

@router.post(
    "/users/{admin_id}/activate",
    response_model=APIResponse[dict],
    summary="Aktifkan kembali akun admin",
)
async def activate_admin(
    admin_id: str,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Re-activate a deactivated admin account (super_admin only)."""
    service = AdminManagementService(db)
    admin = await service.activate_admin(
        admin_id=admin_id,
        activated_by=super_admin["id"],
    )
    return APIResponse(
        message="Akun admin berhasil diaktifkan kembali.",
        data=admin,
    )


# ── Delete Admin ──────────────────────────────────────────

@router.delete(
    "/users/{admin_id}",
    response_model=APIResponse[dict],
    summary="Hapus permanen akun admin",
)
async def delete_admin(
    admin_id: str,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Permanently delete an admin account (super_admin only)."""
    service = AdminManagementService(db)
    await service.delete_admin(
        admin_id=admin_id,
        deleted_by=super_admin["id"],
    )
    return APIResponse(
        message="Akun admin berhasil dihapus permanen.",
        data={"id": admin_id},
    )


# ── Activity Logs ─────────────────────────────────────────

@router.get(
    "/logs",
    response_model=PaginatedResponse[dict],
    summary="Daftar activity logs",
)
async def list_logs(
    super_admin: SuperAdminUser,
    db: SupabaseDep,
    search: Optional[str] = Query(None, description="Cari log"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get system activity logs (super_admin only)."""
    query = db.table("activity_logs").select("*, user:users(nama_lengkap, email)", count="exact").order("created_at", desc=True)
    
    if search:
        query = query.ilike("action", f"%{search}%")
        
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)
    
    result = query.execute()
    logs = result.data or []
    total = result.count or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return PaginatedResponse(
        message="Logs retrieved successfully.",
        data=logs,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


# ── Clear Activity Logs ───────────────────────────────────

@router.delete(
    "/logs",
    response_model=APIResponse[dict],
    summary="Hapus semua log aktivitas",
)
async def clear_logs(
    request: ClearLogsRequest,
    super_admin: SuperAdminUser,
    db: SupabaseDep,
):
    """Clear all activity logs (super_admin only)."""
    if not verify_password(request.password, super_admin.get("password_hash", "")):
        raise ValidationError("Password yang Anda masukkan salah.")

    service = AdminManagementService(db)
    await service.clear_activity_logs(
        super_admin_id=super_admin["id"],
        super_admin_email=super_admin["email"],
    )
    return APIResponse(
        message="Log aktivitas berhasil dibersihkan.",
        data={"id": super_admin["id"]},
    )
