import Link from "next/link";
import { getDomains } from "@/lib/data";
import { BrandStar, Logo } from "./logo";

const LINKS = [
  {
    title: "Explore",
    items: [
      { href: "/events", label: "Events" },
      { href: "/projects", label: "Projects" },
      { href: "/domains", label: "Domains" },
    ],
  },
  {
    title: "Club",
    items: [
      { href: "/about", label: "About" },
      { href: "/join", label: "Join SIC" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Members",
    items: [
      { href: "/portal", label: "Portal" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

const IDENTITY = ["Science", "Innovation", "Engineering", "GEC Palamu"];

/** One marquee row, rendered twice so the loop is seamless. */
function Marquee({ words, reverse, small }: { words: string[]; reverse?: boolean; small?: boolean }) {
  const row = (hidden: boolean) => (
    <span className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center">
          <span
            className={
              small
                ? "hud-label px-6 text-[0.75rem] text-subtle"
                : i % 2
                  ? "outline-text px-8 font-brand text-[clamp(2.2rem,6vw,4.5rem)] font-black uppercase leading-none"
                  : "px-8 font-brand text-[clamp(2.2rem,6vw,4.5rem)] font-black uppercase leading-none"
            }
          >
            {w}
          </span>
          <BrandStar size={small ? 10 : 22} className="text-primary" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="footer-marquee overflow-hidden">
      <div className={`footer-marquee-track ${reverse ? "is-reverse" : ""} ${small ? "is-slow" : ""}`}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

export async function SiteFooter() {
  const domains = await getDomains();
  const domainNames = domains.length ? domains.map((d) => d.name) : ["Mechanical", "Civil", "Electrical", "Electronics", "Robotics", "IoT", "AI / ML", "Software", "Research"];

  return (
    <footer className="site-footer relative z-10 mt-28 overflow-hidden border-t border-line bg-bg">
      {/* Identity marquee */}
      <div className="border-b border-line py-6">
        <Marquee words={IDENTITY} />
      </div>
      <div className="border-b border-line bg-surface/40 py-3">
        <Marquee words={domainNames} reverse small />
      </div>

      {/* Links */}
      <div className="mx-auto grid w-full max-w-content gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_2fr]">
        <div className="flex flex-col items-start gap-5">
          <Logo size="lg" />
          <p className="max-w-sm text-muted">
            The Science &amp; Innovation Club of GEC Palamu: students from every branch building robots, circuits,
            structures, software and research together.
          </p>
          <a href="#main" className="footer-top group hud-label inline-flex items-center gap-2 py-2 text-[0.75rem] text-muted hover:text-primary">
            <span className="text-primary">[</span>
            Back to top
            <span aria-hidden="true" className="inline-block transition-transform group-hover:-translate-y-1">↑</span>
            <span className="text-primary">]</span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {LINKS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="hud-label flex items-center gap-2 text-[0.6875rem] text-primary">
                <span className="h-px w-4 bg-primary" aria-hidden="true" />
                {group.title}
              </p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="footer-link group inline-flex items-center gap-2 text-[0.9375rem] text-muted hover:text-fg">
                  <span aria-hidden="true" className="footer-link-arrow text-primary">→</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ornamental rule */}
      <div className="footer-rule mx-auto flex w-full max-w-content items-center gap-4 px-4 sm:px-6" aria-hidden="true">
        <span className="footer-rule-line h-px flex-1 origin-right bg-line-strong" />
        <BrandStar size={14} className="text-primary" />
        <BrandStar size={22} className="logo-star text-primary" />
        <BrandStar size={14} className="text-primary" />
        <span className="footer-rule-line h-px flex-1 origin-left bg-line-strong" />
      </div>

      {/* Giant wordmark that fills with light as it scrolls into view */}
      <div aria-hidden="true" className="footer-wordmark select-none text-center font-brand font-black leading-[0.78]">
        SIC
      </div>

      <div className="relative border-t border-line bg-bg">
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 px-4 py-5 text-[0.8125rem] text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Science &amp; Innovation Club, GEC Palamu</p>
          <p className="hud-label text-[0.6875rem]">Built by members · Palamu, Jharkhand</p>
        </div>
      </div>
    </footer>
  );
}
