import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PawPrint, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Vetigo" },
      {
        name: "description",
        content: "Set a new password for your Vetigo clinic account.",
      },
      { property: "og:title", content: "Reset Password — Vetigo" },
      {
        property: "og:description",
        content: "Set a new password for your Vetigo clinic account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      setInvalid(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = resetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errs: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0];
        if (typeof key === "string") (errs as Record<string, string>)[key] = err.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <PawPrint className="size-7" />
          Vetigo
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Secure access for your clinic.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Choose a strong password to keep your patient records, appointments, and billing data
            safe.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">
          Trusted by independent practices and multi-location clinic groups.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>Create a new password for your Vetigo account.</CardDescription>
          </CardHeader>
          <CardContent>
            {invalid && !done ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-destructive">
                  This password reset link is invalid or has expired. Please request a new one from
                  the sign-in page.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Back to sign in</Link>
                </Button>
              </div>
            ) : done ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/10">
                  <CheckCircle2 className="size-7 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rp-password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="rp-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rp-confirm">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="rp-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
