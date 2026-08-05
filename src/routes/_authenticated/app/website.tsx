import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/website")({
  head: () => ({
    meta: [
      { title: "Website Management — SmartVet" },
      { name: "description", content: "Publish a public page for your clinic in a few clicks." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Website />
    </RequireClinic>
  ),
});

type WebsiteForm = {
  headline: string;
  tagline: string;
  about: string;
  contact_email: string;
  contact_phone: string;
  hero_image_url: string;
  is_published: boolean;
};

const EMPTY: WebsiteForm = {
  headline: "",
  tagline: "",
  about: "",
  contact_email: "",
  contact_phone: "",
  hero_image_url: "",
  is_published: false,
};

function Website() {
  const { clinic } = useClinic();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WebsiteForm>(EMPTY);

  const { data } = useQuery({
    queryKey: ["clinic-website", clinic?.id],
    enabled: Boolean(clinic?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_websites")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      headline: data.headline ?? "",
      tagline: data.tagline ?? "",
      about: data.about ?? "",
      contact_email: data.contact_email ?? "",
      contact_phone: data.contact_phone ?? "",
      hero_image_url: data.hero_image_url ?? "",
      is_published: data.is_published,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        clinic_id: clinic!.id,
        headline: form.headline || null,
        tagline: form.tagline || null,
        about: form.about || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        hero_image_url: form.hero_image_url || null,
        is_published: form.is_published,
      };
      const { error } = await supabase
        .from("clinic_websites")
        .upsert(payload, { onConflict: "clinic_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Website saved");
      void queryClient.invalidateQueries({ queryKey: ["clinic-website"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const field = (key: keyof WebsiteForm) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div>
      <PageHeader
        title="Website Management"
        description="Your clinic's public-facing page, powered by the same data."
        actions={
          <Button variant="outline" asChild>
            <a href={`/c/${clinic?.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Preview
            </a>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-panel space-y-5 p-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-sm text-muted-foreground">
                Visitors can reach your page at /c/{clinic?.slug}
              </p>
            </div>
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" placeholder="Compassionate care for every pet" {...field("headline")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" placeholder="Open 7 days a week" {...field("tagline")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">About the clinic</Label>
            <Textarea id="about" rows={6} {...field("about")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact email</Label>
              <Input id="contact_email" type="email" {...field("contact_email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact phone</Label>
              <Input id="contact_phone" {...field("contact_phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero">Hero image URL</Label>
            <Input id="hero" placeholder="https://…" {...field("hero_image_url")} />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save website"}
          </Button>
        </section>

        <section className="surface-panel overflow-hidden">
          <div className="flex items-center gap-2 border-b p-4">
            <Globe className="size-4 text-primary" />
            <span className="text-sm font-medium">Live preview</span>
            <Badge variant={form.is_published ? "default" : "secondary"} className="ml-auto">
              {form.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          {form.hero_image_url ? (
            <img
              src={form.hero_image_url}
              alt={`${clinic?.name} clinic`}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="h-40 w-full bg-accent" />
          )}
          <div className="space-y-3 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{clinic?.name}</p>
            <h2 className="text-xl font-semibold">
              {form.headline || "Your headline appears here"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {form.tagline || "Add a short tagline to introduce your clinic."}
            </p>
            <p className="text-sm leading-relaxed">
              {form.about || "Tell pet owners about your team, facilities and specialities."}
            </p>
            <div className="border-t pt-3 text-sm text-muted-foreground">
              <p>{form.contact_email || clinic?.email || "—"}</p>
              <p>{form.contact_phone || clinic?.phone || "—"}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
