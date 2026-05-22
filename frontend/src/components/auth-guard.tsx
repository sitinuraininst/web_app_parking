"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

/** Returns the base dashboard path for a given role. */
export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user, hydrate } = useAuthStore();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    if (requireAuth && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // TEMPORARY LOGGING FOR DEBUGGING
    console.log("[AuthGuard Debug]", {
      role: user?.role,
      pathname,
      isAuthenticated,
      isHydrated
    });

    // Role-based redirect: if user is authenticated but not in allowedRoles
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      console.log(`[AuthGuard] Redirecting from ${pathname} to ${getRoleDashboardPath(user.role)} because role ${user.role} is not in allowedRoles:`, allowedRoles);
      router.replace(getRoleDashboardPath(user.role));
      return;
    }
  }, [
    isHydrated,
    isAuthenticated,
    requireAuth,
    allowedRoles,
    user,
    router,
    pathname,
  ]);

  // Show nothing while hydrating
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect conditions not met yet
  if (requireAuth && !isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
