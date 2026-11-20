import type { ClinicRole } from "@/lib/clinic-context";

const ROLE_ROUTES: Array<{ prefix: string; roles: ClinicRole[] }> = [
  { prefix: "/app/examinations", roles: ["owner", "admin", "veterinarian"] },
  { prefix: "/app/vaccinations", roles: ["owner", "admin", "veterinarian"] },
  { prefix: "/app/services", roles: ["owner", "admin"] },
  { prefix: "/app/invoices", roles: ["owner", "admin", "staff"] },
  { prefix: "/app/reports", roles: ["owner", "admin"] },
  { prefix: "/app/users", roles: ["owner", "admin"] },
  { prefix: "/app/website", roles: ["owner", "admin"] },
  { prefix: "/app/subscription", roles: ["owner"] },
];

/** Keep navigation and direct route access aligned with the database role policies. */
export function canAccessClinicPath(
  role: ClinicRole | null,
  pathname: string,
  isPlatformAdmin = false,
): boolean {
  if (isPlatformAdmin) return true;
  if (pathname.startsWith("/app/clinics")) return false;
  const rule = ROLE_ROUTES.find(({ prefix }) => pathname.startsWith(prefix));
  return !rule || (role !== null && rule.roles.includes(role));
}
