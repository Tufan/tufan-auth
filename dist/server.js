// src/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
async function createClient() {
  const cookieStore = await cookies();
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
              ({ name, value, options }) => cookieStore.set(name, value, options)
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
