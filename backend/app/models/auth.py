"""
Smart Parking UMSU — Authentication Schemas

Pydantic models for login, registration, and token-related operations.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.constants import UserRole


# ── Login ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login request body."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    """Login response with JWT token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: "UserProfile"


# ── Registration ───────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Student registration request body."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    nama_lengkap: str = Field(..., min_length=2, max_length=255)
    npm: str = Field(..., min_length=6, max_length=20)
    phone: Optional[str] = Field(None, max_length=20)
    prodi: Optional[str] = Field(None, max_length=100)

    @field_validator("npm")
    @classmethod
    def validate_npm_format(cls, v: str) -> str:
        """Ensure NPM contains only digits."""
        if not v.strip().isdigit():
            raise ValueError("NPM harus berupa angka.")
        return v.strip()

    @field_validator("nama_lengkap")
    @classmethod
    def validate_nama(cls, v: str) -> str:
        """Strip and validate name."""
        return v.strip()


class RegisterResponse(BaseModel):
    """Registration response."""

    user_id: str
    email: str
    nama_lengkap: str
    npm: str
    message: str = "Registrasi berhasil."


# ── User Profile ──────────────────────────────────────────

class UserProfile(BaseModel):
    """User profile data (returned in responses)."""

    id: str
    email: str
    nama_lengkap: str
    npm: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    prodi: Optional[str] = None
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    """Update user profile request."""

    nama_lengkap: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    prodi: Optional[str] = Field(None, max_length=100)


class ChangePasswordRequest(BaseModel):
    """Change password request."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


# ── Token ──────────────────────────────────────────────────

class TokenPayload(BaseModel):
    """JWT token payload structure."""

    sub: str  # user ID
    role: UserRole
    email: str
    exp: datetime
    iat: datetime
