"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { Car, Bike, Plus, Trash2, QrCode, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { vehicleApi } from "@/lib/services/vehicle";
import { AddVehicleForm } from "@/components/dashboard/add-vehicle-form";

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: () => vehicleApi.listMine(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
      toast.success("Kendaraan berhasil dihapus.");
      setDeleteId(null);
    },
    onError: () => toast.error("Gagal menghapus kendaraan."),
  });

  const vehicles = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kendaraan Saya</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kelola kendaraan yang terdaftar.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah
        </Button>
      </div>

      {/* Vehicle List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : vehicles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Car className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Belum Ada Kendaraan</h2>
          <p className="text-sm text-slate-400 mb-4">Daftarkan kendaraan Anda untuk mulai menggunakan parkir.</p>
          <Button onClick={() => setShowAdd(true)} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Daftarkan Kendaraan
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-blue-500/15 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/15">
                    {v.jenis === "mobil" ? <Car className="h-6 w-6 text-blue-400" /> : <Bike className="h-6 w-6 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{v.plat_nomor}</h3>
                      <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 capitalize">{v.jenis}</Badge>
                      {v.has_qr && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">QR</Badge>}
                    </div>
                    <p className="text-sm text-slate-400">{v.merek} {v.model} · <span className="capitalize">{v.warna}</span></p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link href={`/dashboard/vehicles/${v.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(v.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#111633] border-white/[0.08] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Daftarkan Kendaraan</DialogTitle>
            <DialogDescription className="text-slate-400">Masukkan detail kendaraan Anda.</DialogDescription>
          </DialogHeader>
          <AddVehicleForm onSuccess={() => { setShowAdd(false); queryClient.invalidateQueries({ queryKey: ["my-vehicles"] }); }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-[#111633] border-white/[0.08] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-400" /> Hapus Kendaraan?</DialogTitle>
            <DialogDescription className="text-slate-400">Kendaraan akan di-nonaktifkan dan QR Code tidak dapat digunakan lagi.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-slate-300 cursor-pointer">Batal</Button>
            <Button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-500 text-white cursor-pointer">
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
