import json
import time
from typing import Dict, Any
from supabase import Client
from app.config import settings
from app.models.settings import SystemSettings, SystemSettingsUpdate

_settings_cache_time = 0
_settings_cache_value = None
CACHE_TTL_SECONDS = 15

DEFAULT_SETTINGS = {
    "maintenance_mode": "false",
    "max_parking_capacity": str(settings.max_parking_capacity),
    "auto_suspend_admins": "false",
    "scan_cooldown_seconds": str(settings.scan_cooldown_seconds),
}

class SettingsService:
    def __init__(self, db: Client):
        self.db = db

    def get_settings(self) -> SystemSettings:
        global _settings_cache_time, _settings_cache_value
        
        current_time = time.time()
        if _settings_cache_value and (current_time - _settings_cache_time < CACHE_TTL_SECONDS):
            return _settings_cache_value

        # Fetch all settings
        response = self.db.table("parking_config").select("key, value").execute()
        rows = response.data

        # Map to dictionary
        settings_dict: Dict[str, str] = {row["key"]: row["value"] for row in rows}

        # Check for missing defaults and insert them
        missing_keys = []
        for key, default_val in DEFAULT_SETTINGS.items():
            if key not in settings_dict:
                missing_keys.append({"key": key, "value": default_val})
                settings_dict[key] = default_val
        
        if missing_keys:
            self.db.table("parking_config").upsert(missing_keys, on_conflict="key").execute()

        # Parse string values to their respective types
        settings_obj = SystemSettings(
            maintenance_mode=(settings_dict.get("maintenance_mode", "false").lower() == "true"),
            max_parking_capacity=int(settings_dict.get("max_parking_capacity", "500")),
            auto_suspend_admins=(settings_dict.get("auto_suspend_admins", "false").lower() == "true"),
            scan_cooldown_seconds=int(settings_dict.get("scan_cooldown_seconds", "30")),
        )
        
        _settings_cache_value = settings_obj
        _settings_cache_time = current_time
        return settings_obj

    def update_settings(self, data: SystemSettingsUpdate) -> SystemSettings:
        global _settings_cache_time
        # Convert incoming model to list of dictionaries for upsert
        upsert_data = [
            {"key": "maintenance_mode", "value": "true" if data.maintenance_mode else "false"},
            {"key": "max_parking_capacity", "value": str(data.max_parking_capacity)},
            {"key": "auto_suspend_admins", "value": "true" if data.auto_suspend_admins else "false"},
            {"key": "scan_cooldown_seconds", "value": str(data.scan_cooldown_seconds)},
        ]
        
        # Upsert
        self.db.table("parking_config").upsert(upsert_data, on_conflict="key").execute()
        
        # Force cache refresh
        _settings_cache_time = 0
        
        # Return updated settings
        return self.get_settings()

    def is_maintenance_mode_active(self) -> bool:
        """Helper for middleware/auth checks. Uses cached settings."""
        settings = self.get_settings()
        return settings.maintenance_mode
