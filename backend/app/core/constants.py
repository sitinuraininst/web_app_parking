"""
Smart Parking UMSU — Constants & Enums

Centralized constants, enum definitions, and magic values
used throughout the application.
"""

from enum import Enum


# ── User Roles ─────────────────────────────────────────────

class UserRole(str, Enum):
    """User role types."""
    STUDENT = "student"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


# ── Vehicle Types ──────────────────────────────────────────

class VehicleType(str, Enum):
    """Vehicle classification."""
    MOTOR = "motor"
    MOBIL = "mobil"


# ── Vehicle Status ─────────────────────────────────────────

class VehicleStatus(str, Enum):
    """Vehicle registration status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


# ── Parking Status ─────────────────────────────────────────

class ParkingStatus(str, Enum):
    """Parking session status."""
    PARKED = "PARKED"
    COMPLETED = "COMPLETED"


# ── Document Types ─────────────────────────────────────────

class DocumentType(str, Enum):
    """Uploaded document types."""
    STNK = "stnk"
    FOTO_KENDARAAN = "foto_kendaraan"


# ── Log Actions ────────────────────────────────────────────

class LogAction(str, Enum):
    """Activity log action types."""
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    REGISTER = "REGISTER"
    VEHICLE_REGISTERED = "VEHICLE_REGISTERED"
    VEHICLE_UPDATED = "VEHICLE_UPDATED"
    VEHICLE_DELETED = "VEHICLE_DELETED"
    VEHICLE_HARD_DELETED = "VEHICLE_HARD_DELETED"
    QR_GENERATED = "QR_GENERATED"
    PARKING_ENTRY = "PARKING_ENTRY"
    PARKING_EXIT = "PARKING_EXIT"
    SCAN_REJECTED = "SCAN_REJECTED"
    UPLOAD_STNK = "UPLOAD_STNK"
    UPLOAD_FOTO = "UPLOAD_FOTO"
    ADMIN_CREATED = "ADMIN_CREATED"
    ADMIN_UPDATED = "ADMIN_UPDATED"
    ADMIN_DELETED = "ADMIN_DELETED"
    ADMIN_DEACTIVATED = "ADMIN_DEACTIVATED"
    ADMIN_ACTIVATED = "ADMIN_ACTIVATED"
    LOGS_CLEARED = "LOGS_CLEARED"


# ── WebSocket Event Types ─────────────────────────────────

class WSEventType(str, Enum):
    """WebSocket event types for realtime updates."""
    PARKING_ENTRY = "parking:entry"
    PARKING_EXIT = "parking:exit"
    STATS_UPDATE = "stats:update"
    CONNECTION_ACK = "connection:ack"
    ERROR = "error"


# ── Storage Buckets ────────────────────────────────────────

STORAGE_BUCKET_VEHICLES = "vehicle-documents"

# ── QR Code ────────────────────────────────────────────────

QR_CODE_VERSION = 1
QR_CODE_BOX_SIZE = 10
QR_CODE_BORDER = 4

# ── Parking Gates ──────────────────────────────────────────

DEFAULT_GATE_MASUK = "GATE-MASUK-1"
DEFAULT_GATE_KELUAR = "GATE-KELUAR-1"

# ── Pagination Defaults ───────────────────────────────────

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
