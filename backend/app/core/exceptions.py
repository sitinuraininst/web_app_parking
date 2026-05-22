"""
Smart Parking UMSU — Custom Exceptions

Hierarchical exception classes mapped to HTTP status codes.
These are caught by the global exception handler in main.py
and converted to consistent JSON error responses.
"""

from typing import Any, Optional


class SmartParkingException(Exception):
    """Base exception for all Smart Parking errors."""

    status_code: int = 500
    detail: str = "Terjadi kesalahan internal."
    error_code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        detail: Optional[str] = None,
        error_code: Optional[str] = None,
        extra: Optional[dict[str, Any]] = None,
    ):
        self.detail = detail or self.__class__.detail
        self.error_code = error_code or self.__class__.error_code
        self.extra = extra or {}
        super().__init__(self.detail)


class AuthenticationError(SmartParkingException):
    """Raised when authentication fails (invalid credentials, expired token)."""

    status_code = 401
    detail = "Autentikasi gagal."
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(SmartParkingException):
    """Raised when user lacks permission for the requested action."""

    status_code = 403
    detail = "Anda tidak memiliki akses untuk resource ini."
    error_code = "AUTHORIZATION_ERROR"


class NotFoundError(SmartParkingException):
    """Raised when a requested resource does not exist."""

    status_code = 404
    detail = "Resource tidak ditemukan."
    error_code = "NOT_FOUND"


class ValidationError(SmartParkingException):
    """Raised when input data fails validation."""

    status_code = 422
    detail = "Data tidak valid."
    error_code = "VALIDATION_ERROR"


class DuplicateEntryError(SmartParkingException):
    """Raised when attempting to create a duplicate record."""

    status_code = 409
    detail = "Data sudah terdaftar."
    error_code = "DUPLICATE_ENTRY"


class CooldownActiveError(SmartParkingException):
    """Raised when a scan is attempted within the cooldown period."""

    status_code = 429
    detail = "Terlalu cepat. Tunggu beberapa saat sebelum scan lagi."
    error_code = "COOLDOWN_ACTIVE"

    def __init__(
        self,
        remaining_seconds: int = 0,
        detail: Optional[str] = None,
    ):
        self.remaining_seconds = remaining_seconds
        super().__init__(
            detail=detail or f"Cooldown aktif. Tunggu {remaining_seconds} detik.",
            extra={"remaining_seconds": remaining_seconds},
        )


class StorageError(SmartParkingException):
    """Raised when file storage operations fail."""

    status_code = 500
    detail = "Gagal memproses file."
    error_code = "STORAGE_ERROR"


class ParkingFullError(SmartParkingException):
    """Raised when parking lot has reached maximum capacity."""

    status_code = 409
    detail = "Parkiran sudah penuh."
    error_code = "PARKING_FULL"


class VehicleAlreadyParkedError(SmartParkingException):
    """Raised when a vehicle is already in the parking lot."""

    status_code = 409
    detail = "Kendaraan sudah berada di dalam parkiran."
    error_code = "ALREADY_PARKED"


class VehicleNotParkedError(SmartParkingException):
    """Raised when trying to exit a vehicle that is not parked."""

    status_code = 409
    detail = "Kendaraan tidak sedang parkir."
    error_code = "NOT_PARKED"
