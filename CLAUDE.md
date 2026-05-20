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

## `COOKIE_DOMAIN` for cross-subdomain SSO

When set (e.g. `.tufan.co.uk`), Supabase auth cookies are written on the parent domain so sibling subdomains share the same signed-in session.

The override is plumbed through **all four** cookie-writing paths — if any one misses it, you'll end up with same-named cookies on two different scopes coexisting in the browser, and sign-out clears the wrong half. Symptoms: signing into vault doesn't sign you into admin (or vice versa), or `/login` ↔ `/` redirect loops on siblings.

Paths covered:

1. `src/middleware.ts` — token refresh on every request. Reads `COOKIE_DOMAIN`, threads `domain` onto every `supabaseResponse.cookies.set` call.
2. `src/server.ts` — `createClient()` for page handlers / API routes. Same thing on `cookieStore.set`.
3. `src/callback.ts` — `createCallbackHandler()` for the OAuth callback. Same thing on the `setAll` inside `exchangeCodeForSession`. Without this, fresh sign-ins still produce per-host cookies even though refresh writes go to the parent.
4. `src/client.ts` — `createClient()` for the browser. Auto-derives `cookieOptions.domain` from `window.location.hostname` (parent domain) so `signOut()` clears cookies at the SAME scope they were written. No env var needed on the browser side — derivation handles it. Skipped for localhost / IPs / single-label hosts.

Server-side (paths 1–3): leave `COOKIE_DOMAIN` unset locally so localhost dev keeps default per-host cookies. In prod, set it to `.tufan.co.uk` on every Vercel project.

Caveats:
- Switching `COOKIE_DOMAIN` on (or rotating it) doesn't migrate existing sessions. They keep working on the subdomain that wrote them but won't be visible to siblings until the next sign-out + sign-in. Existing cookies under both scopes can coexist — clear them explicitly during transitions.
- Vercel does NOT auto-redeploy on env-var changes. After setting it, push a commit or trigger a redeploy from the dashboard.
- Consumers that bypass tufan-auth (use their own `createServerClient`/`createBrowserClient` directly — e.g. admin) must apply the same plumbing in their own files.
