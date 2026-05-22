"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bike,
  Car,
  User,
  Mail,
  Phone,
  GraduationCap,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { vehicleApi } from "@/lib/services/vehicle";
import type { Vehicle } from "@/types";

interface VehicleDetailDialogProps {
  /** The vehicle to show detail for (pass null to close) */
  vehicle: Vehicle | null;
  onClose: () => void;
}

export function VehicleDetailDialog({ vehicle, onClose }: VehicleDetailDialogProps) {
  const isOpen = !!vehicle;

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-detail", vehicle?.id],
    queryFn: () => vehicleApi.getDetail(vehicle!.id),
    enabled: isOpen,
    staleTime: 60 * 1000, // 1 minute
  });

  const detail = data?.data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c1020] border-white/[0.08] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {vehicle?.jenis === "mobil" ? (
              <Car className="h-5 w-5 text-blue-400" />
            ) : (
              <Bike className="h-5 w-5 text-blue-400" />
            )}
            Detail Kendaraan
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 mt-2">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-5 w-2/3 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/3 rounded-lg" />
          </div>
        ) : detail ? (
          <div className="mt-2 space-y-4">
            {/* Vehicle Info */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Informasi Kendaraan
              </h3>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Plat Nomor</span>
                  <span className="text-sm font-bold text-white">{detail.plat_nomor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Merek & Model</span>
                  <span className="text-sm text-white">{detail.merek} {detail.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Warna</span>
                  <span className="text-sm text-white">{detail.warna}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Jenis</span>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 capitalize">
                    {detail.jenis === "mobil" ? (
                      <Car className="h-3 w-3 mr-1" />
                    ) : (
                      <Bike className="h-3 w-3 mr-1" />
                    )}
                    {detail.jenis}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      detail.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400"
                        : "border-red-500/30 text-red-400"
                    }`}
                  >
                    {detail.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Verifikasi</span>
                  {detail.is_verified ? (
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
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Terdaftar
                  </span>
                  <span className="text-sm text-white">
                    {new Date(detail.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Informasi Pemilik
              </h3>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nama Lengkap
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {detail.owner_nama || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    NPM
                  </span>
                  <span className="text-sm text-white font-mono">
                    {detail.owner_npm || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    Prodi
                  </span>
                  <span className="text-sm text-white">
                    {detail.owner_prodi || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </span>
                  <span className="text-sm text-white truncate max-w-[180px]">
                    {detail.owner_email || "—"}
                  </span>
                </div>
                {detail.owner_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telepon
                    </span>
                    <span className="text-sm text-white">
                      {detail.owner_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Gagal memuat detail kendaraan.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
