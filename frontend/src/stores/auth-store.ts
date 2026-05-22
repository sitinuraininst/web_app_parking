import { create } from "zustand";
import type { UserProfile } from "@/types";
import { authApi } from "@/lib/services/auth";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    nama_lengkap: string;
    npm: string;
    phone?: string;
    prodi?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      const { access_token, user } = response.data;

      // Persist
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.register(data);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  refreshProfile: async () => {
    try {
      const response = await authApi.getProfile();
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      set({ user });
    } catch {
      // If profile fetch fails, force logout
      get().logout();
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ isHydrated: true });
      return;
    }

    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserProfile;
        set({
          user,
          token,
          isAuthenticated: true,
          isHydrated: true,
        });
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },
}));
