import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ClickTracker } from "@/components/click-tracker";
import { CommandPalette } from "@/components/command-palette";
import { Shortcuts } from "@/components/shortcuts";
import { SiteHeader } from "@/components/site-header";
import { PREFS_SCRIPT } from "@/lib/prefs";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "DevPulse — tech news for builders", template: "%s · DevPulse" },
  description:
    "AI models, system design, DevOps, cloud, security and software engineering news from Hacker News, Dev.to, Lobsters, 50 engineering blogs, and what engineers are saying on Bluesky and Mastodon.",
  alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: "DevPulse — top stories" }] } },
  appleWebApp: { capable: true, title: "DevPulse", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

const FOOTER_LINKS: [label: string, href: string][] = [
  ["Weekly digest", "/digest"],
  ["Reading list", "/saved"],
  ["Trend radar", "/trends"],
  ["Status", "/status"],
  ["RSS", "/rss.xml"],
  ["API", "/api/feed?topic=ai"],
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script below sets data-theme etc. on <html> before React hydrates.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        {children}
        <footer className="mx-auto max-w-6xl border-t border-line px-4 py-8 text-xs text-muted">
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_LINKS.map(([label, href]) => (
              <Link key={href} href={href} prefetch={false} className="hover:text-fg">
                {label}
              </Link>
            ))}
            <a className="hover:text-fg" href="https://github.com/Masad791/devpulse">
              GitHub
            </a>
          </nav>
          <p className="mt-3">
            Open source (MIT). Press <kbd className="rounded border border-line px-1 font-mono">?</kbd> for keyboard shortcuts. Content belongs
            to its authors; DevPulse links to the original. No cookies; we count story clicks anonymously.
          </p>
        </footer>
        <CommandPalette />
        <Shortcuts />
        <ClickTracker />
        {/* Cookieless, aggregate-only analytics. No-ops outside Vercel. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
