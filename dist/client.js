"use client";

// src/client.ts
import { createBrowserClient } from "@supabase/ssr";
function deriveCookieDomain() {
  if (typeof window === "undefined") return void 0;
  const host = window.location.hostname;
  if (host === "localhost" || /^[\d.]+$/.test(host) || !host.includes(".")) {
    return void 0;
  }
  return "." + host.split(".").slice(1).join(".");
}
function createClient() {
  const cookieDomain = deriveCookieDomain();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : void 0
  );
}
export {
  createClient
};
