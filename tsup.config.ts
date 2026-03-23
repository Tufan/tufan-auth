import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/client.ts", "src/guard.tsx"],
    format: ["esm"],
    dts: true,
    splitting: false,
    clean: true,
    external: [
      "react",
      "next",
      "next/server",
      "next/headers",
      "@supabase/ssr",
      "@supabase/supabase-js",
    ],
    banner: { js: '"use client";' },
  },
  {
    entry: ["src/server.ts", "src/middleware.ts", "src/callback.ts"],
    format: ["esm"],
    dts: true,
    splitting: false,
    clean: false,
    external: [
      "react",
      "next",
      "next/server",
      "next/headers",
      "@supabase/ssr",
      "@supabase/supabase-js",
    ],
  },
]);
