import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages are open; account, admin, API and sign-in pages are kept out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal", "/manage", "/api/", "/auth/", "/login", "/onboarding", "/invite/", "/join/apply", "/events/*/register"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
