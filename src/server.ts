import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  // When COOKIE_DOMAIN is set (e.g. ".tufan.co.uk" in prod), Supabase auth
  // cookies are written on the parent domain so sibling subdomains
  // (admin.tufan.co.uk, vault.tufan.co.uk, ...) share the same session.
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
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
