// Smart Parking UMSU — API Client Types

// ── Auth ──────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nama_lengkap: string;
  npm: string;
  phone?: string;
  prodi?: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  nama_lengkap: string;
  npm: string;
  message: string;
}

export type UserRole = "student" | "admin" | "super_admin";

export interface UserProfile {
  id: string;
  email: string;
  nama_lengkap: string;
  npm: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  prodi: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

// ── Admin Management ──────────────────────────────────────

export interface AdminProfile {
  id: string;
  email: string;
  nama_lengkap: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface CreateAdminRequest {
  nama_lengkap: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateAdminRequest {
  nama_lengkap?: string;
  email?: string;
  phone?: string;
}

// ── Vehicle ───────────────────────────────────────────────

export interface Vehicle {
  id: string;
  user_id: string;
  plat_nomor: string;
  merek: string;
  model: string;
  warna: string;
  jenis: "motor" | "mobil";
  foto_url: string | null;
  stnk_url: string | null;
  status: "ACTIVE" | "INACTIVE";
  is_verified: boolean;
  has_qr?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithOwnerDetail extends Vehicle {
  owner_nama: string | null;
  owner_npm: string | null;
  owner_email: string | null;
  owner_prodi: string | null;
  owner_phone: string | null;
}

export interface VehicleRegisterRequest {
  plat_nomor: string;
  merek: string;
  model: string;
  warna: string;
  jenis: "motor" | "mobil";
}

// ── QR Code ───────────────────────────────────────────────

export interface QRCode {
  id: string;
  vehicle_id: string;
  qr_token: string;
  is_active: boolean;
  generated_at: string;
  plat_nomor?: string;
  merek?: string;
  model?: string;
}

export interface QRCodeImage {
  qr_token: string;
  image_base64: string;
  vehicle_id: string;
  plat_nomor: string;
}

// ── Parking ───────────────────────────────────────────────

export interface ParkingSession {
  id: string;
  vehicle_id: string;
  qr_code_id: string;
  waktu_masuk: string;
  waktu_keluar: string | null;
  durasi_menit: number | null;
  durasi_formatted: string | null;
  status: "PARKED" | "COMPLETED";
  gate_masuk: string | null;
  gate_keluar: string | null;
  plat_nomor?: string;
  merek?: string;
  model?: string;
  warna?: string;
  jenis?: string;
  owner_nama?: string;
  owner_npm?: string;
  created_at: string;
}

export interface ParkingStatistics {
  total_hari_ini: number;
  sedang_parkir: number;
  keluar_hari_ini: number;
  kapasitas_terisi: number;
  kapasitas_total: number;
  persentase_terisi: number;
  rata_rata_durasi_menit: number | null;
  kendaraan_motor: number;
  kendaraan_mobil: number;
}

export interface DailyStatItem {
  tanggal: string;
  total_masuk: number;
  total_keluar: number;
  rata_rata_durasi: number | null;
}

export interface HourlyStatItem {
  jam: number;
  total_masuk: number;
  total_keluar: number;
}

// ── API Response Wrappers ─────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error_code: string;
  detail?: Record<string, unknown>;
  timestamp: string;
}
