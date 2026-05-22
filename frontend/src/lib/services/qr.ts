import api from "@/lib/api";
import type { APIResponse, QRCode, QRCodeImage } from "@/types";

export const qrApi = {
  generate: async (vehicleId: string): Promise<APIResponse<QRCode>> => {
    const res = await api.post<APIResponse<QRCode>>(`/qr-codes/generate/${vehicleId}`);
    return res.data;
  },

  get: async (vehicleId: string): Promise<APIResponse<QRCode>> => {
    const res = await api.get<APIResponse<QRCode>>(`/qr-codes/vehicle/${vehicleId}`);
    return res.data;
  },

  getImage: async (vehicleId: string): Promise<APIResponse<QRCodeImage>> => {
    const res = await api.get<APIResponse<QRCodeImage>>(`/qr-codes/vehicle/${vehicleId}/image`);
    return res.data;
  },

  listMine: async (): Promise<APIResponse<QRCode[]>> => {
    const res = await api.get<APIResponse<QRCode[]>>("/qr-codes/me");
    return res.data;
  },
};
