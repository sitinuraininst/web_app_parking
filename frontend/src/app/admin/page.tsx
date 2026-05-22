"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ParkingCircle,
  TrendingUp,
  Bike,
  Car,
  ScanLine,
  ChevronRight,
  Clock,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { statisticsApi } from "@/lib/services/statistics";
import { parkingApi } from "@/lib/services/parking";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function LiveDuration({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = Date.now() - new Date(since).getTime();
      const m = Math.floor(diff / 60000);
      const h = Math.floor(m / 60);
      setElapsed(h > 0 ? `${h}j ${m % 60}m` : `${m}m`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [since]);
  return <span className="font-mono text-xs tabular-nums">{elapsed}</span>;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statisticsApi.getOverview(),
    refetchInterval: 30000,
  });

  const { data: activeRes, isLoading: activeLoading } = useQuery({
    queryKey: ["admin-active"],
    queryFn: () => parkingApi.getActive(),
    refetchInterval: 15000,
  });

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ["admin-history", { page: 1, page_size: 5 }],
    queryFn: () => parkingApi.getHistory({ page: 1, page_size: 5 }),
  });

  const stats = statsRes?.data;
  const activeParking = activeRes?.data || [];
  const recentHistory = historyRes?.data || [];

  const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-amber-400" />
              Operator Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Selamat bertugas, {user?.nama_lengkap?.split(" ")[0]}. Monitoring parkir realtime.
            </p>
          </div>
          <Link href="/admin/scanner">
            <Button className="bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-lg shadow-amber-600/20">
              <ScanLine className="h-4 w-4 mr-2" />
              Buka Scanner
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Sedang Parkir",
            value: stats?.sedang_parkir ?? activeParking.length,
            icon: ParkingCircle,
            color: "emerald",
            loading: statsLoading && activeLoading,
          },
          {
            label: "Masuk Hari Ini",
            value: stats?.total_hari_ini ?? 0,
            icon: TrendingUp,
            color: "amber",
            loading: statsLoading,
          },
          {
            label: "Keluar Hari Ini",
            value: stats?.keluar_hari_ini ?? 0,
            icon: Clock,
            color: "blue",
            loading: statsLoading,
          },
          {
            label: "Kapasitas",
            value: stats ? `${stats.persentase_terisi}%` : "-",
            icon: BarChart3,
            color: "indigo",
            loading: statsLoading,
          },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.05 + i * 0.04 }}>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/15`}
                >
                  <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                </div>
                <div>
                  {stat.loading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Capacity Bar */}
      {stats && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>
                Kapasitas Parkir — {stats.kapasitas_terisi}/{stats.kapasitas_total} slot
              </span>
              <span
                className={
                  stats.persentase_terisi > 80
                    ? "text-red-400"
                    : stats.persentase_terisi > 50
                      ? "text-amber-400"
                      : "text-emerald-400"
                }
              >
                {stats.persentase_terisi}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.persentase_terisi}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  stats.persentase_terisi > 80
                    ? "bg-gradient-to-r from-red-600 to-red-500"
                    : stats.persentase_terisi > 50
                      ? "bg-gradient-to-r from-amber-600 to-amber-500"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>🏍 Motor: {stats.kendaraan_motor}</span>
              <span>🚗 Mobil: {stats.kendaraan_mobil}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Parking */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ParkingCircle className="h-4 w-4 text-emerald-400" />
                Parkir Aktif
              </h2>
              <Link
                href="/admin/active"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Lihat semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {activeLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : activeParking.length === 0 ? (
              <div className="text-center py-8">
                <ParkingCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Tidak ada kendaraan parkir saat ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeParking.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                      {s.jenis === "mobil" ? (
                        <Car className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Bike className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.plat_nomor}</p>
                      <p className="text-xs text-slate-500">
                        {s.owner_nama} · <LiveDuration since={s.waktu_masuk} />
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 text-[10px]"
                    >
                      PARKED
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent History */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Aktivitas Terbaru
              </h2>
              <Link
                href="/admin/history"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Lihat semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada aktivitas parkir hari ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentHistory.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        s.status === "PARKED" ? "bg-emerald-500/10" : "bg-slate-500/10"
                      }`}
                    >
                      <ParkingCircle
                        className={`h-4 w-4 ${
                          s.status === "PARKED" ? "text-emerald-400" : "text-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.plat_nomor}</p>
                      <p className="text-xs text-slate-500">
                        {s.owner_nama} ·{" "}
                        {new Date(s.waktu_masuk).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {s.durasi_formatted && ` · ${s.durasi_formatted}`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        s.status === "PARKED"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-slate-500/30 text-slate-400"
                      }`}
                    >
                      {s.status === "PARKED" ? "MASUK" : "KELUAR"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
