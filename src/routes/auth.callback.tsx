import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirming Your Account — Vetigo" },
      { name: "description", content: "Complete email verification and securely sign in to your Vetigo clinic account." },
      { property: "og:title", content: "Confirming Your Account — Vetigo" },
      { property: "og:description", content: "Complete your Vetigo account verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
      <h1 className="text-xl font-semibold">Confirming your Vetigo account…</h1>
      <Button asChild variant="outline"><Link to="/auth">Back to sign in</Link></Button>
    </main>
  ),
});