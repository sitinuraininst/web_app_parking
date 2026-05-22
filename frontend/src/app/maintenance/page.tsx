"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { settingsApi } from "@/lib/services/settings";

export default function MaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    // Periodically check if maintenance is over
    const checkStatus = async () => {
      try {
        const settings = await settingsApi.getSettings();
        if (!settings.maintenance_mode) {
          router.replace("/");
        }
      } catch (e) {
        // Ignore 503 errors while checking
      }
    };

    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-md rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6"
          >
            <img src="/logo-umsu.png" alt="UMSU Logo" className="w-12 h-auto object-contain drop-shadow-md" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            System Under Maintenance
          </h1>
          
          <p className="text-slate-400 mb-8 leading-relaxed">
            Sistem Smart Parking UMSU sedang dalam pemeliharaan rutin. Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman yang lebih baik.
          </p>

          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
            <Wrench className="w-4 h-4" />
            <span className="animate-pulse">Segera kembali...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
