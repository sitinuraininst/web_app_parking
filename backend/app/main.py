"""
Smart Parking UMSU — FastAPI Application Entry Point

Main application file that configures middleware, exception handlers,
mounts routers, and manages application lifecycle.
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.exceptions import SmartParkingException
from app.core.logging import set_correlation_id, setup_logging
from app.database import verify_supabase_connection
from app.models.common import ErrorResponse, HealthCheckResponse

from app.routers import auth, qr_codes, vehicles, parking, admin_management, uploads, settings as settings_router, websocket, statistics

logger = logging.getLogger(__name__)


# ── Application Lifecycle ──────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ────────────────────────────────────────
    setup_logging()
    logger.info("=" * 60)
    logger.info(f"  {settings.app_name} v{settings.app_version}")
    logger.info(f"  Environment: {settings.app_env}")
    logger.info("=" * 60)

    # Verify Supabase connectivity
    db_connected = await verify_supabase_connection()
    if db_connected:
        logger.info("[OK] Database connection verified")
    else:
        logger.warning("[FAIL] Database connection failed - some features may not work")

    logger.info(f"[OK] CORS origins: {settings.cors_origins}")
    logger.info(f"[OK] Max parking capacity: {settings.max_parking_capacity}")
    logger.info(f"[OK] Scan cooldown: {settings.scan_cooldown_seconds}s")
    logger.info("[OK] Application started successfully")
    logger.info("-" * 60)

    yield

    # ── Shutdown ───────────────────────────────────────
    logger.info("Application shutting down...")


# ── Create FastAPI App ─────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    description=(
        "Sistem parkir cerdas berbasis QR Code untuk lingkungan kampus "
        "Universitas Muhammadiyah Sumatera Utara (UMSU). "
        "Mendukung registrasi kendaraan, QR Code permanen, "
        "monitoring realtime, dan dashboard admin."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── Middleware ─────────────────────────────────────────────

# CORS
# Development vs Production handling:
# Dev: allow_origins=["*"] must be paired with allow_credentials=False
# Prod: strict origins with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.is_production,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging & correlation ID middleware
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Add correlation ID, log requests, and measure response time."""
    # Set correlation ID
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4())[:8])
    set_correlation_id(correlation_id)

    # Start timer
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000

    # Log request (skip health checks to reduce noise)
    if request.url.path != "/api/health":
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} "
            f"({duration_ms:.1f}ms)"
        )

    # Add headers
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Response-Time"] = f"{duration_ms:.1f}ms"

    return response


# ── Exception Handlers ─────────────────────────────────────

@app.exception_handler(SmartParkingException)
async def smart_parking_exception_handler(
    request: Request, exc: SmartParkingException
):
    """Handle all custom Smart Parking exceptions."""
    logger.warning(
        f"SmartParkingException: {exc.error_code} - {exc.detail} "
        f"(path={request.url.path})"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            message=exc.detail,
            error_code=exc.error_code,
            detail=exc.extra if exc.extra else None,
        ).model_dump(mode="json"),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """Handle Pydantic validation errors with user-friendly messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({"field": field, "message": error["msg"]})

    logger.warning(f"Validation error on {request.url.path}: {errors}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            message="Data yang dikirim tidak valid.",
            error_code="VALIDATION_ERROR",
            detail={"errors": errors},
        ).model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected exceptions."""
    logger.error(
        f"Unhandled exception on {request.url.path}: {type(exc).__name__}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            message="Terjadi kesalahan internal server.",
            error_code="INTERNAL_ERROR",
        ).model_dump(mode="json"),
    )


# ── Mount Routers ──────────────────────────────────────────

API_PREFIX = "/api"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(vehicles.router, prefix=API_PREFIX)
app.include_router(qr_codes.router, prefix=API_PREFIX)
app.include_router(parking.router, prefix=API_PREFIX)
app.include_router(statistics.router, prefix=API_PREFIX)
app.include_router(admin_management.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)
app.include_router(settings_router.router, prefix=API_PREFIX)
app.include_router(websocket.router, prefix=API_PREFIX)


# ── Health Check ───────────────────────────────────────────

@app.get(
    "/api/health",
    response_model=HealthCheckResponse,
    tags=["System"],
    summary="Health check",
    description="Verifikasi status aplikasi dan koneksi database.",
)
async def health_check():
    """Application health check endpoint."""
    db_connected = await verify_supabase_connection()

    return HealthCheckResponse(
        status="healthy" if db_connected else "degraded",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        database_connected=db_connected,
    )


# ── Root Redirect ─────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health",
    }
