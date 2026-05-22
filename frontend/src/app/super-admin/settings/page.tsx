"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Server, Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsApi, type SystemSettings } from "@/lib/services/settings";

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsApi.getSettings,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["system-settings"], data);
      toast.success("Pengaturan berhasil disimpan.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Gagal menyimpan pengaturan.");
    },
  });

  // Local state for the form
  const [formData, setFormData] = useState<SystemSettings>({
    maintenance_mode: false,
    max_parking_capacity: 500,
    auto_suspend_admins: false,
    scan_cooldown_seconds: 30,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Konfigurasi parameter dan aturan sistem Smart Parking.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6"
      >
        {/* General Settings */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-center gap-3">
            <Server className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">General Configuration</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Kapasitas Maksimal Kendaraan</Label>
                <Input 
                  value={formData.max_parking_capacity} 
                  onChange={(e) => handleChange("max_parking_capacity", parseInt(e.target.value) || 0)}
                  type="number" 
                  className="bg-white/[0.04] border-white/[0.08] text-white" 
                />
                <p className="text-xs text-slate-500">Batas maksimal kendaraan yang diizinkan parkir bersamaan.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Cooldown Scan QR (Detik)</Label>
                <Input 
                  value={formData.scan_cooldown_seconds} 
                  onChange={(e) => handleChange("scan_cooldown_seconds", parseInt(e.target.value) || 0)}
                  type="number" 
                  className="bg-white/[0.04] border-white/[0.08] text-white" 
                />
                <p className="text-xs text-slate-500">Jeda minimal sebelum QR yang sama dapat di-scan lagi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Security & Access</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Hanya Super Admin yang dapat login saat maintenance.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.maintenance_mode}
                  onChange={(e) => handleChange("maintenance_mode", e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Auto-Suspend Inactive Admins</p>
                <p className="text-xs text-slate-500">Nonaktifkan admin jika tidak login selama 30 hari.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.auto_suspend_admins}
                  onChange={(e) => handleChange("auto_suspend_admins", e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan Pengaturan
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
