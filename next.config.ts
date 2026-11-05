import type { NextConfig } from "next";

// Old addresses (for example the *.vercel.app one) can be sent to the main domain so
// search engines see a single site. Set SITE_REDIRECT_HOSTS="a.vercel.app,b.vercel.app"
// and NEXT_PUBLIC_SITE_URL in Vercel once the main domain is working.
const redirectHosts = (process.env.SITE_REDIRECT_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
const mainSite = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    if (!mainSite || redirectHosts.length === 0) return [];
    return redirectHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${mainSite}/:path*`,
      permanent: true,
    }));
  },
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
