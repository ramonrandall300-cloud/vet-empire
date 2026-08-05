import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { ClinicProvider, useClinic, useCurrentUser } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function ClinicSwitcher() {
  const { clinic, memberships, setClinicId } = useClinic();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-[240px] justify-between">
          <Building2 className="size-4" />
          <span className="truncate">{clinic?.name ?? "Select clinic"}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your clinics</DropdownMenuLabel>
        {memberships.map((m) => (
          <DropdownMenuItem key={m.clinic_id} onClick={() => setClinicId(m.clinic_id)}>
            <span className="flex-1 truncate">{m.clinics?.name}</span>
            <Badge variant="secondary" className="capitalize">
              {m.role}
            </Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/clinics">
            <Plus className="size-4" /> Add a clinic
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { data: user } = useCurrentUser();
  const { role } = useClinic();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name = (user?.user_metadata?.["full_name"] as string) || user?.email || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block max-w-[160px] truncate text-sm font-medium">{name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{role ?? "member"}</span>
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Shell() {
  const { clinic, loading } = useClinic();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <ClinicSwitcher />
            <div className="flex-1" />
            <UserMenu />
          </header>
          <main className="min-w-0 flex-1 p-5 lg:p-8">
            {!loading && !clinic ? (
              <div className="surface-panel mx-auto max-w-lg p-10 text-center">
                <Building2 className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-xl font-semibold">Create your first clinic</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each clinic gets its own isolated panel, staff and records.
                </p>
                <Button className="mt-6" asChild>
                  <Link to="/app/clinics">Set up a clinic</Link>
                </Button>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppLayout() {
  return (
    <ClinicProvider>
      <Shell />
    </ClinicProvider>
  );
}
