"use client";

// src/client.ts
import { createBrowserClient } from "@supabase/ssr";

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

// src/client.ts
function createClient() {
  const host = typeof window === "undefined" ? void 0 : window.location.hostname;
  const cookieDomain = resolveCookieDomain(host);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : void 0
  );
}
export {
  createClient
};
