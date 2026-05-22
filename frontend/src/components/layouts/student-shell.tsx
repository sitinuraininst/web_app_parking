"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  LayoutDashboard,
  Bike,
  QrCode,
  History,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "Kendaraan", icon: Bike },
  { href: "/dashboard/qr-codes", label: "QR Code", icon: QrCode },
  { href: "/dashboard/history", label: "Riwayat Parkir", icon: History },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = studentNav;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col border-r border-white/[0.06] bg-[#0c1020]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.04]">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/logo-umsu.png" alt="UMSU Logo" className="h-9 w-auto object-contain drop-shadow-md" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Smart Parking</p>
            <p className="text-[9px] font-medium tracking-[0.2em] text-blue-400/60 uppercase">UMSU</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-blue-400")} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-white/[0.04] p-4">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/15">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nama_lengkap}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.npm || user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-white/[0.06] bg-[#0c1020] lg:hidden"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <div className="flex shrink-0 items-center justify-center">
                    <img src="/logo-umsu.png" alt="UMSU Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
                  </div>
                  <p className="text-sm font-bold text-white">Smart Parking</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/[0.04] p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar (mobile) */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0c1020]/80 backdrop-blur lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 items-center justify-center">
              <img src="/logo-umsu.png" alt="UMSU Logo" className="h-7 w-auto object-contain" />
            </div>
            <p className="text-sm font-bold text-white">Smart Parking</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/15">
            <User className="h-4 w-4 text-blue-400" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
