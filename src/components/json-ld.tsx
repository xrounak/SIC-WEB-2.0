import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Structured data for search engines. `<` is escaped so the JSON can never close the tag early. */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** The club and the college it belongs to. Used on the home page. */
export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Science & Innovation Club, GEC Palamu",
  alternateName: ["SIC", "SIC GEC Palamu"],
  url: SITE_URL,
  logo: absoluteUrl("/logo.png"),
  description:
    "A student club of Government Engineering College, Palamu building projects, running workshops and hackathons across mechanical, civil, IoT and robotics, and software.",
  foundingDate: "2023",
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Government Engineering College, Palamu",
    address: { "@type": "PostalAddress", addressLocality: "Palamu", addressRegion: "Jharkhand", addressCountry: "IN" },
  },
  areaServed: "Palamu, Jharkhand, India",
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "SIC · Science & Innovation Club, GEC Palamu",
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/** Breadcrumb trail for a detail page: [["Events", "/events"], ["Title", "/events/x"]]. */
export function breadcrumbLd(trail: Array<[string, string]>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as [string, string], ...trail].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}
