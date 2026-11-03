import Link from "next/link";
import { SOURCES } from "@/lib/sources";
import { Customize } from "./customize";
import { SectionNav, TopicNav } from "./nav-links";
import { SearchButton } from "./search-button";

const SOURCE_NAMES = SOURCES.map((s) => s.name).sort();

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-3 py-2.5 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            <span className="text-lg font-semibold tracking-tight">DevPulse</span>
          </Link>
          <SectionNav />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SearchButton />
            <Customize sources={SOURCE_NAMES} />
          </div>
        </div>
        <TopicNav />
      </div>
    </header>
  );
}
