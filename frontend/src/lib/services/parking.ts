import api from "@/lib/api";
import type { APIResponse, PaginatedResponse, ParkingSession } from "@/types";

export const parkingApi = {
  scan: async (qr_token: string, gate?: string): Promise<APIResponse> => {
    const res = await api.post<APIResponse>("/parking/scan", { qr_token, gate });
    return res.data;
  },

  getActive: async (search?: string): Promise<APIResponse<ParkingSession[]>> => {
    const res = await api.get<APIResponse<ParkingSession[]>>("/parking/active", { params: { search } });
    return res.data;
  },

  getHistory: async (params: {
    page?: number;
    page_size?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<ParkingSession>> => {
    const res = await api.get<PaginatedResponse<ParkingSession>>("/parking/history", { params });
    return res.data;
  },

  getSession: async (sessionId: string): Promise<APIResponse<ParkingSession>> => {
    const res = await api.get<APIResponse<ParkingSession>>(`/parking/sessions/${sessionId}`);
    return res.data;
  },
};
