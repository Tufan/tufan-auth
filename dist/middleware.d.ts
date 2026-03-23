import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase-aware Next.js middleware that refreshes auth tokens
 * and redirects unauthenticated users to /login.
 *
 * Usage in your app's middleware.ts:
 *
 *   export { middleware } from "tufan-auth/middleware";
 *   export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|login|auth).*)"] };
 *
 * Or for custom logic:
 *
 *   import { createAuthMiddleware } from "tufan-auth/middleware";
 *   export const middleware = createAuthMiddleware({ loginPath: "/login" });
 */
declare function createAuthMiddleware(options?: {
    loginPath?: string;
}): (request: NextRequest) => Promise<NextResponse<unknown>>;
/** Pre-configured middleware with default /login redirect */
declare const middleware: (request: NextRequest) => Promise<NextResponse<unknown>>;

export { createAuthMiddleware, middleware };
