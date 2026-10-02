import { unstable_cache } from "next/cache";
import { categorize, dedupe, dropStale, rank } from "./pipeline";
import { allSettledPool } from "./pool";
import { SOURCES } from "./sources";
import { discussionFetchers, type Discussion } from "./sources/discussions";
import { socialFetchers } from "./sources/social";
import { risingRepos, trendingModels } from "./sources/trends";
import type { Article, Post, SourceStatus, Trend } from "./types";

export type Feed = { generatedAt: string; articles: Article[]; sources: SourceStatus[] };

/** Fan out to every source (10 at a time); a failing source is reported, never fatal. */
async function buildFeed(): Promise<Feed> {
  const results = await allSettledPool(SOURCES.map((s) => s.fetch), 10);

  const sources = results.map((r, i): SourceStatus => {
    const name = SOURCES[i].name;
    if (r.status === "fulfilled") return { name, ok: true, count: r.value.length };
    console.error(`[feed] ${name} failed:`, r.reason);
    return { name, ok: false, count: 0, error: String(r.reason) };
  });

  const raw = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const now = Date.now();
  return { generatedAt: new Date(now).toISOString(), articles: rank(dedupe(categorize(dropStale(raw, now))), now), sources };
}

// The whole processed feed is cached as ONE entry and shared by every page and the API.
// Without this, 12 topics x 10 pages would each re-run 50 fetches + the pipeline.
export const getFeed = unstable_cache(buildFeed, ["feed-v2"], { revalidate: 300, tags: ["feed"] });

export type Buzz = { generatedAt: string; posts: Post[] };

async function buildBuzz(): Promise<Buzz> {
  const results = await allSettledPool(socialFetchers.map((f) => f.fetch), 10);
  results.forEach((r, i) => r.status === "rejected" && console.error(`[buzz] ${socialFetchers[i].name} failed:`, r.reason));
  const now = Date.now();
  const ageHours = (p: Post) => (now - Date.parse(p.createdAt)) / 3_600_000;
  // Engagement with a 12h half-life: fresh + discussed first.
  const score = (p: Post) => Math.log1p(p.likes + 2 * p.reposts + p.replies) * 0.5 ** (ageHours(p) / 12);

  // The same federated post trends on several Mastodon servers; its url is the same everywhere.
  const unique = new Map(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).map((p) => [p.url, p]));
  const perAuthor = new Map<string, number>();
  const posts = [...unique.values()]
    .filter((p) => ageHours(p) < 72)
    .sort((a, b) => score(b) - score(a))
    .filter((p) => {
      const n = (perAuthor.get(p.author.handle) ?? 0) + 1; // max 3 per author so one prolific poster can't own the feed
      perAuthor.set(p.author.handle, n);
      return n <= 3;
    });
  return { generatedAt: new Date(now).toISOString(), posts };
}

export const getBuzz = unstable_cache(buildBuzz, ["buzz-v1"], { revalidate: 120, tags: ["buzz"] });

async function buildDiscussions(): Promise<{ generatedAt: string; discussions: Discussion[] }> {
  const results = await allSettledPool(discussionFetchers.map((f) => f.fetch), 3);
  results.forEach((r, i) => r.status === "rejected" && console.error(`[discussions] ${discussionFetchers[i].name} failed:`, r.reason));
  const now = Date.now();
  // "Heat": comment volume with a 24h half-life, so a 300-comment thread from today beats a 500-comment one from 3 days ago.
  const heat = (d: Discussion) => Math.log1p(d.comments) * 0.5 ** ((now - Date.parse(d.createdAt)) / 3_600_000 / 24);
  const unique = new Map(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).map((d) => [d.id, d]));
  return { generatedAt: new Date(now).toISOString(), discussions: [...unique.values()].sort((a, b) => heat(b) - heat(a)) };
}

export const getDiscussions = unstable_cache(buildDiscussions, ["discussions-v1"], { revalidate: 300, tags: ["discussions"] });

export async function getTrends(): Promise<{ models: Trend[]; repos: Trend[] }> {
  const [models, repos] = await Promise.allSettled([trendingModels(), risingRepos()]);
  return {
    models: models.status === "fulfilled" ? models.value : [],
    repos: repos.status === "fulfilled" ? repos.value : [],
  };
}
