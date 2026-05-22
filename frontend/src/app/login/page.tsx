"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, Car, Shield, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { getRoleDashboardPath } from "@/components/auth-guard";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRedirect = searchParams.get("redirect") || "";

  const { login, isLoading, isAuthenticated, hydrate, isHydrated } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const { user } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      router.replace(defaultRedirect || getRoleDashboardPath(user.role));
    }
  }, [isHydrated, isAuthenticated, user, router, defaultRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Email dan password harus diisi.");
      return;
    }

    try {
      await login(email.trim(), password);
      toast.success("Login berhasil!");
      // Get the updated user from store after login
      const loggedInUser = useAuthStore.getState().user;
      const targetPath = defaultRedirect || getRoleDashboardPath(loggedInUser?.role || "student");
      router.push(targetPath);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message || "Sistem sedang dalam maintenance. Silakan coba kembali beberapa saat lagi.";
      toast.error(message);
    }
  };

  const features = [
    {
      icon: QrCode,
      title: "QR Code Parking",
      desc: "Scan QR untuk masuk & keluar parkiran",
    },
    {
      icon: Car,
      title: "Vehicle Management",
      desc: "Daftarkan & kelola kendaraan Anda",
    },
    {
      icon: Shield,
      title: "Secure & Realtime",
      desc: "Monitoring parkir secara realtime",
    },
  ];

  return (
    <div className="relative flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111633] to-[#0d1025]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,130,237,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.06),transparent_60%)]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 items-center justify-center">
                <img src="/logo-umsu.png" alt="UMSU Logo" className="h-11 w-auto object-contain drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Smart Parking
                </h1>
                <p className="text-[11px] font-medium tracking-[0.2em] text-blue-400/70 uppercase">
                  UMSU
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Parkir Cerdas
                <br />
                <span className="text-gradient">Berbasis QR Code</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                Sistem manajemen parkir modern untuk lingkungan kampus
                Universitas Muhammadiyah Sumatera Utara.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-blue-500/30 group-hover:bg-blue-500/[0.06] transition-all duration-300">
                    <feature.icon className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {feature.title}
                    </p>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs text-slate-600"
          >
            &copy; 2025 Smart Parking UMSU. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[420px] space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex shrink-0 items-center justify-center lg:hidden">
              <img src="/logo-umsu.png" alt="UMSU Logo" className="h-10 w-auto object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Smart Parking</h1>
              <p className="text-[10px] font-medium tracking-[0.2em] text-blue-400/70 uppercase">
                UMSU
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Masuk ke Akun</h2>
            <p className="text-sm text-slate-400">
              Masukkan email dan password untuk mengakses sistem parkir.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-600/20 transition-all duration-300 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Register link */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
