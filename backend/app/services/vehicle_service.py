"""
Smart Parking UMSU — Vehicle Service

Business logic for vehicle registration, updates, and queries.
"""

import logging
from typing import Optional

from supabase import Client

from app.core.constants import LogAction, VehicleStatus
from app.core.exceptions import (
    AuthorizationError,
    DuplicateEntryError,
    NotFoundError,
    ValidationError,
)
from app.utils.validators import normalize_plate_number, validate_plate_number

logger = logging.getLogger(__name__)


class VehicleService:
    """Handles vehicle registration, updates, and retrieval."""

    def __init__(self, db: Client):
        self.db = db

    async def register_vehicle(
        self,
        user_id: str,
        plat_nomor: str,
        merek: str,
        model: str,
        warna: str,
        jenis: str,
    ) -> dict:
        """Register a new vehicle for a student."""
        # Normalize plate number
        plat_nomor = normalize_plate_number(plat_nomor)

        # Validate format
        if not validate_plate_number(plat_nomor):
            raise ValidationError(
                f"Format plat nomor '{plat_nomor}' tidak valid. "
                "Contoh format yang benar: BK 1234 ABC"
            )

        # Check duplicate plate
        try:
            existing = (
                self.db.table("vehicles")
                .select("id")
                .eq("plat_nomor", plat_nomor)
                .execute()
            )
            if existing.data:
                raise DuplicateEntryError(
                    f"Plat nomor {plat_nomor} sudah terdaftar dalam sistem."
                )
        except DuplicateEntryError:
            raise
        except Exception as e:
            logger.error(f"Error checking plate: {e}")

        # Create vehicle record
        vehicle_data = {
            "user_id": user_id,
            "plat_nomor": plat_nomor,
            "merek": merek.strip(),
            "model": model.strip(),
            "warna": warna.strip(),
            "jenis": jenis,
            "status": VehicleStatus.ACTIVE.value,
        }

        try:
            result = (
                self.db.table("vehicles")
                .insert(vehicle_data)
                .execute()
            )
            vehicle = result.data[0]
        except Exception as e:
            logger.error(f"Failed to register vehicle: {e}")
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateEntryError(f"Plat nomor {plat_nomor} sudah terdaftar.")
            raise ValidationError(f"Gagal mendaftarkan kendaraan: {e}")

        # Log activity
        self._log_activity(
            action=LogAction.VEHICLE_REGISTERED,
            user_id=user_id,
            vehicle_id=vehicle["id"],
            detail={"plat_nomor": plat_nomor, "merek": merek, "model": model},
        )

        logger.info(f"Vehicle registered: {plat_nomor} by user {user_id}")
        return vehicle

    async def get_vehicle(self, vehicle_id: str, user_id: Optional[str] = None) -> dict:
        """
        Get vehicle details by ID.
        If user_id provided, verifies ownership (unless admin).
        """
        try:
            result = (
                self.db.table("vehicles")
                .select("*")
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        # Verify ownership if user_id provided
        if user_id and vehicle["user_id"] != user_id:
            raise AuthorizationError("Anda tidak memiliki akses ke kendaraan ini.")

        return vehicle

    async def list_user_vehicles(self, user_id: str) -> list[dict]:
        """List all vehicles owned by a user with QR availability flag."""
        try:
            result = (
                self.db.table("vehicles")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", VehicleStatus.ACTIVE.value)
                .order("created_at", desc=True)
                .execute()
            )
            vehicles = result.data or []
        except Exception as e:
            logger.error(f"Error listing vehicles: {e}")
            return []

        # Check QR availability for each vehicle
        for vehicle in vehicles:
            try:
                qr_result = (
                    self.db.table("qr_codes")
                    .select("id")
                    .eq("vehicle_id", vehicle["id"])
                    .eq("is_active", True)
                    .execute()
                )
                vehicle["has_qr"] = bool(qr_result.data)
            except Exception:
                vehicle["has_qr"] = False

        return vehicles

    async def update_vehicle(
        self, vehicle_id: str, user_id: str, updates: dict
    ) -> dict:
        """Update vehicle details. Only the owner can update."""
        # Verify ownership
        await self.get_vehicle(vehicle_id, user_id)

        # Filter out None values
        clean_updates = {k: v.strip() if isinstance(v, str) else v
                         for k, v in updates.items() if v is not None}
        if not clean_updates:
            return await self.get_vehicle(vehicle_id)

        try:
            result = (
                self.db.table("vehicles")
                .update(clean_updates)
                .eq("id", vehicle_id)
                .execute()
            )
            if not result.data:
                raise NotFoundError("Kendaraan tidak ditemukan.")
            vehicle = result.data[0]
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to update vehicle: {e}")
            raise ValidationError(f"Gagal mengupdate kendaraan: {e}")

        # Log activity
        self._log_activity(
            action=LogAction.VEHICLE_UPDATED,
            user_id=user_id,
            vehicle_id=vehicle_id,
            detail={"updates": clean_updates},
        )

        return vehicle

    async def delete_vehicle(self, vehicle_id: str, user_id: str) -> bool:
        """Soft-delete a vehicle (set status to INACTIVE)."""
        # Verify ownership
        vehicle = await self.get_vehicle(vehicle_id, user_id)

        try:
            self.db.table("vehicles").update({
                "status": VehicleStatus.INACTIVE.value,
            }).eq("id", vehicle_id).execute()
        except Exception as e:
            logger.error(f"Failed to delete vehicle: {e}")
            raise ValidationError("Gagal menghapus kendaraan.")

        # Deactivate associated QR code
        try:
            self.db.table("qr_codes").update({
                "is_active": False,
            }).eq("vehicle_id", vehicle_id).execute()
        except Exception as e:
            logger.warning(f"Failed to deactivate QR for vehicle {vehicle_id}: {e}")

        # Log activity
        self._log_activity(
            action=LogAction.VEHICLE_DELETED,
            user_id=user_id,
            vehicle_id=vehicle_id,
            detail={"plat_nomor": vehicle["plat_nomor"]},
        )

        logger.info(f"Vehicle soft-deleted: {vehicle['plat_nomor']}")
        return True

    async def list_all_vehicles(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        jenis: Optional[str] = None,
    ) -> tuple[list[dict], int]:
        """List all registered vehicles with owner info (admin)."""
        try:
            # Build query
            query = self.db.table("vehicles").select(
                "*, users!inner(nama_lengkap, npm, email)",
                count="exact",
            )

            if search:
                query = query.ilike("plat_nomor", f"%{search.upper()}%")

            if jenis:
                query = query.eq("jenis", jenis)

            # Get total count and paginated data
            offset = (page - 1) * page_size
            result = (
                query
                .order("created_at", desc=True)
                .range(offset, offset + page_size - 1)
                .execute()
            )

            vehicles = result.data or []
            total = result.count or 0

            # Flatten user info
            for v in vehicles:
                user_info = v.pop("users", {})
                v["owner_nama"] = user_info.get("nama_lengkap")
                v["owner_npm"] = user_info.get("npm")
                v["owner_email"] = user_info.get("email")

            return vehicles, total

        except Exception as e:
            logger.error(f"Error listing all vehicles: {e}")
            return [], 0

    async def get_vehicle_with_owner(self, vehicle_id: str) -> dict:
        """
        Get vehicle details with full owner profile info (admin view).

        Performs a single JOIN query to avoid N+1 patterns.
        Returns vehicle data with owner's nama_lengkap, npm, email, prodi, phone.
        """
        try:
            result = (
                self.db.table("vehicles")
                .select(
                    "*, users!inner(nama_lengkap, npm, email, prodi, phone)"
                )
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        # Flatten user info into vehicle dict
        user_info = vehicle.pop("users", {})
        vehicle["owner_nama"] = user_info.get("nama_lengkap")
        vehicle["owner_npm"] = user_info.get("npm")
        vehicle["owner_email"] = user_info.get("email")
        vehicle["owner_prodi"] = user_info.get("prodi")
        vehicle["owner_phone"] = user_info.get("phone")

        return vehicle

    async def hard_delete_vehicle(
        self, vehicle_id: str, deleted_by: str
    ) -> dict:
        """
        Permanently delete a vehicle (super_admin only).

        - Fetches vehicle with owner info for audit logging
        - Deactivates associated QR codes
        - Deletes the vehicle record permanently
        - Logs VEHICLE_HARD_DELETED activity
        """
        # Fetch vehicle with owner info before deletion (for logging)
        vehicle = await self.get_vehicle_with_owner(vehicle_id)

        # Deactivate associated QR codes (soft-deactivate to preserve history)
        try:
            self.db.table("qr_codes").update({
                "is_active": False,
            }).eq("vehicle_id", vehicle_id).execute()
        except Exception as e:
            logger.warning(
                f"Failed to deactivate QR codes for vehicle {vehicle_id}: {e}"
            )

        # Permanently delete the vehicle record
        try:
            result = (
                self.db.table("vehicles")
                .delete()
                .eq("id", vehicle_id)
                .execute()
            )
            if not result.data:
                raise NotFoundError(
                    "Kendaraan tidak ditemukan atau gagal dihapus."
                )
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to hard-delete vehicle: {e}")
            raise ValidationError(f"Gagal menghapus kendaraan: {e}")

        # Log activity with full details for audit trail
        self._log_activity(
            action=LogAction.VEHICLE_HARD_DELETED,
            user_id=deleted_by,
            vehicle_id=vehicle_id,
            detail={
                "action": "hard_delete_vehicle",
                "plat_nomor": vehicle.get("plat_nomor"),
                "merek": vehicle.get("merek"),
                "model": vehicle.get("model"),
                "owner_nama": vehicle.get("owner_nama"),
                "owner_npm": vehicle.get("owner_npm"),
                "deleted_by": deleted_by,
            },
        )

        logger.info(
            f"Vehicle hard-deleted: {vehicle.get('plat_nomor')} "
            f"by super_admin {deleted_by}"
        )
        return vehicle

    def _log_activity(
        self,
        action: LogAction,
        user_id: Optional[str] = None,
        vehicle_id: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> None:
        """Log a vehicle-related activity."""
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "vehicle_id": vehicle_id,
                "action": action.value,
                "detail": detail or {},
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
