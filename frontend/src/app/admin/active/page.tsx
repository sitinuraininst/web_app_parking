"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ParkingCircle, Search, Bike, Car, Clock, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parkingApi } from "@/lib/services/parking";

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
    const id = setInterval(calc, 15000);
    return () => clearInterval(id);
  }, [since]);
  return <span className="font-mono text-xs tabular-nums text-amber-400">{elapsed}</span>;
}

export default function ActiveParkingPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-active-full", search],
    queryFn: () => parkingApi.getActive(search || undefined),
    refetchInterval: 15000,
  });

  const sessions = data?.data || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ParkingCircle className="h-5 w-5 text-emerald-400" />
          Parkir Aktif
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {sessions.length} kendaraan sedang parkir saat ini.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari plat nomor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <ParkingCircle className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Area Parkir Kosong</h2>
          <p className="text-sm text-slate-400">
            {search ? "Tidak ditemukan kendaraan dengan plat tersebut." : "Tidak ada kendaraan yang sedang parkir."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4 hover:border-emerald-500/15 transition-all">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                  {s.jenis === "mobil" ? (
                    <Car className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Bike className="h-6 w-6 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">{s.plat_nomor}</p>
                  <p className="text-xs text-slate-500">
                    {s.merek} {s.model} · {s.warna} · {s.owner_nama}
                    {s.owner_npm && ` (${s.owner_npm})`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <LiveDuration since={s.waktu_masuk} />
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {new Date(s.waktu_masuk).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] shrink-0">
                  PARKED
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
