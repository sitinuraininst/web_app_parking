from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies import CurrentUser, SupabaseDep
from app.models.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UpdateProfileRequest,
    UserProfile,
)
from app.models.common import APIResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Login (Form — used by Swagger Authorize) ───────────────

@router.post(
    "/login",
    summary="Login (Swagger OAuth2)",
    description=(
        "OAuth2-compatible login. Swagger Authorize popup uses this endpoint. "
        "Field 'username' = email address."
    ),
)
async def login_form(
    db: SupabaseDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Authenticate via form-data (Swagger Authorize compatibility)."""
    service = AuthService(db)
    result = await service.login(
        email=form_data.username,
        password=form_data.password,
    )
    # Return flat OAuth2 format so Swagger can parse access_token directly
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
    }


# ── Login (JSON — used by Frontend) ───────────────────────

@router.post(
    "/login/json",
    response_model=APIResponse[LoginResponse],
    summary="Login (JSON body)",
    description="Login dengan JSON body. Digunakan oleh frontend Next.js.",
)
async def login_json(request: LoginRequest, db: SupabaseDep):
    """Authenticate via JSON body (frontend usage)."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"DEBUG [backend route] Received JSON login payload: {request.model_dump()}")

    service = AuthService(db)
    result = await service.login(
        email=request.email,
        password=request.password,
    )
    return APIResponse(
        message="Login berhasil.",
        data=result,
    )


# ── Register ───────────────────────────────────────────────

@router.post(
    "/register",
    response_model=APIResponse[RegisterResponse],
    status_code=201,
    summary="Registrasi mahasiswa baru",
    description="Mendaftarkan akun mahasiswa baru dengan email, NPM, dan data profil.",
)
async def register(request: RegisterRequest, db: SupabaseDep):
    """Register a new student account."""
    service = AuthService(db)
    result = await service.register_student(
        email=request.email,
        password=request.password,
        nama_lengkap=request.nama_lengkap,
        npm=request.npm,
        phone=request.phone,
        prodi=request.prodi,
    )
    return APIResponse(
        message="Registrasi berhasil.",
        data=result,
    )


# ── Profile ────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=APIResponse[UserProfile],
    summary="Ambil profil user saat ini",
)
async def get_profile(current_user: CurrentUser, db: SupabaseDep):
    """Get the current user's profile."""
    service = AuthService(db)
    profile = await service.get_user_profile(current_user["id"])
    return APIResponse(
        message="Profil berhasil diambil.",
        data=profile,
    )


@router.patch(
    "/me",
    response_model=APIResponse[UserProfile],
    summary="Update profil user",
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Update the current user's profile."""
    service = AuthService(db)
    updates = request.model_dump(exclude_none=True)
    profile = await service.update_profile(current_user["id"], updates)
    return APIResponse(
        message="Profil berhasil diupdate.",
        data=profile,
    )


@router.post(
    "/change-password",
    response_model=APIResponse,
    summary="Ganti password",
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: CurrentUser,
    db: SupabaseDep,
):
    """Change the current user's password."""
    service = AuthService(db)
    await service.change_password(
        user_id=current_user["id"],
        current_password=request.current_password,
        new_password=request.new_password,
    )
    return APIResponse(message="Password berhasil diubah.")
