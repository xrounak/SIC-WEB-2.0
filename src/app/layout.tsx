import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SeasonalLayer } from "@/seasonal/SeasonalLayer";
import { PageTransition } from "@/seasonal/PageTransition";
import { IntroLoader } from "@/components/intro/intro-loader";
import { introBootScript } from "@/components/intro/boot";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_SHORT_NAME, SITE_URL } from "@/lib/site";
import { SfxController } from "@/seasonal/SfxController";
import { AmbientBackdrop } from "@/components/layout/ambient-backdrop";
import { DEFAULT_THEME, themeBootScript, themeCss } from "@/seasonal/registry";
import { ThemeCursorStyles } from "@/seasonal/ThemeCursor";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: "%s · SIC" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_SHORT_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Science & Innovation Club, GEC Palamu", url: SITE_URL }],
  creator: "Science & Innovation Club, GEC Palamu",
  publisher: "Government Engineering College, Palamu",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", url: SITE_URL, title: SITE_NAME, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
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
      lang="en-IN"
      data-theme={DEFAULT_THEME}
      data-mode="theme"
      suppressHydrationWarning
      className={`${cinzel.variable} ${manrope.variable} ${rajdhani.variable} antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <ThemeCursorStyles />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() + introBootScript() }} />
      </head>
      <body>
        <IntroLoader />
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
        <SfxController />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
