"""
Smart Parking UMSU — Logging Configuration

Structured JSON logging with correlation IDs for request tracing.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Optional

from pythonjsonlogger import json as jsonlogger

from app.config import settings

# ── Correlation ID ─────────────────────────────────────────
# Stored per-request via contextvars for async safety

correlation_id_var: ContextVar[Optional[str]] = ContextVar(
    "correlation_id", default=None
)


def get_correlation_id() -> str:
    """Get the current request's correlation ID, or generate one."""
    cid = correlation_id_var.get()
    if cid is None:
        cid = str(uuid.uuid4())[:8]
        correlation_id_var.set(cid)
    return cid


def set_correlation_id(cid: Optional[str] = None) -> str:
    """Set a correlation ID for the current request context."""
    if cid is None:
        cid = str(uuid.uuid4())[:8]
    correlation_id_var.set(cid)
    return cid


# ── Custom JSON Formatter ─────────────────────────────────

class SmartParkingFormatter(jsonlogger.JsonFormatter):
    """Custom JSON log formatter that includes correlation ID and app metadata."""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # Add standard fields
        log_record["timestamp"] = record.created
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["app"] = settings.app_name
        log_record["env"] = settings.app_env

        # Add correlation ID if available
        cid = correlation_id_var.get()
        if cid:
            log_record["correlation_id"] = cid

        # Remove default fields we've renamed
        log_record.pop("levelname", None)
        log_record.pop("name", None)


# ── Setup Function ─────────────────────────────────────────

def setup_logging() -> None:
    """
    Configure application-wide logging.

    - JSON format for production
    - Human-readable format for development
    - Sets log level based on DEBUG setting
    """
    log_level = logging.DEBUG if settings.debug else logging.INFO

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Create handler with explicit UTF-8 encoding for Windows compatibility
    import io
    utf8_stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    handler = logging.StreamHandler(utf8_stdout)
    handler.setLevel(log_level)

    if settings.is_production:
        # JSON format for production (structured logging)
        formatter = SmartParkingFormatter(
            fmt="%(timestamp)s %(level)s %(logger)s %(message)s"
        )
    else:
        # Human-readable format for development
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
            datefmt="%H:%M:%S",
        )

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("hpack").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("websockets").setLevel(logging.INFO)

    logging.getLogger(__name__).info(
        f"Logging initialized — level={logging.getLevelName(log_level)}, "
        f"env={settings.app_env}"
    )
