"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { statisticsApi } from "@/lib/services/statistics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AdminStatisticsPage() {
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-stats-overview"],
    queryFn: () => statisticsApi.getOverview(),
  });

  const { data: dailyRes, isLoading: dailyLoading } = useQuery({
    queryKey: ["admin-stats-daily"],
    queryFn: () => statisticsApi.getDaily(7),
  });

  const { data: hourlyRes, isLoading: hourlyLoading } = useQuery({
    queryKey: ["admin-stats-hourly"],
    queryFn: () => statisticsApi.getHourly(),
  });

  const stats = overviewRes?.data;
  const dailyData = dailyRes?.data || [];
  const hourlyData = hourlyRes?.data || [];

  const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-amber-400" />
          Statistik Parkir
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Analitik dan tren parkir.</p>
      </motion.div>

      {/* Summary Cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Hari Ini", value: stats.total_hari_ini, color: "amber" },
              { label: "Sedang Parkir", value: stats.sedang_parkir, color: "emerald" },
              { label: "Keluar Hari Ini", value: stats.keluar_hari_ini, color: "blue" },
              {
                label: "Rata-rata Durasi",
                value: stats.rata_rata_durasi_menit ? `${Math.round(stats.rata_rata_durasi_menit)}m` : "-",
                color: "indigo",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Daily Chart */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            Tren Harian (7 Hari Terakhir)
          </h2>
          {dailyLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : dailyData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="tanggal"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                  }
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0c1020",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                <Line
                  type="monotone"
                  dataKey="total_masuk"
                  name="Masuk"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_keluar"
                  name="Keluar"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Hourly Chart */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-400" />
            Distribusi Per Jam (Hari Ini)
          </h2>
          {hourlyLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : hourlyData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="jam"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => `${String(v).padStart(2, "0")}:00`}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0c1020",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                <Bar dataKey="total_masuk" name="Masuk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_keluar" name="Keluar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
