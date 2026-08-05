import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, PawPrint, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/c/$slug")({
  head: () => ({
    meta: [
      { title: "Veterinary Clinic — SmartVet" },
      {
        name: "description",
        content: "Opening hours, services and contact details for this veterinary clinic.",
      },
      { property: "og:title", content: "Veterinary Clinic — SmartVet" },
      {
        property: "og:description",
        content: "Book an appointment and meet the team at this SmartVet clinic.",
      },
    ],
  }),
  component: ClinicSite,
});

function ClinicSite() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["public-clinic", slug],
    queryFn: async () => {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("id, name, city, country, address, phone, email, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (!clinic) return null;
      const { data: site } = await supabase
        .from("clinic_websites")
        .select("id, clinic_id, is_published, headline, tagline, about, hero_image_url, primary_color, social_links")
        .eq("clinic_id", clinic.id)
        .eq("is_published", true)
        .maybeSingle();
      const { data: services } = await supabase
        .from("services")
        .select("name, description, price")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .limit(6);
      return { clinic, site, services: services ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>
    );
  }

  if (!data?.clinic || !data.site) {
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <PawPrint className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">This page isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The clinic hasn't published a public website yet.
          </p>
        </div>
      </div>
    );
  }

  const { clinic, site, services } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-5 font-semibold">
          <PawPrint className="size-5 text-primary" /> {clinic.name}
        </div>
      </header>

      {site.hero_image_url && (
        <img src={site.hero_image_url} alt={clinic.name} className="h-64 w-full object-cover" />
      )}

      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">{site.headline ?? clinic.name}</h1>
        {site.tagline && <p className="mt-3 text-lg text-muted-foreground">{site.tagline}</p>}
        {site.about && <p className="mt-6 max-w-3xl leading-relaxed">{site.about}</p>}

        {services.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Our services</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <article key={s.name} className="surface-panel p-5">
                  <h3 className="font-medium">{s.name}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="surface-panel mt-12 grid gap-4 p-6 sm:grid-cols-3">
          <p className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-primary" />
            {site.contact_phone ?? clinic.phone ?? "—"}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-primary" />
            {site.contact_email ?? clinic.email ?? "—"}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-primary" />
            {[clinic.address, clinic.city, clinic.country].filter(Boolean).join(", ") || "—"}
          </p>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Powered by SmartVet
      </footer>
    </div>
  );
}
