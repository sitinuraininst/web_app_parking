from pydantic import BaseModel, Field


class SystemSettings(BaseModel):
    maintenance_mode: bool = Field(default=False)
    max_parking_capacity: int = Field(default=500, ge=1)
    auto_suspend_admins: bool = Field(default=False)
    scan_cooldown_seconds: int = Field(default=30, ge=0)


class SystemSettingsUpdate(BaseModel):
    maintenance_mode: bool
    max_parking_capacity: int = Field(..., ge=1)
    auto_suspend_admins: bool
    scan_cooldown_seconds: int = Field(..., ge=0)
