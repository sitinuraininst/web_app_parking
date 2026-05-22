"""
Smart Parking UMSU — Common Response Schemas

Shared Pydantic models for API responses, pagination, and error formatting.
"""

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ── Standard API Response ──────────────────────────────────

class APIResponse(BaseModel, Generic[T]):
    """Standard wrapper for all API responses."""

    success: bool = True
    message: str = "Berhasil"
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseModel):
    """Standard error response format."""

    success: bool = False
    message: str
    error_code: str
    detail: Optional[dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)


# ── Pagination ─────────────────────────────────────────────

class PaginationMeta(BaseModel):
    """Pagination metadata."""

    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_previous: bool = False


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    success: bool = True
    message: str = "Berhasil"
    data: list[T] = []
    pagination: PaginationMeta = PaginationMeta()
    timestamp: datetime = Field(default_factory=datetime.now)


# ── Health Check ───────────────────────────────────────────

class HealthCheckResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    app_name: str
    version: str
    environment: str
    database_connected: bool
    timestamp: datetime = Field(default_factory=datetime.now)
