# tufan-auth

Shared Supabase auth package consumed by all Tufan family Next.js apps via `github:Tufan/tufan-auth`.

## Architecture

- **Single Supabase project** handles auth for all apps (admin, vault, meal planner, etc.)
- **Google OAuth SSO** — any Google account can attempt sign-in; access is gated by the `approved_users` table, not by domain
- **`approved_users` table** in Supabase gates access — only listed emails can log in
- Compiled with **tsup** to ESM — consumers get pre-built JS from `dist/`

## Source files

- `src/client.ts` — browser Supabase client (`createBrowserClient`)
- `src/server.ts` — server Supabase client with cookie handling, `getSession()`, `requireSession()`
- `src/middleware.ts` — Next.js middleware that refreshes tokens and redirects unauthenticated users
- `src/guard.tsx` — `<AuthGuard>` React component with loading state and Google sign-in button
- `src/callback.ts` — `createCallbackHandler()` factory for the `/auth/callback` route

## Build

```bash
npm run build
```

This compiles `src/` → `dist/` using tsup. The `dist/` directory is committed to git because consumers install from GitHub without a build step.

**Always run `npm run build` and commit `dist/` after changing source files.**

## tsup config

- Client-side files (`client.ts`, `guard.tsx`) get `"use client"` banner
- Server-side files (`server.ts`, `middleware.ts`, `callback.ts`) have no banner
- All peer dependencies (`next`, `react`, `@supabase/*`) are externalized

## Key patterns

- Auth callback exchanges the Supabase code for a session, checks `approved_users`, and redirects
- Middleware uses `supabase.auth.getUser()` (not `getSession`) for secure server-side validation
- The `AuthGuard` component subscribes to `onAuthStateChange` for reactive session updates
- `requireSession()` throws a `Response` object — catch it in the route handler or let Next.js handle it

## Consuming apps

Each app needs:
1. `npm install github:Tufan/tufan-auth @supabase/ssr @supabase/supabase-js`
2. Two env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. An `/auth/callback` route using `createCallbackHandler()`
4. Middleware or `<AuthGuard>` (or both) for protection

## Cookie domain / cross-subdomain SSO

Supabase auth cookies are written on the **parent domain** (e.g. `.tufan.co.uk`) so sibling subdomains (admin, vault, …) share one signed-in session, and so the browser can *clear* a cookie at the same scope it was written.

**The parent domain is auto-derived from the request host on every cookie-writing path** — no env var required. `COOKIE_DOMAIN`, if set, is an explicit **override** (it always wins). The shared logic lives in `src/cookie-domain.ts` (`resolveCookieDomain(host)`): if `COOKIE_DOMAIN` is set use it, else derive the parent from `host`. Derivation needs **3+ labels** (so `sub.domain.tld` → `.domain.tld`, but a bare `domain.tld` yields nothing rather than an over-broad `.tld`), and is skipped for localhost / raw IPs / single-label hosts.

Why it matters: if the server wrote host-scoped cookies while the browser wrote/cleared parent-scoped ones (or vice versa), the two coexist, server and browser disagree about whether a session exists, and you get same-named cookies on two scopes → **`/login` ↔ `/` redirect loops** on siblings, or "signing into vault doesn't sign you into admin." Deriving the *same* scope everywhere makes that impossible regardless of env config. (This is exactly the loop that hit vault.tufan.co.uk in Jun 2026 — see vault-mcp `CLAUDE.md`.)

All four paths use `resolveCookieDomain(host)`:

1. `src/middleware.ts` — token refresh on every request. Host from `x-forwarded-host` ?? `host`.
2. `src/server.ts` — `createClient()` for page handlers / API routes. Host from `next/headers` (`x-forwarded-host` ?? `host`).
3. `src/callback.ts` — `createCallbackHandler()` for the OAuth callback. Host from the request headers.
4. `src/client.ts` — browser `createClient()`. Host from `window.location.hostname`.

**`dist/` is committed.** After editing `src/`, run `npm run build`, commit `dist/`, push, then `npm update tufan-auth` + redeploy the consumer.

Caveats:
- `COOKIE_DOMAIN` is now optional. You generally **don't need to set it** — leave it unset and the host-derivation handles prod and localhost alike (localhost derives nothing → default per-host cookies, which is correct for dev). Set it only to pin an exact non-derivable scope.
- Switching the effective scope (e.g. first rollout, or setting/rotating `COOKIE_DOMAIN`) doesn't migrate existing sessions: old cookies keep working on the subdomain that wrote them but aren't visible to siblings until a sign-out + sign-in. Both scopes can coexist in a browser; a user stuck mid-transition can clear them via the consumer's `/auth/reset` page (vault + admin both have one).
- Vercel does NOT auto-redeploy on env-var changes — redeploy after any `COOKIE_DOMAIN` change.
- Consumers that bypass tufan-auth (their own `createServerClient`/`createBrowserClient` — e.g. admin) must apply equivalent scoping in their own files.
