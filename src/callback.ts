import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Creates the auth callback GET handler.
 *
 * Usage in your app's app/auth/callback/route.ts:
 *
 *   import { createCallbackHandler } from "tufan-auth/callback";
 *   export const GET = createCallbackHandler({ redirectTo: "/" });
 *
 * Options:
 *   - redirectTo: where to send the user after successful login (default: "/")
 *   - loginPath: where to send the user on failure (default: "/login")
 *   - checkApproved: whether to check the approved_users table (default: true)
 */
export function createCallbackHandler(
  options: {
    redirectTo?: string;
    loginPath?: string;
    checkApproved?: boolean;
  } = {}
) {
  const redirectTo = options.redirectTo || "/";
  const loginPath = options.loginPath || "/login";
  const checkApproved = options.checkApproved !== false;

  return async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${origin}${loginPath}?error=no_code`);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(
        `${origin}${loginPath}?error=auth_failed`
      );
    }

    if (checkApproved) {
      const { data: approved } = await supabase
        .from("approved_users")
        .select("email")
        .eq("email", data.user.email!)
        .single();

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
