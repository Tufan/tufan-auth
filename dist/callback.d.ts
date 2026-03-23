import { NextResponse } from 'next/server';

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
declare function createCallbackHandler(options?: {
    redirectTo?: string;
    loginPath?: string;
    checkApproved?: boolean;
}): (request: Request) => Promise<NextResponse<unknown>>;

export { createCallbackHandler };
