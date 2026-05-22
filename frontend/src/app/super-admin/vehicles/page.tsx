"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bike, Car, Search, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleApi } from "@/lib/services/vehicle";
import { VehicleDetailDialog } from "@/components/dashboard/vehicle-detail-dialog";
import { VehicleDeleteDialog } from "@/components/dashboard/vehicle-delete-dialog";
import type { Vehicle } from "@/types";

export default function AdminVehiclesPage() {
  const [search, setSearch] = useState("");
  const [jenisFilter, setJenisFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vehicles", { page, search, jenis: jenisFilter }],
    queryFn: () =>
      vehicleApi.listAll({
        page,
        page_size: 20,
        search: search || undefined,
        jenis: jenisFilter === "all" ? undefined : jenisFilter,
      }),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const vehicles = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bike className="h-5 w-5 text-amber-400" />
          Semua Kendaraan
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Verifikasi dan monitoring kendaraan terdaftar.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari plat nomor, merek..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={jenisFilter} onValueChange={(v) => { setJenisFilter(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/[0.08] text-white">
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent className="bg-[#0c1020] border-white/[0.08]">
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="motor">Motor</SelectItem>
            <SelectItem value="mobil">Mobil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Bike className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Tidak Ada Kendaraan</h2>
          <p className="text-sm text-slate-400">
            {search ? "Tidak ditemukan kendaraan." : "Belum ada kendaraan terdaftar."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <div
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4 hover:border-white/[0.1] transition-all cursor-pointer"
                onClick={() => setSelectedVehicle(v)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/15">
                  {v.jenis === "mobil" ? (
                    <Car className="h-5 w-5 text-blue-400" />
                  ) : (
                    <Bike className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{v.plat_nomor}</p>
                  <p className="text-xs text-slate-500">
                    {v.merek} {v.model} · {v.warna} · {v.jenis}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {v.is_verified ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                  {v.has_qr && (
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                      QR
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      v.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400"
                        : "border-red-500/30 text-red-400"
                    }`}
                  >
                    {v.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(v);
                    }}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
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

      {/* Vehicle Detail Dialog */}
      <VehicleDetailDialog
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />

      {/* Vehicle Delete Confirmation Dialog */}
      <VehicleDeleteDialog
        vehicle={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
