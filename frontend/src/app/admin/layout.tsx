"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AdminShell } from "@/components/layouts/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth allowedRoles={["admin"]}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
