"use client";

import { AuthGuard } from "@/components/auth-guard";
import { SuperAdminShell } from "@/components/layouts/super-admin-shell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth allowedRoles={["super_admin"]}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </AuthGuard>
  );
}
