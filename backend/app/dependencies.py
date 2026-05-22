"""
Smart Parking UMSU — FastAPI Dependencies

Shared dependency injection functions for route handlers.
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from app.core.security import decode_access_token
import time
from app.database import get_supabase_client
from app.services.settings_service import SettingsService

_user_cache = {} # {user_id: (timestamp, user_dict)}
USER_CACHE_TTL = 30 # seconds

logger = logging.getLogger(__name__)


# ── OAuth2 Scheme ──────────────────────────────────────────
# This tells Swagger UI to show the 🔒 Authorize button.
# tokenUrl points to the login endpoint so Swagger knows where tokens come from.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Supabase Client Dependency ─────────────────────────────

def get_db() -> Client:
    """Provide the Supabase client as a dependency."""
    return get_supabase_client()


SupabaseDep = Annotated[Client, Depends(get_db)]


# ── Authentication Dependencies ───────────────────────────

async def get_current_user(
    db: SupabaseDep,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """
    Extract and validate the JWT token via OAuth2PasswordBearer.

    Swagger UI will automatically send the token as 'Authorization: Bearer <token>'.

    Returns the full user record from the database.

    Raises:
        HTTPException 401: If token is missing, invalid, or expired.
        HTTPException 401: If user not found or inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    # Check cache first
    global _user_cache
    current_time = time.time()
    if user_id in _user_cache:
        timestamp, cached_user = _user_cache[user_id]
        if current_time - timestamp < USER_CACHE_TTL:
            user = cached_user
        else:
            # Expired
            del _user_cache[user_id]
            user = None
    else:
        user = None

    if not user:
        # Fetch user from database
        try:
            result = (
                db.table("users")
                .select("*")
                .eq("id", user_id)
                .eq("is_active", True)
                .single()
                .execute()
            )
            user = result.data
            if user:
                _user_cache[user_id] = (current_time, user)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User tidak ditemukan atau tidak aktif.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan atau tidak aktif.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check maintenance mode
    settings_service = SettingsService(db)
    is_maintenance = settings_service.is_maintenance_mode_active()
    if is_maintenance and user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is currently under maintenance."
        )

    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]


async def require_admin(current_user: CurrentUser) -> dict:
    """
    Ensure the current user has admin or super_admin role.

    Raises:
        HTTPException 403: If user is not an admin or super_admin.
    """
    if current_user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang dapat mengakses resource ini.",
        )
    return current_user


AdminUser = Annotated[dict, Depends(require_admin)]


async def require_super_admin(current_user: CurrentUser) -> dict:
    """
    Ensure the current user has super_admin role.

    Raises:
        HTTPException 403: If user is not a super_admin.
    """
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya super admin yang dapat mengakses resource ini.",
        )
    return current_user


SuperAdminUser = Annotated[dict, Depends(require_super_admin)]


async def require_student(current_user: CurrentUser) -> dict:
    """
    Ensure the current user has student role.

    Raises:
        HTTPException 403: If user is not a student.
    """
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya mahasiswa yang dapat mengakses resource ini.",
        )
    return current_user


StudentUser = Annotated[dict, Depends(require_student)]
