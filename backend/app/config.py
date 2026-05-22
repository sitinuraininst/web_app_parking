"""
Smart Parking UMSU — Application Configuration

Loads environment variables and provides typed settings via Pydantic BaseSettings.
"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Supabase ───────────────────────────────────────────
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str = ""

    # ── JWT Authentication ─────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours

    # ── Application ────────────────────────────────────────
    app_name: str = "Smart Parking UMSU"
    app_version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = True

    # ── CORS ───────────────────────────────────────────────
    # In production, this should be a comma-separated list of exact domains.
    # In development, CORS is overridden to allow all origins ("*") for ngrok/mobile testing.
    allowed_origins: str = "http://localhost:3000,http://192.168.1.9:3000"

    # ── Parking ────────────────────────────────────────────
    scan_cooldown_seconds: int = 30
    max_parking_capacity: int = 500

    # ── File Upload ────────────────────────────────────────
    max_upload_size_mb: int = 5
    allowed_file_types: str = "image/jpeg,image/png,image/webp"

    # ── Server ─────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS comma-separated string into a list.
        In development mode, we return ["*"] to support flexible ngrok/LAN testing.
        """
        if not self.is_production:
            return ["*"]
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def upload_file_types(self) -> List[str]:
        """Parse ALLOWED_FILE_TYPES comma-separated string into a list."""
        return [ft.strip() for ft in self.allowed_file_types.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


# Singleton instance
settings = Settings()
