import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClinic } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/clinics")({
  head: () => ({
    meta: [
      { title: "All Clinics — Vetigo Operator Console" },
      { name: "description", content: "Operate and monitor every clinic on your platform." },
    ],
  }),

  component: Clinics,
});

function Clinics() {
  const { memberships, clinic, setClinicId } = useClinic();


  return (
    <div>
      <PageHeader
        title="All Clinics"
        description="Every clinic you operate runs on its own isolated dataset."
        actions={
          <Button asChild>
            <Link to="/app/onboarding">
              <Plus className="size-4" /> Onboard clinic
            </Link>
          </Button>
        }
      />


      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Clinics"
          value={memberships.length}
          icon={<Building2 className="size-5" />}
        />
        <StatCard
          label="Active subscriptions"
          value={memberships.filter((m) => m.clinics?.subscription_status === "active").length}
        />
        <StatCard
          label="On trial"
          value={memberships.filter((m) => m.clinics?.subscription_status === "trialing").length}
        />
      </div>

      <div className="surface-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinic</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Your role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((m) => (
              <TableRow key={m.clinic_id}>
                <TableCell className="font-medium">
                  {m.clinics?.name}
                  {m.clinic_id === clinic?.id && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.clinics?.city ?? "—"}</TableCell>
                <TableCell className="capitalize">{m.role}</TableCell>
                <TableCell>
                  <Badge
                    variant={m.clinics?.subscription_status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {m.clinics?.subscription_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={m.clinic_id === clinic?.id}
                    onClick={() => setClinicId(m.clinic_id)}
                  >
                    Open panel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!memberships.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <Building2 className="mx-auto mb-3 size-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No clinics yet</p>
                  <p className="text-sm text-muted-foreground">
                    Onboard your first clinic to open its panel.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link to="/app/onboarding">
                      <Plus className="size-4" /> Start onboarding
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </div>

    </div>
  );
}
