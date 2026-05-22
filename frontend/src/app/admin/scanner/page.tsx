"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ScanLine,
  Camera,
  CheckCircle2,
  XCircle,
  Car,
  Bike,
  User,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Video,
  Keyboard,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parkingApi } from "@/lib/services/parking";

type ScanResult = {
  type: "entry" | "exit";
  message: string;
  session?: {
    id: string;
    waktu_masuk: string;
    waktu_keluar?: string;
    durasi_formatted?: string;
    gate_masuk?: string;
    gate_keluar?: string;
  };
  vehicle?: {
    plat_nomor: string;
    merek: string;
    model: string;
    warna: string;
    jenis: string;
  };
  owner?: {
    nama_lengkap: string;
    npm: string;
  };
};

type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string>("");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualToken, setManualToken] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  const scanMutation = useMutation({
    mutationFn: (qrToken: string) => parkingApi.scan(qrToken),
    onSuccess: (response) => {
      const data = response.data as ScanResult;
      setScanResult(data);
      setScanState("success");
      toast.success(data.message || "Scan berhasil!");
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || "Scan gagal. QR tidak valid.";
      setScanError(msg);
      setScanState("error");
      toast.error(msg);
    },
  });

  const handleScan = useCallback(
    (qrToken: string) => {
      if (scanMutation.isPending || scanState === "success") return;
      setScanState("scanning");
      scanMutation.mutate(qrToken.trim());
    },
    [scanMutation, scanState]
  );

  const resetScan = () => {
    setScanState("idle");
    setScanResult(null);
    setScanError("");
    setManualToken("");
  };

  // Initialize html5-qrcode scanner
  useEffect(() => {
    if (mode !== "camera" || !scannerRef.current) return;

    let scanner: { clear: () => void | Promise<void>; stop?: () => Promise<void> } | null = null;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const qrScanner = new Html5Qrcode("qr-reader");
        html5QrRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1,
          },
          (decodedText) => {
            // Pause scanning after successful decode
            handleScan(decodedText);
            try {
              qrScanner.pause(true);
            } catch {
              // ignore
            }
          },
          () => {
            // QR scan error (no QR detected) — silent
          }
        );

        setCameraActive(true);
        scanner = qrScanner;
      } catch (err) {
        console.error("Scanner init failed:", err);
        setCameraActive(false);
        toast.error("Gagal mengakses kamera. Gunakan mode manual.");
        setMode("manual");
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        try {
          const s = scanner as { stop: () => Promise<void>; clear: () => void | Promise<void> };
          s.stop().then(() => s.clear()).catch(() => {});
        } catch {
          // ignore
        }
      }
      setCameraActive(false);
    };
  }, [mode, handleScan]);

  // Resume scanner when resetting
  useEffect(() => {
    if (scanState === "idle" && mode === "camera" && html5QrRef.current) {
      try {
        const qr = html5QrRef.current as { resume: () => void };
        qr.resume();
      } catch {
        // ignore
      }
    }
  }, [scanState, mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.error("Masukkan token QR.");
      return;
    }
    handleScan(manualToken);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-amber-400" />
          QR Scanner
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Scan QR Code kendaraan untuk masuk atau keluar parkiran.
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("camera");
            resetScan();
          }}
          className={
            mode === "camera"
              ? "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
              : "border-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
          }
        >
          <Video className="h-4 w-4 mr-2" />
          Kamera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("manual");
            resetScan();
          }}
          className={
            mode === "manual"
              ? "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
              : "border-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
          }
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual
        </Button>
      </div>

      {/* Scanner Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {mode === "camera" ? (
            <div className="relative">
              {/* Camera viewport */}
              <div className="aspect-square max-h-[420px] bg-black relative overflow-hidden">
                <div id="qr-reader" ref={scannerRef} className="w-full h-full" />

                {/* Scanner overlay */}
                {cameraActive && scanState === "idle" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[280px] h-[280px] relative">
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
                      {/* Scan line animation */}
                      <motion.div
                        animate={{ y: [0, 260, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                      />
                    </div>
                  </div>
                )}

                {!cameraActive && scanState === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]">
                    <Camera className="h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">Mengaktifkan kamera...</p>
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin mt-2" />
                  </div>
                )}
              </div>

              {/* Camera status */}
              <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cameraActive ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-slate-400">Kamera aktif — arahkan ke QR Code</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">Memuat kamera...</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Manual input */
            <div className="p-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <Keyboard className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Masukkan token QR secara manual</p>
                </div>
                <Input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste QR token di sini..."
                  className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 text-center font-mono text-lg"
                  disabled={scanMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={scanMutation.isPending || !manualToken.trim()}
                  className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                >
                  {scanMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4 mr-2" />
                      Proses Scan
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </motion.div>

      {/* Scan Result */}
      <AnimatePresence mode="wait">
        {scanState === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-6 text-center">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-amber-300">Memproses scan...</p>
            </div>
          </motion.div>
        )}

        {scanState === "success" && scanResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              className={`rounded-2xl border p-6 ${
                scanResult.type === "entry"
                  ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                  : "border-blue-500/20 bg-blue-500/[0.06]"
              }`}
            >
              {/* Status header */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    scanResult.type === "entry"
                      ? "bg-emerald-500/20 border border-emerald-500/30"
                      : "bg-blue-500/20 border border-blue-500/30"
                  }`}
                >
                  {scanResult.type === "entry" ? (
                    <ArrowDownToLine className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <ArrowUpFromLine className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-lg font-bold ${
                      scanResult.type === "entry" ? "text-emerald-300" : "text-blue-300"
                    }`}
                  >
                    {scanResult.type === "entry" ? "MASUK PARKIR" : "KELUAR PARKIR"}
                  </p>
                  <p className="text-xs text-slate-400">{scanResult.message}</p>
                </div>
              </div>

              {/* Vehicle info */}
              {scanResult.vehicle && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                      {scanResult.vehicle.jenis === "mobil" ? (
                        <Car className="h-5 w-5 text-slate-300" />
                      ) : (
                        <Bike className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {scanResult.vehicle.plat_nomor}
                      </p>
                      <p className="text-xs text-slate-400">
                        {scanResult.vehicle.merek} {scanResult.vehicle.model} ·{" "}
                        {scanResult.vehicle.warna}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] border-white/[0.1] text-slate-400 capitalize"
                    >
                      {scanResult.vehicle.jenis}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Owner info */}
              {scanResult.owner && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                      <User className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {scanResult.owner.nama_lengkap}
                      </p>
                      <p className="text-xs text-slate-400">NPM: {scanResult.owner.npm}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Session info */}
              {scanResult.session && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">
                        Masuk:{" "}
                        {new Date(scanResult.session.waktu_masuk).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {scanResult.session.waktu_keluar && (
                        <p className="text-xs text-slate-400">
                          Keluar:{" "}
                          {new Date(scanResult.session.waktu_keluar).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    {scanResult.session.durasi_formatted && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/20 text-amber-400 font-mono"
                      >
                        {scanResult.session.durasi_formatted}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Reset button */}
              <Button
                onClick={resetScan}
                className="w-full mt-5 bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Scan Berikutnya
              </Button>
            </div>
          </motion.div>
        )}

        {scanState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
              <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-base font-bold text-red-300 mb-1">Scan Gagal</p>
              <p className="text-sm text-slate-400 mb-4">{scanError}</p>
              <Button
                onClick={resetScan}
                className="bg-red-600/80 hover:bg-red-500 text-white cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
