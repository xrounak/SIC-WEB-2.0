import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { storageUrl } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

/** Rebuilt at most once an hour; search engines do not need it fresher. */
export const revalidate = 3600;

/**
 * Pages whose content only changes when the site is edited. Bump this date when you
 * change their wording, so "last modified" stays honest (a date that changes on
 * every request teaches Google to ignore the field).
 */
const STATIC_UPDATED = "2026-11-05";

type Entry = MetadataRoute.Sitemap[number];
const newest = (...dates: Array<string | null | undefined>) =>
  dates.filter((d): d is string => Boolean(d)).sort().at(-1) ?? STATIC_UPDATED;

/**
 * Every public page: the fixed ones, then each published event, project and domain,
 * with its own last-modified date and cover picture. Reads with the public (anon)
 * key and no cookies, so it can be cached and never exposes anything RLS hides.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = (path: string, priority: number, changeFrequency: Entry["changeFrequency"], lastModified = STATIC_UPDATED): Entry => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });

  let events: Array<{ slug: string; updated_at: string; cover_path: string | null; status: string }> = [];
  let projects: Array<{ slug: string; updated_at: string; cover_path: string | null }> = [];
  let domains: Array<{ slug: string; updated_at: string }> = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const [e, p, d] = await Promise.all([
        supabase
          .from("events")
          .select("slug, updated_at, cover_path, status")
          .in("status", ["published", "completed"])
          .eq("visibility", "public")
          .not("slug", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase
          .from("projects")
          .select("slug, updated_at, cover_path")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase.from("domains").select("slug, updated_at").eq("is_active", true).order("sort_order"),
      ]);
      events = e.data ?? [];
      projects = p.data ?? [];
      domains = d.data ?? [];
    } catch {
      // Database unreachable: the fixed pages are still worth listing.
    }
  }

  const latestEvent = newest(...events.map((x) => x.updated_at));
  const latestProject = newest(...projects.map((x) => x.updated_at));

  return [
    fixed("/", 1, "weekly", newest(latestEvent, latestProject)),
    fixed("/events", 0.9, "daily", latestEvent),
    fixed("/projects", 0.8, "weekly", latestProject),
    fixed("/join", 0.8, "weekly"),
    fixed("/domains", 0.7, "monthly"),
    fixed("/about", 0.6, "monthly"),
    fixed("/contact", 0.5, "yearly"),
    fixed("/privacy", 0.2, "yearly"),
    fixed("/terms", 0.2, "yearly"),
    ...domains.map((d) => fixed(`/domains/${d.slug}`, 0.5, "monthly", d.updated_at)),
    ...events.map((e): Entry => {
      const cover = storageUrl(e.cover_path);
      return {
        url: absoluteUrl(`/events/${e.slug}`),
        lastModified: e.updated_at,
        // Upcoming events change often (seats, details); finished ones almost never.
        changeFrequency: e.status === "published" ? "weekly" : "yearly",
        priority: e.status === "published" ? 0.8 : 0.4,
        ...(cover ? { images: [cover] } : {}),
      };
    }),
    ...projects.map((p): Entry => {
      const cover = storageUrl(p.cover_path);
      return {
        url: absoluteUrl(`/projects/${p.slug}`),
        lastModified: p.updated_at,
        changeFrequency: "monthly",
        priority: 0.6,
        ...(cover ? { images: [cover] } : {}),
      };
    }),
  ];
}
