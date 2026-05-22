"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleApi } from "@/lib/services/vehicle";

interface Props {
  onSuccess: () => void;
}

export function AddVehicleForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    plat_nomor: "",
    merek: "",
    model: "",
    warna: "",
    jenis: "" as "motor" | "mobil" | "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      vehicleApi.register({
        plat_nomor: form.plat_nomor,
        merek: form.merek,
        model: form.model,
        warna: form.warna,
        jenis: form.jenis as "motor" | "mobil",
      }),
    onSuccess: () => {
      toast.success("Kendaraan berhasil didaftarkan!");
      onSuccess();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal mendaftarkan kendaraan.");
    },
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plat_nomor || !form.merek || !form.model || !form.warna || !form.jenis) {
      toast.error("Harap isi semua field.");
      return;
    }
    mutation.mutate();
  };

  const inputCls = "h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm text-slate-300">Plat Nomor</Label>
        <Input placeholder="BK 1234 ABC" value={form.plat_nomor} onChange={(e) => update("plat_nomor", e.target.value.toUpperCase())} className={inputCls} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-300">Merek</Label>
          <Input placeholder="Honda" value={form.merek} onChange={(e) => update("merek", e.target.value)} className={inputCls} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-300">Model</Label>
          <Input placeholder="Vario 150" value={form.model} onChange={(e) => update("model", e.target.value)} className={inputCls} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-300">Warna</Label>
          <Input placeholder="Hitam" value={form.warna} onChange={(e) => update("warna", e.target.value)} className={inputCls} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-300">Jenis</Label>
          <Select value={form.jenis || undefined} onValueChange={(v) => { if (v) update("jenis", v); }}>
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f36] border-white/[0.08] text-white">
              <SelectItem value="motor">Motor</SelectItem>
              <SelectItem value="mobil">Mobil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending} className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white cursor-pointer">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Daftarkan Kendaraan"}
      </Button>
    </form>
  );
}
