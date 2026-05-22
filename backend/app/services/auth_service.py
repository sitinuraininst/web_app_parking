"""
Smart Parking UMSU — Authentication Service

Business logic for user authentication, registration, and profile management.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from supabase import Client

from fastapi import status, HTTPException
from app.core.exceptions import SmartParkingException
from app.models.auth import (
    LoginResponse,
    UserRole,
)
from app.services.settings_service import SettingsService
from app.core.exceptions import (
    AuthenticationError,
    DuplicateEntryError,
    NotFoundError,
    ValidationError,
)
from app.core.constants import LogAction
from app.core.security import create_access_token, hash_password, verify_password
from app.config import settings
from app.utils.validators import validate_password_strength

logger = logging.getLogger(__name__)


class AuthService:
    """Handles authentication, registration, and user management."""

    def __init__(self, db: Client):
        self.db = db

    async def login(self, email: str, password: str) -> dict:
        """
        Authenticate user with email and password.

        Returns dict with access_token, user profile, and expiration info.
        """
        email = email.strip().lower()

        # Find user by email
        try:
            result = (
                self.db.table("users")
                .select("*")
                .eq("email", email)
                .eq("is_active", True)
                .single()
                .execute()
            )
            user = result.data
        except Exception:
            raise AuthenticationError("Email atau password salah.")

        if not user:
            raise AuthenticationError(
                detail="Email atau password salah.",
                error_code="INVALID_CREDENTIALS",
            )

        # Check maintenance mode
        settings_service = SettingsService(self.db)
        if settings_service.is_maintenance_mode_active() and user["role"] != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="System is currently under maintenance.",
            )

        # Verify password
        if not verify_password(password, user["password_hash"]):
            await self._log_activity(
                action=LogAction.LOGIN,
                detail={"email": email, "success": False, "reason": "wrong_password"},
            )
            raise AuthenticationError("Email atau password salah.")

        # Generate JWT token
        token_data = {
            "sub": user["id"],
            "role": user["role"],
            "email": user["email"],
        }
        access_token = create_access_token(token_data)

        # Update last login
        try:
            self.db.table("users").update({
                "last_login_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user["id"]).execute()
        except Exception as e:
            logger.warning(f"Failed to update last_login_at: {e}")

        # Log successful login
        await self._log_activity(
            action=LogAction.LOGIN,
            user_id=user["id"],
            detail={"email": email, "success": True},
        )

        # Build profile (exclude sensitive fields)
        profile = self._build_profile(user)
        
        login_response = {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expiration_minutes * 60,
            "user": profile,
        }

        return login_response

    async def register_student(
        self,
        email: str,
        password: str,
        nama_lengkap: str,
        npm: str,
        phone: Optional[str] = None,
        prodi: Optional[str] = None,
    ) -> dict:
        """
        Register a new student account.
        """
        email = email.strip().lower()
        npm = npm.strip()

        # Validate password strength
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise ValidationError(error_msg)

        # Check duplicate email
        try:
            existing = (
                self.db.table("users")
                .select("id")
                .eq("email", email)
                .execute()
            )
            if existing.data:
                raise DuplicateEntryError("Email sudah terdaftar.")
        except DuplicateEntryError:
            raise
        except Exception as e:
            logger.error(f"Error checking email: {e}")

        # Check duplicate NPM
        try:
            existing_npm = (
                self.db.table("users")
                .select("id")
                .eq("npm", npm)
                .execute()
            )
            if existing_npm.data:
                raise DuplicateEntryError("NPM sudah terdaftar.")
        except DuplicateEntryError:
            raise
        except Exception as e:
            logger.error(f"Error checking NPM: {e}")

        # Hash password and create user
        hashed = hash_password(password)

        user_data = {
            "email": email,
            "password_hash": hashed,
            "nama_lengkap": nama_lengkap.strip(),
            "npm": npm,
            "role": UserRole.STUDENT.value,
            "phone": phone,
            "prodi": prodi,
        }

        try:
            result = (
                self.db.table("users")
                .insert(user_data)
                .execute()
            )
            user = result.data[0]
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateEntryError("Email atau NPM sudah terdaftar.")
            raise ValidationError(f"Gagal membuat akun: {e}")

        # Log registration
        await self._log_activity(
            action=LogAction.REGISTER,
            user_id=user["id"],
            detail={"email": email, "npm": npm},
        )

        logger.info(f"New student registered: {email} (NPM: {npm})")

        return {
            "user_id": user["id"],
            "email": user["email"],
            "nama_lengkap": user["nama_lengkap"],
            "npm": user["npm"],
            "message": "Registrasi berhasil.",
        }

    async def get_user_profile(self, user_id: str) -> dict:
        """Get user profile by ID (excluding password_hash)."""
        try:
            result = (
                self.db.table("users")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
            user = result.data
        except Exception:
            raise NotFoundError("User tidak ditemukan.")

        if not user:
            raise NotFoundError("User tidak ditemukan.")

        return self._build_profile(user)

    async def update_profile(self, user_id: str, updates: dict) -> dict:
        """Update user profile fields."""
        # Filter out None values
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return await self.get_user_profile(user_id)

        try:
            result = (
                self.db.table("users")
                .update(clean_updates)
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise NotFoundError("User tidak ditemukan.")
            user = result.data[0]
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to update profile: {e}")
            raise ValidationError(f"Gagal mengupdate profil: {e}")

        return self._build_profile(user)

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> bool:
        """Change user password after verifying current password."""
        # Validate new password
        is_valid, error_msg = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(error_msg)

        # Get current hash
        try:
            result = (
                self.db.table("users")
                .select("password_hash")
                .eq("id", user_id)
                .single()
                .execute()
            )
            user = result.data
        except Exception:
            raise NotFoundError("User tidak ditemukan.")

        if not user:
            raise NotFoundError("User tidak ditemukan.")

        # Verify current password
        if not verify_password(current_password, user["password_hash"]):
            raise AuthenticationError("Password saat ini salah.")

        # Update password
        new_hash = hash_password(new_password)
        try:
            self.db.table("users").update({
                "password_hash": new_hash,
            }).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"Failed to change password: {e}")
            raise ValidationError("Gagal mengubah password.")

        logger.info(f"Password changed for user: {user_id}")
        return True

    async def _log_activity(
        self,
        action: LogAction,
        user_id: Optional[str] = None,
        detail: Optional[dict] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log an authentication-related activity."""
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "action": action.value,
                "detail": detail or {},
                "ip_address": ip_address,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")

    @staticmethod
    def _build_profile(user: dict) -> dict:
        """Build a safe profile dict (no password_hash)."""
        return {
            "id": user["id"],
            "email": user["email"],
            "nama_lengkap": user["nama_lengkap"],
            "npm": user.get("npm"),
            "role": user["role"],
            "avatar_url": user.get("avatar_url"),
            "phone": user.get("phone"),
            "prodi": user.get("prodi"),
            "is_active": user.get("is_active", True),
            "last_login_at": user.get("last_login_at"),
            "created_at": user["created_at"],
        }
