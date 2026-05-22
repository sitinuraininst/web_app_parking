"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, ParkingCircle, Bike, Car, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parkingApi } from "@/lib/services/parking";

export default function AdminHistoryPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-history", { page, dateFrom, dateTo }],
    queryFn: () =>
      parkingApi.getHistory({
        page,
        page_size: 20,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const sessions = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-amber-400" />
          Riwayat Parkir
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Semua riwayat aktivitas parkir.
        </p>
      </motion.div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-10 bg-white/[0.04] border-white/[0.08] text-white w-40"
          />
          <span className="text-slate-500 text-xs">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-10 bg-white/[0.04] border-white/[0.08] text-white w-40"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-18 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <History className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Tidak Ada Riwayat</h2>
          <p className="text-sm text-slate-400">Belum ada riwayat parkir pada periode ini.</p>
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
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    s.status === "PARKED" ? "bg-emerald-500/10" : "bg-slate-500/10"
                  }`}
                >
                  {s.jenis === "mobil" ? (
                    <Car
                      className={`h-5 w-5 ${
                        s.status === "PARKED" ? "text-emerald-400" : "text-slate-400"
                      }`}
                    />
                  ) : (
                    <Bike
                      className={`h-5 w-5 ${
                        s.status === "PARKED" ? "text-emerald-400" : "text-slate-400"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{s.plat_nomor}</p>
                  <p className="text-xs text-slate-500">
                    {s.owner_nama}
                    {s.owner_npm && ` · ${s.owner_npm}`} · {s.merek} {s.model}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">
                    {new Date(s.waktu_masuk).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {new Date(s.waktu_masuk).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.waktu_keluar &&
                      ` – ${new Date(s.waktu_keluar).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </p>
                  {s.durasi_formatted && (
                    <p className="text-[10px] text-amber-400/80 font-mono">{s.durasi_formatted}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    s.status === "PARKED"
                      ? "border-emerald-500/30 text-emerald-400"
                      : "border-slate-500/30 text-slate-400"
                  }`}
                >
                  {s.status}
                </Badge>
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
    </div>
  );
}
