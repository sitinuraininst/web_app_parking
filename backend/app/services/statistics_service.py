"""
Smart Parking UMSU — Statistics Service

Business logic for parking statistics and analytics.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from supabase import Client

from app.config import settings
from app.core.constants import ParkingStatus
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)


class StatisticsService:
    """Handles parking statistics calculations and aggregations."""

    def __init__(self, db: Client):
        self.db = db
        self.settings_service = SettingsService(db)

    async def get_overview(self) -> dict:
        """Get today's parking statistics overview."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Currently parked count
        try:
            parked_result = (
                self.db.table("parking_sessions")
                .select("id", count="exact")
                .eq("status", ParkingStatus.PARKED.value)
                .execute()
            )
            sedang_parkir = parked_result.count or 0
        except Exception as e:
            logger.error(f"Error counting parked vehicles: {e}")
            sedang_parkir = 0

        # Total entries today
        try:
            today_result = (
                self.db.table("parking_sessions")
                .select("id", count="exact")
                .gte("waktu_masuk", today_start.isoformat())
                .execute()
            )
            total_hari_ini = today_result.count or 0
        except Exception as e:
            logger.error(f"Error counting today's entries: {e}")
            total_hari_ini = 0

        # Total exits today
        try:
            exit_result = (
                self.db.table("parking_sessions")
                .select("id", count="exact")
                .eq("status", ParkingStatus.COMPLETED.value)
                .gte("waktu_keluar", today_start.isoformat())
                .execute()
            )
            keluar_hari_ini = exit_result.count or 0
        except Exception as e:
            logger.error(f"Error counting today's exits: {e}")
            keluar_hari_ini = 0

        # Average duration today (completed sessions)
        try:
            avg_result = (
                self.db.table("parking_sessions")
                .select("durasi_menit")
                .eq("status", ParkingStatus.COMPLETED.value)
                .gte("waktu_keluar", today_start.isoformat())
                .execute()
            )
            durations = [s["durasi_menit"] for s in (avg_result.data or []) if s.get("durasi_menit")]
            rata_rata = round(sum(durations) / len(durations), 2) if durations else None
        except Exception as e:
            logger.error(f"Error calculating avg duration: {e}")
            rata_rata = None

        # Vehicle type breakdown (currently parked)
        try:
            type_result = (
                self.db.table("parking_sessions")
                .select("vehicles!inner(jenis)")
                .eq("status", ParkingStatus.PARKED.value)
                .execute()
            )
            type_data = type_result.data or []
            kendaraan_motor = sum(1 for t in type_data if t.get("vehicles", {}).get("jenis") == "motor")
            kendaraan_mobil = sum(1 for t in type_data if t.get("vehicles", {}).get("jenis") == "mobil")
        except Exception as e:
            logger.error(f"Error counting vehicle types: {e}")
            kendaraan_motor = 0
            kendaraan_mobil = 0
            
        sys_settings = self.settings_service.get_settings()
        kapasitas_total = sys_settings.max_parking_capacity
        persentase_terisi = round((sedang_parkir / kapasitas_total) * 100, 1) if kapasitas_total > 0 else 0

        return {
            "total_hari_ini": total_hari_ini,
            "sedang_parkir": sedang_parkir,
            "keluar_hari_ini": keluar_hari_ini,
            "kapasitas_terisi": sedang_parkir,
            "kapasitas_total": kapasitas_total,
            "persentase_terisi": persentase_terisi,
            "rata_rata_durasi_menit": rata_rata,
            "kendaraan_motor": kendaraan_motor,
            "kendaraan_mobil": kendaraan_mobil,
        }

    async def get_daily_stats(self, days: int = 7) -> list[dict]:
        """Get daily parking statistics for the last N days."""
        now = datetime.now(timezone.utc)
        daily_stats = []

        for i in range(days - 1, -1, -1):
            target_date = now - timedelta(days=i)
            day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            tanggal = target_date.strftime("%Y-%m-%d")

            # Count entries for this day
            try:
                entry_result = (
                    self.db.table("parking_sessions")
                    .select("id", count="exact")
                    .gte("waktu_masuk", day_start.isoformat())
                    .lte("waktu_masuk", day_end.isoformat())
                    .execute()
                )
                total_masuk = entry_result.count or 0
            except Exception:
                total_masuk = 0

            # Count exits for this day
            try:
                exit_result = (
                    self.db.table("parking_sessions")
                    .select("id", count="exact")
                    .eq("status", ParkingStatus.COMPLETED.value)
                    .gte("waktu_keluar", day_start.isoformat())
                    .lte("waktu_keluar", day_end.isoformat())
                    .execute()
                )
                total_keluar = exit_result.count or 0
            except Exception:
                total_keluar = 0

            # Average duration for this day
            try:
                dur_result = (
                    self.db.table("parking_sessions")
                    .select("durasi_menit")
                    .eq("status", ParkingStatus.COMPLETED.value)
                    .gte("waktu_keluar", day_start.isoformat())
                    .lte("waktu_keluar", day_end.isoformat())
                    .execute()
                )
                durations = [s["durasi_menit"] for s in (dur_result.data or []) if s.get("durasi_menit")]
                rata_rata = round(sum(durations) / len(durations), 2) if durations else None
            except Exception:
                rata_rata = None

            daily_stats.append({
                "tanggal": tanggal,
                "total_masuk": total_masuk,
                "total_keluar": total_keluar,
                "rata_rata_durasi": rata_rata,
            })

        return daily_stats

    async def get_hourly_stats(self, date: Optional[str] = None) -> list[dict]:
        """Get hourly parking distribution for a specific date."""
        if date:
            try:
                target = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                target = datetime.now(timezone.utc)
        else:
            target = datetime.now(timezone.utc)

        day_start = target.replace(hour=0, minute=0, second=0, microsecond=0)

        # Fetch all sessions for the day
        try:
            result = (
                self.db.table("parking_sessions")
                .select("waktu_masuk, waktu_keluar, status")
                .gte("waktu_masuk", day_start.isoformat())
                .lte("waktu_masuk", (day_start + timedelta(days=1)).isoformat())
                .execute()
            )
            sessions = result.data or []
        except Exception as e:
            logger.error(f"Error fetching hourly stats: {e}")
            sessions = []

        # Build hourly breakdown
        hourly = []
        for hour in range(24):
            masuk = 0
            keluar = 0

            for session in sessions:
                try:
                    entry_time = datetime.fromisoformat(
                        session["waktu_masuk"].replace("Z", "+00:00")
                    )
                    if entry_time.hour == hour:
                        masuk += 1
                except Exception:
                    pass

                if session.get("waktu_keluar"):
                    try:
                        exit_time = datetime.fromisoformat(
                            session["waktu_keluar"].replace("Z", "+00:00")
                        )
                        if exit_time.hour == hour:
                            keluar += 1
                    except Exception:
                        pass

            hourly.append({
                "jam": hour,
                "total_masuk": masuk,
                "total_keluar": keluar,
            })

        return hourly

    async def get_student_stats(self, user_id: str) -> dict:
        """Get personal parking statistics for a student."""
        try:
            # Get all sessions for user's vehicles
            result = (
                self.db.table("parking_sessions")
                .select("*, vehicles!inner(user_id)")
                .eq("vehicles.user_id", user_id)
                .execute()
            )
            sessions = result.data or []
        except Exception as e:
            logger.error(f"Error fetching student stats: {e}")
            sessions = []

        total_sessions = len(sessions)
        completed = [s for s in sessions if s.get("status") == ParkingStatus.COMPLETED.value]
        active = [s for s in sessions if s.get("status") == ParkingStatus.PARKED.value]

        # Total duration
        durations = [s["durasi_menit"] for s in completed if s.get("durasi_menit")]
        total_durasi = sum(durations) if durations else 0
        rata_rata = round(total_durasi / len(durations), 2) if durations else 0

        # Most recent session
        recent = None
        if sessions:
            sorted_sessions = sorted(
                sessions, key=lambda s: s.get("waktu_masuk", ""), reverse=True
            )
            latest = sorted_sessions[0]
            recent = {
                "session_id": latest["id"],
                "waktu_masuk": latest["waktu_masuk"],
                "waktu_keluar": latest.get("waktu_keluar"),
                "status": latest["status"],
            }

        # Count by month (last 6 months)
        now = datetime.now(timezone.utc)
        monthly = {}
        for s in sessions:
            try:
                entry = datetime.fromisoformat(
                    s["waktu_masuk"].replace("Z", "+00:00")
                )
                if (now - entry).days <= 180:
                    month_key = entry.strftime("%Y-%m")
                    monthly[month_key] = monthly.get(month_key, 0) + 1
            except Exception:
                pass

        return {
            "total_sessions": total_sessions,
            "total_completed": len(completed),
            "currently_parked": len(active),
            "total_durasi_menit": round(total_durasi, 2),
            "rata_rata_durasi_menit": rata_rata,
            "sesi_terakhir": recent,
            "monthly_breakdown": monthly,
        }
