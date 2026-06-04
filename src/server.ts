import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { resolveCookieDomain } from "./cookie-domain";

export async function createClient() {
  const cookieStore = await cookies();
  // Scope auth cookies to the parent domain (e.g. ".tufan.co.uk") so sibling
  // subdomains (admin.tufan.co.uk, vault.tufan.co.uk, ...) share the same
  // session AND so the browser client can clear them at the same scope it
  // wrote them. COOKIE_DOMAIN overrides; otherwise derive from the request
  // host (x-forwarded-host on Vercel, falling back to host).
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const cookieDomain = resolveCookieDomain(host);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                cookieDomain ? { ...options, domain: cookieDomain } : options
              )
            );
          } catch {
            // Ignore errors in Server Components where cookies are read-only
          }
        },
      },
    }
  );
}

/**
 * Get the current session or return null.
 * Use in API routes and server components.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Require a valid session or throw a Response-compatible object.
 * Use in API route handlers:
 *
 *   const session = await requireSession();
 *   // if we get here, session is valid
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}
