"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

const LINKS = [
  { href: "/for-you", label: "For you" },
  { href: "/", label: "All" },
  ...Object.entries(CATEGORIES).map(([slug, label]) => ({ href: `/${slug}`, label })),
];

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/all/") : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Topics" className="-mb-px flex gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
      {LINKS.map(({ href, label }) => (
        <Tab key={href} href={href} active={isActive(href)}>
          {label}
        </Tab>
      ))}
      <Tab href="/buzz" active={isActive("/buzz")}>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          Buzz
        </span>
      </Tab>
    </nav>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 transition-colors ${
        active ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}
