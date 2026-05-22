import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  vehicle_id: string | null;
  action: string;
  detail: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  user?: {
    nama_lengkap: string;
    email: string;
  } | null;
}

export const logsApi = {
  /** Fetch system activity logs (Super Admin only) */
  getLogs: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<PaginatedResponse<ActivityLog>> => {
    const res = await api.get<PaginatedResponse<ActivityLog>>("/admin/logs", {
      params,
    });
    return res.data;
  },

  /** Clear all system activity logs (Super Admin only) */
  clearLogs: async (password: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>("/admin/logs", {
      data: { password },
    });
    return res.data;
  },
};
