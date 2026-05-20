import { createBrowserClient } from "@supabase/ssr";

// Auto-derive the parent domain so the browser client writes (and, crucially,
// CLEARS) cookies on the same scope the server middleware does. Without this,
// signOut() only clears cookies at the current host scope (e.g. vault.tufan.co.uk)
// while session cookies were actually written on the parent (.tufan.co.uk),
// leaving stale invalidated cookies that drive auth-state confusion and
// redirect loops between /login and /.
function deriveCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  // Skip localhost, raw IPs, and single-label hosts.
  if (host === "localhost" || /^[\d.]+$/.test(host) || !host.includes(".")) {
    return undefined;
  }
  return "." + host.split(".").slice(1).join(".");
}

export function createClient() {
  const cookieDomain = deriveCookieDomain();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  );
}
