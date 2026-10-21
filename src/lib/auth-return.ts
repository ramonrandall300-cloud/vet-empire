export function authReturnKind(pathname: string, hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (pathname === "/reset-password" || params.get("type") === "recovery") return "recovery";
  if (params.has("error") || params.has("error_code")) return "error";
  if (pathname === "/auth/callback" || params.has("access_token") || params.has("refresh_token")) return "callback";
  return "none";
}

export function shouldEnterApp(kind: ReturnType<typeof authReturnKind>, pathname: string, event?: string) {
  if (kind === "recovery" || kind === "error") return false;
  return kind === "callback" || pathname === "/auth" || (pathname === "/" && event === "SIGNED_IN");
}