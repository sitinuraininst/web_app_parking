"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { User, Mail, Hash, Phone, GraduationCap, BookOpen, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/services/auth";
import { getRoleLabel } from "@/lib/role-labels";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    phone: user?.phone || "",
    prodi: user?.prodi || "",
  });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: () => {
      refreshProfile();
      setEditing(false);
      toast.success("Profil berhasil diupdate!");
    },
    onError: () => toast.error("Gagal mengupdate profil."),
  });

  const pwMutation = useMutation({
    mutationFn: () => authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
    onSuccess: () => {
      setPwForm({ current_password: "", new_password: "", confirm: "" });
      toast.success("Password berhasil diubah!");
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Gagal mengubah password.");
    },
  });

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password.length < 8) { toast.error("Password minimal 8 karakter."); return; }
    if (pwForm.new_password !== pwForm.confirm) { toast.error("Konfirmasi password tidak cocok."); return; }
    pwMutation.mutate();
  };

  const inputCls = "h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 text-sm";

  const infoFields = [
    { label: "Nama Lengkap", value: user?.nama_lengkap, icon: User },
    { label: "Email", value: user?.email, icon: Mail },
    { label: "NPM", value: user?.npm, icon: Hash },
    { label: "Role", value: getRoleLabel(user?.role ?? ""), icon: User },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-white">Profil Saya</h1>
        <p className="text-sm text-slate-400 mt-0.5">Kelola informasi akun Anda.</p>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/15">
            <User className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.nama_lengkap}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {infoFields.map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] px-4 py-3">
              <f.icon className="h-4 w-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm text-white capitalize">{f.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Editable Fields */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Informasi Tambahan</h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs cursor-pointer">
              Edit
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 flex items-center gap-1"><Phone className="h-3 w-3" /> Telepon</Label>
            <Input value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} disabled={!editing} className={inputCls} placeholder="081234567890" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Program Studi</Label>
            <Input value={form.prodi} onChange={(e) => setForm(p => ({...p, prodi: e.target.value}))} disabled={!editing} className={inputCls} placeholder="Informatika" />
          </div>
        </div>
        {editing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Simpan
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-slate-400 cursor-pointer">Batal</Button>
          </div>
        )}
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-blue-400" /> Ganti Password</h2>
        <form onSubmit={handlePwSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Password Saat Ini</Label>
            <Input type="password" value={pwForm.current_password} onChange={(e) => setPwForm(p => ({...p, current_password: e.target.value}))} className={inputCls} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Password Baru</Label>
            <Input type="password" value={pwForm.new_password} onChange={(e) => setPwForm(p => ({...p, new_password: e.target.value}))} className={inputCls} required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Konfirmasi Password</Label>
            <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm(p => ({...p, confirm: e.target.value}))} className={inputCls} required />
          </div>
          <Button type="submit" disabled={pwMutation.isPending} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
            {pwMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Ubah Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
