import type { Metadata } from "next";

/** The public address search engines should use. Override with NEXT_PUBLIC_SITE_URL. */
const DEFAULT_SITE_URL = "https://sic-gecp.vercel.app";

function resolveSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const isLocal = !fromEnv || /localhost|127\.0\.0\.1/.test(fromEnv);
  // A production build must never advertise localhost as its canonical address.
  if (process.env.NODE_ENV === "production" && isLocal) return DEFAULT_SITE_URL;
  return fromEnv || DEFAULT_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "SIC · Science & Innovation Club, GEC Palamu";
export const SITE_SHORT_NAME = "SIC GEC Palamu";
export const SITE_DESCRIPTION =
  "The Science & Innovation Club of Government Engineering College, Palamu: projects, workshops, hackathons and a community of builders in mechanical, civil, IoT and robotics, and software.";
export const SITE_KEYWORDS = [
  "SIC GEC Palamu",
  "Science and Innovation Club",
  "GEC Palamu",
  "Government Engineering College Palamu",
  "engineering club Jharkhand",
  "robotics club",
  "IoT",
  "hackathon",
  "student projects",
  "Palamu",
];

/** Default share picture (public/og.png, 1200 x 630). */
export const DEFAULT_OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "SIC, Science & Innovation Club, GEC Palamu" };

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trims text to a sensible search-snippet length without cutting a word in half. */
export function snippet(text: string | null | undefined, max = 158) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/**
 * Metadata for one public page: title, description, canonical address and the
 * Open Graph / Twitter preview. `title` goes through the layout's "%s · SIC" template.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title?: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title ? `${title} · SIC` : SITE_NAME;
  const images = image ? [{ url: image }] : [DEFAULT_OG_IMAGE];
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: { type, url, siteName: SITE_NAME, locale: "en_IN", title: fullTitle, description, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: images.map((i) => i.url) },
  };
}

/** Keeps a page out of search results (private areas, one-off links). */
export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };
