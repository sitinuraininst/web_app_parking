import api from "@/lib/api";
import type { APIResponse, Vehicle, VehicleRegisterRequest, VehicleWithOwnerDetail, PaginatedResponse } from "@/types";

export const vehicleApi = {
  register: async (data: VehicleRegisterRequest): Promise<APIResponse<Vehicle>> => {
    const res = await api.post<APIResponse<Vehicle>>("/vehicles", data);
    return res.data;
  },

  listMine: async (): Promise<APIResponse<Vehicle[]>> => {
    const res = await api.get<APIResponse<Vehicle[]>>("/vehicles/me");
    return res.data;
  },

  get: async (vehicleId: string): Promise<APIResponse<Vehicle>> => {
    const res = await api.get<APIResponse<Vehicle>>(`/vehicles/${vehicleId}`);
    return res.data;
  },

  update: async (vehicleId: string, data: Partial<VehicleRegisterRequest>): Promise<APIResponse<Vehicle>> => {
    const res = await api.patch<APIResponse<Vehicle>>(`/vehicles/${vehicleId}`, data);
    return res.data;
  },

  delete: async (vehicleId: string): Promise<APIResponse> => {
    const res = await api.delete<APIResponse>(`/vehicles/${vehicleId}`);
    return res.data;
  },

  listAll: async (params: { page?: number; page_size?: number; search?: string; jenis?: string }): Promise<PaginatedResponse<Vehicle>> => {
    const res = await api.get<PaginatedResponse<Vehicle>>("/vehicles", { params });
    return res.data;
  },

  /** Get vehicle detail with owner info (admin only) */
  getDetail: async (vehicleId: string): Promise<APIResponse<VehicleWithOwnerDetail>> => {
    const res = await api.get<APIResponse<VehicleWithOwnerDetail>>(`/vehicles/${vehicleId}/detail`);
    return res.data;
  },

  /** Permanently delete a vehicle (super_admin only) */
  hardDelete: async (vehicleId: string): Promise<APIResponse> => {
    const res = await api.delete<APIResponse>(`/vehicles/${vehicleId}/permanent`);
    return res.data;
  },
};
