import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nearly every page reads the Supabase session cookie, so pages render per request.
  // Cache Components would require a Suspense boundary around every session read.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
