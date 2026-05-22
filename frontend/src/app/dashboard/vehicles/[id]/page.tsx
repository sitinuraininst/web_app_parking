"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft, Car, Bike, QrCode, Download, Maximize2,
  Loader2, XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { vehicleApi } from "@/lib/services/vehicle";
import { qrApi } from "@/lib/services/qr";
import { uploadApi } from "@/lib/services/upload";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [qrFullscreen, setQrFullscreen] = useState(false);

  const { data: vRes, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleApi.get(id),
  });

  const { data: qrImgRes, isLoading: qrLoading } = useQuery({
    queryKey: ["qr-image", id],
    queryFn: () => qrApi.getImage(id),
    enabled: !!vRes?.data?.has_qr,
    retry: false,
  });

  const genQrMutation = useMutation({
    mutationFn: () => qrApi.generate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-image", id] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
      toast.success("QR Code berhasil di-generate!");
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Gagal generate QR.");
    },
  });

  const downloadQr = () => {
    if (!qrImgRes?.data?.image_base64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qrImgRes.data.image_base64}`;
    link.download = `QR_${vehicle?.plat_nomor || "parking"}.png`;
    link.click();
  };

  const vehicle = vRes?.data;

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;
  if (!vehicle) return <div className="text-center py-16"><XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" /><p className="text-white">Kendaraan tidak ditemukan.</p></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link href="/dashboard/vehicles" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      {/* Vehicle Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/15">
            {vehicle.jenis === "mobil" ? <Car className="h-7 w-7 text-blue-400" /> : <Bike className="h-7 w-7 text-blue-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{vehicle.plat_nomor}</h1>
              <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 capitalize">{vehicle.jenis}</Badge>
            </div>
            <p className="text-sm text-slate-400">{vehicle.merek} {vehicle.model} · <span className="capitalize">{vehicle.warna}</span></p>
            <p className="text-xs text-slate-500 mt-1">Terdaftar: {new Date(vehicle.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </motion.div>

      {/* QR Code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><QrCode className="h-4 w-4 text-blue-400" /> QR Code Parkir</h2>
        {vehicle.has_qr && qrImgRes?.data?.image_base64 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setQrFullscreen(true)}>
              <img src={`data:image/png;base64,${qrImgRes.data.image_base64}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-slate-500 font-mono">{qrImgRes.data.qr_token}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadQr} className="border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQrFullscreen(true)} className="border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer">
                <Maximize2 className="h-4 w-4 mr-1.5" /> Fullscreen
              </Button>
            </div>
          </div>
        ) : qrLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 text-blue-400 animate-spin" /></div>
        ) : (
          <div className="text-center py-6">
            <QrCode className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-3">QR Code belum di-generate.</p>
            <Button onClick={() => genQrMutation.mutate()} disabled={genQrMutation.isPending} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
              {genQrMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Generating...</> : <><QrCode className="h-4 w-4 mr-1.5" />Generate QR Code</>}
            </Button>
          </div>
        )}
      </motion.div>

      {/* QR Fullscreen Dialog */}
      <Dialog open={qrFullscreen} onOpenChange={setQrFullscreen}>
        <DialogContent className="bg-[#0a0e1a] border-white/[0.08] sm:max-w-lg flex flex-col items-center p-8">
          <DialogHeader><DialogTitle className="text-white text-center">QR Code - {vehicle.plat_nomor}</DialogTitle></DialogHeader>
          {qrImgRes?.data?.image_base64 && (
            <div className="bg-white rounded-2xl p-6 my-4">
              <img src={`data:image/png;base64,${qrImgRes.data.image_base64}`} alt="QR Code" className="w-64 h-64 sm:w-80 sm:h-80" />
            </div>
          )}
          <p className="text-xs text-slate-500 font-mono text-center">{qrImgRes?.data?.qr_token}</p>
          <Button onClick={downloadQr} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Download PNG
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
