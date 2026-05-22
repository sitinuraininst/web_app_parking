import type { UserRole } from "@/types";

/** Indonesian display labels for each UserRole. */
const ROLE_LABELS: Record<UserRole, string> = {
  student: "Mahasiswa",
  admin: "Operator",
  super_admin: "Super Admin",
};

/**
 * Returns the Indonesian display label for a given role.
 * Falls back to the raw role string (capitalized, underscores replaced)
 * if the role is not in the mapping — ensuring safety for future/unknown roles.
 */
export function getRoleLabel(role: string): string {
  return (
    ROLE_LABELS[role as UserRole] ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
