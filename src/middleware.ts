import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

    // When COOKIE_DOMAIN is set (e.g. ".tufan.co.uk" in prod), Supabase auth
    // cookies are written on the parent domain so sibling subdomains share
    // the same session.
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

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
