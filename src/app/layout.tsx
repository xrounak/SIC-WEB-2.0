import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SeasonalLayer } from "@/seasonal/SeasonalLayer";
import { PageTransition } from "@/seasonal/PageTransition";
import { AmbientBackdrop } from "@/components/layout/ambient-backdrop";
import { DEFAULT_THEME, themeBootScript, themeCss } from "@/seasonal/registry";
import { ThemeCursorStyles } from "@/seasonal/ThemeCursor";
import "./globals.css";
import "../seasonal/seasonal.css";

// Brand type, self-hosted from src/app/fonts (Latin subset, OFL) so builds never
// depend on reaching Google Fonts. Cinzel (wordmark, headings) echoes the inscribed
// capitals of the SIC artwork; Manrope for reading; Rajdhani (Indian Type Foundry)
// for labels and numbers.
const cinzel = localFont({
  src: "./fonts/cinzel-500-900.woff2",
  weight: "500 900",
  variable: "--font-cinzel",
  display: "swap",
  fallback: ["Georgia", "serif"],
});
const manrope = localFont({
  src: "./fonts/manrope-200-800.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const rajdhani = localFont({
  src: [
    { path: "./fonts/rajdhani-500.woff2", weight: "500" },
    { path: "./fonts/rajdhani-600.woff2", weight: "600" },
    { path: "./fonts/rajdhani-700.woff2", weight: "700" },
  ],
  variable: "--font-rajdhani",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "SIC · Science & Innovation Club, GEC Palamu", template: "%s · SIC" },
  description:
    "The Science & Innovation Club: projects, workshops, hackathons and a community of builders across every engineering discipline.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  colorScheme: "dark",
};

/** Theme tokens for every theme, generated once from sic-seasonal-themes.json. */
const THEME_CSS = themeCss();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is the server default; the boot script may swap it before paint.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${cinzel.variable} ${manrope.variable} ${rajdhani.variable} antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <ThemeCursorStyles />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <AmbientBackdrop />
        <SeasonalLayer />
        {children}
        <PageTransition />
      </body>
    </html>
  );
}
