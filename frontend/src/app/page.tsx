"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getRoleDashboardPath } from "@/components/auth-guard";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && user) {
      router.replace(getRoleDashboardPath(user.role));
    } else {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
    </div>
  );
}
