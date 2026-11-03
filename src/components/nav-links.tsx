"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

const TOPICS = [
  { href: "/for-you", label: "For you" },
  { href: "/", label: "All" },
  ...Object.entries(CATEGORIES).map(([slug, label]) => ({ href: `/${slug}`, label })),
];

const SECTIONS = [
  { href: "/", label: "News" },
  { href: "/buzz", label: "Buzz", live: true },
  { href: "/skills", label: "Skills" },
  { href: "/repos", label: "Repos" },
  { href: "/releases", label: "Releases" },
  { href: "/discussions", label: "Discussions" },
  { href: "/contribute", label: "Contribute" },
  { href: "/trends", label: "Trends" },
];

// Everything that is not a news page (sections + utility pages) hides the topic strip.
const OTHER_SECTIONS = [...SECTIONS.slice(1).map((s) => s.href), "/digest", "/saved", "/status", "/search"];
const isNewsPath = (p: string) => !OTHER_SECTIONS.some((s) => p === s || p.startsWith(`${s}/`));
const isActive = (p: string, href: string) =>
  href === "/" ? p === "/" || p.startsWith("/all/") : p === href || p.startsWith(`${href}/`);

export function SectionNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="flex min-w-0 gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
      {SECTIONS.map(({ href, label, live }) => {
        const active = href === "/" ? isNewsPath(pathname) : isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 ${
              active ? "bg-surface font-medium text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {live && <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The topic strip — only on news pages. */
export function TopicNav() {
  const pathname = usePathname();
  if (!isNewsPath(pathname)) return null;
  return (
    <nav aria-label="Topics" className="-mb-px flex gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
      {TOPICS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 transition-colors ${
              active ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
