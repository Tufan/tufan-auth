// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
function createAuthMiddleware(options = {}) {
  const loginPath = options.loginPath || "/login";
  return async function middleware2(request) {
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({ name, value, options: options2 }) => request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(
              ({ name, value, options: options2 }) => supabaseResponse.cookies.set(name, value, options2)
            );
          }
        }
      }
    );
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user && !request.nextUrl.pathname.startsWith(loginPath)) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  };
}
var middleware = createAuthMiddleware();
export {
  createAuthMiddleware,
  middleware
};
