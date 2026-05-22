"""
Smart Parking UMSU — Parking Service

Business logic for parking sessions: entry, exit, history, and active monitoring.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from supabase import Client

from app.config import settings
from app.core.constants import DEFAULT_GATE_KELUAR, DEFAULT_GATE_MASUK, LogAction, ParkingStatus
from app.core.exceptions import (
    CooldownActiveError,
    NotFoundError,
    ParkingFullError,
    ValidationError,
    VehicleAlreadyParkedError,
    VehicleNotParkedError,
)
from app.services.qr_service import QRService
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)


class ParkingService:
    """Handles parking session management: entry, exit, and monitoring."""

    def __init__(self, db: Client):
        self.db = db
        self.qr_service = QRService(db)
        self.settings_service = SettingsService(db)

    async def handle_scan(self, qr_token: str, gate: Optional[str] = None) -> dict:
        """
        Handle a QR code scan — determines whether it's an entry or exit.

        1. Validate QR token
        2. Check cooldown
        3. If NOT parked → create entry
        4. If PARKED → process exit
        """
        # Validate QR token
        validation = await self.qr_service.validate_qr_token(qr_token)
        if not validation["is_valid"]:
            # Log rejected scan
            self._log_activity(
                action=LogAction.SCAN_REJECTED,
                detail={"qr_token": qr_token, "reason": validation.get("error_message")},
            )
            raise ValidationError(validation.get("error_message", "QR Code tidak valid."))

        vehicle_id = validation["vehicle_id"]
        qr_code_id = validation["qr_code_id"]

        # Check cooldown
        await self._check_cooldown(vehicle_id)

        # Determine entry or exit
        if validation["is_currently_parked"]:
            # Vehicle is parked → process exit
            return await self._process_exit(vehicle_id, gate)
        else:
            # Vehicle is not parked → create entry
            await self._check_capacity()
            return await self._create_entry(vehicle_id, qr_code_id, validation, gate)

    async def _create_entry(
        self,
        vehicle_id: str,
        qr_code_id: str,
        validation: dict,
        gate: Optional[str] = None,
    ) -> dict:
        """Create a new parking entry session."""
        now = datetime.now(timezone.utc)

        session_data = {
            "vehicle_id": vehicle_id,
            "qr_code_id": qr_code_id,
            "waktu_masuk": now.isoformat(),
            "status": ParkingStatus.PARKED.value,
            "gate_masuk": gate or DEFAULT_GATE_MASUK,
        }

        try:
            result = (
                self.db.table("parking_sessions")
                .insert(session_data)
                .execute()
            )
            session = result.data[0]
        except Exception as e:
            logger.error(f"Failed to create parking entry: {e}")
            raise ValidationError("Gagal mencatat masuk parkir.")

        # Log activity
        self._log_activity(
            action=LogAction.PARKING_ENTRY,
            user_id=validation.get("user_id"),
            vehicle_id=vehicle_id,
            detail={
                "session_id": session["id"],
                "plat_nomor": validation.get("plat_nomor"),
                "gate": gate or DEFAULT_GATE_MASUK,
            },
        )

        logger.info(
            f"PARKING ENTRY: {validation.get('plat_nomor')} "
            f"({validation.get('owner_nama')})"
        )

        return {
            "type": "entry",
            "session_id": session["id"],
            "vehicle_id": vehicle_id,
            "plat_nomor": validation.get("plat_nomor", ""),
            "merek": validation.get("merek", ""),
            "model": validation.get("model", ""),
            "warna": validation.get("warna", ""),
            "jenis": validation.get("jenis", ""),
            "owner_nama": validation.get("owner_nama", ""),
            "waktu_masuk": session["waktu_masuk"],
            "status": ParkingStatus.PARKED.value,
            "message": "Kendaraan berhasil masuk parkiran.",
        }

    async def _process_exit(
        self, vehicle_id: str, gate: Optional[str] = None
    ) -> dict:
        """Process parking exit — close the active session."""
        # Find active session
        try:
            result = (
                self.db.table("parking_sessions")
                .select("*, vehicles!inner(plat_nomor, merek, model, warna, jenis, user_id, users!inner(nama_lengkap, npm))")
                .eq("vehicle_id", vehicle_id)
                .eq("status", ParkingStatus.PARKED.value)
                .order("waktu_masuk", desc=True)
                .limit(1)
                .single()
                .execute()
            )
            session = result.data
        except Exception:
            raise VehicleNotParkedError()

        if not session:
            raise VehicleNotParkedError()

        now = datetime.now(timezone.utc)

        # Update session with exit time
        # The trigger will calculate durasi_menit and set status to COMPLETED
        try:
            update_result = (
                self.db.table("parking_sessions")
                .update({
                    "waktu_keluar": now.isoformat(),
                    "gate_keluar": gate or DEFAULT_GATE_KELUAR,
                })
                .eq("id", session["id"])
                .execute()
            )
            updated_session = update_result.data[0]
        except Exception as e:
            logger.error(f"Failed to process parking exit: {e}")
            raise ValidationError("Gagal mencatat keluar parkir.")

        # Calculate duration manually for the response
        waktu_masuk = datetime.fromisoformat(
            session["waktu_masuk"].replace("Z", "+00:00")
        )
        durasi_menit = (now - waktu_masuk).total_seconds() / 60
        durasi_formatted = self.format_duration(durasi_menit)

        vehicle = session.get("vehicles", {})
        user = vehicle.get("users", {})

        # Log activity
        self._log_activity(
            action=LogAction.PARKING_EXIT,
            user_id=vehicle.get("user_id"),
            vehicle_id=vehicle_id,
            detail={
                "session_id": session["id"],
                "plat_nomor": vehicle.get("plat_nomor"),
                "durasi_menit": round(durasi_menit, 2),
                "gate": gate or DEFAULT_GATE_KELUAR,
            },
        )

        logger.info(
            f"PARKING EXIT: {vehicle.get('plat_nomor')} "
            f"({user.get('nama_lengkap')}) — {durasi_formatted}"
        )

        return {
            "type": "exit",
            "session_id": session["id"],
            "vehicle_id": vehicle_id,
            "plat_nomor": vehicle.get("plat_nomor", ""),
            "merek": vehicle.get("merek", ""),
            "model": vehicle.get("model", ""),
            "warna": vehicle.get("warna", ""),
            "jenis": vehicle.get("jenis", ""),
            "owner_nama": user.get("nama_lengkap", ""),
            "waktu_masuk": session["waktu_masuk"],
            "waktu_keluar": now.isoformat(),
            "durasi_menit": round(durasi_menit, 2),
            "durasi_formatted": durasi_formatted,
            "status": ParkingStatus.COMPLETED.value,
            "message": "Kendaraan berhasil keluar parkiran.",
        }

    async def _check_cooldown(self, vehicle_id: str) -> None:
        """Check if the vehicle is within the scan cooldown period."""
        sys_settings = self.settings_service.get_settings()
        cooldown_seconds = sys_settings.scan_cooldown_seconds

        try:
            # Get the most recent parking session or activity for this vehicle
            result = (
                self.db.table("parking_sessions")
                .select("waktu_masuk, waktu_keluar, updated_at")
                .eq("vehicle_id", vehicle_id)
                .order("updated_at", desc=True)
                .limit(1)
                .execute()
            )

            if not result.data:
                return  # No previous sessions, no cooldown

            session = result.data[0]
            last_activity = session.get("waktu_keluar") or session.get("waktu_masuk")

            if last_activity:
                last_time = datetime.fromisoformat(
                    last_activity.replace("Z", "+00:00")
                )
                now = datetime.now(timezone.utc)
                elapsed = (now - last_time).total_seconds()

                if elapsed < cooldown_seconds:
                    remaining = int(cooldown_seconds - elapsed)
                    raise CooldownActiveError(remaining_seconds=remaining)

        except CooldownActiveError:
            raise
        except Exception as e:
            # Don't block parking on cooldown check failure
            logger.warning(f"Cooldown check error (non-blocking): {e}")

    async def _check_capacity(self) -> None:
        """Check if parking lot has available space."""
        try:
            result = (
                self.db.table("parking_sessions")
                .select("id", count="exact")
                .eq("status", ParkingStatus.PARKED.value)
                .execute()
            )
            current_count = result.count or 0
            sys_settings = self.settings_service.get_settings()

            if current_count >= sys_settings.max_parking_capacity:
                raise ParkingFullError()

        except ParkingFullError:
            raise
        except Exception as e:
            # Don't block parking on capacity check failure
            logger.warning(f"Capacity check error (non-blocking): {e}")

    async def get_active_parking(
        self, search: Optional[str] = None
    ) -> list[dict]:
        """Get all currently parked vehicles."""
        try:
            query = (
                self.db.table("parking_sessions")
                .select("*, vehicles!inner(plat_nomor, merek, model, warna, jenis, users!inner(nama_lengkap, npm))")
                .eq("status", ParkingStatus.PARKED.value)
                .order("waktu_masuk", desc=True)
            )

            result = query.execute()
            sessions = result.data or []
        except Exception as e:
            logger.error(f"Error fetching active parking: {e}")
            return []

        now = datetime.now(timezone.utc)
        active_items = []

        for session in sessions:
            vehicle = session.get("vehicles", {})
            user = vehicle.get("users", {})
            plat_nomor = vehicle.get("plat_nomor", "")

            # Apply search filter
            if search and search.upper() not in plat_nomor.upper():
                continue

            # Calculate current duration
            try:
                waktu_masuk = datetime.fromisoformat(
                    session["waktu_masuk"].replace("Z", "+00:00")
                )
                durasi_menit = (now - waktu_masuk).total_seconds() / 60
            except Exception:
                durasi_menit = 0

            active_items.append({
                "session_id": session["id"],
                "vehicle_id": session["vehicle_id"],
                "plat_nomor": plat_nomor,
                "merek": vehicle.get("merek", ""),
                "model": vehicle.get("model", ""),
                "warna": vehicle.get("warna", ""),
                "jenis": vehicle.get("jenis", ""),
                "owner_nama": user.get("nama_lengkap", ""),
                "owner_npm": user.get("npm"),
                "waktu_masuk": session["waktu_masuk"],
                "durasi_menit": round(durasi_menit, 2),
            })

        return active_items

    async def get_parking_history(
        self,
        user_id: Optional[str] = None,
        role: str = "student",
        page: int = 1,
        page_size: int = 20,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> tuple[list[dict], int]:
        """Get parking history with pagination and filters."""
        try:
            query = (
                self.db.table("parking_sessions")
                .select(
                    "*, vehicles!inner(plat_nomor, merek, model, warna, jenis, user_id, users!inner(nama_lengkap, npm))",
                    count="exact",
                )
            )

            # Students only see their own history
            if role == "student" and user_id:
                query = query.eq("vehicles.user_id", user_id)

            # Date filters
            if date_from:
                query = query.gte("waktu_masuk", f"{date_from}T00:00:00+00:00")
            if date_to:
                query = query.lte("waktu_masuk", f"{date_to}T23:59:59+00:00")

            # Pagination
            offset = (page - 1) * page_size
            result = (
                query
                .order("waktu_masuk", desc=True)
                .range(offset, offset + page_size - 1)
                .execute()
            )

            sessions = result.data or []
            total = result.count or 0

            # Format response
            formatted = []
            for session in sessions:
                vehicle = session.pop("vehicles", {})
                user = vehicle.pop("users", {})

                durasi_formatted = None
                if session.get("durasi_menit"):
                    durasi_formatted = self.format_duration(session["durasi_menit"])

                formatted.append({
                    **session,
                    "durasi_formatted": durasi_formatted,
                    "plat_nomor": vehicle.get("plat_nomor"),
                    "merek": vehicle.get("merek"),
                    "model": vehicle.get("model"),
                    "warna": vehicle.get("warna"),
                    "jenis": vehicle.get("jenis"),
                    "owner_nama": user.get("nama_lengkap"),
                    "owner_npm": user.get("npm"),
                })

            return formatted, total

        except Exception as e:
            logger.error(f"Error fetching parking history: {e}")
            return [], 0

    async def get_session_detail(self, session_id: str) -> dict:
        """Get details of a specific parking session."""
        try:
            result = (
                self.db.table("parking_sessions")
                .select("*, vehicles!inner(plat_nomor, merek, model, warna, jenis, users!inner(nama_lengkap, npm))")
                .eq("id", session_id)
                .single()
                .execute()
            )
            session = result.data
        except Exception:
            raise NotFoundError("Sesi parkir tidak ditemukan.")

        if not session:
            raise NotFoundError("Sesi parkir tidak ditemukan.")

        vehicle = session.pop("vehicles", {})
        user = vehicle.pop("users", {})

        durasi_formatted = None
        if session.get("durasi_menit"):
            durasi_formatted = self.format_duration(session["durasi_menit"])

        return {
            **session,
            "durasi_formatted": durasi_formatted,
            "plat_nomor": vehicle.get("plat_nomor"),
            "merek": vehicle.get("merek"),
            "model": vehicle.get("model"),
            "warna": vehicle.get("warna"),
            "jenis": vehicle.get("jenis"),
            "owner_nama": user.get("nama_lengkap"),
            "owner_npm": user.get("npm"),
        }

    @staticmethod
    def format_duration(minutes: float) -> str:
        """Format duration in minutes to human-readable Indonesian string."""
        total_minutes = int(minutes)
        hours = total_minutes // 60
        mins = total_minutes % 60

        if hours == 0:
            return f"{mins} menit"
        elif mins == 0:
            return f"{hours} jam"
        else:
            return f"{hours} jam {mins} menit"

    def _log_activity(
        self,
        action: LogAction,
        user_id: Optional[str] = None,
        vehicle_id: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> None:
        """Log a parking-related activity."""
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "vehicle_id": vehicle_id,
                "action": action.value,
                "detail": detail or {},
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
