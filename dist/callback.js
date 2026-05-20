var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
    const cookieDomain = process.env.COOKIE_DOMAIN || void 0;
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
              ({ name, value, options: options2 }) => cookieStore.set(
                name,
                value,
                cookieDomain ? __spreadProps(__spreadValues({}, options2), { domain: cookieDomain }) : options2
              )
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
