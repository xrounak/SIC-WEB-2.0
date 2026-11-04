import type { MetadataRoute } from "next";
import { getDomains, getPastEvents, getPublishedProjects, getUpcomingEvents } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

const STATIC: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/events", priority: 0.9, changeFrequency: "daily" },
  { path: "/projects", priority: 0.8, changeFrequency: "weekly" },
  { path: "/domains", priority: 0.7, changeFrequency: "monthly" },
  { path: "/join", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

/** Every public page, plus each published event, project and domain. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const [upcoming, past, projects, domains] = await Promise.all([
      getUpcomingEvents(500),
      getPastEvents(500),
      getPublishedProjects(500),
      getDomains(),
    ]);
    for (const e of [...upcoming, ...past]) {
      if (e.slug) entries.push({ url: absoluteUrl(`/events/${e.slug}`), lastModified: e.published_at ?? e.created_at, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const p of projects) {
      entries.push({ url: absoluteUrl(`/projects/${p.slug}`), lastModified: p.published_at ?? p.created_at, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const d of domains) {
      entries.push({ url: absoluteUrl(`/domains/${d.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch {
    // Database unreachable: the static pages are still worth listing.
  }
  return entries;
}
