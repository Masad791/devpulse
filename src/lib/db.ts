import "server-only";
import { createHash } from "node:crypto";
import postgres from "postgres";

/**
 * The database is OPTIONAL. Without DATABASE_URL the site fetches sources live (the original design),
 * so contributors can run it with zero setup; history, search, trends and click counts need the DB.
 */
const globalForDb = globalThis as unknown as { devpulseSql?: postgres.Sql };

export const sql: postgres.Sql | null = process.env.DATABASE_URL
  ? (globalForDb.devpulseSql ??= postgres(process.env.DATABASE_URL, {
      max: 3, // serverless: many small instances, so keep each pool tiny
      prepare: false, // required behind Neon's / PgBouncer's transaction pooler
      idle_timeout: 20,
      onnotice: () => {},
    }))
  : null;

/** Client IP -> salted daily hash. We can count and rate-limit visitors without ever storing an IP. */
export function clientKey(headers: Headers, bucket: string): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  const salt = `${process.env.CRON_SECRET ?? "devpulse"}:${new Date().toISOString().slice(0, 10)}`;
  return `${bucket}:${createHash("sha256").update(`${salt}:${ip}`).digest("base64url").slice(0, 22)}`;
}

/**
 * Fixed-window rate limit in one atomic upsert: true = allowed.
 * Without a DB there's nothing shared between server instances, so we allow (and say so in the docs).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!sql) return true;
  const [row] = await sql<{ hits: number }[]>`
    insert into rate_limits (key, window_start, hits) values (${key}, now(), 1)
    on conflict (key) do update set
      hits = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.hits + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end
    returning hits`;
  return row.hits <= limit;
}
