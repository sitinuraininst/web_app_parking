import api from "@/lib/api";
import type { APIResponse } from "@/types";

export const uploadApi = {
  uploadStnk: async (vehicleId: string, file: File): Promise<APIResponse<{ file_url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<APIResponse<{ file_url: string }>>(`/uploads/stnk/${vehicleId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  uploadPhoto: async (vehicleId: string, file: File): Promise<APIResponse<{ file_url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<APIResponse<{ file_url: string }>>(`/uploads/foto-kendaraan/${vehicleId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getDocuments: async (vehicleId: string): Promise<APIResponse<Record<string, unknown>[]>> => {
    const res = await api.get<APIResponse<Record<string, unknown>[]>>(`/uploads/vehicle/${vehicleId}`);
    return res.data;
  },
};
