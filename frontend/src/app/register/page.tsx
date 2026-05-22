"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Car,
  Loader2,
  ArrowLeft,
  User,
  Hash,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, hydrate, isHydrated } =
    useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nama_lengkap: "",
    npm: "",
    phone: "",
    prodi: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, router]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.email ||
      !form.password ||
      !form.nama_lengkap ||
      !form.npm
    ) {
      toast.error("Harap isi semua field yang wajib.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        nama_lengkap: form.nama_lengkap.trim(),
        npm: form.npm.trim(),
        phone: form.phone.trim() || undefined,
        prodi: form.prodi.trim() || undefined,
      });
      toast.success("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Registrasi gagal.";
      toast.error(message);
    }
  };

  const fields = [
    {
      id: "nama_lengkap",
      label: "Nama Lengkap",
      icon: User,
      type: "text",
      placeholder: "Nama Lengkap",
      required: true,
    },
    {
      id: "npm",
      label: "NPM",
      icon: Hash,
      type: "text",
      placeholder: "2102010001",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      type: "email",
      placeholder: "nama@gmail.com",
      required: true,
    },
    {
      id: "phone",
      label: "No. Telepon",
      icon: Phone,
      type: "tel",
      placeholder: "081234567890",
      required: false,
    },

    {
      id: "prodi",
      label: "Program Studi",
      icon: BookOpen,
      type: "text",
      placeholder: "Sistem Informasi",
      required: false,
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0d1025] to-[#0a0e1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(96,130,237,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Back link */}
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center">
              <img src="/logo-umsu.png" alt="UMSU Logo" className="h-10 w-auto object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Daftar Akun</h1>
              <p className="text-xs text-slate-400">Smart Parking UMSU</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Text fields */}
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label
                  htmlFor={field.id}
                  className="text-sm text-slate-300 flex items-center gap-1.5"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 text-xs">*</span>
                  )}
                </Label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.id as keyof typeof form]}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className="h-10 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 text-sm"
                    disabled={isLoading}
                    required={field.required}
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm text-slate-300 flex items-center gap-1.5"
              >
                Password <span className="text-red-400 text-xs">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="h-10 pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 text-sm"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-sm text-slate-300 flex items-center gap-1.5"
              >
                Konfirmasi Password{" "}
                <span className="text-red-400 text-xs">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  className="h-10 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar Akun"
              )}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
