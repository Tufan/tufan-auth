import * as _supabase_auth_js from '@supabase/auth-js';
import * as _supabase_supabase_js from '@supabase/supabase-js';

declare function createClient(): Promise<_supabase_supabase_js.SupabaseClient<any, "public", "public", any, any>>;
/**
 * Get the current session or return null.
 * Use in API routes and server components.
 */
declare function getSession(): Promise<_supabase_auth_js.Session | null>;
/**
 * Require a valid session or throw a Response-compatible object.
 * Use in API route handlers:
 *
 *   const session = await requireSession();
 *   // if we get here, session is valid
 */
declare function requireSession(): Promise<_supabase_auth_js.Session>;

export { createClient, getSession, requireSession };
