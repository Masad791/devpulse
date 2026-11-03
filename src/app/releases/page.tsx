import type { Metadata } from "next";
import { timeAgo } from "@/lib/format";
import { getReleases } from "@/lib/feed";
import { WATCHED } from "@/lib/sources/releases";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Release radar",
  description: "The latest releases of the frameworks, runtimes, AI tools and infrastructure developers use.",
};

export default async function ReleasesPage() {
  const { releases, generatedAt } = await getReleases();
  const now = Date.parse(generatedAt);
  const groups = [...new Set(WATCHED.map((w) => w.group))];
  const fresh = releases.filter((r) => !r.prerelease && now - Date.parse(r.date) < 7 * 86_400_000);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Release radar</h1>
        <p className="mt-1 text-sm text-muted">
          Latest stable release of {WATCHED.length} tools, from each project&apos;s GitHub releases feed. {fresh.length} shipped this week.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{group}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {releases
              .filter((r) => r.group === group)
              .map((r) => {
                const isNew = now - Date.parse(r.date) < 3 * 86_400_000;
                return (
                  <li key={r.repo}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-accent/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- GitHub avatars */}
                      <img src={`https://github.com/${r.repo.split("/")[0]}.png?size=40`} alt="" width={28} height={28} loading="lazy" className="size-7 rounded-md bg-line" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.repo.split("/")[1]}</p>
                        <p className="truncate font-mono text-xs text-muted">{r.tag}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        {isNew && <span className="mb-0.5 block rounded-full bg-accent px-1.5 text-[10px] font-medium text-bg">new</span>}
                        {r.prerelease && <span className="mb-0.5 block text-[10px] text-muted">pre-release</span>}
                        <span className="text-muted">{timeAgo(r.date, now)}</span>
                      </div>
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </main>
  );
}
