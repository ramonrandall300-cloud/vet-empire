import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { BadgeCheck, CircleAlert, ImageUp, Loader2, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useClinic, useCurrentUser } from "@/lib/clinic-context";
import { deleteMyAccount, setSubscriptionCancellation } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Vetigo" },
      {
        name: "description",
        content:
          "Manage your Vetigo profile picture, display name, bio, organization logo, plan and account status.",
      },
      { property: "og:title", content: "My Profile — Vetigo" },
      {
        property: "og:description",
        content: "Update your Vetigo account details, organization branding and subscription.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

/** Private bucket, so images are resolved through short-lived signed URLs. */
function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//.test(path)) {
      setUrl(path);
      return;
    }
    void supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { clinic, role, isAdmin, refetch } = useClinic();
  const cancelSub = useServerFn(setSubscriptionCancellation);
  const deleteAccount = useServerFn(deleteMyAccount);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const subscriptionQuery = useQuery({
    queryKey: ["clinic-subscription", clinic?.id],
    enabled: Boolean(clinic?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_subscriptions")
        .select("*, plans(name, slug, price_monthly)")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (Record<string, unknown> & {
            current_period_end: string;
            cancel_at_period_end: boolean;
            interval: string;
            status: string;
            plans: { name: string } | null;
          })
        | null;
    },
  });

  const planQuery = useQuery({
    queryKey: ["plan", clinic?.plan_id],
    enabled: Boolean(clinic?.plan_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly")
        .eq("id", clinic!.plan_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = profileQuery.data;
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    username: "",
    bio: "",
    phone: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      full_name: profile.full_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile]);

  const avatarUrl = useSignedUrl(profile?.avatar_url);
  const logoUrl = useSignedUrl(clinic?.logo_url);

  const initials = useMemo(() => {
    const source = form.full_name || form.first_name || user?.email || "";
    return source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join("");
  }, [form.full_name, form.first_name, user?.email]);

  const save = useMutation({
    mutationFn: async () => {
      const username = form.username.trim();
      if (username && !/^[a-z0-9_.-]{3,30}$/i.test(username)) {
        throw new Error("Username must be 3–30 characters (letters, numbers, . _ -)");
      }
      if (form.bio.length > 500) throw new Error("Bio must be 500 characters or fewer");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name.trim() || null,
          last_name: form.last_name.trim() || null,
          full_name:
            form.full_name.trim() ||
            [form.first_name, form.last_name].filter(Boolean).join(" ").trim() ||
            null,
          username: username || null,
          bio: form.bio.trim() || null,
          phone: form.phone.trim() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not save your profile"),
  });

  const uploadImage = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: "avatar" | "logo" }) => {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be smaller than 5 MB");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path =
        kind === "avatar"
          ? `users/${user!.id}/avatar-${Date.now()}.${ext}`
          : `clinics/${clinic!.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      if (kind === "avatar") {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: path })
          .eq("id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clinics")
          .update({ logo_url: path })
          .eq("id", clinic!.id);
        if (error) throw error;
      }
      return kind;
    },
    onSuccess: (kind) => {
      toast.success(kind === "avatar" ? "Profile picture updated" : "Organization logo updated");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      refetch();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const cancel = useMutation({
    mutationFn: (nextCancel: boolean) =>
      cancelSub({ data: { clinicId: clinic!.id, cancel: nextCancel } }),
    onSuccess: (r) => {
      toast.success(
        r.cancelAtPeriodEnd
          ? "Subscription will end at the close of the current period"
          : "Subscription renewal resumed",
      );
      void queryClient.invalidateQueries({ queryKey: ["clinic-subscription"] });
      refetch();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update subscription"),
  });

  const removeAccount = useMutation({
    mutationFn: () => deleteAccount({}),
    onSuccess: async () => {
      toast.success("Your account has been deleted");
      await supabase.auth.signOut();
      window.location.assign("/");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete account"),
  });

  const emailVerified = Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
  const accountActive = profile?.is_active !== false;
  const subscription = subscriptionQuery.data;
  const renewal = subscription?.current_period_end
    ? format(parseISO(subscription.current_period_end), "d MMMM yyyy")
    : clinic?.trial_ends_at
      ? `${format(parseISO(clinic.trial_ends_at), "d MMMM yyyy")} (trial ends)`
      : "—";

  return (
    <div>
      <PageHeader
        title="My profile"
        description="Your personal details, organization branding and account status."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-panel space-y-5 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Your profile picture" />}
              <AvatarFallback className="text-lg">{initials || "V"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Profile picture</p>
              <p className="text-sm text-muted-foreground">PNG or JPG, up to 5 MB.</p>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage.mutate({ file, kind: "avatar" });
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => avatarInput.current?.click()}
                disabled={uploadImage.isPending}
              >
                <Upload className="mr-2 size-4" /> Upload picture
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                value={form.first_name}
                maxLength={60}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                maxLength={60}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Display name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                maxLength={30}
                placeholder="e.g. dr.ramon"
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                maxLength={30}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={form.bio}
                placeholder="A short introduction shown to your team."
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{form.bio.length}/500</p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface-panel space-y-3 p-6">
            <h2 className="font-semibold">Account</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>
                  <Badge variant={emailVerified ? "default" : "secondary"} className="gap-1">
                    {emailVerified ? (
                      <BadgeCheck className="size-3.5" />
                    ) : (
                      <CircleAlert className="size-3.5" />
                    )}
                    {emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Account status</dt>
                <dd>
                  <Badge variant={accountActive ? "default" : "destructive"}>
                    {accountActive ? "Active" : "Inactive"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="mt-1 break-all font-mono text-xs">{user?.id ?? "—"}</dd>
              </div>
            </dl>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={removeAccount.isPending}>
                  <Trash2 className="mr-2 size-4" /> Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes your login and clinic memberships. Clinic records stay
                    with the organization. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my account</AlertDialogCancel>
                  <AlertDialogAction onClick={() => removeAccount.mutate()}>
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

          <section className="surface-panel space-y-4 p-6">
            <h2 className="font-semibold">Organization</h2>
            <div className="flex items-center gap-3">
              <Avatar className="size-14 rounded-lg">
                {logoUrl && <AvatarImage src={logoUrl} alt="Organization logo" />}
                <AvatarFallback className="rounded-lg">
                  {(clinic?.name ?? "V").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{clinic?.name ?? "No clinic selected"}</p>
                <p className="text-sm capitalize text-muted-foreground">{role ?? "—"}</p>
              </div>
            </div>
            {isAdmin && clinic && (
              <>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage.mutate({ file, kind: "logo" });
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInput.current?.click()}
                  disabled={uploadImage.isPending}
                >
                  <ImageUp className="mr-2 size-4" /> Upload logo
                </Button>
              </>
            )}

            <dl className="space-y-3 border-t pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Current plan</dt>
                <dd className="font-medium">
                  {subscription?.plans?.name ?? planQuery.data?.name ?? "Trial"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{clinic?.subscription_status ?? "trialing"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Renewal date</dt>
                <dd>{renewal}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link to="/app/subscription">Upgrade or downgrade plan</Link>
              </Button>
              {isAdmin && clinic?.stripe_subscription_id && (
                <Button
                  variant={subscription?.cancel_at_period_end ? "default" : "destructive"}
                  className="w-full"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(!subscription?.cancel_at_period_end)}
                >
                  {subscription?.cancel_at_period_end
                    ? "Resume subscription"
                    : "Cancel subscription"}
                </Button>
              )}
              {subscription?.cancel_at_period_end && (
                <p className="text-xs text-muted-foreground">
                  Access continues until {renewal}, then the subscription ends.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
