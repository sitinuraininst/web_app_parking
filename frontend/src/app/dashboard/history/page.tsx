"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, ParkingCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parkingApi } from "@/lib/services/parking";

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["my-history", { page, page_size: pageSize }],
    queryFn: () => parkingApi.getHistory({ page, page_size: pageSize }),
  });

  const sessions = data?.data || [];
  const pagination = data?.pagination;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Riwayat Parkir</h1>
        <p className="text-sm text-slate-400 mt-0.5">Semua catatan masuk dan keluar parkir.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Clock className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Belum Ada Riwayat</h2>
          <p className="text-sm text-slate-400">Riwayat parkir akan muncul setelah Anda menggunakan parkiran.</p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.status === "PARKED" ? "bg-emerald-500/10 border border-emerald-500/15" : "bg-slate-500/10 border border-slate-500/10"}`}>
                      <ParkingCircle className={`h-5 w-5 ${s.status === "PARKED" ? "text-emerald-400" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{s.plat_nomor}</p>
                        <Badge variant="outline" className={`text-[10px] ${s.status === "PARKED" ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}`}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(s.waktu_masuk)}</span>
                        <span>Masuk: {formatTime(s.waktu_masuk)}</span>
                        {s.waktu_keluar && <span>Keluar: {formatTime(s.waktu_keluar)}</span>}
                        {s.durasi_formatted && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.durasi_formatted}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.has_previous} className="border-white/[0.08] text-slate-300 cursor-pointer">
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-xs text-slate-400">
                Hal. {pagination.page} / {pagination.total_pages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.has_next} className="border-white/[0.08] text-slate-300 cursor-pointer">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
