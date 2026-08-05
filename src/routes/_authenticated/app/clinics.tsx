import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useClinic, useCurrentUser } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/clinics")({
  head: () => ({
    meta: [
      { title: "All Clinics — SmartVet" },
      { name: "description", content: "Manage every veterinary clinic on your platform." },
    ],
  }),
  component: Clinics,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Clinics() {
  const { memberships, clinic, setClinicId, refetch } = useClinic();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .insert({
          name: name.trim(),
          slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
          city: city.trim() || null,
          phone: phone.trim() || null,
          owner_id: user!.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: memberError } = await supabase
        .from("clinic_members")
        .insert({ clinic_id: data.id, user_id: user!.id, role: "owner" });
      if (memberError) throw memberError;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Clinic created");
      setOpen(false);
      setName("");
      setCity("");
      setPhone("");
      setClinicId(id);
      refetch();
      void queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create clinic"),
  });

  return (
    <div>
      <PageHeader
        title="All Clinics"
        description="Every clinic you manage runs on its own isolated dataset."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New clinic
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
                    Create your first clinic to unlock the panel.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a clinic</DialogTitle>
            <DialogDescription>
              You become the owner and get a 14-day trial on the Starter plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinic-name">Clinic name</Label>
              <Input
                id="clinic-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Green Valley Veterinary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic-city">City</Label>
                <Input id="clinic-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-phone">Phone</Label>
                <Input id="clinic-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
              {create.isPending ? "Creating…" : "Create clinic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
