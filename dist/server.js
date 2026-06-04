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

// src/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

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

// src/server.ts
async function createClient() {
  var _a;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = (_a = headerStore.get("x-forwarded-host")) != null ? _a : headerStore.get("host");
  const cookieDomain = resolveCookieDomain(host);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => cookieStore.set(
                name,
                value,
                cookieDomain ? __spreadProps(__spreadValues({}, options), { domain: cookieDomain }) : options
              )
            );
          } catch (e) {
          }
        }
      }
    }
  );
}
async function getSession() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session;
}
async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return session;
}
export {
  createClient,
  getSession,
  requireSession
};
