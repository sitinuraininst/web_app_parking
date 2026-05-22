"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Search,
  Shield,
  Crown,
  Mail,
  Phone,
  Edit,
  Power,
  PowerOff,
  Loader2,
  X,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/services/admin";
import { getRoleLabel } from "@/lib/role-labels";
import type { AdminProfile, CreateAdminRequest } from "@/types";

export default function AdminManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminProfile | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);

  const { data: adminsRes, isLoading } = useQuery({
    queryKey: ["sa-admins", { page, search }],
    queryFn: () => adminApi.listAdmins({ page, page_size: 20, search: search || undefined }),
    staleTime: 45 * 1000, // 45 seconds
    refetchOnWindowFocus: false,
  });

  const admins = adminsRes?.data || [];
  const pagination = adminsRes?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              Admin Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Kelola akun admin dan operator parkir.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Admin
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      {/* Admin List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Users className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Tidak Ada Admin</h2>
          <p className="text-sm text-slate-400 mb-4">
            {search ? "Tidak ditemukan admin dengan kata kunci tersebut." : "Belum ada admin terdaftar."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4 hover:border-white/[0.1] transition-all">
                {/* Avatar */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                    admin.role === "super_admin"
                      ? "bg-purple-500/10 border-purple-500/15"
                      : "bg-amber-500/10 border-amber-500/15"
                  }`}
                >
                  {admin.role === "super_admin" ? (
                    <Crown className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Shield className="h-5 w-5 text-amber-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">
                      {admin.nama_lengkap}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        admin.role === "super_admin"
                          ? "border-purple-500/30 text-purple-400"
                          : "border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {getRoleLabel(admin.role)}
                    </Badge>
                    {!admin.is_active && (
                      <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {admin.email}
                    </span>
                    {admin.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {admin.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — only for non-super_admin */}
                {admin.role !== "super_admin" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditAdmin(admin)}
                      className="text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer h-8 w-8 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {admin.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeactivateTarget(admin)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer h-8 w-8 p-0"
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <ActivateButton adminId={admin.id} />
                    )}
                    {user?.id !== admin.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(admin)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_previous}
            onClick={() => setPage((p) => p - 1)}
            className="border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-slate-400">
            Halaman {pagination.page} dari {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
            className="border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Create Admin Dialog */}
      <CreateAdminDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Admin Dialog */}
      <EditAdminDialog admin={editAdmin} onClose={() => setEditAdmin(null)} />

      {/* Deactivate Confirm Dialog */}
      <DeactivateDialog admin={deactivateTarget} onClose={() => setDeactivateTarget(null)} />

      {/* Delete Confirm Dialog */}
      <DeleteDialog admin={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

/* ─── Create Admin Dialog ────────────────────────────────── */

function CreateAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateAdminRequest>({
    nama_lengkap: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      toast.success("Admin berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["sa-admins"] });
      onClose();
      setForm({ nama_lengkap: "", email: "", password: "", phone: "" });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal membuat admin.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.email || !form.password) {
      toast.error("Nama, email, dan password wajib diisi.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c1020] border-white/[0.08] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            Tambah Admin Baru
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Nama Lengkap *</Label>
            <Input
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
              placeholder="Nama lengkap admin"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@umsu.ac.id"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Password *</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 karakter"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">No. Telepon</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat Admin"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Edit Admin Dialog ──────────────────────────────────── */

function EditAdminDialog({ admin, onClose }: { admin: AdminProfile | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nama_lengkap: "", email: "", phone: "" });

  // Sync form when admin changes
  useState(() => {
    if (admin) {
      setForm({
        nama_lengkap: admin.nama_lengkap,
        email: admin.email,
        phone: admin.phone || "",
      });
    }
  });

  // Re-sync on open
  const isOpen = !!admin;
  if (admin && form.nama_lengkap === "" && form.email === "") {
    setForm({
      nama_lengkap: admin.nama_lengkap,
      email: admin.email,
      phone: admin.phone || "",
    });
  }

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateAdmin(admin!.id, {
        nama_lengkap: form.nama_lengkap || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      }),
    onSuccess: () => {
      toast.success("Admin berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["sa-admins"] });
      handleClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal mengupdate admin.");
    },
  });

  const handleClose = () => {
    setForm({ nama_lengkap: "", email: "", phone: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0c1020] border-white/[0.08] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5 text-indigo-400" />
            Edit Admin
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 mt-2"
        >
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Nama Lengkap</Label>
            <Input
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">No. Telepon</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Deactivate Dialog ──────────────────────────────────── */

function DeactivateDialog({ admin, onClose }: { admin: AdminProfile | null; onClose: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminApi.deactivateAdmin(admin!.id),
    onSuccess: () => {
      toast.success("Admin berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["sa-admins"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal menonaktifkan admin.");
    },
  });

  return (
    <Dialog open={!!admin} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c1020] border-white/[0.08] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <PowerOff className="h-5 w-5 text-red-400" />
            Nonaktifkan Admin
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-slate-400">
            Apakah Anda yakin ingin menonaktifkan akun{" "}
            <span className="text-white font-medium">{admin?.nama_lengkap}</span>?
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Admin yang dinonaktifkan tidak dapat login hingga diaktifkan kembali.
          </p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menonaktifkan...
              </>
            ) : (
              "Nonaktifkan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Activate Button ────────────────────────────────────── */

function ActivateButton({ adminId }: { adminId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminApi.activateAdmin(adminId),
    onSuccess: () => {
      toast.success("Admin berhasil diaktifkan kembali.");
      queryClient.invalidateQueries({ queryKey: ["sa-admins"] });
    },
    onError: () => {
      toast.error("Gagal mengaktifkan admin.");
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer h-8 w-8 p-0"
    >
      {mutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Power className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

/* ─── Delete Dialog ──────────────────────────────────────── */

function DeleteDialog({ admin, onClose }: { admin: AdminProfile | null; onClose: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminApi.deleteAdmin(admin!.id),
    onSuccess: () => {
      toast.success("Admin berhasil dihapus permanen.");
      queryClient.invalidateQueries({ queryKey: ["sa-admins"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal menghapus admin.");
    },
  });

  return (
    <Dialog open={!!admin} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c1020] border-red-500/20 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Hapus Permanen Admin
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-slate-400">
            Apakah Anda yakin ingin menghapus permanen akun{" "}
            <span className="text-white font-medium">{admin?.nama_lengkap}</span>?
          </p>
          <p className="text-xs text-red-400 mt-2">
            Peringatan: Tindakan ini tidak dapat dibatalkan. Semua data terkait akun ini akan hilang.
          </p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Permanen"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
