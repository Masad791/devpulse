import { clientKey, rateLimit } from "@/lib/db";
import { searchArticles } from "@/lib/feed";

// GET /api/search?q=postgres+vector — used by the Ctrl+K palette. Public, CORS open, 30 req/min per visitor.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ q, articles: [] });
  if (!(await rateLimit(clientKey(request.headers, "search"), 30, 60))) {
    return Response.json({ error: "Too many searches, slow down a little." }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const articles = await searchArticles(q);
  return Response.json(
    { q, articles: articles.slice(0, 20) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600", "Access-Control-Allow-Origin": "*" } },
  );
}
