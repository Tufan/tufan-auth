import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveCookieDomain } from "./cookie-domain";

/**
 * Creates a Supabase-aware Next.js middleware that refreshes auth tokens
 * and redirects unauthenticated users to /login.
 *
 * Usage in your app's middleware.ts:
 *
 *   export { middleware } from "tufan-auth/middleware";
 *   export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|login|auth).*)"] };
 *
 * Or for custom logic:
 *
 *   import { createAuthMiddleware } from "tufan-auth/middleware";
 *   export const middleware = createAuthMiddleware({ loginPath: "/login" });
 */
export function createAuthMiddleware(
  options: { loginPath?: string } = {}
) {
  const loginPath = options.loginPath || "/login";

  return async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // Scope auth cookies to the parent domain so sibling subdomains share the
    // same session and the browser can clear them at the same scope it wrote
    // them. COOKIE_DOMAIN overrides; otherwise derive from the request host
    // (x-forwarded-host on Vercel, falling back to host).
    const cookieDomain = resolveCookieDomain(
      request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(
                name,
                value,
                cookieDomain ? { ...options, domain: cookieDomain } : options
              )
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !request.nextUrl.pathname.startsWith(loginPath)) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  };
}

/** Pre-configured middleware with default /login redirect */
export const middleware = createAuthMiddleware();
