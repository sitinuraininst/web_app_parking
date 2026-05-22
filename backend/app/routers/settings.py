from fastapi import APIRouter, Depends
from app.dependencies import SuperAdminUser, SupabaseDep
from app.models.settings import SystemSettings, SystemSettingsUpdate
from app.services.settings_service import SettingsService
from app.models.common import APIResponse

router = APIRouter(prefix="/system-settings", tags=["Settings"])

@router.get("", response_model=APIResponse[SystemSettings])
async def get_settings(
    db: SupabaseDep,
    current_admin: SuperAdminUser,
):
    service = SettingsService(db)
    settings = service.get_settings()
    return APIResponse(data=settings)

@router.patch("", response_model=APIResponse[SystemSettings])
async def update_settings(
    request: SystemSettingsUpdate,
    db: SupabaseDep,
    current_admin: SuperAdminUser,
):
    service = SettingsService(db)
    updated_settings = service.update_settings(request)
    return APIResponse(
        data=updated_settings,
        message="System settings updated successfully"
    )
