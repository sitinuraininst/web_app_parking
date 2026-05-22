import api from "@/lib/api";
import type {
  APIResponse,
  PaginatedResponse,
  AdminProfile,
  CreateAdminRequest,
  UpdateAdminRequest,
} from "@/types";

export const adminApi = {
  /** List all admin/super_admin users */
  listAdmins: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<PaginatedResponse<AdminProfile>> => {
    const res = await api.get<PaginatedResponse<AdminProfile>>("/admin/users", {
      params,
    });
    return res.data;
  },

  /** Get a single admin profile */
  getAdmin: async (adminId: string): Promise<APIResponse<AdminProfile>> => {
    const res = await api.get<APIResponse<AdminProfile>>(
      `/admin/users/${adminId}`
    );
    return res.data;
  },

  /** Create a new admin account */
  createAdmin: async (
    data: CreateAdminRequest
  ): Promise<APIResponse<AdminProfile>> => {
    const res = await api.post<APIResponse<AdminProfile>>(
      "/admin/users",
      data
    );
    return res.data;
  },

  /** Update an admin account */
  updateAdmin: async (
    adminId: string,
    data: UpdateAdminRequest
  ): Promise<APIResponse<AdminProfile>> => {
    const res = await api.patch<APIResponse<AdminProfile>>(
      `/admin/users/${adminId}`,
      data
    );
    return res.data;
  },

  /** Deactivate an admin account */
  deactivateAdmin: async (
    adminId: string
  ): Promise<APIResponse<AdminProfile>> => {
    const res = await api.post<APIResponse<AdminProfile>>(
      `/admin/users/${adminId}/deactivate`
    );
    return res.data;
  },

  /** Activate an admin account */
  activateAdmin: async (
    adminId: string
  ): Promise<APIResponse<AdminProfile>> => {
    const res = await api.post<APIResponse<AdminProfile>>(
      `/admin/users/${adminId}/activate`
    );
    return res.data;
  },

  /** Permanently delete an admin account */
  deleteAdmin: async (
    adminId: string
  ): Promise<APIResponse<{ id: string }>> => {
    const res = await api.delete<APIResponse<{ id: string }>>(
      `/admin/users/${adminId}`
    );
    return res.data;
  },
};
