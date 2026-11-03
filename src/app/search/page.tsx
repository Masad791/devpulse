import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { param } from "@/components/filters";
import { searchArticles } from "@/lib/feed";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const q = (param((await searchParams).q) ?? "").slice(0, 100);
  const { articles, now } = await load(q);
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <form action="/search" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search every story DevPulse has collected — try: postgres vector, “system design”, rust -async"
          aria-label="Search"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
        />
        <button className="rounded-lg bg-fg px-4 font-medium text-bg">Search</button>
      </form>
      {q &&
        (articles.length ? (
          <>
            <p className="text-xs text-muted">
              {articles.length} results for “{q}”
            </p>
            <ArticleList articles={articles} now={now} />
          </>
        ) : (
          <p className="py-16 text-center text-muted">No stories match “{q}”.</p>
        ))}
    </main>
  );
}

async function load(q: string) {
  return { articles: q.length >= 2 ? await searchArticles(q) : [], now: Date.now() };
}
