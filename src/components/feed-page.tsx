import Link from "next/link";
import { getFeed, getTrends } from "@/lib/feed";
import { CATEGORIES, type Article, type Category, type SourceStatus, type Trend } from "@/lib/types";

const CHIP: Record<Category, string> = {
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  "system-design": "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  devops: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  engineering: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });
function timeAgo(iso: string, now: number) {
  const minutes = Math.round((Date.parse(iso) - now) / 60_000);
  if (minutes > -60) return rtf.format(minutes, "minute");
  if (minutes > -60 * 48) return rtf.format(Math.round(minutes / 60), "hour");
  return rtf.format(Math.round(minutes / 1440), "day");
}

const domain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export async function FeedPage({ category }: { category?: Category }) {
  const [feed, trends] = await Promise.all([getFeed(), getTrends()]);
  const now = Date.parse(feed.generatedAt);
  const articles = (category ? feed.articles.filter((a) => a.categories.includes(category)) : feed.articles).slice(0, 60);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <Link href="/" className="flex items-center gap-2 pb-1">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-lg font-semibold tracking-tight">DevPulse</span>
            <span className="hidden text-sm text-zinc-500 md:inline">— what builders are reading</span>
          </Link>
          <nav className="-mb-px flex gap-1 overflow-x-auto text-sm" aria-label="Categories">
            <Tab href="/" active={!category}>All</Tab>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <Tab key={c} href={`/${c}`} active={c === category}>
                {CATEGORIES[c]}
              </Tab>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Articles">
          {articles.length ? (
            <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {articles.map((a, i) => (
                <Row key={a.id} article={a} rank={i + 1} now={now} />
              ))}
            </ol>
          ) : (
            <p className="py-20 text-center text-zinc-500">No stories right now — every source failed. Check back in a few minutes.</p>
          )}
        </section>

        <aside className="space-y-8 text-sm">
          <TrendList title="Trending AI models" subtitle="Hugging Face" items={trends.models} />
          <TrendList title="Rising repos" subtitle="GitHub · created this week" items={trends.repos} />
          <SourceHealth sources={feed.sources} generatedAt={feed.generatedAt} />
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-zinc-500">
        Free public API:{" "}
        <Link className="underline" href="/api/feed?category=ai" prefetch={false}>
          /api/feed?category=ai
        </Link>{" "}
        · Open source on{" "}
        <a className="underline" href="https://github.com/Masad791/devpulse">
          GitHub
        </a>
      </footer>
    </>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap border-b-2 px-3 py-2 transition-colors ${
        active
          ? "border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}

function Row({ article: a, rank, now }: { article: Article; rank: number; now: number }) {
  return (
    <li className="flex gap-4 py-3.5">
      <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-xs text-zinc-400">{rank}</span>
      <div className="min-w-0">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium leading-snug hover:underline">
          {a.title}
        </a>{" "}
        <span className="text-xs text-zinc-500">{domain(a.url)}</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{a.source}</span>
          {a.points > 0 && <span>▲ {a.points}</span>}
          {a.discussionUrl && (
            <a href={a.discussionUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {a.comments} comments
            </a>
          )}
          <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt, now)}</time>
          {a.categories.map((c) => (
            <Link key={c} href={`/${c}`} className={`rounded px-1.5 py-0.5 text-[11px] ${CHIP[c]}`}>
              {CATEGORIES[c]}
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}

function TrendList({ title, subtitle, items }: { title: string; subtitle: string; items: Trend[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-2 text-xs text-zinc-500">{subtitle}</p>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t.url} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="block truncate hover:underline">
                {t.title}
              </a>
              {t.description && <p className="truncate text-xs text-zinc-500">{t.description}</p>}
            </div>
            <span className="shrink-0 font-mono text-xs text-zinc-500">{t.stat}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceHealth({ sources, generatedAt }: { sources: SourceStatus[]; generatedAt: string }) {
  const time = new Intl.DateTimeFormat("en", { timeStyle: "short", timeZone: "UTC" }).format(new Date(generatedAt));
  return (
    <section>
      <h2 className="font-semibold">Sources</h2>
      <p className="mb-2 text-xs text-zinc-500">Refreshed {time} UTC · every 15 min</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {sources.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5" title={s.error}>
            <span className={`size-1.5 shrink-0 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto text-zinc-400">{s.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
