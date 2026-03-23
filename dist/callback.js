// src/callback.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
function createCallbackHandler(options = {}) {
  const redirectTo = options.redirectTo || "/";
  const loginPath = options.loginPath || "/login";
  const checkApproved = options.checkApproved !== false;
  return async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(`${origin}${loginPath}?error=no_code`);
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({ name, value, options: options2 }) => cookieStore.set(name, value, options2)
            );
          }
        }
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(
        `${origin}${loginPath}?error=auth_failed`
      );
    }
    if (checkApproved) {
      const { data: approved } = await supabase.from("approved_users").select("email").eq("email", data.user.email).single();
      if (!approved) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}${loginPath}?error=unauthorized`
        );
      }
    }
    return NextResponse.redirect(`${origin}${redirectTo}`);
  };
}
export {
  createCallbackHandler
};
