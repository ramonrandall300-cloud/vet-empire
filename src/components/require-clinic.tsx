import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClinic } from "@/lib/clinic-context";

export function RequireClinic({ children }: { children: ReactNode }) {
  const { clinic, loading } = useClinic();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="surface-panel mx-auto max-w-lg p-10 text-center">
        <Building2 className="mx-auto mb-4 size-8 text-primary" />
        <h2 className="text-xl font-semibold">Onboard your first clinic</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every clinic you operate gets its own isolated panel, staff and patient records.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/app/clinics">Onboard a clinic</Link>
        </Button>
      </div>
    );
  }


  return <>{children}</>;
}
