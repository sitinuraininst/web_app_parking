"""
Smart Parking UMSU — Admin Management Service

Business logic for super_admin to manage admin/operator accounts.
"""

import logging
from typing import Optional

from supabase import Client

from app.core.constants import LogAction, UserRole
from app.core.exceptions import (
    DuplicateEntryError,
    NotFoundError,
    ValidationError,
)
from app.core.security import hash_password
from app.utils.validators import validate_password_strength

logger = logging.getLogger(__name__)


class AdminManagementService:
    """Handles admin account CRUD operations for super_admin."""

    def __init__(self, db: Client):
        self.db = db

    async def list_admins(
        self,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        """
        List all admin and super_admin users.

        Returns (list_of_admins, total_count).
        """
        query = (
            self.db.table("users")
            .select("*", count="exact")
            .in_("role", [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
            .order("created_at", desc=True)
        )

        if search:
            query = query.or_(
                f"nama_lengkap.ilike.%{search}%,email.ilike.%{search}%"
            )

        # Pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        try:
            result = query.execute()
            admins = [self._build_admin_profile(u) for u in (result.data or [])]
            total = result.count or 0
            return admins, total
        except Exception as e:
            logger.error(f"Failed to list admins: {e}")
            raise ValidationError(f"Gagal mengambil daftar admin: {e}")

    async def create_admin(
        self,
        nama_lengkap: str,
        email: str,
        password: str,
        phone: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> dict:
        """Create a new admin account."""
        email = email.strip().lower()

        # Validate password
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

        # Create admin user
        hashed = hash_password(password)
        user_data = {
            "email": email,
            "password_hash": hashed,
            "nama_lengkap": nama_lengkap.strip(),
            "role": UserRole.ADMIN.value,
            "phone": phone,
            "npm": None,
        }

        try:
            result = self.db.table("users").insert(user_data).execute()
            user = result.data[0]
        except Exception as e:
            logger.error(f"Failed to create admin: {e}")
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateEntryError("Email sudah terdaftar.")
            raise ValidationError(f"Gagal membuat akun admin: {e}")

        # Log activity
        await self._log_activity(
            action=LogAction.ADMIN_CREATED,
            user_id=created_by,
            detail={
                "action": "create_admin",
                "created_user_id": user["id"],
                "email": email,
            },
        )

        logger.info(f"New admin created: {email} (by {created_by})")
        return self._build_admin_profile(user)

    async def update_admin(
        self,
        admin_id: str,
        updates: dict,
        updated_by: Optional[str] = None,
    ) -> dict:
        """Update an admin account."""
        # Filter allowed fields
        allowed = {"nama_lengkap", "phone", "email"}
        clean = {k: v for k, v in updates.items() if k in allowed and v is not None}

        if not clean:
            # Nothing to update, return current
            return await self.get_admin(admin_id)

        try:
            result = (
                self.db.table("users")
                .update(clean)
                .eq("id", admin_id)
                .in_("role", [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
                .execute()
            )
            if not result.data:
                raise NotFoundError("Admin tidak ditemukan.")
            user = result.data[0]
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to update admin: {e}")
            raise ValidationError(f"Gagal mengupdate admin: {e}")

        await self._log_activity(
            action=LogAction.ADMIN_UPDATED,
            user_id=updated_by,
            detail={
                "action": "update_admin",
                "target_user_id": admin_id,
                "updates": clean,
            },
        )

        return self._build_admin_profile(user)

    async def get_admin(self, admin_id: str) -> dict:
        """Get a single admin profile."""
        try:
            result = (
                self.db.table("users")
                .select("*")
                .eq("id", admin_id)
                .in_("role", [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
                .single()
                .execute()
            )
            if not result.data:
                raise NotFoundError("Admin tidak ditemukan.")
            return self._build_admin_profile(result.data)
        except NotFoundError:
            raise
        except Exception:
            raise NotFoundError("Admin tidak ditemukan.")

    async def deactivate_admin(
        self,
        admin_id: str,
        deactivated_by: Optional[str] = None,
    ) -> dict:
        """Deactivate an admin account."""
        try:
            result = (
                self.db.table("users")
                .update({"is_active": False})
                .eq("id", admin_id)
                .eq("role", UserRole.ADMIN.value)  # Cannot deactivate super_admin
                .execute()
            )
            if not result.data:
                raise NotFoundError(
                    "Admin tidak ditemukan atau tidak dapat dinonaktifkan."
                )
            user = result.data[0]
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to deactivate admin: {e}")
            raise ValidationError(f"Gagal menonaktifkan admin: {e}")

        await self._log_activity(
            action=LogAction.ADMIN_DEACTIVATED,
            user_id=deactivated_by,
            detail={
                "action": "deactivate_admin",
                "target_user_id": admin_id,
            },
        )

        logger.info(f"Admin deactivated: {admin_id} (by {deactivated_by})")
        return self._build_admin_profile(user)

    async def activate_admin(
        self,
        admin_id: str,
        activated_by: Optional[str] = None,
    ) -> dict:
        """Re-activate a deactivated admin account."""
        try:
            result = (
                self.db.table("users")
                .update({"is_active": True})
                .eq("id", admin_id)
                .eq("role", UserRole.ADMIN.value)
                .execute()
            )
            if not result.data:
                raise NotFoundError("Admin tidak ditemukan.")
            user = result.data[0]
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to activate admin: {e}")
            raise ValidationError(f"Gagal mengaktifkan admin: {e}")

        await self._log_activity(
            action=LogAction.ADMIN_ACTIVATED,
            user_id=activated_by,
            detail={
                "action": "activate_admin",
                "target_user_id": admin_id,
            },
        )

        return self._build_admin_profile(user)

    async def delete_admin(
        self,
        admin_id: str,
        deleted_by: Optional[str] = None,
    ) -> None:
        """Permanently delete an admin account."""
        if admin_id == deleted_by:
            raise ValidationError("Tidak dapat menghapus akun sendiri.")

        # Check user details
        target = await self.get_admin(admin_id)

        # Check if last super_admin
        if target["role"] == UserRole.SUPER_ADMIN.value:
            res = (
                self.db.table("users")
                .select("id", count="exact")
                .eq("role", UserRole.SUPER_ADMIN.value)
                .execute()
            )
            if res.count is not None and res.count <= 1:
                raise ValidationError("Tidak dapat menghapus super admin terakhir.")

        try:
            result = self.db.table("users").delete().eq("id", admin_id).execute()
            if not result.data:
                raise NotFoundError("Admin tidak ditemukan atau gagal dihapus.")
        except Exception as e:
            logger.error(f"Failed to delete admin: {e}")
            raise ValidationError(f"Gagal menghapus admin: {e}")

        await self._log_activity(
            action=LogAction.ADMIN_DELETED,
            user_id=deleted_by,
            detail={
                "action": "delete_admin",
                "target_user_id": admin_id,
                "target_email": target["email"],
            },
        )
    async def clear_activity_logs(
        self,
        super_admin_id: str,
        super_admin_email: str,
    ) -> None:
        """
        Safely and efficiently clear all activity logs and log the clear action.
        """
        try:
            # Delete all logs. Standard PostgREST requires a filter to run delete.
            # Using .neq() on ID is an efficient way to clear the table cleanly.
            self.db.table("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            logger.warning(f"Activity logs cleared by super_admin: {super_admin_email}")
        except Exception as e:
            logger.error(f"Failed to clear activity logs: {e}")
            raise ValidationError(f"Gagal membersihkan log aktivitas: {e}")

        # Log the clear action
        await self._log_activity(
            action=LogAction.LOGS_CLEARED,
            user_id=super_admin_id,
            detail={
                "action": "clear_activity_logs",
                "cleared_by_email": super_admin_email,
            },
        )

    @staticmethod
    def _build_admin_profile(user: dict) -> dict:
        """Build a safe admin profile dict."""
        return {
            "id": user["id"],
            "email": user["email"],
            "nama_lengkap": user["nama_lengkap"],
            "role": user["role"],
            "phone": user.get("phone"),
            "is_active": user.get("is_active", True),
            "last_login_at": user.get("last_login_at"),
            "created_at": user["created_at"],
        }

    async def _log_activity(
        self,
        action: LogAction,
        user_id: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> None:
        """Log an admin management activity."""
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "action": action.value,
                "detail": detail or {},
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
