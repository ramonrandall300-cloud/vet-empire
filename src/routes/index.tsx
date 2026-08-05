import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Lock, PawPrint, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartVet Operator Console — Internal Clinic Management" },
      {
        name: "description",
        content:
          "Private operator console for the SmartVet clinic network. Staff sign-in only — no public registration.",
      },
      { property: "og:title", content: "SmartVet Operator Console" },
      {
        property: "og:description",
        content: "Internal console used to run and monitor every clinic on the SmartVet network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gate,
});

function Gate() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex items-center justify-center gap-2 text-lg font-semibold">
          <PawPrint className="size-6 text-primary" /> SmartVet
        </span>

        <div className="surface-panel mt-8 p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Lock className="size-5" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Operator console</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This is a private console for running the clinics on our network. Access is granted by
            the platform operator — there is no public sign-up.
          </p>

          <Button className="mt-7 w-full" size="lg" asChild>
            <Link to={signedIn ? "/app" : "/auth"}>
              {signedIn ? "Open console" : "Sign in to console"}
            </Link>
          </Button>

          <div className="mt-7 space-y-2 text-left text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" /> Unlimited clinics, one operator
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Each clinic isolated by row-level
              security
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SmartVet — internal use only
        </p>
      </div>
    </main>
  );
}
