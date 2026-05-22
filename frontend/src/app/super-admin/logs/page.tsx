"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Activity, Search, ShieldAlert, LogIn, LogOut, FileText, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logsApi } from "@/lib/services/logs";

function getActionDetails(action: string) {
  switch (action) {
    case "LOGIN":
      return { icon: LogIn, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    case "LOGOUT":
      return { icon: LogOut, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    case "REGISTER":
    case "VEHICLE_REGISTERED":
      return { icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case "PARKING_ENTRY":
    case "PARKING_EXIT":
      return { icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    case "ADMIN_CREATED":
    case "ADMIN_UPDATED":
    case "ADMIN_DELETED":
    case "ADMIN_DEACTIVATED":
    case "ADMIN_ACTIVATED":
      return { icon: ShieldAlert, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
    case "LOGS_CLEARED":
      return { icon: Trash2, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    default:
      return { icon: Activity, color: "text-slate-400", bg: "bg-white/[0.05]", border: "border-white/[0.1]" };
  }
}

export default function SuperAdminLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", { page, search }],
    queryFn: () => logsApi.getLogs({ page, page_size: 20, search: search || undefined }),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Activity Logs
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Pantau semua aktivitas sistem secara real-time.
            </p>
          </div>
          <Button
            onClick={() => setClearDialogOpen(true)}
            variant="outline"
            className="border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer h-9 px-4 text-xs font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Bersihkan Log
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari aksi (cth: LOGIN, ADMIN_DELETED)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/[0.02] border-b border-white/[0.08]">
              <tr>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada log ditemukan.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const { icon: Icon, color, bg, border } = getActionDetails(log.action);
                  return (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`flex w-max items-center gap-1.5 ${bg} ${border} ${color}`}>
                          <Icon className="h-3 w-3" />
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="font-medium text-slate-200">{log.user.nama_lengkap}</p>
                            <p className="text-xs text-slate-500">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sistem</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs max-w-md truncate">
                        {JSON.stringify(log.detail)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_previous}
            onClick={() => setPage((p) => p - 1)}
            className="border-white/[0.08] text-slate-300 cursor-pointer"
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-slate-400">
            {pagination.page} / {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
            className="border-white/[0.08] text-slate-300 cursor-pointer"
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ClearLogsDialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)} />
    </div>
  );
}

/* ─── Clear Logs Confirmation Dialog ────────────────────── */

function ClearLogsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => logsApi.clearLogs(password),
    onSuccess: () => {
      toast.success("Log aktivitas berhasil dibersihkan.");
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      handleClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal membersihkan log.");
    },
  });

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password wajib diisi.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0c1020] border-red-500/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Bersihkan Log Aktivitas
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              Apakah Anda yakin ingin menghapus semua riwayat aktivitas sistem?
            </p>
            <p className="text-xs text-red-400 font-medium">
              Peringatan: Tindakan ini permanen dan tidak dapat dibatalkan. Log yang dihapus tidak dapat dipulihkan.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Password Konfirmasi *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Super Admin Anda"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
              required
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
              className="flex-1 bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membersihkan...
                </>
              ) : (
                "Bersihkan Semua Log"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
