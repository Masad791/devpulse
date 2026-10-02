import { categorize, dedupe, rank } from "./pipeline";
import { SOURCES } from "./sources";
import { risingRepos, trendingModels } from "./sources/trends";
import type { Article, SourceStatus, Trend } from "./types";

export type Feed = { generatedAt: string; articles: Article[]; sources: SourceStatus[] };

/** Fan out to every source in parallel; a failing source is reported, never fatal. */
export async function getFeed(): Promise<Feed> {
  const results = await Promise.allSettled(SOURCES.map((s) => s.fetch()));

  const sources = results.map((r, i): SourceStatus => {
    const name = SOURCES[i].name;
    if (r.status === "fulfilled") return { name, ok: true, count: r.value.length };
    console.error(`[feed] ${name} failed:`, r.reason);
    return { name, ok: false, count: 0, error: String(r.reason) };
  });

  const raw = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return { generatedAt: new Date().toISOString(), articles: rank(dedupe(categorize(raw))), sources };
}

export async function getTrends(): Promise<{ models: Trend[]; repos: Trend[] }> {
  const [models, repos] = await Promise.allSettled([trendingModels(), risingRepos()]);
  return {
    models: models.status === "fulfilled" ? models.value : [],
    repos: repos.status === "fulfilled" ? repos.value : [],
  };
}
