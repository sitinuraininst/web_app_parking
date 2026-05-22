import api from "@/lib/api";
import type {
  APIResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
} from "@/types";

export const authApi = {
  /** Login via JSON body (frontend usage) */
  login: async (data: LoginRequest): Promise<APIResponse<LoginResponse>> => {
    const response = await api.post<APIResponse<LoginResponse>>(
      "/auth/login/json",
      data
    );
    return response.data;
  },

  /** Register a new student */
  register: async (
    data: RegisterRequest
  ): Promise<APIResponse<RegisterResponse>> => {
    const response = await api.post<APIResponse<RegisterResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  /** Get current user profile */
  getProfile: async (): Promise<APIResponse<UserProfile>> => {
    const response = await api.get<APIResponse<UserProfile>>("/auth/me");
    return response.data;
  },

  /** Update profile */
  updateProfile: async (
    data: Partial<UserProfile>
  ): Promise<APIResponse<UserProfile>> => {
    const response = await api.patch<APIResponse<UserProfile>>(
      "/auth/me",
      data
    );
    return response.data;
  },

  /** Change password */
  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<APIResponse> => {
    const response = await api.post<APIResponse>(
      "/auth/change-password",
      data
    );
    return response.data;
  },
};
