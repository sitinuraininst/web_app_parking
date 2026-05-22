"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { QrCode, Download, Maximize2, Bike, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { qrApi } from "@/lib/services/qr";
import { vehicleApi } from "@/lib/services/vehicle";
import type { QRCodeImage } from "@/types";

export default function QRCodesPage() {
  const [fullscreen, setFullscreen] = useState<QRCodeImage | null>(null);

  const { data: vehiclesRes, isLoading: vLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: () => vehicleApi.listMine(),
  });

  const vehicles = vehiclesRes?.data || [];
  const vehiclesWithQr = vehicles.filter((v) => v.has_qr);

  const downloadQr = (imageBase64: string, platNomor: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `QR_${platNomor}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">QR Code Saya</h1>
        <p className="text-sm text-slate-400 mt-0.5">QR Code permanen untuk akses parkir.</p>
      </div>

      {vLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[1,2].map(i => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}</div>
      ) : vehiclesWithQr.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <QrCode className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Belum Ada QR Code</h2>
          <p className="text-sm text-slate-400 mb-4">Generate QR Code dari halaman kendaraan Anda.</p>
          <Link href="/dashboard/vehicles">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">Ke Kendaraan Saya</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehiclesWithQr.map((v, i) => (
            <QRCardWrapper key={v.id} vehicleId={v.id} platNomor={v.plat_nomor} merek={v.merek} model={v.model} jenis={v.jenis} index={i} onFullscreen={setFullscreen} onDownload={downloadQr} />
          ))}
        </div>
      )}

      {/* Fullscreen */}
      <Dialog open={!!fullscreen} onOpenChange={() => setFullscreen(null)}>
        <DialogContent className="bg-[#0a0e1a] border-white/[0.08] sm:max-w-lg flex flex-col items-center p-8">
          <DialogHeader><DialogTitle className="text-white text-center">QR Code - {fullscreen?.plat_nomor}</DialogTitle></DialogHeader>
          {fullscreen?.image_base64 && (
            <div className="bg-white rounded-2xl p-6 my-4">
              <img src={`data:image/png;base64,${fullscreen.image_base64}`} alt="QR" className="w-64 h-64 sm:w-80 sm:h-80" />
            </div>
          )}
          <p className="text-xs text-slate-500 font-mono">{fullscreen?.qr_token}</p>
          <Button onClick={() => fullscreen && downloadQr(fullscreen.image_base64, fullscreen.plat_nomor)} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Download PNG
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QRCardWrapper({ vehicleId, platNomor, merek, model, jenis, index, onFullscreen, onDownload }: {
  vehicleId: string; platNomor: string; merek: string; model: string; jenis: string; index: number;
  onFullscreen: (d: QRCodeImage) => void; onDownload: (b64: string, plate: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["qr-image", vehicleId],
    queryFn: () => qrApi.getImage(vehicleId),
  });

  const qrData = data?.data;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 self-start">
          {jenis === "mobil" ? <Car className="h-4 w-4 text-blue-400" /> : <Bike className="h-4 w-4 text-blue-400" />}
          <span className="text-sm font-bold text-white">{platNomor}</span>
          <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 capitalize">{jenis}</Badge>
        </div>
        <p className="text-xs text-slate-500 mb-3">{merek} {model}</p>

        {isLoading ? (
          <Skeleton className="w-40 h-40 rounded-xl" />
        ) : qrData?.image_base64 ? (
          <>
            <div className="bg-white rounded-xl p-3 cursor-pointer hover:scale-105 transition-transform" onClick={() => onFullscreen(qrData)}>
              <img src={`data:image/png;base64,${qrData.image_base64}`} alt="QR" className="w-36 h-36" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => onDownload(qrData.image_base64, platNomor)} className="border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFullscreen(qrData)} className="border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer text-xs">
                <Maximize2 className="h-3.5 w-3.5 mr-1" /> Fullscreen
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
