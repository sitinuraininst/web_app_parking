import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const isProd = process.env.NODE_ENV === "production";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_API_URL.replace(/^http:\/\//i, 'https://')
  : (isProd ? "https://webappparking-production.up.railway.app" : "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Request Interceptor: attach JWT token ─────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("[Axios Request]", config.method?.toUpperCase(), config.baseURL, config.url);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 and 503 globally ─────────────
api.interceptors.response.use(
  (response) => {
    console.log("[Axios Response Success]", response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error("[Axios Response Error]", error.response?.status, error.response?.data);
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      } else if (error.response?.status === 503) {
        // Maintenance Mode
        if (
          !window.location.pathname.includes("/maintenance") && 
          !window.location.pathname.includes("/super-admin")
        ) {
          window.location.href = "/maintenance";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
