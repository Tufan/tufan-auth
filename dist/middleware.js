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

// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// src/cookie-domain.ts
function parentDomainFromHost(host) {
  if (!host) return void 0;
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname) return void 0;
  if (hostname === "localhost" || /^[\d.]+$/.test(hostname) || !hostname.includes(".")) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) return void 0;
  return "." + parts.slice(1).join(".");
}
function resolveCookieDomain(host) {
  const override = process.env.COOKIE_DOMAIN;
  if (override) return override;
  return parentDomainFromHost(host);
}

// src/middleware.ts
function createAuthMiddleware(options = {}) {
  const loginPath = options.loginPath || "/login";
  return async function middleware2(request) {
    var _a;
    let supabaseResponse = NextResponse.next({ request });
    const cookieDomain = resolveCookieDomain(
      (_a = request.headers.get("x-forwarded-host")) != null ? _a : request.headers.get("host")
    );
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
              ({ name, value }) => request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(
              ({ name, value, options: options2 }) => supabaseResponse.cookies.set(
                name,
                value,
                cookieDomain ? __spreadProps(__spreadValues({}, options2), { domain: cookieDomain }) : options2
              )
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
