import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "./db";
import { categorize, cluster, dropStale, rank, sanitize } from "./pipeline";
import { allSettledPool } from "./pool";
import { SOURCES } from "./sources";
import { discussionFetchers, type Discussion } from "./sources/discussions";
import { socialFetchers } from "./sources/social";
import { latestReleases, type Release } from "./sources/releases";
import type { Skill } from "./sources/skills";
import { risingRepos, trendingModels } from "./sources/trends";
import { computeTrends } from "./trends";
import type { Article, Post, SourceStatus, Trend } from "./types";

export type Feed = { generatedAt: string; articles: Article[]; sources: SourceStatus[] };

async function buildFeed(): Promise<Feed> {
  return (sql && (await feedFromDb())) || liveFeed();
}

type ArticleRow = {
  id: string;
  url: string;
  title: string;
  source: string;
  discussion_url: string | null;
  image: string | null;
  points: number;
  comments: number;
  published_at: Date;
  tags: string[];
  categories: Article["categories"];
};

export const fromRow = (r: ArticleRow): Article => ({
  id: r.id,
  url: r.url,
  title: r.title,
  source: r.source,
  discussionUrl: r.discussion_url ?? undefined,
  image: r.image ?? undefined,
  points: r.points,
  comments: r.comments,
  publishedAt: r.published_at.toISOString(),
  tags: r.tags,
  categories: r.categories,
});

/** READ path with a DB: no upstream calls at all — stored articles plus the latest ingest's source health. */
async function feedFromDb(): Promise<Feed | null> {
  const [rows, [run]] = await Promise.all([
    sql!<ArticleRow[]>`
      select id, url, title, source, discussion_url, image, points, comments, published_at, tags, categories
      from articles where published_at > now() - interval '30 days' order by published_at desc limit 4000`,
    sql!<{ sources: SourceStatus[] }[]>`select sources from ingest_runs where finished_at is not null order by id desc limit 1`,
  ]);
  if (!rows.length) return null; // fresh database: nothing ingested yet, so fall back to live fetching
  const now = Date.now();
  return { generatedAt: new Date(now).toISOString(), articles: rank(cluster(rows.map(fromRow)), now), sources: run?.sources ?? [] };
}

