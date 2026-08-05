import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Consumes an OAuth session returned in the URL hash (Google returns to the
 * site origin) and sends the signed-in user into the app. Token parsing and
 * storage are left entirely to the Supabase client.
 */
export function AuthSessionBridge() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;

    // Captured before touching the Supabase client, which consumes the hash.
    const rawHash = window.location.hash ?? "";
    const hadOAuthFragment = /(?:^|[#&])(access_token|refresh_token|error)=/.test(rawHash);

    const clearHash = () => {
      if (!hadOAuthFragment) return;
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    };

    const goToApp = () => {
      clearHash();
      if (window.location.pathname !== "/app") {
        navigate({ to: "/app", replace: true });
      }
    };

    const shouldRedirect = () =>
      hadOAuthFragment || window.location.pathname === "/auth";

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[auth] Failed to read session:", error.message);
          clearHash();
          return;
        }
        if (session && shouldRedirect()) {
          goToApp();
          return;
        }
        clearHash();
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
      if (
        event !== "SIGNED_IN" &&
        event !== "INITIAL_SESSION" &&
        event !== "TOKEN_REFRESHED"
      ) {
        return;
      }
      if (session && shouldRedirect()) goToApp();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, pathname]);

  return null;
}
