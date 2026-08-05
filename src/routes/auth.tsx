import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Operator Sign In — Vetigo Console" },
      {
        name: "description",
        content:
          "Sign in to the Vetigo operator console to run appointments, patients and billing across every clinic.",
      },
      { property: "og:title", content: "Operator Sign In — Vetigo Console" },
      {
        property: "og:description",
        content: "Private staff sign-in for the Vetigo clinic network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/app", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    navigate({ to: "/app", replace: true });
  }




  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <PawPrint className="size-6" /> Vetigo
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            One console, every clinic you operate.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Appointments, patient records, vaccination reminders, inventory and billing — managed
            centrally, isolated per clinic.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Internal operator access only.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Operator sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts are created by the platform operator. Contact the operator if you need access.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="si-email">Email</Label>
              <Input
                id="si-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-password">Password</Label>
              <Input
                id="si-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={signIn} disabled={busy}>
              Sign in
            </Button>
          </div>

        
        </div>
      </div>
    </main>
  );
}
