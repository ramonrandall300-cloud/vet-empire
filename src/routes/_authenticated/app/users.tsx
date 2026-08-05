import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useClinic, type ClinicRole } from "@/lib/clinic-context";
import { useClinicStaff } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/users")({
  head: () => ({
    meta: [
      { title: "Users & Staff — SmartVet" },
      { name: "description", content: "Manage who can access this clinic and what they can do." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <UsersPage />
    </RequireClinic>
  ),
});

const ROLES: ClinicRole[] = ["owner", "admin", "veterinarian", "staff"];

function UsersPage() {
  const { clinic, isAdmin } = useClinic();
  const { data, isLoading } = useClinicStaff();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClinicRole>("staff");

  const changeRole = useMutation({
    mutationFn: async ({ userId, next }: { userId: string; next: ClinicRole }) => {
      const { error } = await supabase
        .from("clinic_members")
        .update({ role: next })
        .eq("clinic_id", clinic!.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update role"),
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (!profile) {
        throw new Error(
          "No SmartVet account uses that email yet. Ask them to sign up first, then add them here.",
        );
      }
      const { error: insertError } = await supabase
        .from("clinic_members")
        .insert({ clinic_id: clinic!.id, user_id: profile.id, role });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Team member added");
      setOpen(false);
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add member"),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with access to this clinic's panel and records."
        actions={
          isAdmin && (
            <Button onClick={() => setOpen(true)}>
              <UserCog className="size-4" /> Add member
            </Button>
          )
        }
      />

      <div className="surface-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((member) => (
              <TableRow key={member.user_id}>
                <TableCell className="font-medium">
                  {member.profiles?.full_name ?? "Unnamed"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.profiles?.email ?? "—"}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select
                      value={member.role}
                      onValueChange={(next) =>
                        changeRole.mutate({ userId: member.user_id, next: next as ClinicRole })
                      }
                    >
                      <SelectTrigger className="w-44 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !(data ?? []).length && (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>
              They need a SmartVet account first — then you can grant them access to this clinic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email address</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vet@clinic.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as ClinicRole)}>
                <SelectTrigger className="capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => invite.mutate()} disabled={!email.trim() || invite.isPending}>
              {invite.isPending ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
