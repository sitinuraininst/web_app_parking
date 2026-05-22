import api from "@/lib/api";
import type { APIResponse } from "@/types";

export interface SystemSettings {
  maintenance_mode: boolean;
  max_parking_capacity: number;
  auto_suspend_admins: boolean;
  scan_cooldown_seconds: number;
}

export const settingsApi = {
  getSettings: async (): Promise<SystemSettings> => {
    const response = await api.get<APIResponse<SystemSettings>>("/system-settings");
    return response.data.data;
  },

  updateSettings: async (data: SystemSettings): Promise<SystemSettings> => {
    const response = await api.patch<APIResponse<SystemSettings>>("/system-settings", data);
    return response.data.data;
  },
};
