# tufan-auth

Shared Supabase authentication package for Tufan family apps. Provides Google Workspace SSO with an approved-users gate, backed by a single Supabase project.

## Install

```bash
npm install github:Tufan/tufan-auth @supabase/ssr @supabase/supabase-js
```

## Environment variables

Every consuming app needs these two env vars (same values everywhere):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Setup in a Next.js app

### 1. Auth callback route

Create `app/auth/callback/route.ts`:

```ts
import { createCallbackHandler } from "tufan-auth/callback";

export const GET = createCallbackHandler({ redirectTo: "/" });
```

Options:
- `redirectTo` — where to send users after login (default: `"/"`)
- `loginPath` — where to redirect on failure (default: `"/login"`)
- `checkApproved` — check the `approved_users` table (default: `true`)

### 2. Protect routes with middleware

Create `src/middleware.ts`:

```ts
export { middleware } from "tufan-auth/middleware";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|auth).*)"],
};
```

Or customise:

```ts
import { createAuthMiddleware } from "tufan-auth/middleware";

export const middleware = createAuthMiddleware({ loginPath: "/login" });
```

### 3. Auth guard component (client-side)

Wrap protected layouts:

```tsx
import AuthGuard from "tufan-auth/guard";

export default function Layout({ children }) {
  return (
    <AuthGuard appName="My App" description="Sign in to continue.">
      {children}
    </AuthGuard>
  );
}
```

### 4. Protect API routes (server-side)

```ts
import { getSession } from "tufan-auth/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... handle request
}
```

Or use `requireSession()` which throws a 401 Response automatically:

```ts
import { requireSession } from "tufan-auth/server";

export async function GET() {
  const session = await requireSession();
  // session is guaranteed valid here
}
```

### 5. Client-side Supabase access

```ts
import { createClient } from "tufan-auth/client";

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
```

## Exports

| Import path | Purpose |
|---|---|
| `tufan-auth/client` | Browser Supabase client |
| `tufan-auth/server` | Server Supabase client, `getSession()`, `requireSession()` |
| `tufan-auth/middleware` | Next.js middleware with auth redirect |
| `tufan-auth/guard` | `<AuthGuard>` React component with Google sign-in |
| `tufan-auth/callback` | `createCallbackHandler()` for `/auth/callback` route |

## Supabase setup

The Supabase project needs:
- **Google OAuth provider** enabled (Authentication → Providers → Google)
- An `approved_users` table with an `email` text column
- Add family members' emails to `approved_users` to grant access

## Development

```bash
npm run build   # compile with tsup → dist/
```

After making changes, run `npm run build` and commit `dist/` before pushing — consumers install directly from GitHub and don't run a build step.
