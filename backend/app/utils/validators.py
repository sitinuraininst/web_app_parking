"""
Smart Parking UMSU — Input Validators

Reusable validation functions for user input, file uploads, and data formatting.
"""

import re
from typing import Optional

from fastapi import UploadFile

from app.config import settings


# ── Plate Number Validation ────────────────────────────────

# Indonesian plate number pattern: 1-2 letters, 1-4 digits, 0-3 letters
# Examples: BK 1234 ABC, B 1 A, BK 5678 XY
PLATE_NUMBER_PATTERN = re.compile(
    r"^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$",
    re.IGNORECASE,
)


def validate_plate_number(plat_nomor: str) -> bool:
    """
    Validate Indonesian vehicle plate number format.

    Args:
        plat_nomor: The plate number string to validate.

    Returns:
        True if the format is valid.
    """
    cleaned = plat_nomor.strip().upper()
    return bool(PLATE_NUMBER_PATTERN.match(cleaned))


def normalize_plate_number(plat_nomor: str) -> str:
    """
    Normalize plate number to uppercase with consistent spacing.

    Examples:
        'bk 1234 abc' -> 'BK 1234 ABC'
        'BK1234ABC' -> 'BK 1234 ABC'
    """
    cleaned = plat_nomor.strip().upper()
    # Remove all spaces, then re-insert them
    no_spaces = cleaned.replace(" ", "")

    # Split into parts: letters, digits, letters
    match = re.match(r"^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$", no_spaces)
    if match:
        prefix, number, suffix = match.groups()
        parts = [prefix, number]
        if suffix:
            parts.append(suffix)
        return " ".join(parts)

    return cleaned


# ── Email Validation ───────────────────────────────────────

EMAIL_PATTERN = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)


def validate_email(email: str) -> bool:
    """Validate email format."""
    return bool(EMAIL_PATTERN.match(email.strip()))


# ── NPM Validation ────────────────────────────────────────

NPM_PATTERN = re.compile(r"^\d{6,15}$")


def validate_npm(npm: str) -> bool:
    """
    Validate NPM (Nomor Pokok Mahasiswa) format.

    NPM should be 6-15 digits.
    """
    return bool(NPM_PATTERN.match(npm.strip()))


# ── File Upload Validation ─────────────────────────────────

def validate_upload_file(
    file: UploadFile,
    allowed_types: Optional[list[str]] = None,
    max_size_bytes: Optional[int] = None,
) -> tuple[bool, Optional[str]]:
    """
    Validate an uploaded file's type and size.

    Args:
        file: The uploaded file.
        allowed_types: List of allowed MIME types.
        max_size_bytes: Maximum file size in bytes.

    Returns:
        Tuple of (is_valid, error_message).
    """
    if allowed_types is None:
        allowed_types = settings.upload_file_types

    if max_size_bytes is None:
        max_size_bytes = settings.max_upload_size_bytes

    # Check MIME type
    if file.content_type not in allowed_types:
        allowed_str = ", ".join(allowed_types)
        return False, (
            f"Tipe file '{file.content_type}' tidak diizinkan. "
            f"Tipe yang diterima: {allowed_str}"
        )

    # Check file size (if size is available)
    if file.size and file.size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        return False, f"Ukuran file melebihi batas maksimum {max_mb:.0f}MB."

    return True, None


# ── Password Strength ─────────────────────────────────────

def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password meets minimum security requirements.

    Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit

    Returns:
        Tuple of (is_valid, error_message).
    """
    if len(password) < 8:
        return False, "Password minimal 8 karakter."

    if not re.search(r"[A-Z]", password):
        return False, "Password harus mengandung huruf besar."

    if not re.search(r"[a-z]", password):
        return False, "Password harus mengandung huruf kecil."

    if not re.search(r"\d", password):
        return False, "Password harus mengandung angka."

    return True, None


# ── General Sanitization ──────────────────────────────────

def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize a string input by stripping whitespace and limiting length."""
    return value.strip()[:max_length]
