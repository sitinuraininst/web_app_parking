"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Car, Bike, Clock, QrCode, ParkingCircle, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { vehicleApi } from "@/lib/services/vehicle";
import { parkingApi } from "@/lib/services/parking";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

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
  return <span>{elapsed}</span>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: vehiclesRes, isLoading: vLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: () => vehicleApi.listMine(),
  });

  const { data: historyRes, isLoading: hLoading } = useQuery({
    queryKey: ["my-history", { page: 1, page_size: 5 }],
    queryFn: () => parkingApi.getHistory({ page: 1, page_size: 5 }),
  });

  const vehicles = vehiclesRes?.data || [];
  const history = historyRes?.data || [];
  const activeSession = history.find((s) => s.status === "PARKED");

  const stats = [
    { label: "Kendaraan", value: vehicles.length, icon: Bike, color: "blue" },
    { label: "QR Aktif", value: vehicles.filter((v) => v.has_qr).length, icon: QrCode, color: "emerald" },
    { label: "Total Parkir", value: historyRes?.pagination?.total_items ?? 0, icon: ParkingCircle, color: "amber" },
  ];

  const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">
          Halo, {user?.nama_lengkap?.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">Selamat datang di Smart Parking UMSU.</p>
      </motion.div>

      {/* Active Parking Alert */}
      {activeSession && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <ParkingCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-300">Kendaraan Sedang Parkir</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSession.plat_nomor} — <LiveDuration since={activeSession.waktu_masuk} />
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs shrink-0">PARKED</Badge>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/15`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
              </div>
              <div>
                {vLoading || hLoading ? (
                  <Skeleton className="h-7 w-10 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                )}
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicles */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Kendaraan Saya</h2>
              <Link href="/dashboard/vehicles" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Lihat semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {vLoading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada kendaraan terdaftar.</p>
                <Link href="/dashboard/vehicles" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
                  Daftarkan kendaraan →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicles.slice(0, 3).map((v) => (
                  <Link key={v.id} href={`/dashboard/vehicles/${v.id}`} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 hover:border-blue-500/20 transition-all group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/15">
                      {v.jenis === "mobil" ? <Car className="h-4 w-4 text-blue-400" /> : <Bike className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.plat_nomor}</p>
                      <p className="text-xs text-slate-500">{v.merek} {v.model} · {v.warna}</p>
                    </div>
                    {v.has_qr && <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] shrink-0">QR</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent History */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Riwayat Terbaru</h2>
              <Link href="/dashboard/history" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Lihat semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {hLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada riwayat parkir.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.status === "PARKED" ? "bg-emerald-500/10" : "bg-slate-500/10"}`}>
                      <ParkingCircle className={`h-4 w-4 ${s.status === "PARKED" ? "text-emerald-400" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.plat_nomor}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(s.waktu_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        {s.durasi_formatted && ` · ${s.durasi_formatted}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${s.status === "PARKED" ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}`}>
                      {s.status}
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
