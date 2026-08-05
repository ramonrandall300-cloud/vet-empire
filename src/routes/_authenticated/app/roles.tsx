import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClinic } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — Vetigo" },
      { name: "description", content: "What each clinic role can see and change." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Roles />
    </RequireClinic>
  ),
});

const ROLES = ["owner", "admin", "veterinarian", "staff"] as const;

const ROLE_NOTES: Record<(typeof ROLES)[number], string> = {
  owner: "Full control, including billing and deleting the clinic.",
  admin: "Runs day-to-day operations and manages staff.",
  veterinarian: "Clinical work: examinations, vaccinations, prescriptions.",
  staff: "Front desk: bookings, customers, patients, invoicing.",
};

const MATRIX: { area: string; access: Record<(typeof ROLES)[number], boolean> }[] = [
  { area: "Dashboard", access: { owner: true, admin: true, veterinarian: true, staff: true } },
  { area: "Appointments", access: { owner: true, admin: true, veterinarian: true, staff: true } },
  {
    area: "Customers & Pets",
    access: { owner: true, admin: true, veterinarian: true, staff: true },
  },
  { area: "Examinations", access: { owner: true, admin: true, veterinarian: true, staff: false } },
  { area: "Vaccinations", access: { owner: true, admin: true, veterinarian: true, staff: false } },
  {
    area: "Services & pricing",
    access: { owner: true, admin: true, veterinarian: false, staff: false },
  },
  { area: "Inventory", access: { owner: true, admin: true, veterinarian: true, staff: true } },
  { area: "Invoices", access: { owner: true, admin: true, veterinarian: false, staff: true } },
  { area: "Reports", access: { owner: true, admin: true, veterinarian: false, staff: false } },
  {
    area: "Users & roles",
    access: { owner: true, admin: true, veterinarian: false, staff: false },
  },
  {
    area: "Website management",
    access: { owner: true, admin: true, veterinarian: false, staff: false },
  },
  {
    area: "Subscription & billing",
    access: { owner: true, admin: false, veterinarian: false, staff: false },
  },
];

function Roles() {
  const { role } = useClinic();

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Access is enforced per clinic, so data never crosses between tenants."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <div key={r} className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold capitalize">{r}</h2>
              {role === r && <Badge>Your role</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{ROLE_NOTES[r]}</p>
          </div>
        ))}
      </div>

      <div className="surface-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="capitalize">
                  {r}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATRIX.map((row) => (
              <TableRow key={row.area}>
                <TableCell className="font-medium">{row.area}</TableCell>
                {ROLES.map((r) => (
                  <TableCell key={r}>
                    {row.access[r] ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <Minus className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
