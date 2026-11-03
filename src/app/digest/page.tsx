import type { Metadata } from "next";
import Link from "next/link";
import { getMostRead, getReleases, getTermTrends, getWeek } from "@/lib/feed";
import { count } from "@/lib/format";
import { isoWeek } from "@/lib/rss";
import { CATEGORIES, type Article, type Category } from "@/lib/types";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Weekly digest",
  description: "The week in tech for builders: top stories per topic, rising technologies and new releases.",
  alternates: { types: { "application/rss+xml": [{ url: "/digest/rss.xml", title: "DevPulse weekly digest" }] } },
};

export default async function DigestPage() {
  const [{ articles, generatedAt }, mostRead, radar, { releases }] = await Promise.all([getWeek(), getMostRead(), getTermTrends(), getReleases()]);
  const now = Date.parse(generatedAt);
  const rising = radar.trends.filter((t) => t.thisWeek >= 3 && (t.change ?? 0) > 0).sort((a, b) => b.change! - a.change!).slice(0, 5);
  const shipped = releases.filter((r) => !r.prerelease && now - Date.parse(r.date) < 7 * 86_400_000).slice(0, 8);

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <header>
        <p className="font-mono text-xs text-accent">{isoWeek(new Date(now))}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">This week in tech</h1>
        <p className="mt-2 text-sm text-muted">
          The most popular stories of the last 7 days across {Object.keys(CATEGORIES).length} topics, what&apos;s rising, and what shipped.{" "}
          <Link href="/digest/rss.xml" prefetch={false} className="underline hover:text-fg">
            Follow by RSS
          </Link>
          .
        </p>
      </header>

      <Section title="Top 10">
        <ol className="space-y-3">
          {articles.slice(0, 10).map((a, i) => (
            <Story key={a.id} a={a} n={i + 1} />
          ))}
        </ol>
      </Section>

      {(rising.length > 0 || shipped.length > 0) && (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {rising.length > 0 && (
            <Section title="Rising">
              <ul className="space-y-1.5 text-sm">
                {rising.map((t) => (
                  <li key={t.label} className="flex justify-between">
                    {t.label} <span className="font-mono text-xs text-accent">+{Math.round(t.change! * 100)}%</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {shipped.length > 0 && (
            <Section title="Shipped">
              <ul className="space-y-1.5 text-sm">
                {shipped.map((r) => (
                  <li key={r.repo} className="flex justify-between gap-3">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-accent">
                      {r.repo.split("/")[1]}
                    </a>
                    <span className="truncate font-mono text-xs text-muted">{r.tag}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {mostRead.length > 0 && (
        <Section title="Most read on DevPulse">
          <ol className="space-y-3">
            {mostRead.map((a, i) => (
              <Story key={a.id} a={a} n={i + 1} />
            ))}
          </ol>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        {(Object.keys(CATEGORIES) as Category[]).map((c) => {
          const top = articles.filter((a) => a.categories.includes(c)).slice(0, 3);
          return (
            top.length > 0 && (
              <Section key={c} title={CATEGORIES[c]} href={`/${c}`}>
                <ol className="space-y-3">
                  {top.map((a, i) => (
                    <Story key={a.id} a={a} n={i + 1} />
                  ))}
                </ol>
              </Section>
            )
          );
        })}
      </div>
    </main>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-baseline justify-between border-b border-line pb-2 font-semibold">
        {title}
        {href && (
          <Link href={href} className="text-xs font-normal text-muted hover:text-accent">
            more →
          </Link>
        )}
      </h2>
      {children}
    </section>
  );
}

function Story({ a, n }: { a: Article; n: number }) {
  return (
    <li className="flex gap-3">
      <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-xs text-muted">{n}</span>
      <div className="min-w-0">
        <a href={a.url} target="_blank" rel="noopener noreferrer" data-track={a.id} className="font-medium leading-snug hover:text-accent">
          {a.title}
        </a>
        <p className="text-xs text-muted">
          {a.source}
          {a.points > 0 && ` · ▲ ${count(a.points)}`}
          {a.comments > 0 && ` · ${count(a.comments)} comments`}
          {a.related && ` · also on ${a.related.map((r) => r.source).join(", ")}`}
        </p>
      </div>
    </li>
  );
}
