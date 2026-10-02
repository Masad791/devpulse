import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PREFS_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "DevPulse — tech news for builders", template: "%s · DevPulse" },
  description:
    "AI models, system design, DevOps, cloud, security and software engineering news from Hacker News, Dev.to, Lobsters, 50 engineering blogs, and what engineers are saying on Bluesky and Mastodon.",
};

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
          <p>
            DevPulse is open source (MIT) —{" "}
            <a className="underline hover:text-fg" href="https://github.com/Masad791/devpulse">
              contribute on GitHub
            </a>
            . Free JSON API:{" "}
            <Link className="underline hover:text-fg" href="/api/feed?topic=ai" prefetch={false}>
              /api/feed?topic=ai
            </Link>{" "}
            ·{" "}
            <Link className="underline hover:text-fg" href="/api/buzz" prefetch={false}>
              /api/buzz
            </Link>
          </p>
          <p className="mt-1">Content belongs to its authors; DevPulse links to the original.</p>
        </footer>
      </body>
    </html>
  );
}
