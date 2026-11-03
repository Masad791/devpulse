import { clientKey, rateLimit, sql } from "@/lib/db";

// POST /api/click  body: { "id": "<article id>" } — sent with navigator.sendBeacon when a reader opens a story.
// Stores only (article, day, count): no IP, no cookie, no user id. Powers "Most read on DevPulse".
export async function POST(request: Request) {
  if (!sql) return new Response(null, { status: 204 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.slice(0, 600) : "";
  if (!id) return new Response(null, { status: 400 });
  if (!(await rateLimit(clientKey(request.headers, "click"), 60, 60))) return new Response(null, { status: 429 });

  // Only counts ids we actually stored, so nobody can fill the table with junk rows.
  await sql`
    insert into clicks (article_id) select id from articles where id = ${id}
    on conflict (article_id, day) do update set count = clicks.count + 1`;
  return new Response(null, { status: 204 });
}
