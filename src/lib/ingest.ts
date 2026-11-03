import "server-only";
import { sql } from "./db";
import { categorize, dropStale, sanitize } from "./pipeline";
import { allSettledPool } from "./pool";
import { SOURCES } from "./sources";
import { latestReleases } from "./sources/releases";
import { trendingSkills } from "./sources/skills";
import type { SourceStatus } from "./types";

const LOCK_ID = 7_001; // any constant; identifies "the ingest job" to pg_try_advisory_lock

export type IngestResult = { skipped: true } | { skipped: false; inserted: number; updated: number; sources: SourceStatus[] };

/**
 * The WRITE path: fetch every source, clean + tag, upsert into Postgres. The site's read path never
 * calls upstream APIs when a DB is configured — it only reads what this job stored.
 */
export async function ingest(oidcToken?: string): Promise<IngestResult> {
  if (!sql) throw new Error("DATABASE_URL is not set");

  // Cron + a manual run (or two overlapping cron runs) must not ingest at the same time.
  // A *session* advisory lock: held by this connection until unlocked, so we reserve one connection.
  const conn = await sql.reserve();
  try {
    const [{ locked }] = await conn<{ locked: boolean }[]>`select pg_try_advisory_lock(${LOCK_ID}) as locked`;
    if (!locked) return { skipped: true };

    const [run] = await conn<{ id: string }[]>`insert into ingest_runs default values returning id`;
    const results = await allSettledPool(SOURCES.map((s) => s.fetch), 10);
    const sources = results.map((r, i): SourceStatus =>
      r.status === "fulfilled"
        ? { name: SOURCES[i].name, ok: true, count: r.value.length }
        : { name: SOURCES[i].name, ok: false, count: 0, error: String(r.reason).slice(0, 200) },
    );
    const articles = categorize(dropStale(sanitize(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])))));
    const unique = [...new Map(articles.map((a) => [a.id, a])).values()]; // an upsert batch can't touch a row twice

    const rows = unique.map((a) => ({
      id: a.id,
      url: a.url,
      title: a.title.slice(0, 500),
      source: a.source,
      discussion_url: a.discussionUrl ?? null,
      image: a.image ?? null,
      points: a.points,
      comments: a.comments,
      published_at: a.publishedAt,
      tags: a.tags.slice(0, 20),
      categories: a.categories,
      search_text: `${a.title} ${a.tags.join(" ")}`,
    }));

    let inserted = 0;
    let updated = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      // (xmax = 0) is true only for freshly inserted rows: a cheap way to count inserts vs updates.
      const res = await conn<{ inserted: boolean }[]>`
        insert into articles (id, url, title, source, discussion_url, image, points, comments, published_at, tags, categories, search)
        select x.id, x.url, x.title, x.source, x.discussion_url, x.image, x.points, x.comments, x.published_at,
               x.tags, x.categories, to_tsvector('english', x.search_text)
        from jsonb_to_recordset(${conn.json(batch)}) as x(
          id text, url text, title text, source text, discussion_url text, image text, points int, comments int,
          published_at timestamptz, tags text[], categories text[], search_text text)
        on conflict (id) do update set
          title = excluded.title, url = excluded.url, discussion_url = excluded.discussion_url, image = excluded.image,
          points = excluded.points, comments = excluded.comments, tags = excluded.tags,
          categories = excluded.categories, search = excluded.search, updated_at = now()
        returning (xmax = 0) as inserted`;
      for (const r of res) {
        if (r.inserted) inserted++;
        else updated++;
      }
    }

    // Release radar: upsert whatever succeeded; a repo whose slow feed timed out keeps its previous row.
    const releases = await latestReleases(45_000);
    if (releases.length) {
      await conn`
        insert into releases (repo, grp, tag, url, published_at, prerelease)
        select x.repo, x.grp, x.tag, x.url, x.published_at, x.prerelease
        from jsonb_to_recordset(${conn.json(releases.map((r) => ({ repo: r.repo, grp: r.group, tag: r.tag, url: r.url, published_at: r.date, prerelease: r.prerelease })))})
          as x(repo text, grp text, tag text, url text, published_at timestamptz, prerelease boolean)
        on conflict (repo) do update set grp = excluded.grp, tag = excluded.tag, url = excluded.url,
          published_at = excluded.published_at, prerelease = excluded.prerelease, updated_at = now()`;
    }

    // Trending skills: replace the board in one statement. No token (forks, local) or an outage keeps the last rows.
    if (oidcToken) {
      try {
        const skills = await trendingSkills(oidcToken);
        await conn`
          with fresh as (
            select * from jsonb_to_recordset(${conn.json(skills)}) as x(id text, name text, source text, installs int, url text)
          ), gone as (
            delete from skills where id not in (select id from fresh)
          )
          insert into skills (id, name, source, installs, url)
          select id, name, source, installs, url from fresh
          on conflict (id) do update set name = excluded.name, source = excluded.source, installs = excluded.installs,
            url = excluded.url, updated_at = now()`;
        sources.push({ name: "skills.sh", ok: true, count: skills.length });
      } catch (error) {
        sources.push({ name: "skills.sh", ok: false, count: 0, error: String(error).slice(0, 200) });
      }
    }

    await conn`update ingest_runs set finished_at = now(), inserted = ${inserted}, updated = ${updated}, sources = ${conn.json(sources)} where id = ${run.id}`;
    // Housekeeping: rate-limit windows older than a day are dead weight.
    await conn`delete from rate_limits where window_start < now() - interval '1 day'`;
    return { skipped: false, inserted, updated, sources };
  } finally {
    await conn`select pg_advisory_unlock(${LOCK_ID})`.catch(() => {});
    conn.release();
  }
}
