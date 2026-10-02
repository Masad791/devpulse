"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Prefs } from "@/lib/prefs";
import { savePrefs, usePrefs } from "@/lib/use-prefs";
import { CATEGORIES, type Article, type Category } from "@/lib/types";
import { ArticleList } from "./article-list";
import { Pagination } from "./pagination";

type FeedPage = { generatedAt: string; page: number; totalPages: number; total: number; articles: Article[] };

export function ForYou() {
  const prefs = usePrefs();
  const page = Math.max(1, Number(useSearchParams().get("page")) || 1);
  const topics = prefs?.topics ?? [];
  const url = topics.length ? `/api/feed?topic=${topics.join(",")}&page=${page}&limit=30` : null;

  // Keyed by URL so a stale response for the previous page can never be shown for the new one.
  const [result, setResult] = useState<{ url: string; data: FeedPage } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((data: FeedPage) => !cancelled && setResult({ url, data }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (prefs === null) return <Skeleton />; // hydrating: localStorage not read yet
  if (!topics.length) return <PickTopics prefs={prefs} />;

  const data = result?.url === url ? result.data : null;
  return (
    <>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">For you</h1>
        <p className="text-xs text-muted">{topics.map((t) => CATEGORIES[t]).join(" · ")} — change in Customize</p>
      </div>
      {data ? (
        <>
          <ArticleList articles={data.articles} now={Date.parse(data.generatedAt)} />
          <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(n) => (n === 1 ? "/for-you" : `/for-you?page=${n}`)} />
        </>
      ) : (
        <Skeleton />
      )}
    </>
  );
}

function PickTopics({ prefs }: { prefs: Prefs }) {
  const [picked, setPicked] = useState<Category[]>([]);
  const toggle = (c: Category) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  return (
    <div className="py-12 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Build your feed</h1>
      <p className="mt-1 text-sm text-muted">Pick the topics you care about. Saved in this browser only — no account needed.</p>
      <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            aria-pressed={picked.includes(c)}
            className={`rounded-full border px-4 py-1.5 text-sm ${picked.includes(c) ? "border-accent bg-accent text-bg" : "border-line hover:border-accent hover:text-accent"}`}
          >
            {CATEGORIES[c]}
          </button>
        ))}
      </div>
      <button
        disabled={!picked.length}
        onClick={() => savePrefs({ ...prefs, topics: picked })}
        className="mt-8 rounded-lg bg-fg px-5 py-2 text-sm font-medium text-bg disabled:opacity-40"
      >
        Show my feed{picked.length ? ` (${picked.length} topics)` : ""}
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 py-4" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-1/4 animate-pulse rounded bg-surface" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}
