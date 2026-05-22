"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  ParkingCircle,
  Bike,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Activity,
  Crown,
  Car,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { statisticsApi } from "@/lib/services/statistics";
import { adminApi } from "@/lib/services/admin";
import { parkingApi } from "@/lib/services/parking";
import { vehicleApi } from "@/lib/services/vehicle";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/lib/role-labels";

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["sa-stats-overview"],
    queryFn: () => statisticsApi.getOverview(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const { data: adminsRes, isLoading: adminsLoading } = useQuery({
    queryKey: ["sa-admins-list", { page: 1, page_size: 5 }],
    queryFn: () => adminApi.listAdmins({ page: 1, page_size: 5 }),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const { data: activeRes, isLoading: activeLoading } = useQuery({
    queryKey: ["sa-active-parking"],
    queryFn: () => parkingApi.getActive(),
    staleTime: 15 * 1000, // 15 seconds (more frequent for active parking)
    refetchOnWindowFocus: false,
  });

  const { data: vehiclesRes, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["sa-all-vehicles", { page: 1, page_size: 5 }],
    queryFn: () => vehicleApi.listAll({ page: 1, page_size: 5 }),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const stats = statsRes?.data;
  const admins = adminsRes?.data || [];
  const totalAdmins = adminsRes?.pagination?.total_items ?? 0;
  const activeParking = activeRes?.data || [];
  const totalVehicles = vehiclesRes?.pagination?.total_items ?? 0;

  const overviewCards = [
    {
      label: "Total Admin",
      value: totalAdmins,
      icon: Users,
      color: "indigo",
      href: "/super-admin/admins",
      loading: adminsLoading,
    },
    {
      label: "Sedang Parkir",
      value: stats?.sedang_parkir ?? activeParking.length,
      icon: ParkingCircle,
      color: "emerald",
      href: "/super-admin/parking",
      loading: statsLoading && activeLoading,
    },
    {
      label: "Total Kendaraan",
      value: totalVehicles,
      icon: Bike,
      color: "blue",
      href: "/super-admin/vehicles",
      loading: vehiclesLoading,
    },
    {
      label: "Masuk Hari Ini",
      value: stats?.total_hari_ini ?? 0,
      icon: TrendingUp,
      color: "amber",
      href: "/super-admin/statistics",
      loading: statsLoading,
    },
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  };

  const colorMap: Record<string, { bg: string; border: string; text: string; iconText: string }> = {
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/15",
      text: "text-indigo-300",
      iconText: "text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
      text: "text-emerald-300",
      iconText: "text-emerald-400",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/15",
      text: "text-blue-300",
      iconText: "text-blue-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/15",
      text: "text-amber-300",
      iconText: "text-amber-400",
    },
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <Crown className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Control Center</h1>
        </div>
        <p className="text-sm text-slate-400">
          Selamat datang, {user?.nama_lengkap?.split(" ")[0]}. Monitoring dan manajemen sistem parkir.
        </p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewCards.map((card, i) => {
          const c = colorMap[card.color];
          return (
            <motion.div
              key={card.label}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.05 }}
            >
              <Link
                href={card.href}
                className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bg} border ${c.border}`}
                  >
                    <card.icon className={`h-5 w-5 ${c.iconText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {card.loading ? (
                      <Skeleton className="h-7 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-white">{card.value}</p>
                    )}
                    <p className="text-xs text-slate-400">{card.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Admins */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Admin Terdaftar</h2>
              <Link
                href="/super-admin/admins"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Kelola <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {adminsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada admin terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {admins.slice(0, 4).map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/15">
                      <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {admin.nama_lengkap}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          admin.role === "super_admin"
                            ? "border-purple-500/30 text-purple-400"
                            : "border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {getRoleLabel(admin.role)}
                      </Badge>
                      {!admin.is_active && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-red-500/30 text-red-400"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Parking */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Parkir Aktif</h2>
              <Link
                href="/super-admin/parking"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
                <p className="text-sm text-slate-400">Tidak ada kendaraan yang sedang parkir.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeParking.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                      {session.jenis === "mobil" ? (
                        <Car className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Bike className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.plat_nomor}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.owner_nama} · {session.merek} {session.model}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 text-[10px] shrink-0"
                    >
                      PARKED
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Parking Stats Bar */}
      {stats && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Statistik Hari Ini</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_hari_ini}</p>
                <p className="text-xs text-slate-400">Total Masuk</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.keluar_hari_ini}</p>
                <p className="text-xs text-slate-400">Total Keluar</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.kapasitas_terisi}/{stats.kapasitas_total}
                </p>
                <p className="text-xs text-slate-400">Kapasitas Terisi</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.rata_rata_durasi_menit ? `${Math.round(stats.rata_rata_durasi_menit)}m` : "-"}
                </p>
                <p className="text-xs text-slate-400">Rata-rata Durasi</p>
              </div>
            </div>
            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Kapasitas parkir</span>
                <span>{stats.persentase_terisi}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.persentase_terisi}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className={`h-full rounded-full ${
                    stats.persentase_terisi > 80
                      ? "bg-red-500"
                      : stats.persentase_terisi > 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
