"""
Smart Parking UMSU — QR Code Service

Business logic for QR code generation, retrieval, and validation.
"""

import base64
import io
import logging
import uuid
from typing import Optional

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from supabase import Client

from app.core.constants import LogAction, QR_CODE_BORDER, QR_CODE_BOX_SIZE
from app.core.exceptions import (
    AuthorizationError,
    DuplicateEntryError,
    NotFoundError,
)

logger = logging.getLogger(__name__)


class QRService:
    """Handles QR code generation, retrieval, and validation."""

    def __init__(self, db: Client):
        self.db = db

    async def generate_qr_code(self, vehicle_id: str, user_id: str) -> dict:
        """
        Generate a permanent QR code for a registered vehicle.
        Each vehicle can only have one active QR code.
        """
        # Verify vehicle exists and belongs to user
        try:
            vehicle_result = (
                self.db.table("vehicles")
                .select("id, user_id, plat_nomor, merek, model")
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = vehicle_result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if vehicle["user_id"] != user_id:
            raise AuthorizationError("Anda tidak memiliki akses ke kendaraan ini.")

        # Check if QR already exists
        try:
            existing = (
                self.db.table("qr_codes")
                .select("*")
                .eq("vehicle_id", vehicle_id)
                .eq("is_active", True)
                .execute()
            )
            if existing.data:
                # Return existing QR code instead of creating duplicate
                qr = existing.data[0]
                qr["plat_nomor"] = vehicle["plat_nomor"]
                qr["merek"] = vehicle["merek"]
                qr["model"] = vehicle["model"]
                return qr
        except Exception as e:
            logger.error(f"Error checking existing QR: {e}")

        # Generate new QR token
        qr_token = str(uuid.uuid4())

        qr_data = {
            "vehicle_id": vehicle_id,
            "qr_token": qr_token,
            "is_active": True,
        }

        try:
            result = (
                self.db.table("qr_codes")
                .insert(qr_data)
                .execute()
            )
            qr_record = result.data[0]
        except Exception as e:
            logger.error(f"Failed to create QR code: {e}")
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateEntryError("QR Code sudah ada untuk kendaraan ini.")
            raise

        # Log activity
        self._log_activity(
            action=LogAction.QR_GENERATED,
            user_id=user_id,
            vehicle_id=vehicle_id,
            detail={"qr_token": qr_token, "plat_nomor": vehicle["plat_nomor"]},
        )

        logger.info(f"QR code generated for vehicle {vehicle['plat_nomor']}")

        qr_record["plat_nomor"] = vehicle["plat_nomor"]
        qr_record["merek"] = vehicle["merek"]
        qr_record["model"] = vehicle["model"]
        return qr_record

    async def get_qr_code(self, vehicle_id: str, user_id: str) -> dict:
        """Get the QR code record for a vehicle."""
        # Verify ownership
        try:
            vehicle_result = (
                self.db.table("vehicles")
                .select("id, user_id, plat_nomor, merek, model")
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = vehicle_result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if vehicle["user_id"] != user_id:
            raise AuthorizationError("Anda tidak memiliki akses ke kendaraan ini.")

        # Get QR code
        try:
            result = (
                self.db.table("qr_codes")
                .select("*")
                .eq("vehicle_id", vehicle_id)
                .eq("is_active", True)
                .single()
                .execute()
            )
            qr = result.data
        except Exception:
            raise NotFoundError("QR Code belum di-generate untuk kendaraan ini.")

        if not qr:
            raise NotFoundError("QR Code belum di-generate untuk kendaraan ini.")

        qr["plat_nomor"] = vehicle["plat_nomor"]
        qr["merek"] = vehicle["merek"]
        qr["model"] = vehicle["model"]
        return qr

    async def get_qr_image(self, vehicle_id: str, user_id: str) -> dict:
        """Get the QR code as a base64-encoded PNG image."""
        qr = await self.get_qr_code(vehicle_id, user_id)

        image_base64 = self.generate_qr_image_base64(qr["qr_token"])

        return {
            "qr_token": qr["qr_token"],
            "image_base64": image_base64,
            "vehicle_id": vehicle_id,
            "plat_nomor": qr["plat_nomor"],
        }

    async def list_user_qr_codes(self, user_id: str) -> list[dict]:
        """List all QR codes for a user's vehicles."""
        try:
            # Get user's vehicle IDs
            vehicles_result = (
                self.db.table("vehicles")
                .select("id, plat_nomor, merek, model")
                .eq("user_id", user_id)
                .eq("status", "ACTIVE")
                .execute()
            )
            vehicles = vehicles_result.data or []
        except Exception as e:
            logger.error(f"Error listing vehicles for QR: {e}")
            return []

        if not vehicles:
            return []

        vehicle_ids = [v["id"] for v in vehicles]
        vehicle_map = {v["id"]: v for v in vehicles}

        # Get QR codes for these vehicles
        try:
            qr_result = (
                self.db.table("qr_codes")
                .select("*")
                .in_("vehicle_id", vehicle_ids)
                .eq("is_active", True)
                .execute()
            )
            qr_codes = qr_result.data or []
        except Exception as e:
            logger.error(f"Error listing QR codes: {e}")
            return []

        # Merge vehicle info
        for qr in qr_codes:
            vehicle = vehicle_map.get(qr["vehicle_id"], {})
            qr["plat_nomor"] = vehicle.get("plat_nomor")
            qr["merek"] = vehicle.get("merek")
            qr["model"] = vehicle.get("model")

        return qr_codes

    async def validate_qr_token(self, qr_token: str) -> dict:
        """
        Validate a QR token and return associated vehicle/user data.
        Called during parking scans.
        """
        try:
            qr_result = (
                self.db.table("qr_codes")
                .select("*, vehicles!inner(*, users!inner(id, nama_lengkap, npm, email))")
                .eq("qr_token", qr_token)
                .eq("is_active", True)
                .single()
                .execute()
            )
            qr = qr_result.data
        except Exception:
            return {
                "is_valid": False,
                "error_message": "QR Code tidak ditemukan atau tidak aktif.",
            }

        if not qr:
            return {
                "is_valid": False,
                "error_message": "QR Code tidak ditemukan atau tidak aktif.",
            }

        vehicle = qr.get("vehicles", {})
        user = vehicle.get("users", {})

        # Check if vehicle is active
        if vehicle.get("status") != "ACTIVE":
            return {
                "is_valid": False,
                "error_message": "Kendaraan tidak aktif.",
            }

        # Check if currently parked
        try:
            session_result = (
                self.db.table("parking_sessions")
                .select("id")
                .eq("vehicle_id", vehicle["id"])
                .eq("status", "PARKED")
                .execute()
            )
            is_parked = bool(session_result.data)
        except Exception:
            is_parked = False

        return {
            "is_valid": True,
            "qr_token": qr_token,
            "qr_code_id": qr["id"],
            "vehicle_id": vehicle["id"],
            "user_id": user.get("id"),
            "plat_nomor": vehicle.get("plat_nomor"),
            "merek": vehicle.get("merek"),
            "model": vehicle.get("model"),
            "warna": vehicle.get("warna"),
            "jenis": vehicle.get("jenis"),
            "owner_nama": user.get("nama_lengkap"),
            "owner_npm": user.get("npm"),
            "is_currently_parked": is_parked,
        }

    @staticmethod
    def generate_qr_image_base64(data: str) -> str:
        """Generate a QR code image and return it as a base64 string."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=ERROR_CORRECT_H,
            box_size=QR_CODE_BOX_SIZE,
            border=QR_CODE_BORDER,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#1a1a2e", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def _log_activity(
        self,
        action: LogAction,
        user_id: Optional[str] = None,
        vehicle_id: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> None:
        """Log a QR-related activity."""
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "vehicle_id": vehicle_id,
                "action": action.value,
                "detail": detail or {},
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
