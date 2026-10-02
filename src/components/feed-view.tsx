import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuzz, getFeed, getTrends } from "@/lib/feed";
import { paginate } from "@/lib/pipeline";
import { CATEGORIES, type Category, type SourceStatus, type Trend } from "@/lib/types";
import { ArticleList } from "./article-list";
import { AutoRefresh } from "./auto-refresh";
import { Pagination } from "./pagination";
import { PostCard } from "./post-card";

/** Shared by "/" and every topic page: one ranked feed, filtered and paginated. */
export async function FeedView({ topic, page }: { topic?: Category; page: number }) {
  const [feed, trends, buzz] = await Promise.all([getFeed(), getTrends(), getBuzz()]);
  const result = paginate(feed.articles, topic ? [topic] : [], page);
  if (page > result.totalPages) notFound();

  const now = Date.parse(feed.generatedAt);
  const hrefFor = (n: number) => (n === 1 ? (topic ? `/${topic}` : "/") : `/${topic ?? "all"}/${n}`);

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <AutoRefresh />
      <section aria-label="Articles">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{topic ? CATEGORIES[topic] : "Top stories"}</h1>
          <p className="text-xs text-muted">
            {result.total} stories{result.totalPages > 1 && ` · page ${page} of ${result.totalPages}`}
          </p>
        </div>
        {result.articles.length ? (
          <ArticleList articles={result.articles} now={now} />
        ) : (
          <p className="py-20 text-center text-muted">No stories right now. Sources refresh every 5 minutes.</p>
        )}
        <Pagination page={page} totalPages={result.totalPages} hrefFor={hrefFor} />
      </section>

      <aside className="space-y-8 text-sm">
        {buzz.posts.length > 0 && (
          <section>
            <SideHeading title="Engineers are saying" subtitle="Bluesky & Mastodon · live" />
            <div className="space-y-3">
              {buzz.posts.slice(0, 3).map((p) => (
                <PostCard key={p.id} post={p} now={Date.parse(buzz.generatedAt)} clamp />
              ))}
            </div>
            <Link href="/buzz" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
              See all posts →
            </Link>
          </section>
        )}
        <TrendList title="Trending AI models" subtitle="Hugging Face" items={trends.models} />
        <TrendList title="Rising repos" subtitle="GitHub · created this week" items={trends.repos} />
        <SourceHealth sources={feed.sources} generatedAt={feed.generatedAt} />
      </aside>
    </main>
  );
}

function SideHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2.5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-xs text-muted">{subtitle}</p>
    </div>
  );
}

function TrendList({ title, subtitle, items }: { title: string; subtitle: string; items: Trend[] }) {
  if (!items.length) return null;
  return (
    <section>
      <SideHeading title={title} subtitle={subtitle} />
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t.url} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="block truncate hover:text-accent">
                {t.title}
              </a>
              {t.description && <p className="truncate text-xs text-muted">{t.description}</p>}
            </div>
            <span className="shrink-0 font-mono text-xs text-muted">{t.stat}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceHealth({ sources, generatedAt }: { sources: SourceStatus[]; generatedAt: string }) {
  const time = new Intl.DateTimeFormat("en", { timeStyle: "short", timeZone: "UTC" }).format(new Date(generatedAt));
  const up = sources.filter((s) => s.ok).length;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        <SideHeading title={`Sources · ${up}/${sources.length} up`} subtitle={`Refreshed ${time} UTC · every 5 min · tap to expand`} />
      </summary>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {sources.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5" title={s.error}>
            <span className={`size-1.5 shrink-0 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto text-muted">{s.count}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
