import api from "@/lib/api";
import type {
  APIResponse,
  ParkingStatistics,
  DailyStatItem,
  HourlyStatItem,
} from "@/types";

export const statisticsApi = {
  /** Get today's parking overview stats (admin/super_admin) */
  getOverview: async (): Promise<APIResponse<ParkingStatistics>> => {
    const res = await api.get<APIResponse<ParkingStatistics>>(
      "/statistics/overview"
    );
    return res.data;
  },

  /** Get daily parking statistics */
  getDaily: async (
    days: number = 7
  ): Promise<APIResponse<DailyStatItem[]>> => {
    const res = await api.get<APIResponse<DailyStatItem[]>>(
      "/statistics/daily",
      { params: { days } }
    );
    return res.data;
  },

  /** Get hourly distribution */
  getHourly: async (
    date?: string
  ): Promise<APIResponse<HourlyStatItem[]>> => {
    const res = await api.get<APIResponse<HourlyStatItem[]>>(
      "/statistics/hourly",
      { params: { date } }
    );
    return res.data;
  },

  /** Get personal stats (student) */
  getMyStats: async (): Promise<APIResponse<Record<string, unknown>>> => {
    const res = await api.get<APIResponse<Record<string, unknown>>>(
      "/statistics/me"
    );
    return res.data;
  },
};
