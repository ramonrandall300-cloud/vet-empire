import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  PawPrint,
  Calendar,
  Users,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    agreeTerms: z.boolean().refine((v) => v, "You must agree to the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

type Tab = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    oauth_error: typeof search["oauth_error"] === "string" ? (search["oauth_error"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — Vetigo for Clinics" },
      {
        name: "description",
        content:
          "Sign in or create a Vetigo account for your veterinary clinic. Manage appointments, patients, and billing in one place.",
      },
      { property: "og:title", content: "Sign In — Vetigo for Clinics" },
      {
        property: "og:description",
        content: "Veterinary practice management software built for clinics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});


function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [tab, setTab] = useState<Tab>("signin");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});

  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [signUpErrors, setSignUpErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [oauthError, setOauthError] = useState<string | null>(search.oauth_error ?? null);

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

  // A failed managed OAuth attempt can also land directly on /auth with an error hash.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (!params.get("error")) return;
    setOauthError(
      params.get("error_description")?.replace(/\+/g, " ") ?? params.get("error") ?? "Google sign-in failed",
    );
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  async function handleGoogle(retry = false) {
    setBusy(true);
    setOauthError(null);

    if (retry) {
      // Drop any spent authorization code / stale OAuth state before starting over,
      // and force Google to issue a brand-new code instead of silently reusing consent.
      window.history.replaceState(null, "", "/auth");
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* no local session to clear */
      }
      for (const store of [window.localStorage, window.sessionStorage]) {
        for (const key of Object.keys(store)) {
          if (/oauth|pkce|code[-_]?verifier|lovable[-_]auth/i.test(key)) store.removeItem(key);
        }
      }
    }

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      ...(retry ? { extraParams: { prompt: "select_account consent" } } : {}),
    });
    if (result.error) {
      setBusy(false);
      const message = result.error.message ?? "Google sign-in failed";
      setOauthError(message);
      toast.error(message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app", replace: true });
  }


  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const result = signInSchema.safeParse(signInForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0];
        if (typeof key === "string") errors[key] = err.message;
      });
      setSignInErrors(errors);
      return;
    }
    setSignInErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInForm.email,
      password: signInForm.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/app", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const result = signUpSchema.safeParse(signUpForm);
    if (!result.success) {
      const errors: {
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        agreeTerms?: string;
      } = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0];
        if (typeof key === "string") (errors as Record<string, string>)[key] = err.message;
      });
      setSignUpErrors(errors);
      return;
    }
    setSignUpErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signUpForm.fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSignedUpEmail(signUpForm.email);
    toast.success("Account created. Check your email to confirm.");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const result = forgotSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      setForgotError(result.error.errors[0]?.message ?? "Invalid email");
      return;
    }
    setForgotError("");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
  }

  if (signedUpEmail) {
    return (
      <main className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />
        <div className="relative flex items-center justify-center p-6">
          <Link
            to="/"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10">
                <Mail className="size-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{signedUpEmail}</span>. Click it to
                activate your clinic account, then sign in below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setSignedUpEmail(null)}>
                Back to sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="relative flex flex-col items-center justify-center p-6">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {tab === "signin" ? "Welcome back" : "Start your clinic trial"}
            </CardTitle>
            <CardDescription>
              {tab === "signin"
                ? "Sign in to manage your veterinary clinic."
                : "Create an account and onboard your first clinic free for 30 days."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6 flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  tab === "signin" ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  tab === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                Sign up
              </button>

            {oauthError && (
              <div className="mb-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <RefreshCw className="mt-0.5 size-4 shrink-0" />
                  <span>Google sign-in didn&apos;t complete: {oauthError}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={busy}
                  onClick={() => void handleGoogle(true)}
                >
                  {busy ? "Retrying…" : "Retry Google sign-in"}
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="mb-4 w-full"
              disabled={busy}
              onClick={() => void handleGoogle()}
            >

              <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>


            {tab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="si-email"
                      type="email"
                      placeholder="you@clinic.com"
                      className="pl-10"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  {signInErrors.email && (
                    <p className="text-xs text-destructive">{signInErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="si-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {signInErrors.password && (
                    <p className="text-xs text-destructive">{signInErrors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-name"
                      placeholder="Dr. Jane Smith"
                      className="pl-10"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm((f) => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  {signUpErrors.fullName && (
                    <p className="text-xs text-destructive">{signUpErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="you@clinic.com"
                      className="pl-10"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  {signUpErrors.email && (
                    <p className="text-xs text-destructive">{signUpErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {signUpErrors.password && (
                    <p className="text-xs text-destructive">{signUpErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-confirm">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={signUpForm.confirmPassword}
                      onChange={(e) =>
                        setSignUpForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {signUpErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{signUpErrors.confirmPassword}</p>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={signUpForm.agreeTerms}
                    onCheckedChange={(v) => setSignUpForm((f) => ({ ...f, agreeTerms: v === true }))}
                  />
                  <span className="text-sm leading-tight">
                    I agree to the{" "}
                    <Link to="/terms" className="font-medium text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-medium text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {signUpErrors.agreeTerms && (
                  <p className="text-xs text-destructive">{signUpErrors.agreeTerms}</p>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create clinic account"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleForgot}>
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                Enter your email and we&apos;ll send you a link to set a new password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="you@clinic.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {forgotError && <p className="text-xs text-destructive">{forgotError}</p>}
              </div>
              {forgotSent && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="size-4" />
                  Reset link sent. Check your inbox.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={busy || forgotSent}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function BrandPanel() {
  const features = [
    { icon: Calendar, text: "Appointments & scheduling" },
    { icon: Users, text: "Customer & patient records" },
    { icon: Stethoscope, text: "Examinations & vaccinations" },
  ];

  return (
    <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <PawPrint className="size-7" />
        Vetigo
      </div>

      <div>
        <h2 className="text-3xl font-semibold leading-tight">
          Practice management software built for veterinary teams.
        </h2>
        <p className="mt-4 max-w-md text-primary-foreground/80">
          Run appointments, patient records, vaccination reminders, inventory, and billing across
          every clinic you operate — from one central console.
        </p>

        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary-foreground/10">
                <f.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-primary-foreground/70">
        Trusted by independent practices and multi-location clinic groups.
      </p>
    </div>
  );
}
