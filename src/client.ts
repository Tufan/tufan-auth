import { createBrowserClient } from "@supabase/ssr";
import { resolveCookieDomain } from "./cookie-domain";

// Auto-derive the parent domain so the browser client writes (and, crucially,
// CLEARS) cookies on the same scope the server middleware does. Without this,
// signOut() only clears cookies at the current host scope (e.g. vault.tufan.co.uk)
// while session cookies were actually written on the parent (.tufan.co.uk),
// leaving stale invalidated cookies that drive auth-state confusion and
// redirect loops between /login and /. COOKIE_DOMAIN still overrides if set.

export function createClient() {
  const host = typeof window === "undefined" ? undefined : window.location.hostname;
  const cookieDomain = resolveCookieDomain(host);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  );
}
