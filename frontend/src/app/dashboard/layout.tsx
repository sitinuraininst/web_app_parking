"use client";

import { AuthGuard } from "@/components/auth-guard";
import { StudentShell } from "@/components/layouts/student-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth allowedRoles={["student"]}>
      <StudentShell>{children}</StudentShell>
    </AuthGuard>
  );
}