/** READ path without a DB: fan out to every source (10 at a time); a failing source is reported, never fatal. */
async function liveFeed(): Promise<Feed> {
  const results = await allSettledPool(SOURCES.map((s) => s.fetch), 10);

  const sources = results.map((r, i): SourceStatus => {
    const name = SOURCES[i].name;
    if (r.status === "fulfilled") return { name, ok: true, count: r.value.length };
    console.error(`[feed] ${name} failed:`, r.reason);
    return { name, ok: false, count: 0, error: String(r.reason) };
  });

  const raw = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const now = Date.now();
  return { generatedAt: new Date(now).toISOString(), articles: rank(cluster(categorize(dropStale(sanitize(raw), now))), now), sources };
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

// ---------- Search ----------

/** Postgres full-text search (ranked by relevance x recency); without a DB, a simple word match over the live feed. */
export const searchArticles = unstable_cache(
  async (query: string): Promise<Article[]> => {
    const q = query.trim().slice(0, 100);
    if (!q) return [];
    if (sql) {
      const rows = await sql<ArticleRow[]>`
        select id, url, title, source, discussion_url, image, points, comments, published_at, tags, categories
        from articles, websearch_to_tsquery('english', ${q}) query
        where search @@ query
        order by ts_rank(search, query) / (1 + extract(epoch from now() - published_at) / 604800) desc
        limit 30`;
      if (rows.length) return cluster(rows.map(fromRow));
    }
    const words = q.toLowerCase().split(/\s+/);
    const { articles } = await getFeed();
    return articles.filter((a) => words.every((w) => `${a.title} ${a.tags.join(" ")}`.toLowerCase().includes(w))).slice(0, 30);
  },
  ["search-v1"],
  { revalidate: 300, tags: ["search"] },
);

// ---------- Most read (our own click counts) ----------

export const getMostRead = unstable_cache(
  async (): Promise<(Article & { clicks: number })[]> => {
    if (!sql) return [];
    const rows = await sql<(ArticleRow & { clicks: number })[]>`
      select a.id, a.url, a.title, a.source, a.discussion_url, a.image, a.points, a.comments, a.published_at, a.tags, a.categories,
             sum(c.count)::int as clicks
      from clicks c join articles a on a.id = c.article_id
      where c.day > current_date - 7
      group by a.id order by clicks desc limit 5`;
    return rows.map((r) => ({ ...fromRow(r), clicks: r.clicks }));
  },
  ["most-read-v1"],
  { revalidate: 300, tags: ["clicks"] },
);

// ---------- Trend radar ----------

export const getTermTrends = unstable_cache(
  async () => {
    const now = Date.now();
    let items: { title: string; tags: string[]; publishedAt: string }[] = [];
    if (sql) {
      const rows = await sql<{ title: string; tags: string[]; published_at: Date }[]>`
        select title, tags, published_at from articles where published_at > now() - interval '28 days'`;
      items = rows.map((r) => ({ title: r.title, tags: r.tags, publishedAt: r.published_at.toISOString() }));
    }
    const fromHistory = items.length > 0;
    if (!fromHistory) items = (await getFeed()).articles;
    return { generatedAt: new Date(now).toISOString(), fromHistory, articles: items.length, trends: computeTrends(items, now) };
  },
  ["trends-v1"],
  { revalidate: 1800, tags: ["trends"] },
);

// ---------- Weekly digest ----------

/** The last 7 days ranked by popularity only (no time decay): what mattered this week. */
export const getWeek = unstable_cache(
  async (): Promise<{ generatedAt: string; articles: Article[] }> => {
    const now = Date.now();
    let articles: Article[] = [];
    if (sql) {
      const rows = await sql<ArticleRow[]>`
        select id, url, title, source, discussion_url, image, points, comments, published_at, tags, categories
        from articles where published_at > now() - interval '7 days'`;
      articles = cluster(rows.map(fromRow));
    }
    if (!articles.length) articles = (await getFeed()).articles.filter((a) => now - Date.parse(a.publishedAt) < 7 * 86_400_000);
    return { generatedAt: new Date(now).toISOString(), articles: rank(articles, now, Infinity) };
  },
  ["week-v1"],
  { revalidate: 1800, tags: ["digest"] },
);

// ---------- Release radar ----------

export const getReleases = unstable_cache(
  async (): Promise<{ generatedAt: string; releases: Release[] }> => {
    const generatedAt = new Date().toISOString();
    if (sql) {
      const rows = await sql<{ repo: string; grp: string; tag: string; url: string; published_at: Date; prerelease: boolean }[]>`
        select repo, grp, tag, url, published_at, prerelease from releases order by published_at desc`;
      if (rows.length) {
        const releases = rows.map((r) => ({ repo: r.repo, group: r.grp, tag: r.tag, url: r.url, date: r.published_at.toISOString(), prerelease: r.prerelease }));
        return { generatedAt, releases };
      }
    }
    return { generatedAt, releases: await latestReleases() }; // no DB (or not ingested yet): fetch live
  },
  ["releases-v2"],
  { revalidate: 3600, tags: ["releases"] },
);

// ---------- Trending skills ----------

// DB only: the skills.sh token exists during ingest, not while a page renders.
export const getSkills = unstable_cache(
  async (): Promise<Skill[]> => (sql ? [...(await sql<Skill[]>`select id, name, source, installs, url from skills order by installs desc`)] : []),
  ["skills-v1"],
  { revalidate: 3600, tags: ["skills"] },
);

// ---------- Status ----------

export type IngestRun = { id: string; started_at: Date; finished_at: Date | null; inserted: number | null; updated: number | null; failed: number };

export async function getStatus() {
  if (!sql) return { db: false as const };
  const [runs, [counts]] = await Promise.all([
    sql<IngestRun[]>`
      select id, started_at, finished_at, inserted, updated,
             (select count(*)::int from jsonb_array_elements(coalesce(sources, '[]')) s where s->>'ok' = 'false') as failed
      from ingest_runs order by id desc limit 8`,
    sql<{ articles: number; clicks: number; newest: Date | null; minutesSinceIngest: number | null }[]>`
      select (select count(*)::int from articles) as articles,
             (select round(extract(epoch from now() - max(finished_at)) / 60)::int from ingest_runs) as "minutesSinceIngest",
             (select coalesce(sum(count), 0)::int from clicks) as clicks,
             (select max(first_seen) from articles) as newest`,
  ]);
  return { db: true as const, runs, ...counts };
}

export async function getTrends(): Promise<{ models: Trend[]; repos: Trend[] }> {
  const [models, repos] = await Promise.allSettled([trendingModels(), risingRepos()]);
  return {
    models: models.status === "fulfilled" ? models.value : [],
    repos: repos.status === "fulfilled" ? repos.value : [],
  };
}
