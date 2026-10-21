import { useEffect } from "react";
import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authReturnKind, shouldEnterApp } from "@/lib/auth-return";

/**
 * Consumes an OAuth session returned in the URL hash (Google returns to the
 * site origin) and sends the signed-in user into the app. Token parsing and
 * storage are left entirely to the Supabase client.
 */
export function AuthSessionBridge() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    let redirected = false;

    // Captured before touching the Supabase client, which consumes the hash.
    const rawHash = window.location.hash ?? "";
    const returnKind = authReturnKind(window.location.pathname, rawHash);
    const hadOAuthFragment = returnKind === "callback" || returnKind === "error";

    const clearHash = () => {
      if (!hadOAuthFragment) return;
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    };

    const goToApp = () => {
      if (cancelled || redirected) return;
      redirected = true;
      clearHash();
      if (window.location.pathname !== "/app") {
        navigate({ to: "/app", replace: true });
      }
    };

    const failVerification = () => {
      if (cancelled || redirected) return;
      redirected = true;
      clearHash();
      toast.error("This verification link has expired or could not be completed. Please sign in or request a new link.");
      void navigate({ to: "/auth", replace: true });
    };

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (cancelled) return;
        if (error || returnKind === "error") {
          if (returnKind === "callback" || returnKind === "error") failVerification();
          return;
        }
        if (session && shouldEnterApp(returnKind, window.location.pathname)) {
          goToApp();
          return;
        }
        if (!session && returnKind === "callback") {
          failVerification();
          return;
        }
        if (returnKind === "callback" || returnKind === "error") failVerification();
      })
      .catch((err: unknown) => {
        console.error(
          "[auth] Unexpected error reading session:",
          err instanceof Error ? err.message : String(err),
        );
        clearHash();
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Defer work until the auth notification finishes; subscribers must not
        // synchronously trigger fresh auth reads while initialization is running.
        window.setTimeout(() => {
          if (cancelled) return;
          void router.invalidate();
          if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
        }, 0);
      }
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          shouldEnterApp(returnKind, window.location.pathname, event)) {
        window.setTimeout(goToApp, 0);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, pathname, queryClient, router]);

  return null;
}
