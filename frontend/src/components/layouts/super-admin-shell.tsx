"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ParkingCircle,
  Bike,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/role-labels";

const superAdminNav = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/admins", label: "Admin Management", icon: Users },
  { href: "/super-admin/active", label: "Parkir Aktif", icon: ParkingCircle },
  { href: "/super-admin/vehicles", label: "Kendaraan", icon: Bike },
  { href: "/super-admin/statistics", label: "Statistik", icon: BarChart3 },
  { href: "/super-admin/logs", label: "Activity Logs", icon: Activity },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080b14]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[270px] flex-col border-r border-indigo-500/[0.08] bg-[#0a0d18]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-500/[0.06]">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/logo-umsu.png" alt="UMSU Logo" className="h-10 w-auto object-contain drop-shadow-md" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Control Center</p>
            <p className="text-[9px] font-medium tracking-[0.2em] text-indigo-400/60 uppercase">Smart Parking UMSU</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Menu</p>
          {superAdminNav.map((item) => {
            const isActive =
              item.href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-indigo-400")} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-400/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-white/[0.04] p-4">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/15">
              <Crown className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nama_lengkap}</p>
              <Badge variant="outline" className="border-indigo-500/20 text-indigo-400/80 text-[9px] px-1.5 py-0">
                {getRoleLabel("super_admin")}
              </Badge>
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
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[270px] flex flex-col border-r border-indigo-500/[0.08] bg-[#0a0d18] lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-500/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex shrink-0 items-center justify-center">
                    <img src="/logo-umsu.png" alt="UMSU Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
                  </div>
                  <p className="text-sm font-bold text-white">Control Center</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
                {superAdminNav.map((item) => {
                  const isActive =
                    item.href === "/super-admin"
                      ? pathname === "/super-admin"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
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
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/[0.04] bg-[#0a0d18]/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex shrink-0 items-center justify-center">
                <img src="/logo-umsu.png" alt="UMSU Logo" className="h-7 w-auto object-contain" />
              </div>
              <p className="text-sm font-bold text-white">Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 text-[10px]">
              {getRoleLabel("super_admin")}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/15">
              <Crown className="h-4 w-4 text-indigo-400" />
            </div>
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
